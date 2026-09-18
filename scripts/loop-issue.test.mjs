// scripts/loop-issue.test.mjs — the Phase 48 witness for the auto-close
// mechanism. Hermetic: no network, no `gh`, no TTY, no filesystem writes.
//
//   node --test scripts/loop-issue.test.mjs
//
// WHY THIS FILE EXISTS. On 2026-08-03 a fix (`0441c554`, issue #166) was
// declared to have resolved the `Closes #N` auto-close. It stood for five
// days on no witness at all, and #174 stayed open through it. The witness
// is the deliverable: every assertion below fails if the closing mechanism
// regresses in the specific way it has already regressed twice —
//   * a trailer that is present but never acted on,
//   * a trailer on a non-tip commit of a batched push being missed,
//   * a close attempt that silently no-ops instead of erroring loudly,
//   * an already-closed issue turning a routine sweep into a hard failure.
//
// Run by .github/workflows/close-trailers.yml BEFORE the sweep itself, so
// a parser regression turns `main` red rather than quietly leaking issues.

import assert from 'node:assert/strict'
import test from 'node:test'

import {
    stripNonProse,
    parseCloseTrailers,
    collectCloseTargets,
    parseGitLogRecords,
    resolveRangeArgs,
    sweepCloseTrailers,
    buildTrailerCloseCommentBody,
    buildDeployCommentBody,
    sweepDeployComments,
} from './loop-issue.mjs'

const REPO = 'no-trbl-2-u/Axiomancer'
const parse = (message) => parseCloseTrailers(message, { repo: REPO })

// The two real commit messages this phase was opened to explain. Trimmed to
// the shape that matters: an identical bullet-prefixed trailer, one of which
// closed its issue and one of which did not.
const COMMIT_615FF26B = [
    'fix(mobile): wire projected-lethality readout into combat board',
    '',
    'Forward the projection onto `CombatEnemyPaneVM` in the enemy-pane presenter.',
    '',
    '- Closes #174',
].join('\n')

const COMMIT_1004894 = [
    'test(mobile): add GateSockets component coverage',
    '',
    'Added 9 colocated tests pinning socket rendering and the capacity guard.',
    '',
    '- Closes #175',
].join('\n')

// --- trailer parsing --------------------------------------------------

test('the bullet-prefixed trailer that failed on #174 parses', () => {
    assert.deepEqual(parse(COMMIT_615FF26B), [174])
})

test('#174 and #175 parse identically — the bullet prefix was never the cause', () => {
    assert.deepEqual(parse(COMMIT_615FF26B), [174])
    assert.deepEqual(parse(COMMIT_1004894), [175])
})

test('a bare unprefixed trailer parses', () => {
    assert.deepEqual(parse('fix(loop): something\n\nCloses #166'), [166])
})

test('every bullet marker and a trailing-colon form parse', () => {
    assert.deepEqual(parse('subject\n\n- Closes #1'), [1])
    assert.deepEqual(parse('subject\n\n* Closes #2'), [2])
    assert.deepEqual(parse('subject\n\n+ Closes #3'), [3])
    assert.deepEqual(parse('subject\n\nCloses: #4'), [4])
})

test('multiple issues in one message all parse, in order, deduped', () => {
    const message = [
        'fix: three findings at once',
        '',
        '- Closes #10',
        '- Fixes #11',
        '- Resolves #12',
        '- Closes #10',
    ].join('\n')
    assert.deepEqual(parse(message), [10, 11, 12])
})

test('case variants of every keyword parse', () => {
    assert.deepEqual(parse('s\n\nclose #20'), [20])
    assert.deepEqual(parse('s\n\ncloses #21'), [21])
    assert.deepEqual(parse('s\n\nCLOSES #22'), [22])
    assert.deepEqual(parse('s\n\nClosed #23'), [23])
    assert.deepEqual(parse('s\n\nfix #24'), [24])
    assert.deepEqual(parse('s\n\nFIXES #25'), [25])
    assert.deepEqual(parse('s\n\nfixed #26'), [26])
    assert.deepEqual(parse('s\n\nresolve #27'), [27])
    assert.deepEqual(parse('s\n\nRESOLVES #28'), [28])
    assert.deepEqual(parse('s\n\nresolved #29'), [29])
})

test('a GH- reference parses like a # reference', () => {
    assert.deepEqual(parse('s\n\nCloses GH-30'), [30])
})

