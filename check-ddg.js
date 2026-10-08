const ch = require('cheerio');
async function run() {
  const r = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    body: 'q=youth+opportunities+kurdistan',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const t = await r.text();
  const $ = ch.load(t);
  const links = [];
  $('a.result__url').each((i, el) => {
    links.push($(el).attr('href'));
  });
  console.log(links.slice(0, 10).join('\n'));
}
run();
