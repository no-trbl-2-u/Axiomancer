/**
 * Roster-health CLI — prints `auditRosterHealth()` (Phase RH1).
 *
 * Answers "is X reachable in play": dangling references (a bug the loop
 * fixes) and orphans (a content call for T). Reads only.
 *
 * Usage:
 *   npm run roster-health
 *   npm run roster-health -- --json     # the report object and nothing else
 */

import { auditRosterHealth, type RosterFinding } from '../World/roster-health';

function printTable(title: string, rows: readonly RosterFinding[]): void {
    process.stdout.write(`\n${title} (${rows.length})\n`);
    if (rows.length === 0) {
        process.stdout.write('  none\n');
        return;
    }
    const cols = ['lens', 'subject', 'id', 'where'] as const;
    const width = Object.fromEntries(cols.map(c => [c, Math.max(c.length, ...rows.map(r => r[c].length))]));
    process.stdout.write(`  ${cols.map(c => c.padEnd(width[c]!)).join('  ')}  detail\n`);
    for (const r of rows) {
        process.stdout.write(`  ${cols.map(c => r[c].padEnd(width[c]!)).join('  ')}  ${r.detail}\n`);
    }
}

if (require.main === module) {
    const report = auditRosterHealth();
    if (process.argv.includes('--json')) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
        printTable('Dangling references (gap: fix the reference)', report.dangling);
        printTable('Orphans (content: T decides)', report.orphans);
    }
}
