import Parser from 'rss-parser';
const parser = new Parser();
async function run() {
  const feed = await parser.parseURL('https://news.google.com/rss/search?q=youth+opportunities+Kurdistan+OR+Iraq+when:7d');
  console.log(feed.items.map(i => i.title));
}
run();
