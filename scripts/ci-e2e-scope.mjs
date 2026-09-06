#!/usr/bin/env node

/**
 * Deterministic changed-file → browser-evidence classifier shared by the
 * mechanics and mobile verify workflows.
 *
 * Unknown mobile runtime paths fail closed to the full suite. Mechanics paths
 * outside the documented mobile/editor coupling remain mechanics-only. The
 * caller may force the full suite when history is unavailable or for the
 * weekly/manual backstop.
 */

const SUITES = ['hazard', 'encounters', 'combat']

function emptyResult() {
    return {
        mobile: false,
        editor: false,
        run_integration: false,
        full: false,
        hazard: false,
        encounters: false,
        combat: false,
    }
}

function enableFull(result, { editor = false } = {}) {
    result.mobile = true
    result.editor = editor
    result.run_integration = true
    result.full = true
    for (const suite of SUITES) result[suite] = true
}

function isNonRuntime(path) {
    return (
        /(^|\/)__(tests|snapshots)__\//.test(path)
        || /\.(test|spec)\.[cm]?[jt]sx?$/.test(path)
        || /\.(md|provenance\.json)$/.test(path)
        || /^axiomancer-mobile\/(design|docs|reference-images|screenshots|specs)\//.test(path)
    )
}

function markMobileSuite(result, suite) {
    result.mobile = true
    result.run_integration = true
    result[suite] = true
}

function classifyMobilePath(path, result) {
    if (isNonRuntime(path)) return

    const hazard = [
        /^axiomancer-mobile\/app\/hazard(?:-deck)?\//,
        /^axiomancer-mobile\/components\/hazard\//,
        /^axiomancer-mobile\/components\/(?:DebugHazard|HazardGate)/,
        /^axiomancer-mobile\/state\/hazard\//,
        /^axiomancer-mobile\/state\/(?:e2e|presenters)\/.*hazard/i,
        /^axiomancer-mobile\/scripts\/hazard-e2e\.mjs$/,
    ]
    const combat = [
        /^axiomancer-mobile\/app\/combat-encounter\//,
        /^axiomancer-mobile\/components\/combat\//,
        /^axiomancer-mobile\/components\/DebugCombat/,
        /^axiomancer-mobile\/components\/event\/aftermath\/Combat/,
        /^axiomancer-mobile\/state\/combat(?:\/|-mode\.tsx$)/,
        /^axiomancer-mobile\/state\/(?:e2e|presenters)\/.*combat/i,
        /^axiomancer-mobile\/scripts\/combat-encounter-e2e\.mjs$/,
    ]
    const encounters = [
        /^axiomancer-mobile\/app\/(?:cache|quest|rest|event|hazard|combat-encounter|labyrinth)\//,
        /^axiomancer-mobile\/app\/\(tabs\)\/exploration\//,
        /^axiomancer-mobile\/components\/(?:DebugEnemy|DebugQuest|DebugRest|DebugReward|DebugTriggerEncounter|DebugWorld)/,
        /^axiomancer-mobile\/state\/dev\/(?:enemy-picker|rewards|world-travel)\.ts$/,
        /^axiomancer-mobile\/scripts\/encounter-routing-e2e\.mjs$/,
    ]

    let matched = false
    for (const [suite, patterns] of Object.entries({ hazard, encounters, combat })) {
        if (patterns.some((pattern) => pattern.test(path))) {
            markMobileSuite(result, suite)
            matched = true
        }
    }

    if (matched) return

    // Runtime/configuration paths not explicitly owned by one subsystem can
    // affect any route. The correct cost is the full suite, not a guess.
    if (
        path.startsWith('axiomancer-mobile/')
        || path === 'package-lock.json'
        || path === '.github/workflows/verify-mobile.yml'
        || path === 'scripts/ci-e2e-scope.mjs'
    ) {
        enableFull(result)
    }
}

function classifyMechanicsPath(path, result) {
    if (isNonRuntime(path)) return

    if (
        path === 'package-lock.json'
        || path === '.github/workflows/verify-mechanics.yml'
        || path === 'scripts/ci-e2e-scope.mjs'
        || path === 'axiomancer-mechanics/src/index.ts'
    ) {
        enableFull(result, { editor: true })
        return
    }

    if (/^axiomancer-mechanics\/src\/(?:Combat|Cards|Effects)\//.test(path)) {
        markMobileSuite(result, 'combat')
        result.editor = true
        return
    }
    // Enemy content renders in both the combat presenter (portraits,
    // decks) and the event/aftermath presenters (encounter payloads).
    if (/^axiomancer-mechanics\/src\/Enemy\//.test(path)) {
        markMobileSuite(result, 'combat')
        markMobileSuite(result, 'encounters')
        return
    }
    if (/^axiomancer-mechanics\/src\/NPCs\//.test(path)) {
        markMobileSuite(result, 'encounters')
        return
    }
    if (/^axiomancer-mechanics\/src\/World\/Hazard\//.test(path)) {
        markMobileSuite(result, 'hazard')
        return
    }
    // Everything else under World/ is consumed by mobile's exploration,
    // event, dialogue, labyrinth, blacksmith, and rest surfaces (e.g. a
    // map-node change breaks mobile's layout-engine-parity test) — route
    // it all to the encounter suite rather than enumerating subdirs.
    if (/^axiomancer-mechanics\/src\/World\//.test(path)) {
        markMobileSuite(result, 'encounters')
    }
}

export function classifyE2EScope({ owner, files, forceFull = false }) {
    if (!['mobile', 'mechanics'].includes(owner)) {
        throw new Error(`owner must be "mobile" or "mechanics"; received ${owner}`)
    }

    const result = emptyResult()
    if (forceFull) {
        enableFull(result, { editor: owner === 'mechanics' })
        return result
    }

    const uniqueFiles = [...new Set(files.map((file) => file.trim()).filter(Boolean))]
    for (const path of uniqueFiles) {
        if (result.full) break
        if (owner === 'mobile') classifyMobilePath(path, result)
        else classifyMechanicsPath(path, result)
    }
    return result
}

async function main() {
    const owner = process.argv[2]
    const forceFull = process.argv.includes('--full')
    const input = await new Promise((resolve, reject) => {
        let text = ''
        process.stdin.setEncoding('utf8')
        process.stdin.on('data', (chunk) => { text += chunk })
        process.stdin.on('end', () => resolve(text))
        process.stdin.on('error', reject)
    })
    const result = classifyE2EScope({ owner, files: input.split(/\r?\n/), forceFull })
    for (const [key, value] of Object.entries(result)) {
        process.stdout.write(`${key}=${value}\n`)
    }
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (isMain) {
    main().catch((error) => {
        console.error(`ci-e2e-scope: ${error.message}`)
        process.exit(2)
    })
}
