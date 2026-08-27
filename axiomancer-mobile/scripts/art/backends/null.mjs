// scripts/art/backends/null.mjs — the inert backend (phase 73).
//
// Generates nothing, reports exactly what it would have sent, and succeeds.
// This is the DEFAULT with no API key, per the route ruling: "absent the key,
// the acquisition and post-process legs still run; only the generate call is
// inert". It is what makes the compiler and the ingest wiring reviewable and
// testable without spending anything.

export const nullBackend = {
  name: 'null',
  async generate(request) {
    return {
      model: null,
      image: null,
      inert: true,
      extra: {
        would_have_sent: {
          slug: request.slug,
          category: request.category,
          style_version: request.styleVersion,
          prompt_hash: request.promptHash,
          prompt_chars: request.prompt.length,
        },
      },
    }
  },
}
