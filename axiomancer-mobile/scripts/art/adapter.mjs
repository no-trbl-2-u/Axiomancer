// scripts/art/adapter.mjs — the swappable generator seam (phase 73).
//
// T's ruling (AI_ART_PIPELINE_OPTIONS.md §9) is "A-then-B": start hosted, keep
// the local FLUX+LoRA upgrade path. The binding consequence is that the network
// call must be the ONLY option-specific code, so a later B migration replaces
// one module and touches nothing else. That is what this file enforces —
// everything upstream (the compiler) and downstream (post-process, ingest,
// provenance) speaks only in the two shapes below.
//
//   generate(request) -> { image: Buffer, backend, model, extra? }
//
// The default backend is `null`, which generates nothing and reports what it
// would have sent. That is not a degraded mode: the ruling says "absent the
// key, the acquisition and post-process legs still run; only the generate call
// is inert", so an unkeyed checkout must be able to compile, review, and test
// the whole pipeline without spending anything.

/** @typedef {import('./prompt.mjs')} PromptModule */

/**
 * Backends register here rather than being imported eagerly, so the hosted
 * one's module (and its network access) is never loaded on a run that does not
 * use it.
 */
const BACKENDS = {
  null: async () => (await import('./backends/null.mjs')).nullBackend,
  openai: async () => (await import('./backends/openai.mjs')).openaiBackend,
}

export const BACKEND_NAMES = Object.keys(BACKENDS)

/**
 * Pick a backend from the environment.
 *
 * The rule is deliberately blunt: no key means the null backend, whatever
 * `ART_BACKEND` says. A run that thinks it is generating and silently is not
 * would write a provenance record for an image that does not exist.
 */
export function selectBackendName(env = process.env) {
  const requested = env.ART_BACKEND ?? 'openai'
  if (requested === 'null') return 'null'
  if (!BACKENDS[requested]) {
    throw new Error(`art: unknown ART_BACKEND ${JSON.stringify(requested)} — known: ${BACKEND_NAMES.join(', ')}`)
  }
  return env.OPENAI_API_KEY ? requested : 'null'
}

/** Why the selected backend was selected — printed, so a no-op is never silent. */
export function selectionReason(env = process.env) {
  const requested = env.ART_BACKEND ?? 'openai'
  if (requested === 'null') return 'ART_BACKEND=null was requested'
  if (!env.OPENAI_API_KEY) {
    return 'no OPENAI_API_KEY in the environment, so the generate leg is inert '
      + '(the ruling\'s own default — see AI_ART_PIPELINE_OPTIONS.md §9)'
  }
  return `ART_BACKEND=${requested} with a key present`
}

export async function loadBackend(name) {
  const load = BACKENDS[name]
  if (!load) throw new Error(`art: no backend ${JSON.stringify(name)}`)
  return load()
}

/**
 * Generate one image for a compiled request.
 *
 * @param {{slug:string, category:string, prompt:string, styleVersion:string, promptHash:string}} request
 * @param {{env?:object, backend?:object, size?:string}} [opts] `backend` is the
 *   test seam: pass a fake and the whole path runs with no network and no key.
 */
export async function generate(request, opts = {}) {
  const env = opts.env ?? process.env
  const name = opts.backend ? (opts.backend.name ?? 'injected') : selectBackendName(env)
  const backend = opts.backend ?? await loadBackend(name)
  const result = await backend.generate(request, { env, size: opts.size })
  return {
    backend: name,
    model: result.model ?? null,
    image: result.image ?? null,
    inert: result.inert === true,
    ...(result.extra ? { extra: result.extra } : {}),
  }
}

/**
 * The provenance record for a generated asset. Mandatory, not best-effort:
 * raw AI output is not copyrightable (USCO Jan 2025; Thaler Mar 2025), so this
 * record is simultaneously the Steam AI-disclosure artifact and the evidence of
 * human curation. An asset whose prompt is not on file is worse than no asset.
 */
export function generationProvenance({ request, result, date, covers }) {
  return {
    generated_by: 'ai-generation',
    date,
    tool: `scripts/generate-art.mjs (${result.backend})`,
    backend: result.backend,
    model: result.model,
    prompt: request.prompt,
    prompt_hash: request.promptHash,
    style_version: request.styleVersion,
    license: 'generated — raw model output is not copyrightable (USCO 2025); '
      + 'this record is the disclosure and human-curation evidence',
    covers,
  }
}