test('a bare issue mention without a keyword does not close', () => {
    assert.deepEqual(parse('fix: relates to #40 and see #41'), [])
    assert.deepEqual(parse('fix: part of the #42 epic'), [])
})

test('a keyword-lookalike word does not close', () => {
    assert.deepEqual(parse('perf: enclosed #50'), [])
    assert.deepEqual(parse('fix: prefixes #51'), [])
})

// --- prose vs. code / quotes ------------------------------------------

test('a trailer inside a fenced code block does NOT close', () => {
    const message = [
        'docs(loop): document the trailer contract',
        '',
        'The commit body must end with:',
        '',
        '```',
        '- Closes #42',
        '```',
        '',
        'That is the whole convention.',
    ].join('\n')
    assert.deepEqual(parse(message), [])
})

test('a tilde-fenced block is excluded too, and a real trailer after it survives', () => {
    const message = [
        'docs: example plus a real close',
        '',
        '~~~',
        'Closes #60',
        '~~~',
        '',
        '- Closes #61',
    ].join('\n')
    assert.deepEqual(parse(message), [61])
})

test('a trailer inside a quoted body does NOT close', () => {
    const message = [
        'chore: fold in review feedback',
        '',
        '> Closes #70',
        '> — quoted from the original report',
        '',
        'Nothing here closes anything.',
    ].join('\n')
    assert.deepEqual(parse(message), [])
})

test('a trailer inside an inline code span does NOT close', () => {
    assert.deepEqual(parse('docs: the `Closes #80` trailer is mandatory'), [])
})

test('stripNonProse keeps prose and drops fenced, quoted and inline-code text', () => {
    const out = stripNonProse(['keep me', '```', 'drop me', '```', '> drop me too', 'and `drop`.'].join('\n'))
    assert.match(out, /keep me/)
    assert.doesNotMatch(out, /drop me/)
    assert.doesNotMatch(out, /drop me too/)
    assert.doesNotMatch(out, /`drop`/)
})

// --- cross-repo qualification -----------------------------------------

test('a same-repo qualified reference closes', () => {
    assert.deepEqual(parse(`s\n\nCloses ${REPO}#90`), [90])
})

test('a foreign-repo qualified reference does NOT close our issue of that number', () => {
    assert.deepEqual(parse('s\n\nCloses someone-else/OtherRepo#90'), [])
})

// --- batched pushes: every commit is scanned, not just the tip --------

test('a trailer on a NON-TIP commit of a batched push is still collected', () => {
    // git log lists newest-first: the tip is commits[0]. The regression this
    // pins is a sweep that only reads the tip and drops #174.
    const commits = [
        { sha: '1c915ac0', message: 'audit: finding [Combat kill-path legibility] addressed' },
        { sha: '615ff26b', message: COMMIT_615FF26B },
    ]
    assert.deepEqual(collectCloseTargets(commits, { repo: REPO }).map((t) => t.number), [174])
})

test('a batched push closing several issues across several commits collects all of them', () => {
    const commits = [
        { sha: 'ccc', message: 'chore: no trailer here' },
        { sha: 'bbb', message: 'fix: two at once\n\n- Closes #101\n- Fixes #102' },
        { sha: 'aaa', message: 'fix: one more\n\nResolves #103' },
    ]
    const targets = collectCloseTargets(commits, { repo: REPO })
    assert.deepEqual(targets.map((t) => t.number), [101, 102, 103])
    assert.equal(targets[0].sha, 'bbb')
    assert.equal(targets[2].sha, 'aaa')
})

test('the same issue referenced by two commits is attributed once, to the first seen', () => {
    const commits = [
        { sha: 'newer', message: 'fix: retry\n\nCloses #110' },
        { sha: 'older', message: 'fix: first try\n\nCloses #110' },
    ]
    const targets = collectCloseTargets(commits, { repo: REPO })
    assert.equal(targets.length, 1)
    assert.equal(targets[0].sha, 'newer')
})

// --- git plumbing (pure parsing, no git invoked) ----------------------

