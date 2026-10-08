/* eslint-disable @typescript-eslint/no-require-imports */

const { searchWebForOpportunities } = require('./lib/ai.js');

async function test() {
  try {
    console.log("Starting deep web search...");
    let result = await searchWebForOpportunities();
    if (result.length === 0) {
      console.log("AI returned empty, trying fallback...");
      const { fetchFallbackOpportunities } = require('./lib/rss.js');
      result = await fetchFallbackOpportunities();
    }
    console.log("Found opportunities:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
