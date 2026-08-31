// services/kb-live/lib/corpus.mjs — corpus acquisition + model for the
// hosted kb-live MCP server.
//
// The game-knowledge-base repo is PRIVATE, so this module never holds a
// credential of its own: every fetch uses the caller-supplied GitHub token
// (the same GH_TOKEN/.env / GH_PAT that scripts/kb-sync.mjs already uses).
// The corpus is pulled as one codeload tarball, filtered to KnowledgeBase/,
// and cached in module memory keyed by the repo's HEAD sha — so a warm
// instance serves current-tree answers without re-downloading, and a moved
// HEAD is picked up on the next freshness check.
//
// Zero dependencies: node:zlib gunzip + a small ustar/pax reader.

import { gunzipSync } from 'node:zlib'

export const KB_REPO = process.env.KB_REPO ?? 'no-trbl-2-u/game-knowledge-base'
export const KB_BRANCH = process.env.KB_BRANCH ?? 'main'
const SHA_TTL_MS = Number(process.env.KB_SHA_TTL_MS ?? 5 * 60 * 1000)

// --- tar reading ----------------------------------------------------------

const decoder = new TextDecoder()

function cstr(buf, start, len) {
  const slice = buf.subarray(start, start + len)
  const nul = slice.indexOf(0)
  return decoder.decode(nul === -1 ? slice : slice.subarray(0, nul))
}

/**
 * Parse a gzipped tarball into Map<path, text>, keeping only files under
 * `KnowledgeBase/` (paths returned WITHOUT the tarball's top-level
 * `owner-repo-sha/` prefix). Handles ustar prefix fields plus the pax
 * ('x') and GNU longname ('L') extensions GitHub emits for long paths.
 */
export function extractKnowledgeBase(tarGzBuffer) {
  const tar = gunzipSync(tarGzBuffer)
  const files = new Map()
  let offset = 0
  let overrideName = null
  while (offset + 512 <= tar.length) {
    const block = tar.subarray(offset, offset + 512)
    if (block.every((b) => b === 0)) break // end-of-archive
    const size = parseInt(cstr(tar, offset + 124, 12).trim() || '0', 8)
    const typeflag = String.fromCharCode(tar[offset + 156])
    let name = cstr(tar, offset + 0, 100)
    const prefix = cstr(tar, offset + 345, 155)
    if (prefix) name = `${prefix}/${name}`
    if (overrideName !== null) {
      name = overrideName
      overrideName = null
    }
    const body = tar.subarray(offset + 512, offset + 512 + size)
    if (typeflag === 'x' || typeflag === 'g') {
      // pax extended header: "<len> path=<value>\n" records
      const text = decoder.decode(body)
      const m = text.match(/\d+ path=([\s\S]*?)\n/)
      if (m && typeflag === 'x') overrideName = m[1]
    }
    else if (typeflag === 'L') {
      overrideName = decoder.decode(body).replace(/\0+$/, '')
    }
    else if (typeflag === '0' || typeflag === '' || typeflag === '\0') {
      const rel = name.split('/').slice(1).join('/') // drop owner-repo-sha/
      if (rel.startsWith('KnowledgeBase/')) files.set(rel, decoder.decode(body))
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  return files
}

// --- GitHub fetch ---------------------------------------------------------

async function gh(url, token, accept) {
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept,
      'user-agent': 'kb-live-mcp (axiomancer)',
      'x-github-api-version': '2022-11-28',
    },
    redirect: 'follow',
  })
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status} for ${url.replace(/tarball\/.*/, 'tarball/…')}`)
    err.status = res.status
    throw err
  }
  return res
}

export async function resolveHeadSha(token, fetchImpl = gh) {
  const res = await fetchImpl(
    `https://api.github.com/repos/${KB_REPO}/commits/${KB_BRANCH}`,
    token,
    'application/vnd.github.sha',
  )
  return (await res.text()).trim()
}

export async function fetchTarball(token, sha, fetchImpl = gh) {
  const res = await fetchImpl(
    `https://api.github.com/repos/${KB_REPO}/tarball/${sha}`,
    token,
    'application/vnd.github+json',
  )
  return Buffer.from(await res.arrayBuffer())
}

// --- corpus model ---------------------------------------------------------
// Mirrors kb/scripts/kb-mcp-server.mjs (the stdio server in the KB repo),
// re-based from fs reads onto the in-memory file map.

function frontmatter(files, path) {
  const text = files.get(path)
  if (!text) return null
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return fm ? fm[1] : null
}
const field = (head, name) =>
  head?.match(new RegExp(`^\\s*${name}:\\s*(.*)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null
function listItems(head, name) {
  if (!head) return []
  const inline = head.match(new RegExp(`^${name}:\\s*\\[(.*)\\]`, 'm'))
  if (inline) return inline[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  const block = head.match(new RegExp(`^${name}:\\s*\\r?\\n((?:\\s+-\\s+.*\\r?\\n?)+)`, 'm'))
  if (block) return [...block[1].matchAll(/-\s+"?([^"\r\n]+)"?/g)].map((m) => m[1].trim())
  return []
}

const GAMES_PREFIX = 'KnowledgeBase/BoardGames/games/'
const PATTERNS_PREFIX = 'KnowledgeBase/BoardGames/patterns/'
const DAWNCASTER_PREFIX = 'KnowledgeBase/DigitalCardGames/dawncaster/'

export function buildModel(files, sha) {
  const gameSlugs = new Set()
  for (const path of files.keys()) {
    if (path.startsWith(GAMES_PREFIX)) gameSlugs.add(path.slice(GAMES_PREFIX.length).split('/')[0])
  }
  const games = [...gameSlugs].sort().map((slug) => {
    const dir = `${GAMES_PREFIX}${slug}/`
    const head = frontmatter(files, `${dir}index.okf.md`)
    const betterIfHead = frontmatter(files, `${dir}reception/better-if.okf.md`)
    return {
      slug,
      title: field(head, 'title') ?? slug,
      year: field(head, 'year'),
      weight: field(head, 'weight'),
      status: field(head, 'status'),
      mechanics: listItems(head, 'mechanics'),
      better_if_labels: listItems(betterIfHead, 'better_if_labels'),
      docs: [...files.keys()]
        .filter((p) => p.startsWith(dir) && p.endsWith('.okf.md'))
        .map((p) => p.slice(dir.length))
        .sort(),
    }
  })
  const sidecar = (name) => {
    try { return JSON.parse(files.get(`${DAWNCASTER_PREFIX}${name}`) ?? 'null') }
    catch { return null }
  }
  return {
    sha,
    files,
    games,
    patterns: [...files.keys()]
      .filter((p) => p.startsWith(PATTERNS_PREFIX) && p.endsWith('.okf.md'))
      .map((p) => p.slice(PATTERNS_PREFIX.length))
      .sort(),
    cards: sidecar('cards.json'),
    keywords: sidecar('keywords.json'),
  }
}

// --- cached acquisition ---------------------------------------------------

let cache = null // { sha, model, checkedAt }

/** Get the corpus model, downloading/refreshing at most when HEAD moves. */
export async function getModel(token, { now = Date.now, fetchImpl } = {}) {
  if (cache && now() - cache.checkedAt < SHA_TTL_MS) return cache.model
  const sha = await resolveHeadSha(token, fetchImpl)
  if (cache?.sha === sha) {
    cache.checkedAt = now()
    return cache.model
  }
  const files = extractKnowledgeBase(await fetchTarball(token, sha, fetchImpl))
  cache = { sha, model: buildModel(files, sha), checkedAt: now() }
  return cache.model
}

export function resetCache() { cache = null }