test('parseGitLogRecords splits multi-commit, multi-line log output', () => {
    const stdout =
        `615ff26b\x1e${COMMIT_615FF26B}\n\x1f\n` +
        `1004894\x1e${COMMIT_1004894}\n\x1f\n`
    const records = parseGitLogRecords(stdout)
    assert.equal(records.length, 2)
    assert.equal(records[0].sha, '615ff26b')
    assert.match(records[0].message, /- Closes #174$/)
    assert.equal(records[1].sha, '1004894')
    assert.match(records[1].message, /- Closes #175$/)
})

test('parseGitLogRecords tolerates empty output', () => {
    assert.deepEqual(parseGitLogRecords(''), [])
    assert.deepEqual(parseGitLogRecords('\n'), [])
})

test('a normal push range is scanned as a range', () => {
    const args = resolveRangeArgs({ range: 'aaaaaaa..bbbbbbb' })
    assert.ok(args.includes('aaaaaaa..bbbbbbb'))
    assert.ok(!args.includes('-1'))
})

test('a zero base (branch creation / force push) degrades to the head commit alone', () => {
    const zero = '0000000000000000000000000000000000000000'
    const args = resolveRangeArgs({ range: `${zero}..bbbbbbb` })
    assert.ok(args.includes('-1'))
    assert.ok(args.includes('bbbbbbb'))
})

// --- the sweep: idempotency, no-ops, and loud failure -----------------

/** Build a fake gh IO over a { number: state } map, recording every call. */
function fakeIo(states, { closeFails = new Set(), commentFails = new Set() } = {}) {
    const calls = { get: [], close: [], comment: [] }
    return {
        calls,
        getIssueState(number) {
            calls.get.push(number)
            const state = states[number]
            if (state === undefined) return { state: 'MISSING' }
            if (state === 'ERROR') return { error: 'gh issue view exited 1' }
            return { state }
        },
        closeIssue(number) {
            calls.close.push(number)
            if (closeFails.has(number)) return { error: 'HTTP 403: Resource not accessible' }
            states[number] = 'CLOSED'
            return { closed: true }
        },
        comment(number, body) {
            calls.comment.push({ number, body })
            if (commentFails.has(number)) return { error: 'HTTP 503' }
            return { ok: true }
        },
    }
}

const sweep = (commits, io, opts = {}) => sweepCloseTrailers({ commits, repo: REPO, io, ...opts })

test('the sweep closes an open issue named by a pushed commit', () => {
    const io = fakeIo({ 174: 'OPEN' })
    const result = sweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io)
    assert.deepEqual(result.closed.map((t) => t.number), [174])
    assert.deepEqual(io.calls.close, [174])
    assert.equal(result.errors.length, 0)
})

test('THE #174 REGRESSION: the closing commit is not the tip and the issue still closes', () => {
    // This is the exact push that leaked. If the sweep ever narrows back to
    // the tip commit, this test goes red and main goes red with it.
    const io = fakeIo({ 174: 'OPEN' })
    const result = sweep(
        [
            { sha: '1c915ac0', message: 'audit: finding [Combat kill-path legibility] addressed' },
            { sha: '615ff26b', message: COMMIT_615FF26B },
        ],
        io,
    )
    assert.deepEqual(result.closed.map((t) => t.number), [174])
    assert.equal(result.closed[0].sha, '615ff26b')
})

test('the sweep leaves a comment naming the commit that closed the issue', () => {
    const io = fakeIo({ 175: 'OPEN' })
    sweep([{ sha: '100489471764ad', message: COMMIT_1004894 }], io)
    assert.equal(io.calls.comment.length, 1)
    assert.equal(io.calls.comment[0].number, 175)
    assert.match(io.calls.comment[0].body, /10048947/)
    assert.match(io.calls.comment[0].body, /closes #175/)
})

test('IDEMPOTENCY: an already-closed issue is a no-op, not an error', () => {
    // close-comment may already have closed it seconds earlier. Re-running the
    // sweep — or GitHub redelivering the push — must not fail or re-comment.
    const io = fakeIo({ 175: 'CLOSED' })
    const result = sweep([{ sha: '1004894', message: COMMIT_1004894 }], io)
    assert.equal(result.errors.length, 0)
    assert.deepEqual(result.closed, [])
    assert.deepEqual(result.noop.map((t) => t.reason), ['already-closed'])
    assert.deepEqual(io.calls.close, [])
    assert.deepEqual(io.calls.comment, [])
})

test('IDEMPOTENCY: running the sweep twice over the same push closes exactly once', () => {
    const states = { 174: 'OPEN' }
    const io = fakeIo(states)
    const commits = [{ sha: '615ff26b', message: COMMIT_615FF26B }]
    const first = sweep(commits, io)
    const second = sweep(commits, io)
    assert.deepEqual(first.closed.map((t) => t.number), [174])
    assert.deepEqual(second.closed, [])
    assert.equal(second.errors.length, 0)
    assert.deepEqual(io.calls.close, [174])
})

test('a referenced number that is not an issue (a PR, or deleted) is a no-op', () => {
    const io = fakeIo({})
    const result = sweep([{ sha: 'aaa', message: 'fix: x\n\nCloses #999999' }], io)
    assert.equal(result.errors.length, 0)
    assert.deepEqual(result.noop.map((t) => t.reason), ['not-found'])
    assert.deepEqual(io.calls.close, [])
})

test('A FAILED CLOSE IS LOUD: an API failure lands in errors instead of passing silently', () => {
    // The five-day-old bug was a close that did not happen and said nothing.
    const io = fakeIo({ 174: 'OPEN' }, { closeFails: new Set([174]) })
    const result = sweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io)
    assert.deepEqual(result.closed, [])
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0].number, 174)
    assert.match(result.errors[0].error, /403/)
})

