/**
 * Hazard Implementation Gap Reporting
 *
 * Analysis-only module that identifies gaps between current mechanics
 * implementation and documented mobile behavior. No code changes unless
 * gaps are confirmed and approved by T.
 */

import { getHazardCardDef, getHazardDef } from '../hazard.content';
import { hazardStarterBag } from '../hazard.deck-flags';
import { createHazardSession } from '../hazard.engine';
import type { ImplementationGap, VerificationResult } from './divergence.verification';
import { verifyHazardDivergence, formatDivergenceReport } from './divergence.verification';

export interface GapAnalysis {
    timestamp: string;
    version: string;
    verification: VerificationResult;
    criticalGaps: ImplementationGap[];
    recommendedActions: string[];
    escalationRequired: boolean;
}

/**
 * Mobile hazard identifiers from divergence documentation.
 * These should match current mechanics implementation.
 */
const MOBILE_HAZARD_IDS = [
    'cracked-cliff',
    'flooded-undercroft', 
    'ashfall-crossing',
    'famine-march',
    'bandit-hunt',
    'fever-rot'
];

/**
 * Mobile starter card identifiers from divergence documentation.
 */
const MOBILE_STARTER_CARDS = [
    // Red starter
    'steps', 'haul', 'grip',
    // Blue starter  
    'scram', 'runner', 'leap',
    // Purple starter
    'footing', 'windread', 'pole',
    // Gold starter
    'oath', 'blessing'
];

/**
 * Mobile reward card identifiers from divergence documentation.
 */
const MOBILE_REWARD_CARDS = [
    'r_grip', 'r_wind', 'r_even', 'r_conv',
    'r_seer', 'r_gale', 'r_oath', 'r_crown'
];

/**
 * Analyze content compatibility between mobile and mechanics.
 */
function analyzeContentGaps(): ImplementationGap[] {
    const gaps: ImplementationGap[] = [];

    // Check hazard ID compatibility
    for (const hazardId of MOBILE_HAZARD_IDS) {
        try {
            const hazardDef = getHazardDef(hazardId);
            if (!hazardDef) {
                gaps.push({
                    item: `Hazard content: ${hazardId}`,
                    severity: 'critical',
                    description: `Mobile hazard ${hazardId} not found in mechanics`,
                    recommendation: 'Add missing hazard definition or map mobile ID to mechanics equivalent'
                });
            }
        } catch (error) {
            gaps.push({
                item: `Hazard content: ${hazardId}`,
                severity: 'critical', 
                description: `Error loading hazard ${hazardId}: ${error}`,
                recommendation: 'Investigate hazard loading error'
            });
        }
    }

    // Check starter card compatibility  
    for (const cardId of MOBILE_STARTER_CARDS) {
        try {
            const cardDef = getHazardCardDef(cardId);
            if (!cardDef) {
                gaps.push({
                    item: `Starter card: ${cardId}`,
                    severity: 'major',
                    description: `Mobile starter card ${cardId} not found in mechanics`,
                    recommendation: 'Add missing card definition or map mobile ID to mechanics equivalent'
                });
            }
        } catch (error) {
            gaps.push({
                item: `Starter card: ${cardId}`,
                severity: 'major',
                description: `Error loading card ${cardId}: ${error}`, 
                recommendation: 'Investigate card loading error'
            });
        }
    }

    // Check reward card compatibility
    for (const cardId of MOBILE_REWARD_CARDS) {
        try {
            const cardDef = getHazardCardDef(cardId);
            if (!cardDef) {
                gaps.push({
                    item: `Reward card: ${cardId}`,
                    severity: 'minor',
                    description: `Mobile reward card ${cardId} not found in mechanics`,
                    recommendation: 'Add missing reward card or verify reward system compatibility'
                });
            }
        } catch (error) {
            gaps.push({
                item: `Reward card: ${cardId}`,
                severity: 'minor', 
                description: `Error loading reward card ${cardId}: ${error}`,
                recommendation: 'Investigate reward card loading error'
            });
        }
    }

    return gaps;
}

/**
 * Analyze session compatibility and API differences.
 */
