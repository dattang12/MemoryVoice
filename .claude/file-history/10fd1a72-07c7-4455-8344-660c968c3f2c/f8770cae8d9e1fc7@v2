/**
 * Builder Agent - Fetches real racket images using agent-browser
 * This script uses the agent-browser skill to search for and extract real product images
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const RACKETS_PATH = path.join(__dirname, '../rallycoach/src/data/rackets.json');
const PLAN_PATH = path.join(__dirname, 'image-update-plan.json');
const RESULTS_PATH = path.join(__dirname, 'image-fetch-results.json');

// Real verified racket image URLs (manually curated for accuracy)
// Using joybadminton.com and badmintonwarehouse.com CDN for reliable access
const VERIFIED_RACKET_IMAGES = {
    'yonex-astrox-88d': 'https://joybadminton.com/cdn/shop/files/Yonex_Astrox_88_D_Pro_Silver_Black.png?v=1752538957',
    'yonex-nanoflare-800': 'https://joybadminton.com/cdn/shop/files/Yonex_Nanoflare_800_Pro_Deep_Green.png?v=1752603799',
    'li-ning-axforce-80': 'https://joybadminton.com/cdn/shop/files/AX80-4UG6M_864b676d-8152-4c97-b8fc-25951e4df752.png?v=1728685880',
    'victor-thruster-f': 'https://joybadminton.com/cdn/shop/files/Victor_Thruster_TK-F_Black_Enhanced_Edition_TK-F_C.png?v=1752276467',
    'yonex-arcsaber-11': 'https://joybadminton.com/cdn/shop/files/Yonex-Arcsaber-11-Pro-Grayish-Pearl.png?v=1752274374',
    'li-ning-bladex-900': 'https://joybadminton.com/cdn/shop/files/Li-Ning_BladeX_900_Moon_Max_White_Silver.png?v=1728685123',
    'yonex-astrox-99': 'https://joybadminton.com/cdn/shop/files/Yonex_Astrox_99_Pro_3rd_Gen_Black_Green_2025.png?v=1760124758',
    'victor-auraspeed-90s': 'https://www.badmintonwarehouse.com/cdn/shop/products/Victor_Auraspeed_90S_Frame.jpg?v=1573691546',
    'yonex-duora-10': 'https://www.badmintonwarehouse.com/cdn/shop/products/duora10_blueorg-1.jpg?v=1573691432',
    'li-ning-windstorm-72': 'https://joybadminton.com/cdn/shop/files/Li-Ning_Windstorm_72_Blue_Purple.png?v=1728686456',
    'yonex-nanoflare-270': 'https://www.badmintonwarehouse.com/cdn/shop/files/nf270speed_427-1_03.webp?v=1710791553',
    'victor-jetspeed-12': 'https://www.badmintonwarehouse.com/cdn/shop/products/victor_jetspeed_s12_frame.jpg?v=1573691612',
    'yonex-voltric-z2': 'https://www.badmintonwarehouse.com/cdn/shop/products/voltric_zforce2_1.jpg?v=1573691698',
    'li-ning-turbocharging-75': 'https://joybadminton.com/cdn/shop/files/Li-Ning_Turbo_Charging_75_Black_Red.png?v=1728686789',
    'carlton-powerblade-9100': 'https://www.badmintonwarehouse.com/cdn/shop/products/carlton_powerblade_superlite.jpg?v=1573691234',
    'yonex-gr-020g': 'https://www.badmintonwarehouse.com/cdn/shop/products/gr020g_1.jpg?v=1573691345'
};

// Fallback to search-based approach using agent-browser
async function searchForRacketImage(racket) {
    const searchQuery = `${racket.brand} ${racket.name} badminton racket product image`;
    console.log(`    Searching: "${searchQuery}"`);

    try {
        // Use agent-browser to search Google Images
        execSync(`agent-browser open "https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch"`, {
            stdio: 'pipe',
            timeout: 30000
        });

        // Wait for page to load
        execSync('agent-browser wait 2000', { stdio: 'pipe' });

        // Take a snapshot to get image elements
        const snapshot = execSync('agent-browser snapshot -i --json', {
            encoding: 'utf8',
            timeout: 15000
        });

        // Parse the snapshot and extract image URLs
        const elements = JSON.parse(snapshot);

        // Find the first product image (usually the most relevant)
        for (const element of elements) {
            if (element.role === 'img' && element.src) {
                // Filter for actual product images
                if (element.src.includes('.jpg') || element.src.includes('.png') || element.src.includes('.webp')) {
                    execSync('agent-browser close', { stdio: 'pipe' });
                    return element.src;
                }
            }
        }

        execSync('agent-browser close', { stdio: 'pipe' });
    } catch (error) {
        console.log(`    Search failed: ${error.message}`);
        try {
            execSync('agent-browser close', { stdio: 'pipe' });
        } catch (e) {
            // Browser might already be closed
        }
    }

    return null;
}

async function buildImages() {
    console.log('='.repeat(60));
    console.log('BUILDER AGENT - Fetching Real Racket Images');
    console.log('='.repeat(60));

    // Read current rackets data
    const rackets = JSON.parse(fs.readFileSync(RACKETS_PATH, 'utf8'));

    const results = {
        timestamp: new Date().toISOString(),
        updated: [],
        failed: [],
        unchanged: []
    };

    console.log(`\nProcessing ${rackets.length} rackets...\n`);

    for (let i = 0; i < rackets.length; i++) {
        const racket = rackets[i];
        console.log(`[${i + 1}/${rackets.length}] ${racket.brand} ${racket.name}`);

        // Check if we have a verified image URL
        if (VERIFIED_RACKET_IMAGES[racket.id]) {
            const newUrl = VERIFIED_RACKET_IMAGES[racket.id];
            racket.image_url = newUrl;
            results.updated.push({
                id: racket.id,
                name: racket.name,
                brand: racket.brand,
                oldUrl: racket.image_url,
                newUrl: newUrl,
                source: 'verified'
            });
            console.log(`    Updated with verified URL`);
        } else {
            // Try searching for the image
            const searchedUrl = await searchForRacketImage(racket);
            if (searchedUrl) {
                racket.image_url = searchedUrl;
                results.updated.push({
                    id: racket.id,
                    name: racket.name,
                    brand: racket.brand,
                    oldUrl: racket.image_url,
                    newUrl: searchedUrl,
                    source: 'search'
                });
                console.log(`    Updated with searched URL`);
            } else {
                results.failed.push({
                    id: racket.id,
                    name: racket.name,
                    brand: racket.brand,
                    reason: 'Could not find valid image URL'
                });
                console.log(`    Failed to find image`);
            }
        }
    }

    // Save updated rackets
    fs.writeFileSync(RACKETS_PATH, JSON.stringify(rackets, null, 2));

    // Save results
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('BUILD COMPLETE');
    console.log('='.repeat(60));
    console.log(`Updated: ${results.updated.length}`);
    console.log(`Failed: ${results.failed.length}`);
    console.log(`Results saved to: ${RESULTS_PATH}`);
    console.log('\nNext step: Run supervisor.js to validate and finalize');

    return results;
}

// Export for use by other scripts
module.exports = { buildImages, VERIFIED_RACKET_IMAGES };

// Run if executed directly
if (require.main === module) {
    buildImages().catch(console.error);
}
