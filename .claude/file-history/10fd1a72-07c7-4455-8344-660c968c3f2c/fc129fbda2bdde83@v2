/**
 * Main Orchestrator - Runs all agents in sequence to fix racket images
 *
 * This script coordinates:
 * 1. Subagent Planner - Creates the update plan
 * 2. Builder - Fetches and updates real images
 * 3. Supervisor - Validates the results
 */

const { spawn } = require('child_process');
const path = require('path');

const SCRIPTS_DIR = __dirname;

function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Running: ${scriptName}`);
        console.log('='.repeat(60));

        const scriptPath = path.join(SCRIPTS_DIR, scriptName);
        const child = spawn('node', [scriptPath], {
            cwd: SCRIPTS_DIR,
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`${scriptName} exited with code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     RACKET IMAGE FIX - MULTI-AGENT ORCHESTRATOR         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\nStarting agent sequence...\n');

    const startTime = Date.now();

    try {
        // Step 1: Run Planner
        console.log('STEP 1/3: Planning Phase');
        await runScript('subagent-planner.js');

        // Step 2: Run Builder
        console.log('\nSTEP 2/3: Building Phase');
        await runScript('builder.js');

        // Step 3: Run Supervisor
        console.log('\nSTEP 3/3: Validation Phase');
        await runScript('supervisor.js');

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n' + '═'.repeat(60));
        console.log('ALL AGENTS COMPLETED SUCCESSFULLY');
        console.log('═'.repeat(60));
        console.log(`Total execution time: ${duration}s`);
        console.log('\nRacket images have been updated!');
        console.log('Check validation-results.json for details.');

    } catch (error) {
        console.error('\n' + '═'.repeat(60));
        console.error('AGENT EXECUTION FAILED');
        console.error('═'.repeat(60));
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export for external use
module.exports = { runScript, main };

// Run if executed directly
if (require.main === module) {
    main();
}