test('a state lookup failure is an error, never a silent skip', () => {
    const io = fakeIo({ 174: 'ERROR' })
    const result = sweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io)
    assert.equal(result.errors.length, 1)
    assert.equal(result.closed.length, 0)
})

test('a comment failure is a warning — the close still counts', () => {
    const io = fakeIo({ 174: 'OPEN' }, { commentFails: new Set([174]) })
    const result = sweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io)
    assert.deepEqual(result.closed.map((t) => t.number), [174])
    assert.equal(result.errors.length, 0)
    assert.equal(result.warnings.length, 1)
})

test('dry-run reports its targets and makes no API call at all', () => {
    const io = fakeIo({ 174: 'OPEN' })
    const result = sweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io, { dryRun: true })
    assert.deepEqual(result.targets.map((t) => t.number), [174])
    assert.deepEqual(result.noop.map((t) => t.reason), ['dry-run'])
    assert.deepEqual(io.calls.get, [])
    assert.deepEqual(io.calls.close, [])
    assert.deepEqual(io.calls.comment, [])
})

test('a push with no closing references touches nothing', () => {
    const io = fakeIo({ 174: 'OPEN' })
    const result = sweep([{ sha: 'aaa', message: 'digest: 2026-08-08' }], io)
    assert.deepEqual(result.targets, [])
    assert.deepEqual(io.calls.get, [])
    assert.deepEqual(io.calls.close, [])
})

test('a fenced example in a docs commit never closes a live issue through the sweep', () => {
    const io = fakeIo({ 42: 'OPEN' })
    const result = sweep(
        [{ sha: 'doc', message: 'docs(loop): show the trailer\n\n```\n- Closes #42\n```' }],
        io,
    )
    assert.deepEqual(result.targets, [])
    assert.deepEqual(io.calls.close, [])
})

test('the sweep comment states that our sweep, not GitHub, did the closing', () => {
    const body = buildTrailerCloseCommentBody({ number: 174, sha: '615ff26b9e9d', subject: 'fix(mobile): x' })
    assert.match(body, /close-trailers/)
    assert.match(body, /615ff26b/)
})

// --- deploy-comment sweep (Phase 91) -----------------------------------
//
// close-trailers moves the CLOSE onto the push. It does not — and by
// design should not — post the deploy-URL comment, since that comment can
// only be honest once CI has actually concluded, minutes after the push.
// The deploy-comment sweep is the equivalent floor for that comment: it
// only ever concerns ONE commit (the workflow_run event's head_sha), never
// closes anything, and is idempotent on a SHA-scoped marker in the
// comment body rather than issue state.

const DEPLOY_URL = 'https://github.com/no-trbl-2-u/Axiomancer/actions/runs/1'

/** Build a fake deploy-comment IO over a { number: [commentBody, ...] } map. */
function fakeDeployIo(commentsByNumber, { commentFails = new Set() } = {}) {
    const calls = { has: [], comment: [] }
    return {
        calls,
        hasDeployComment(number, sha) {
            calls.has.push(number)
            const comments = commentsByNumber[number]
            if (comments === undefined) return { found: false, missing: true }
            const marker = `Shipped in \`${sha}\``
            return { found: comments.some((body) => body.includes(marker)) }
        },
        comment(number, body) {
            calls.comment.push({ number, body })
            if (commentFails.has(number)) return { error: 'HTTP 503' }
            ;(commentsByNumber[number] ??= []).push(body)
            return { ok: true }
        },
    }
}