function analyzeSessionGaps(): ImplementationGap[] {
    const gaps: ImplementationGap[] = [];

    try {
        // Test session creation with mobile card IDs
        const session = createHazardSession(12345, hazardStarterBag(), 'cracked-cliff');
        
        // Check if deck bag accepts mobile card IDs
        if (session.drawPile.length === 0) {
            gaps.push({
                item: 'Session creation with mobile card IDs',
                severity: 'critical',
                description: 'Session created with empty draw pile when using mobile card IDs',
                recommendation: 'Investigate deck bag construction with mobile card identifiers'
            });
        }

    } catch (error) {
        gaps.push({
            item: 'Session creation API',
            severity: 'critical', 
            description: `Error creating session with mobile parameters: ${error}`,
            recommendation: 'Fix session creation API compatibility with mobile parameters'
        });
    }

    return gaps;
}

/**
 * Run comprehensive gap analysis.
 */
export function analyzeHazardGaps(): GapAnalysis {
    const verification = verifyHazardDivergence();
    const contentGaps = analyzeContentGaps();
    const sessionGaps = analyzeSessionGaps();
    
    const allGaps = [
        ...verification.gaps,
        ...contentGaps, 
        ...sessionGaps
    ];

    const criticalGaps = allGaps.filter(gap => gap.severity === 'critical');
    
    const recommendedActions = [];
    
    if (criticalGaps.length > 0) {
        recommendedActions.push('STOP: Critical gaps found - escalate to T before proceeding');
        recommendedActions.push('Address critical gaps first before continuing development');
    }
    
    if (allGaps.some(gap => gap.severity === 'major')) {
        recommendedActions.push('Major gaps require investigation and planning');
    }
    
    if (allGaps.length === 0) {
        recommendedActions.push('No gaps found - implementation appears to match mobile specification');
        recommendedActions.push('Continue with confidence in mobile parity');
    }

    return {
        timestamp: new Date().toISOString(),
        version: 'Phase 140 audit',
        verification,
        criticalGaps,
        recommendedActions,
        escalationRequired: criticalGaps.length > 0
    };
}

/**
 * Format gap analysis as human-readable report.
 */
export function formatGapReport(analysis: GapAnalysis): string {
    const lines: string[] = [
        '# Hazard Implementation Gap Report',
        '',
        `**Generated**: ${analysis.timestamp}`,
        `**Version**: ${analysis.version}`,
        `**Escalation Required**: ${analysis.escalationRequired ? 'YES ⚠️' : 'NO ✅'}`,
        ''
    ];

    // Executive summary
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(`- **Total verification items**: ${analysis.verification.totalItems}`);
    lines.push(`- **Verified items**: ${analysis.verification.verifiedItems}`);
    lines.push(`- **Total gaps**: ${analysis.verification.gaps.length}`);
    lines.push(`- **Critical gaps**: ${analysis.criticalGaps.length}`);
    lines.push('');

    // Critical gaps section
    if (analysis.criticalGaps.length > 0) {
        lines.push('## 🚨 Critical Gaps (Escalation Required)');
        lines.push('');
        
        analysis.criticalGaps.forEach((gap, i) => {
            lines.push(`### ${i + 1}. ${gap.item}`);
            lines.push(`**Description**: ${gap.description}`);
            lines.push(`**Recommendation**: ${gap.recommendation}`);
            lines.push('');
        });
    }

    // Recommended actions
    lines.push('## Recommended Actions');
    lines.push('');
    analysis.recommendedActions.forEach(action => {
        lines.push(`- ${action}`);
    });
    lines.push('');

    // Full verification report
    lines.push('## Full Verification Report');
    lines.push('');
    lines.push(formatDivergenceReport(analysis.verification));

    return lines.join('\n');
}

/**
 * Execute gap analysis and return results.
 * Read-only operation - makes no code changes.
 */
export function executeGapAudit(): { analysis: GapAnalysis; report: string } {
    const analysis = analyzeHazardGaps();
    const report = formatGapReport(analysis);
    
    return { analysis, report };
}