// scripts/__tests__/smoke-bundler.test.ts
//
// Hermetic tests for the pure helpers in `scripts/smoke-bundler.mjs`.
// Real `expo export` is an integration concern — not covered here.
// Helpers are duplicated inline so the test file doesn't have to
// load the .mjs entrypoint (Jest's default loader can't require ESM
// .mjs). Same pattern as smoke-screens.test.ts and
// deploy-check.test.ts. Keep these in sync with the .mjs file.

describe('smoke-bundler helpers', () => {
    const EXIT = {
        OK: 0,
        FAILED: 1,
        TIMEOUT: 2,
        CONFIG: 3,
    }

    const MIN_INDEX_HTML_BYTES = 200
    const REQUIRED_FILES = ['index.html']

    function buildExportArgs(outputDir: string): string[] {
        return [
            'expo',
            'export',
            '--platform',
            'web',
            '--output-dir',
            outputDir,
        ]
    }

    interface ClassifyInput {
        exitCode: number
        timedOut: boolean
        indexHtmlBytes: number | null
        missingFiles: string[]
    }

    interface ClassifyResult {
        exit: number
        reason: string
    }

    function classifyExportResult({
        exitCode,
        timedOut,
        indexHtmlBytes,
        missingFiles,
    }: ClassifyInput): ClassifyResult {
        if (timedOut) return { exit: EXIT.TIMEOUT, reason: 'expo export timed out' }
        if (exitCode !== 0) {
            return {
                exit: EXIT.FAILED,
                reason: `expo export exited ${exitCode}`,
            }
        }
        if (missingFiles && missingFiles.length > 0) {
            return {
                exit: EXIT.CONFIG,
                reason: `export produced no ${missingFiles.join(', ')}`,
            }
        }
        if (typeof indexHtmlBytes === 'number' && indexHtmlBytes < MIN_INDEX_HTML_BYTES) {
            return {
                exit: EXIT.CONFIG,
                reason: `index.html is ${indexHtmlBytes} bytes (< ${MIN_INDEX_HTML_BYTES})`,
            }
        }
        return { exit: EXIT.OK, reason: 'bundler OK' }
    }

    describe('buildExportArgs', () => {
        test('includes --platform web and the output dir', () => {
            const args = buildExportArgs('/tmp/x')
            expect(args).toContain('expo')
            expect(args).toContain('export')
            expect(args).toContain('--platform')
            expect(args).toContain('web')
            expect(args).toContain('--output-dir')
            expect(args).toContain('/tmp/x')
        })

        test('puts --output-dir immediately before the path argument', () => {
            const args = buildExportArgs('/tmp/abc')
            const i = args.indexOf('--output-dir')
            expect(i).toBeGreaterThanOrEqual(0)
            expect(args[i + 1]).toBe('/tmp/abc')
        })
    })

    describe('classifyExportResult — terminal classifications', () => {
        test('timeout wins regardless of other signals', () => {
            const r = classifyExportResult({
                exitCode: 0,
                timedOut: true,
                indexHtmlBytes: 9999,
                missingFiles: [],
            })
            expect(r.exit).toBe(EXIT.TIMEOUT)
            expect(r.reason).toMatch(/timed out/)
        })

        test('non-zero exit maps to FAILED with the exit code in the reason', () => {
            const r = classifyExportResult({
                exitCode: 137,
                timedOut: false,
                indexHtmlBytes: null,
                missingFiles: [],
            })
            expect(r.exit).toBe(EXIT.FAILED)
            expect(r.reason).toMatch(/137/)
        })

        test('missing required files maps to CONFIG', () => {
            const r = classifyExportResult({
                exitCode: 0,
                timedOut: false,
                indexHtmlBytes: null,
                missingFiles: ['index.html'],
            })
            expect(r.exit).toBe(EXIT.CONFIG)
            expect(r.reason).toMatch(/index\.html/)
        })

        test('tiny index.html maps to CONFIG with the byte count', () => {
            const r = classifyExportResult({
                exitCode: 0,
                timedOut: false,
                indexHtmlBytes: 12,
                missingFiles: [],
            })
            expect(r.exit).toBe(EXIT.CONFIG)
            expect(r.reason).toMatch(/12/)
        })

        test('healthy export maps to OK', () => {
            const r = classifyExportResult({
                exitCode: 0,
                timedOut: false,
                indexHtmlBytes: 4096,
                missingFiles: [],
            })
            expect(r.exit).toBe(EXIT.OK)
        })

        test('healthy export with null bytes (file inspection skipped) maps to OK', () => {
            // Defensive: if the inspector returns null (e.g. it skipped
            // the file because it wasn't in the required list), the
            // classifier should not treat that as a tiny file.
            const r = classifyExportResult({
                exitCode: 0,
                timedOut: false,
                indexHtmlBytes: null,
                missingFiles: [],
            })
            expect(r.exit).toBe(EXIT.OK)
        })
    })

    describe('contract constants', () => {
        test('EXIT codes are stable + distinct', () => {
            const codes = Object.values(EXIT)
            expect(new Set(codes).size).toBe(codes.length)
            expect(EXIT.OK).toBe(0)
            expect(EXIT.FAILED).toBe(1)
            expect(EXIT.TIMEOUT).toBe(2)
            expect(EXIT.CONFIG).toBe(3)
        })

        test('REQUIRED_FILES lists at minimum index.html', () => {
            expect(REQUIRED_FILES).toContain('index.html')
        })

        test('MIN_INDEX_HTML_BYTES is large enough to reject empty files', () => {
            expect(MIN_INDEX_HTML_BYTES).toBeGreaterThan(0)
            expect(MIN_INDEX_HTML_BYTES).toBeGreaterThan(64)
        })
    })
})