const deploySweep = (commits, io, opts = {}) =>
    sweepDeployComments({ commits, repo: REPO, io, deployUrl: DEPLOY_URL, ...opts })

test('the deploy-comment body names the commit and the live URL', () => {
    const body = buildDeployCommentBody({ sha: '615ff26b9e9d', deployUrl: DEPLOY_URL })
    assert.match(body, /Shipped in `615ff26b9e9d`/)
    assert.match(body, new RegExp(DEPLOY_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

test('the sweep posts the deploy comment on an issue the commit closes', () => {
    const io = fakeDeployIo({ 174: [] })
    const result = deploySweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io)
    assert.deepEqual(result.commented.map((t) => t.number), [174])
    assert.equal(io.calls.comment.length, 1)
    assert.equal(io.calls.comment[0].number, 174)
    assert.match(io.calls.comment[0].body, /Shipped in `615ff26b`/)
})

test('IDEMPOTENCY: a comment already bearing this SHA is a no-op, not a repeat post', () => {
    const io = fakeDeployIo({ 174: ['Shipped in `615ff26b`, and CI is now green.'] })
    const result = deploySweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io)
    assert.deepEqual(result.commented, [])
    assert.deepEqual(result.noop.map((t) => t.reason), ['already-commented'])
    assert.deepEqual(io.calls.comment, [])
})

test('IDEMPOTENCY: running the sweep twice over the same commit comments exactly once', () => {
    const commentsByNumber = { 174: [] }
    const io = fakeDeployIo(commentsByNumber)
    const commits = [{ sha: '615ff26b', message: COMMIT_615FF26B }]
    const first = deploySweep(commits, io)
    const second = deploySweep(commits, io)
    assert.deepEqual(first.commented.map((t) => t.number), [174])
    assert.deepEqual(second.commented, [])
    assert.deepEqual(second.noop.map((t) => t.reason), ['already-commented'])
})

test('a different commit closing the same issue posts its own, distinct comment', () => {
    // Two shipping attempts at the same issue (a retry) must not be treated
    // as the same event — each SHA gets its own comment.
    const commentsByNumber = { 174: ['Shipped in `aaaaaaa`, and CI is now green.'] }
    const io = fakeDeployIo(commentsByNumber)
    const result = deploySweep([{ sha: 'bbbbbbb', message: 'fix: retry\n\nCloses #174' }], io)
    assert.deepEqual(result.commented.map((t) => t.number), [174])
    assert.equal(commentsByNumber[174].length, 2)
})

test('a referenced number that is not an issue is a no-op', () => {
    const io = fakeDeployIo({})
    const result = deploySweep([{ sha: 'aaa', message: 'fix: x\n\nCloses #999999' }], io)
    assert.equal(result.errors.length, 0)
    assert.deepEqual(result.noop.map((t) => t.reason), ['not-found'])
    assert.deepEqual(io.calls.comment, [])
})

test('A FAILED COMMENT POST IS LOUD: an API failure lands in errors', () => {
    const io = fakeDeployIo({ 174: [] }, { commentFails: new Set([174]) })
    const result = deploySweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io)
    assert.deepEqual(result.commented, [])
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0].number, 174)
    assert.match(result.errors[0].error, /503/)
})

test('dry-run reports its targets and makes no API call at all', () => {
    const io = fakeDeployIo({ 174: [] })
    const result = deploySweep([{ sha: '615ff26b', message: COMMIT_615FF26B }], io, { dryRun: true })
    assert.deepEqual(result.targets.map((t) => t.number), [174])
    assert.deepEqual(result.noop.map((t) => t.reason), ['dry-run'])
    assert.deepEqual(io.calls.has, [])
    assert.deepEqual(io.calls.comment, [])
})

test('a commit with no closing references touches nothing', () => {
    const io = fakeDeployIo({ 174: [] })
    const result = deploySweep([{ sha: 'aaa', message: 'digest: 2026-08-08' }], io)
    assert.deepEqual(result.targets, [])
    assert.deepEqual(io.calls.has, [])
    assert.deepEqual(io.calls.comment, [])
})
