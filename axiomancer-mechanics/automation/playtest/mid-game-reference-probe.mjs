#!/usr/bin/env node

/**
 * Mid-game reference probe (Phase 119)
 * 
 * Runs deterministic mid-game probe using a level-6 Wanderer-style player state 
 * with Tier 2 skills available against northern-forest elite-tier enemies.
 * Follows the Phase 104 script/report style.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Define the scenarios for mid-game testing
const MID_GAME_SCENARIOS = [
    {
        id: 'mid-game-hush-wraith',
        description: 'Mid-game level-6 Wanderer against Hush-Wraith (northern-forest elite, mind-focused)',
        preset: 'wanderer-level-6',
        enemy: 'hush-wraith',
        runs: 20,
        maxRounds: 45,
        seed: 'mid-game-nf-v0',
        policies: ['aggressive', 'defensive', 'mixed', 'strategist']
    },
    {
        id: 'mid-game-hollow-saint',
        description: 'Mid-game level-6 Wanderer against Hollow Saint (northern-forest elite, heart-focused)',
        preset: 'wanderer-level-6',
        enemy: 'hollow-saint',
        runs: 20,
        maxRounds: 45,
        seed: 'mid-game-nf-v0',
        policies: ['aggressive', 'defensive', 'mixed', 'strategist']
    },
    {
        id: 'mid-game-frostbound-hunter',
        description: 'Mid-game level-6 Wanderer against Frostbound Hunter (northern-forest elite, body-focused)',
        preset: 'wanderer-level-6',
        enemy: 'frostbound-hunter',
        runs: 20,
        maxRounds: 45,
        seed: 'mid-game-nf-v0',
        policies: ['aggressive', 'defensive', 'mixed', 'strategist']
    }
];

function main() {
    console.log('Running mid-game reference probe (Phase 119)...');
    console.log('=====================================');

    const results = [];
    const outDir = 'automation/playtest/reports';
    const scenarioDir = 'automation/playtest/scenarios';

    // Ensure directories exist
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(scenarioDir, { recursive: true });

    for (const scenario of MID_GAME_SCENARIOS) {
        console.log(`\\nRunning scenario: ${scenario.id}`);
        
        // Write scenario file
        const scenarioPath = path.join(scenarioDir, `${scenario.id}.json`);
        fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));
        
        try {
            // Run the playtest CLI
            const output = execSync(`npm run playtest -- --scenario="${scenarioPath}"`, {
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'inherit']
            });
            
            console.log(output.trim());
            results.push({ scenario: scenario.id, status: 'success' });
        } catch (error) {
            console.error(`Failed to run ${scenario.id}: ${error.message}`);
            results.push({ scenario: scenario.id, status: 'failed', error: error.message });
        }
    }

    // Summary
    console.log('\\n=====================================');
    console.log('Mid-game probe summary:');
    results.forEach(result => {
        const status = result.status === 'success' ? '✓' : '✗';
        console.log(`  ${status} ${result.scenario}`);
        if (result.error) console.log(`    Error: ${result.error}`);
    });

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\\nCompleted ${successCount}/${results.length} scenarios successfully.`);
    
    if (successCount > 0) {
        console.log(`\\nReports generated in: ${outDir}/`);
        console.log('Files:');
        MID_GAME_SCENARIOS.forEach(scenario => {
            console.log(`  - ${scenario.id}.md`);
            console.log(`  - ${scenario.id}.json`);
        });
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}