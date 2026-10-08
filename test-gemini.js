/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { extractOpportunities } = require('./lib/ai.js');

async function test() {
  try {
    const text = "Join our upcoming hackathon in Erbil this Friday! Tech for Good.";
    const result = await extractOpportunities(text, "https://example.com");
    console.log("Success:", result);
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
