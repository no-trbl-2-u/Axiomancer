// kb-mcp-host/lib/kb-tools.mjs — the six kb-query tools over an OKF corpus root.
//
// Adapted from the canonical stdio server in the game-knowledge-base repo
// (scripts/kb-mcp-server.mjs). Tool names, schemas, and answer shapes are kept
// IDENTICAL so consumers cannot tell the transports apart; the only additions
// are (a) an injectable corpus root and (b) a snapshot stamp line on
// kb_overview, because a hosted corpus is a snapshot and this project's rule
// is that measured/synced truth names its freshness. If the upstream server
// grows a tool, mirror it here in the same change that bumps the corpus.

import fs from 'node:fs'
import path from 'node:path'

/**
 * @param {string} root Directory that CONTAINS `KnowledgeBase/` — the KB repo
 *   root, Axiomancer's synced `kb/`, or this host's built `corpus/` snapshot.
 */
export function createKbTools(root) {
  const ROOT = path.resolve(root)
  const KB = path.join(ROOT, 'KnowledgeBase')
  const GAMES_DIR = path.join(KB, 'BoardGames', 'games')
  const PATTERNS_DIR = path.join(KB, 'BoardGames', 'patterns')
  const DAWNCASTER = path.join(KB, 'DigitalCardGames', 'dawncaster')

  const corpusMissing = () => !fs.existsSync(KB)
  const missingMessage =
    `Corpus not found at ${KB}. Hosted server: the build step did not run or ` +
    `failed — see kb-mcp-host/build.mjs. Grep-first fallback: sync kb/ in the ` +
    `Axiomancer repo (node scripts/kb-sync.mjs) and read files directly.`

  // --- frontmatter helpers (regex-based, mirrors validate-okf.mjs) ---------
  function frontmatter(file) {
    try {
      const text = fs.readFileSync(file, 'utf-8')
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      return fm ? fm[1] : null
    }
    catch { return null }
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

  function loadGames() {
    if (!fs.existsSync(GAMES_DIR)) return []
    return fs.readdirSync(GAMES_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => {
        const dir = path.join(GAMES_DIR, e.name)
        const head = frontmatter(path.join(dir, 'index.okf.md'))
        const betterIfHead = frontmatter(path.join(dir, 'reception', 'better-if.okf.md'))
        return {
          slug: e.name,
          title: field(head, 'title') ?? e.name,
          year: field(head, 'year'),
          weight: field(head, 'weight'),
          status: field(head, 'status'),
          mechanics: listItems(head, 'mechanics'),
          better_if_labels: listItems(betterIfHead, 'better_if_labels'),
          docs: fs.readdirSync(dir, { recursive: true })
            .map(String)
            .filter((f) => f.endsWith('.okf.md'))
            .map((f) => f.replaceAll('\\', '/')),
        }
      })
  }

  function loadJsonSidecar(name) {
    try { return JSON.parse(fs.readFileSync(path.join(DAWNCASTER, name), 'utf-8')) }
    catch { return null }
  }

  /** Snapshot stamp written by build.mjs; absent on a live checkout / synced kb/. */
  function buildMeta() {
    try { return JSON.parse(fs.readFileSync(path.join(ROOT, '.build-meta.json'), 'utf-8')) }
    catch { return null }
  }

  const tools = [
    {
      name: 'kb_overview',
      description:
        'Map of the corpus: every board game (slug, title, weight, status, mechanics, better-if labels, doc list), available pattern docs, and Dawncaster card-corpus stats. Start here.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      run() {
        const games = loadGames()
        const cards = loadJsonSidecar('cards.json')
        const keywords = loadJsonSidecar('keywords.json')
        const patterns = fs.existsSync(PATTERNS_DIR)
          ? fs.readdirSync(PATTERNS_DIR).filter((f) => f.endsWith('.okf.md'))
          : []
        const lines = [`# BoardGames — ${games.length} game(s)`]
        for (const g of games) {
          lines.push(
            `- ${g.slug} — "${g.title}" (${g.year ?? '?'}, weight ${g.weight ?? '?'}, ${g.status ?? '?'})`,
            `  mechanics: ${g.mechanics.join(', ') || '(none)'}`,
            `  better-if: ${g.better_if_labels.join(', ') || '(none)'}`,
          )
        }
        lines.push(`# Patterns — ${patterns.length} doc(s)${patterns.length ? ': ' + patterns.join(', ') : ''}`)
        lines.push(
          `# Dawncaster — ${cards?.card_count ?? 'unknown'} card records, ${keywords?.keyword_count ?? 'unknown'} keywords`,
        )
        const meta = buildMeta()
        if (meta) lines.push(`# Snapshot — corpus at ${meta.head ?? '?'}, built ${meta.builtAt ?? '?'}`)
        return lines.join('\n')
      },
    },
    {
      name: 'kb_find_games',
      description:
        'Find board games by controlled-vocabulary tag: a mechanics slug (e.g. deck-building, push-your-luck) and/or a better-if label (e.g. runaway-leader, downtime). Returns matching games with their doc paths.',
      inputSchema: {
        type: 'object',
        properties: {
          mechanic: { type: 'string', description: 'mechanics vocabulary slug' },
          better_if_label: { type: 'string', description: 'better-if taxonomy label' },
        },
        additionalProperties: false,
      },
      run({ mechanic, better_if_label }) {
        let games = loadGames()
        if (mechanic) games = games.filter((g) => g.mechanics.includes(mechanic))
        if (better_if_label) games = games.filter((g) => g.better_if_labels.includes(better_if_label))
        if (!games.length) return 'No games match. Use kb_overview to see the live tag sets; consider appending the gap to WISHLIST.md via kb-sync wish.'
        return games
          .map((g) =>
            `${g.slug} — "${g.title}"\n  docs: ${g.docs.map((d) => `KnowledgeBase/BoardGames/games/${g.slug}/${d}`).join(', ')}`)
          .join('\n')
      },
    },
    {
      name: 'kb_search',
      description:
        'Regex search across the corpus (case-insensitive, per line). Returns file:line matches. Scope "boardgames" (default), "cards", or "all". Use to locate claims, rules text, or citations before reading a whole doc.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'JS regex (no flags); invalid regex falls back to literal match' },
          scope: { type: 'string', enum: ['boardgames', 'cards', 'all'] },
          max_results: { type: 'number', description: 'default 40' },
        },
        required: ['query'],
        additionalProperties: false,
      },
      run({ query, scope = 'boardgames', max_results = 40 }) {
        let re
        try { re = new RegExp(query, 'i') }
        catch { re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        const roots = []
        if (scope !== 'cards') roots.push(path.join(KB, 'BoardGames'))
        if (scope !== 'boardgames') roots.push(DAWNCASTER)
        const out = []
        const walk = (dir) => {
          if (out.length >= max_results || !fs.existsSync(dir)) return
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (out.length >= max_results) return
            const p = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(p)
            else if (entry.name.endsWith('.okf.md') || entry.name.endsWith('.md')) {
              const lines = fs.readFileSync(p, 'utf-8').split(/\r?\n/)
              for (let i = 0; i < lines.length && out.length < max_results; i++) {
                if (re.test(lines[i])) {
                  out.push(`${path.relative(ROOT, p).replaceAll('\\', '/')}:${i + 1}: ${lines[i].trim().slice(0, 200)}`)
                }
              }
            }
          }
        }
        roots.forEach(walk)
        return out.length ? out.join('\n') : `No matches for /${query}/i in scope ${scope}.`
      },
    },
    {
      name: 'kb_read_doc',
      description:
        'Read one corpus document by repo-relative path (must be under KnowledgeBase/). Returns the full text (capped at 64KB). Claims carry Source/Evidence/Confidence triplets — keep the src-NNN ids when citing.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'e.g. KnowledgeBase/BoardGames/games/root/reception/better-if.okf.md' } },
        required: ['path'],
        additionalProperties: false,
      },
      run({ path: rel }) {
        const abs = path.resolve(ROOT, rel)
        if (!abs.startsWith(KB + path.sep) && abs !== KB) return 'Refused: path must be under KnowledgeBase/.'
        if (!fs.existsSync(abs)) return `Not found: ${rel}. Use kb_overview / kb_find_games for live paths.`
        return fs.readFileSync(abs, 'utf-8').slice(0, 65536)
      },
    },
    {
      name: 'kb_cards',
      description:
        'Search the Dawncaster card corpus (1,692 records) by name/rules-text/observed-terms substring. Returns name, cost, rarity, rules text, and the okf record path.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'case-insensitive substring' },
          limit: { type: 'number', description: 'default 15' },
        },
        required: ['query'],
        additionalProperties: false,
      },
      run({ query, limit = 15 }) {
        const data = loadJsonSidecar('cards.json')
        if (!data) return 'cards.json sidecar not found — corpus incomplete or unsynced.'
        const q = query.toLowerCase()
        const hits = data.cards.filter((c) =>
          c.name.toLowerCase().includes(q) ||
          (c.rules_text ?? '').toLowerCase().includes(q) ||
          (c.observed_terms ?? []).some((t) => t.toLowerCase().includes(q)),
        ).slice(0, limit)
        if (!hits.length) return `No cards match "${query}".`
        return hits.map((c) => {
          const cost = Object.entries(c.cost ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(' ') || 'free'
          return `${c.name} [${c.rarity}/${c.type}] (${cost}) — ${(c.rules_text ?? '').replaceAll('\n', ' ')}\n  record: KnowledgeBase/DigitalCardGames/dawncaster/${c.okf_path}`
        }).join('\n')
      },
    },
    {
      name: 'kb_keyword',
      description: 'Look up a Dawncaster keyword/mechanic term in the 141-entry glossary (exact or substring match).',
      inputSchema: {
        type: 'object',
        properties: { term: { type: 'string' } },
        required: ['term'],
        additionalProperties: false,
      },
      run({ term }) {
        const data = loadJsonSidecar('keywords.json')
        if (!data) return 'keywords.json sidecar not found — corpus incomplete or unsynced.'
        const q = term.toLowerCase()
        const hits = data.keywords.filter((k) => k.keyword.toLowerCase().includes(q) || k.slug.includes(q))
        if (!hits.length) return `No keyword matches "${term}".`
        return hits.map((k) => `${k.keyword} [${k.type}] — ${k.description}`).join('\n')
      },
    },
  ]

  return { tools, corpusMissing, missingMessage, buildMeta }
}
