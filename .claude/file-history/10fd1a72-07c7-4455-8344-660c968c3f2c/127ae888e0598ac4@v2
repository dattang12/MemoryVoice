/**
 * Subagent Planner - Plans the racket image update process
 * This script analyzes rackets.json and creates a plan for fetching real images
 */

const fs = require('fs');
const path = require('path');

const RACKETS_PATH = path.join(__dirname, '../rallycoach/src/data/rackets.json');
const PLAN_OUTPUT_PATH = path.join(__dirname, 'image-update-plan.json');

async function planImageUpdate() {
    console.log('='.repeat(60));
    console.log('SUBAGENT PLANNER - Racket Image Update Planning');
    console.log('='.repeat(60));

    // Read current rackets data
    const rackets = JSON.parse(fs.readFileSync(RACKETS_PATH, 'utf8'));

    console.log(`\nAnalyzing ${rackets.length} rackets...`);

    // Create search plan for each racket
    const plan = {
        timestamp: new Date().toISOString(),
        totalRackets: rackets.length,
        searchQueries: [],
        execution: {
            searchEngine: 'google-images',
            fallback: 'bing-images',
            imageSize: 'medium',
            imageType: 'product'
        }
    };

    rackets.forEach((racket, index) => {
        // Create optimized search query for each racket
        const searchQuery = {
            id: racket.id,
            name: racket.name,
            brand: racket.brand,
            priority: index + 1,
            searches: [
                // Primary search: Brand + Model + "badminton racket"
                `${racket.brand} ${racket.name} badminton racket`,
                // Secondary search: Brand + Model product image
                `${racket.brand} ${racket.name} product image`,
                // Tertiary: eBay search query (already optimized)
                racket.ebay_search_query
            ],
            currentImageUrl: racket.image_url,
            expectedImageSource: 'official-product-image'
        };

        plan.searchQueries.push(searchQuery);

        console.log(`  [${index + 1}/${rackets.length}] ${racket.brand} ${racket.name}`);
        console.log(`      Search: "${searchQuery.searches[0]}"`);
    });

    // Save the plan
    fs.writeFileSync(PLAN_OUTPUT_PATH, JSON.stringify(plan, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('PLAN COMPLETE');
    console.log('='.repeat(60));
    console.log(`Plan saved to: ${PLAN_OUTPUT_PATH}`);
    console.log(`Total rackets to update: ${plan.totalRackets}`);
    console.log('\nNext step: Run builder.js to fetch real images');

    return plan;
}

// Export for use by other scripts
module.exports = { planImageUpdate };

// Run if executed directly
if (require.main === module) {
    planImageUpdate().catch(console.error);
}
