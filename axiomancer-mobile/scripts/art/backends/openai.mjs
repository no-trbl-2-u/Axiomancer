// scripts/art/backends/openai.mjs — the hosted implementation (phase 73).
//
// ============================ UNEXERCISED ==================================
// This module has NEVER been run against the live API. Phase 73 was built in a
// checkout with no `.env` and no key, and spending against a paid image API is
// not a call the loop makes for itself. It is written against the documented
// Images API request shape and is deliberately the smallest possible module —
// every other part of the pipeline is proven against a fake backend.
//
// Before trusting it: run one generation by hand, confirm the response shape,
// and delete this banner in the same commit that records the result.
// ===========================================================================
//
// The model id is CONFIGURATION, not a constant. T's ruling names gpt-image-2
// and that is the default, but pinning a model this code has never called
// would bake in an unverified assumption — and a swappable adapter that pins
// its own model is not swappable.

const ENDPOINT = 'https://api.openai.com/v1/images/generations'

export const openaiBackend = {
  name: 'openai',
  async generate(request, { env = process.env, size } = {}) {
    const key = env.OPENAI_API_KEY
    if (!key) throw new Error('openai backend: OPENAI_API_KEY is not set')
    const model = env.ART_MODEL ?? 'gpt-image-2'

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        prompt: request.prompt,
        n: 1,
        size: size ?? env.ART_SIZE ?? '1024x1024',
      }),
    })

    if (!response.ok) {
      // The body often carries the actionable part (quota, model name, policy),
      // and the key is never in it — but never echo the request headers.
      const body = await response.text().catch(() => '')
      throw new Error(`openai backend: HTTP ${response.status} — ${body.slice(0, 400)}`)
    }

    const json = await response.json()
    const b64 = json?.data?.[0]?.b64_json
    if (!b64) {
      throw new Error(
        'openai backend: response carried no b64_json image. '
          + `Keys seen: ${Object.keys(json?.data?.[0] ?? {}).join(', ') || '(none)'}. `
          + 'If the API now returns a URL, this is the one place to fix.',
      )
    }
    return { model, image: Buffer.from(b64, 'base64') }
  },
}
