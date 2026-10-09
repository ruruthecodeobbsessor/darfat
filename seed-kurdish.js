import { query } from 'file:///c:/Users/apple/Documents/project/darfat/lib/db.js';

async function seed() {
  const opps = [
    {
      title: "بەرنامەی پێگەیاندنی پێنج یەک (Five One Labs Incubation)",
      description: "بەرنامەیەکی چڕی چەند مانگە بۆ پشتگیریکردنی گەنجانی خاوەن بیرۆکەی داهێنەرانە بۆ دروستکردنی کۆمپانیای سەربەخۆ. لەم بەرنامەیەدا ڕاهێنان و سەرپەرشتیاری و هەلی وەرگرتنی پارە بۆ دەستپێکردن دەستەبەر دەکرێت.",
      type: "workshop",
      organizer: "Five One Labs",
      location: "هەولێر و سلێمانی",
      is_online: false,
      deadline: "2027-01-15",
      required_skills: ["سەرکردایەتی", "بیرۆکەی بازرگانی"],
      link: "https://fiveonelabs.org/programs",
      how_to_apply: "فۆڕمی ئۆنلاین پڕبکەرەوە لە وێبسایتی فەرمی پێنج یەک.",
      benefits: "هاوکاری دارایی بۆ دەستپێکردن، ئۆفیسی کارکردن، ڕاهێنانی بازرگانی"
    },
    {
      title: "خەڵاتەکانی ڕوانگە (Rwanga Awards 2026)",
      description: "پێشبڕکێیەکی ساڵانەی گەورەیە کە لەلایەن دەزگای ڕوانگەوە ڕێکدەخرێت بۆ دۆزینەوە و خەڵاتکردنی بەهرەی گەنجان لە بوارەکانی تەکنەلۆجیا، هونەر، داهێنانی زانستی، و پڕۆژەی خزمەتگوزاری.",
      type: "competition",
      organizer: "دەزگای ڕوانگە",
      location: "کوردستان - هەولێر",
      is_online: false,
      deadline: "2026-11-30",
      required_skills: ["داهێنان", "پرۆژەسازی"],
      link: "https://www.rwanga.org/ckb/awards",
      how_to_apply: "پرۆژەکەت پێشکەش بکە لە ڕێگەی پۆرتاڵی دەزگای ڕوانگە.",
      benefits: "خەڵاتی دارایی گەورە، بڕوانامەی نێودەوڵەتی، پشتگیری میدیایی"
    },
    {
      title: "هاکاسۆنی داهێنانی تەکنەلۆجیای کوردستان (Kurdistan Tech Innovation Hackathon)",
      description: "پێشبڕکێیەکی ٤٨ کاتژمێرییە بۆ گەشەپێدەران و دیزاینەران بۆ دروستکردنی چارەسەری دیجیتاڵی بۆ کێشەکانی ژینگەیی و پەروەردەیی لە کوردستان.",
      type: "hackathon",
      organizer: "Kurdistan Innovation Hub",
      location: "سلێمانی، زانکۆی ئەمریکی AUIS",
      is_online: false,
      deadline: "2026-12-10",
      required_skills: ["کۆدینگ", "دیزاین", "تیم وۆرک"],
      link: "https://auis.edu.krd/academic-programs",
      how_to_apply: "وەک تیمێک ناوی خۆتان تۆمار بکەن پێش کۆتایی هاتنی وادەکە.",
      benefits: "خەڵاتی دارایی، دەرفەتی کارکردن، ڕاهێنانی پێشکەوتوو"
    }
  ];

  for (const opp of opps) {
    await query(
      `INSERT INTO opportunities (title, description, type, organizer, location, is_online, deadline, required_skills, link, how_to_apply, benefits, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'published')`,
      [opp.title, opp.description, opp.type, opp.organizer, opp.location, opp.is_online, opp.deadline, JSON.stringify(opp.required_skills), opp.link, opp.how_to_apply, opp.benefits]
    );
  }
  console.log("Successfully seeded 3 real Kurdish opportunities!");
}
seed();
