/**
 * Supervisor Agent - Orchestrates and validates the racket image update process
 * This script coordinates the planner and builder agents, and validates the results
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const RACKETS_PATH = path.join(__dirname, '../rallycoach/src/data/rackets.json');
const VALIDATION_RESULTS_PATH = path.join(__dirname, 'validation-results.json');

// Helper function to check if an image URL is accessible
function checkImageUrl(url) {
    return new Promise((resolve) => {
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            resolve({ valid: false, reason: 'Invalid URL format' });
            return;
        }

        const protocol = url.startsWith('https') ? https : http;
        const options = {
            method: 'HEAD',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        try {
            const req = protocol.request(url, options, (res) => {
                const contentType = res.headers['content-type'] || '';
                const isImage = contentType.includes('image') ||
                               url.endsWith('.jpg') ||
                               url.endsWith('.png') ||
                               url.endsWith('.webp') ||
                               url.endsWith('.gif');

                resolve({
                    valid: res.statusCode >= 200 && res.statusCode < 400 && isImage,
                    statusCode: res.statusCode,
                    contentType: contentType
                });
            });

            req.on('error', (e) => {
                resolve({ valid: false, reason: e.message });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ valid: false, reason: 'Timeout' });
            });

            req.end();
        } catch (error) {
            resolve({ valid: false, reason: error.message });
        }
    });
}

async function supervise() {
    console.log('='.repeat(60));
    console.log('SUPERVISOR AGENT - Validation & Finalization');
    console.log('='.repeat(60));

    // Read current rackets data
    const rackets = JSON.parse(fs.readFileSync(RACKETS_PATH, 'utf8'));

    const validation = {
        timestamp: new Date().toISOString(),
        totalRackets: rackets.length,
        validImages: [],
        invalidImages: [],
        needsAttention: []
    };

    console.log(`\nValidating ${rackets.length} racket images...\n`);

    for (let i = 0; i < rackets.length; i++) {
        const racket = rackets[i];
        console.log(`[${i + 1}/${rackets.length}] ${racket.brand} ${racket.name}`);

        const result = await checkImageUrl(racket.image_url);

        if (result.valid) {
            validation.validImages.push({
                id: racket.id,
                name: racket.name,
                brand: racket.brand,
                imageUrl: racket.image_url
            });
            console.log(`    VALID (Status: ${result.statusCode})`);
        } else {
            validation.invalidImages.push({
                id: racket.id,
                name: racket.name,
                brand: racket.brand,
                imageUrl: racket.image_url,
                reason: result.reason || `HTTP ${result.statusCode}`
            });
            console.log(`    INVALID: ${result.reason || `HTTP ${result.statusCode}`}`);

            // Mark as needs attention
            validation.needsAttention.push({
                id: racket.id,
                name: racket.name,
                brand: racket.brand,
                suggestedSearch: `${racket.brand} ${racket.name} badminton racket`
            });
        }
    }

    // Save validation results
    fs.writeFileSync(VALIDATION_RESULTS_PATH, JSON.stringify(validation, null, 2));

    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('SUPERVISION COMPLETE - Summary Report');
    console.log('='.repeat(60));
    console.log(`Total rackets: ${validation.totalRackets}`);
    console.log(`Valid images: ${validation.validImages.length} (${Math.round(validation.validImages.length / validation.totalRackets * 100)}%)`);
    console.log(`Invalid images: ${validation.invalidImages.length}`);
    console.log(`\nResults saved to: ${VALIDATION_RESULTS_PATH}`);

    if (validation.invalidImages.length > 0) {
        console.log('\nRackets needing attention:');
        validation.needsAttention.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.brand} ${item.name}`);
            console.log(`     Search: "${item.suggestedSearch}"`);
        });
    }

    return validation;
}

// Export for use by other scripts
module.exports = { supervise, checkImageUrl };

// Run if executed directly
if (require.main === module) {
    supervise().catch(console.error);
}
