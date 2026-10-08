/* eslint-disable @typescript-eslint/no-require-imports */
const { query } = require('./lib/db.js');
const { translateOpportunitiesToKurdish } = require('./lib/ai.js');

async function run() {
  console.log("Fetching existing opportunities...");
  const res = await query(`SELECT id, title, description, location FROM opportunities`);
  const ops = res.rows;

  console.log(`Found ${ops.length} opportunities. Translating...`);
  
  // We'll chunk them just in case there are many
  for (let i = 0; i < ops.length; i += 5) {
    const chunk = ops.slice(i, i + 5);
    try {
      const translatedChunk = await translateOpportunitiesToKurdish(chunk);
      
      for (let j = 0; j < translatedChunk.length; j++) {
        const id = chunk[j].id; // Ensure we match the original ID
        const tTitle = translatedChunk[j].title;
        const tDesc = translatedChunk[j].description;
        
        await query(`UPDATE opportunities SET title = $1, description = $2 WHERE id = $3`, [tTitle, tDesc, id]);
        console.log(`Updated ID ${id}`);
      }
    } catch (e) {
      console.error("Failed to translate chunk:", e);
    }
  }

  console.log("Done translating DB.");
  process.exit(0);
}

run().catch(console.error);
