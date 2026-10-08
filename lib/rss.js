import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

const RSS_FEEDS = [
  'https://opportunitydesk.org/feed',
  'https://scholarship-positions.com/feed/',
  'https://opportunitiescorners.com/feed/',
  'https://www.opportunitiescircle.com/feed/'
];

export async function fetchFallbackOpportunities() {
  const opportunities = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      
      // Get the latest 20 items from each feed to maximize results
      const recentItems = feed.items.slice(0, 20);
      
      for (const item of recentItems) {
        // Simple heuristic to determine type
        const titleLower = (item.title || '').toLowerCase();
        let type = 'volunteer';
        if (titleLower.includes('hackathon')) type = 'hackathon';
        else if (titleLower.includes('competition') || titleLower.includes('award')) type = 'competition';
        else if (titleLower.includes('workshop') || titleLower.includes('training')) type = 'workshop';
        else if (titleLower.includes('fellowship') || titleLower.includes('scholarship')) type = 'club';

        // Extract a short description
        let desc = item.contentSnippet || item.content || item.summary || '';
        desc = desc.replace(/<[^>]+>/g, '').slice(0, 400).trim() + '...';

        opportunities.push({
          title: item.title,
          description: desc,
          type: type,
          organizer: feed.title || 'سەرچاوەی ئۆنلاین',
          location: titleLower.includes('online') || desc.toLowerCase().includes('online') ? 'ئۆنلاین' : 'گشتی (پێویستی بە پشکنینە)',
          is_online: titleLower.includes('online') || desc.toLowerCase().includes('online'),
          deadline: null, // RSS rarely has standard deadline fields
          required_skills: [],
          link: item.link,
          how_to_apply: 'بۆ زانیاری زیاتر و بەشداریکردن سەردانی لینکی فەرمی بکە.',
          benefits: 'جۆراوجۆر'
        });
      }
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feedUrl}:`, error.message);
    }
  }

  // Translate all fetched RSS opportunities to Kurdish using the AI
  if (opportunities.length > 0) {
    try {
      const { translateOpportunitiesToKurdish } = await import('./ai.js');
      const translated = await translateOpportunitiesToKurdish(opportunities);
      return translated;
    } catch (e) {
      console.error("Translation fallback failed:", e);
    }
  }

  return opportunities;
}
