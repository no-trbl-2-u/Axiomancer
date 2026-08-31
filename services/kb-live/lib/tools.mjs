// services/kb-live/lib/tools.mjs — the six kb_* tools over an in-memory
// corpus model. Tool names, schemas, and answer shapes mirror the stdio
// server in the KB repo (kb/scripts/kb-mcp-server.mjs) so consumers see
// ONE logical kb-query surface whether the corpus is local or hosted.

export const TOOLS = [
  {
    name: 'kb_overview',
    description:
      'Map of the corpus: every board game (slug, title, weight, status, mechanics, better-if labels, doc list), available pattern docs, and Dawncaster card-corpus stats. Start here.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run(model) {
      const lines = [`# BoardGames — ${model.games.length} game(s)`]
      for (const g of model.games) {
        lines.push(
          `- ${g.slug} — "${g.title}" (${g.year ?? '?'}, weight ${g.weight ?? '?'}, ${g.status ?? '?'})`,
          `  mechanics: ${g.mechanics.join(', ') || '(none)'}`,
          `  better-if: ${g.better_if_labels.join(', ') || '(none)'}`,
        )
      }
      lines.push(`# Patterns — ${model.patterns.length} doc(s)${model.patterns.length ? ': ' + model.patterns.join(', ') : ''}`)
      lines.push(
        `# Dawncaster — ${model.cards?.card_count ?? 'unknown'} card records, ${model.keywords?.keyword_count ?? 'unknown'} keywords`,
      )
      lines.push(`(kb-live @ ${model.sha.slice(0, 12)})`)
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
    run(model, { mechanic, better_if_label }) {
      let games = model.games
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
    run(model, { query, scope = 'boardgames', max_results = 40 }) {
      let re
      try { re = new RegExp(query, 'i') }
      catch { re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      const roots = []
      if (scope !== 'cards') roots.push('KnowledgeBase/BoardGames/')
      if (scope !== 'boardgames') roots.push('KnowledgeBase/DigitalCardGames/dawncaster/')
      const out = []
      for (const [path, text] of model.files) {
        if (out.length >= max_results) break
        if (!roots.some((r) => path.startsWith(r))) continue
        if (!path.endsWith('.okf.md') && !path.endsWith('.md')) continue
        const lines = text.split(/\r?\n/)
        for (let i = 0; i < lines.length && out.length < max_results; i++) {
          if (re.test(lines[i])) out.push(`${path}:${i + 1}: ${lines[i].trim().slice(0, 200)}`)
        }
      }
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
    run(model, { path }) {
      const rel = String(path).replaceAll('\\', '/').replace(/^\/+/, '')
      if (!rel.startsWith('KnowledgeBase/') || rel.split('/').includes('..')) {
        return 'Refused: path must be under KnowledgeBase/.'
      }
      const text = model.files.get(rel)
      if (text === undefined) return `Not found: ${rel}. Use kb_overview / kb_find_games for live paths.`
      return text.slice(0, 65536)
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
    run(model, { query, limit = 15 }) {
      if (!model.cards) return 'cards.json sidecar not found — corpus incomplete.'
      const q = query.toLowerCase()
      const hits = model.cards.cards.filter((c) =>
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
    run(model, { term }) {
      if (!model.keywords) return 'keywords.json sidecar not found — corpus incomplete.'
      const q = term.toLowerCase()
      const hits = model.keywords.keywords.filter((k) => k.keyword.toLowerCase().includes(q) || k.slug.includes(q))
      if (!hits.length) return `No keyword matches "${term}".`
      return hits.map((k) => `${k.keyword} [${k.type}] — ${k.description}`).join('\n')
    },
  },
]

export const toolList = () =>
  TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))

export function runTool(model, name, args) {
  const tool = TOOLS.find((t) => t.name === name)
  if (!tool) return { error: `Unknown tool: ${name}` }
  return { text: tool.run(model, args ?? {}) }
}
