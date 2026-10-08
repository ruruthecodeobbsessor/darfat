// Creates 20 sample accounts (finished onboarding, posts, follows) for demos.
//   node scripts/seed-demo-users.mjs           create or refresh them
//   node scripts/seed-demo-users.mjs --remove  delete them all
// All use emails demoNN@darfat.demo and the password below.
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { databaseClient } from "./auth-db.mjs";

nextEnv.loadEnvConfig(process.cwd());
const PASSWORD = "Darfat-demo-2026";
const EMAIL = (n) => `demo${String(n).padStart(2, "0")}@darfat.demo`;

const T = "تەکنەلۆژیا و پڕۆگرامسازی", D = "دیزاین و داهێنان", B = "کارئافرینی و بازرگانی", S = "زانست و توێژینەوە",
  A = "هونەر و میدیا", V = "کاری خۆبەخشی و کۆمەڵایەتی", E = "پەروەردە و فێرکردن", N = "ژینگە و سروشت",
  SP = "وەرزش و تەندروستی", L = "زمان و وەرگێڕان", W = "نووسین و ئەدەب", M = "مۆسیقا";

const PEOPLE = [
  { name: "ئارام ئەحمەد", city: "هەولێر", age: 21, interests: [T, B], skills: ["Python", "JavaScript", "React"], headline: "گەشەپێدەری وێب و خوێندکاری کۆمپیوتەر", bio: "خوێندکاری قۆناغی سێی کۆمپیوتەرم. حەزم لە دروستکردنی ئەپی وێبە و دەمەوێت ستارتاپی خۆم دابمەزرێنم.", posts: [["ئەمڕۆ یەکەم ئەپی React ـم بڵاوکردەوە! 🚀", "public"]] },
  { name: "شیلان عومەر", city: "سلێمانی", age: 20, interests: [D, A], skills: ["Figma", "دیزاینی گرافیک", "UI/UX"], headline: "دیزاینەری UI/UX", bio: "دیزاینەرم و حەزم لە دروستکردنی ڕووکاری جوان و ئاسانە. خەون دەبینم ببمە دیزاینەری بەرهەم.", posts: [["دیزاینی ئەپی خوێندنەوەی کوردیم تەواو کرد 🎨", "public"], ["سوپاس بۆ هەموو ئەوانەی ڕاوبۆچوونیان دام", "followers"]] },
  { name: "هێمن کەریم", city: "دهۆک", age: 23, interests: [S, T], skills: ["Python", "شیکاری داتا", "Excel"], headline: "شیکەرەوەی داتا", bio: "دەرچووی ئامارم و ئێستا لە بواری شیکاری داتا کار دەکەم. حەزم لە دۆزینەوەی شاراوەکانی ناو ژمارەکانە.", posts: [["بڕوانامەی Google Data Analytics ـم وەرگرت ✅", "public"]] },
  { name: "ڕێژین حسێن", city: "هەولێر", age: 19, interests: [V, E], skills: ["قسەکردن لەبەردەم خەڵک", "کاری تیمی", "زمانی ئینگلیزی"], headline: "خۆبەخش و ڕێکخەری چالاکی گەنجان", bio: "لە چەند ڕێکخراوێکی خۆبەخشیدا کار دەکەم. دەمەوێت یارمەتی گەنجان بدەم دەرفەت بدۆزنەوە.", posts: [["٥٠ کتێبمان بۆ قوتابخانەیەکی گوندی کۆکردەوە 📚", "public"]] },
  { name: "دانا سەعید", city: "سلێمانی", age: 24, interests: [B, T], skills: ["مارکێتینگ", "بەڕێوەبردنی پڕۆژە", "Excel"], headline: "کارئافرین و دامەزرێنەری ستارتاپ", bio: "ستارتاپێکی بچووکی گەیاندنم هەیە. حەزم لە ناسینی گەشەپێدەر و دیزاینەری نوێیە.", posts: [["ستارتاپەکەمان گەیشتە ١٠٠٠ بەکارهێنەر 🎉", "public"], ["بەدوای گەشەپێدەری Flutter دا دەگەڕێین", "public"]] },
  { name: "نازدار عەلی", city: "کەرکووک", age: 22, interests: [L, W], skills: ["زمانی ئینگلیزی", "وەرگێڕان", "نووسین"], headline: "وەرگێڕ و نووسەر", bio: "وەرگێڕم لە نێوان کوردی، عەرەبی و ئینگلیزیدا. حەزم لە نووسینی چیرۆکی کورتە.", posts: [["یەکەم چیرۆکی کورتم لە گۆڤارێکدا بڵاوکرایەوە ✍️", "public"]] },
  { name: "سەروەر جەلال", city: "هەولێر", age: 18, interests: [T, SP], skills: ["Python", "Scratch", "کاری تیمی"], headline: "قوتابی ئامادەیی و حەزلێکەری ڕۆبۆت", bio: "قوتابی پۆلی دوازدەم. حەزم لە ڕۆبۆت و پێشبڕکێی پڕۆگرامسازییە.", posts: [["لە پێشبڕکێی ڕۆبۆتی قوتابخانەکان پلەی سێیەممان بەدەستهێنا 🤖", "public"]] },
  { name: "لانە مەحمود", city: "سلێمانی", age: 21, interests: [A, D, M], skills: ["وێنەگرتن", "Photoshop", "مۆنتاژی ڤیدیۆ"], headline: "وێنەگر و دروستکەری ناوەڕۆک", bio: "وێنەگرم و ڤیدیۆ بۆ ڕێکخراوەکان دروست دەکەم. دەمەوێت فیلمی بەڵگەنامەیی دروست بکەم.", posts: [["پێشانگای وێنەی یەکەمم لە سلێمانی کرایەوە 📸", "public"]] },
  { name: "کاروان حەمە", city: "هەڵەبجە", age: 25, interests: [N, V], skills: ["بەڕێوەبردنی پڕۆژە", "قسەکردن لەبەردەم خەڵک"], headline: "چالاکوانی ژینگە", bio: "لە پڕۆژەی چاندنی دار و پاککردنەوەی ژینگەدا کار دەکەم.", posts: [["٣٠٠ دارمان لە هەڵەبجە چاند 🌳", "public"]] },
  { name: "بەفرین ئیسماعیل", city: "دهۆک", age: 20, interests: [S, E], skills: ["توێژینەوە", "زمانی ئینگلیزی", "Excel"], headline: "خوێندکاری بایۆلۆجی", bio: "خوێندکاری بایۆلۆجیم و حەزم لە توێژینەوەی زانستییە. دەمەوێت لە دەرەوە ماستەر بخوێنم.", posts: [["توێژینەوەکەم لە کۆنفرانسی خوێندکاران پێشکەش کرد 🔬", "public"]] },
  { name: "ئاکۆ ڕەشید", city: "هەولێر", age: 26, interests: [T, S], skills: ["JavaScript", "Node.js", "SQL"], headline: "گەشەپێدەری Backend", bio: "سێ ساڵە وەک گەشەپێدەری Backend کار دەکەم. حەزم لە فێرکردنی گەنجانی نوێیە.", posts: [["وۆرکشۆپێکی بێبەرامبەرم بۆ فێرکردنی Node.js ڕێکخست", "public"], ["سلاید و کۆدەکانی وۆرکشۆپ بۆ فۆڵۆوەرەکان", "followers"]] },
  { name: "ژیان فاروق", city: "سلێمانی", age: 19, interests: [M, A], skills: ["ژەنینی گیتار", "گۆرانی", "کاری تیمی"], headline: "مۆسیقاژەن", bio: "گیتار دەژەنم و لە باندێکی بچووکدا گۆرانی دەڵێم. دەمەوێت مۆسیقای کوردی بە جیهان بناسێنم.", posts: [["یەکەم کۆنسێرتی باندەکەمان سەرکەوتوو بوو 🎸", "public"]] },
  { name: "هاوڕێ نەوزاد", city: "کەرکووک", age: 23, interests: [B, V], skills: ["مارکێتینگ", "سۆشیال میدیا", "قسەکردن لەبەردەم خەڵک"], headline: "پسپۆڕی سۆشیال میدیا", bio: "پەیجی سۆشیال میدیا بۆ ڕێکخراوە خۆبەخشەکان بەڕێوە دەبەم.", posts: [] },
  { name: "سارا بەختیار", city: "هەولێر", age: 22, interests: [D, T], skills: ["Figma", "HTML/CSS", "UI/UX"], headline: "دیزاینەر و گەشەپێدەری Front-end", bio: "دیزاین دەکەم و کۆدیشی دەنووسم. حەزم لە هاکاسۆنە.", posts: [["تیمەکەمان لە هاکاسۆنی هەولێر پلەی دووەمی بەدەستهێنا 🥈", "public"]] },
  { name: "ڕێبوار قادر", city: "سلێمانی", age: 27, interests: [E, L], skills: ["فێرکردن", "زمانی ئینگلیزی", "نووسین"], headline: "مامۆستای زمانی ئینگلیزی", bio: "مامۆستای ئینگلیزیم و کۆرسی ئۆنلاین بۆ گەنجان دەڵێمەوە.", posts: [["کۆرسی بێبەرامبەری IELTS دەست پێدەکات، بەشداربن", "public"]] },
  { name: "ئەڤین جەمال", city: "زاخۆ", age: 20, interests: [SP, E], skills: ["ڕاهێنانی وەرزشی", "کاری تیمی"], headline: "یاریزانی تۆپی پێ", bio: "یاریزانی تیمی ئافرەتانی زاخۆم. دەمەوێت ببمە ڕاهێنەر.", posts: [["تیمەکەمان پاڵەوانی پارێزگای دهۆک بوو ⚽", "public"]] },
  { name: "بێستون عوسمان", city: "هەولێر", age: 24, interests: [T, B], skills: ["Flutter", "Dart", "Firebase"], headline: "گەشەپێدەری ئەپی مۆبایل", bio: "ئەپی مۆبایل بە Flutter دروست دەکەم. بەدوای تیمێکدا دەگەڕێم بۆ هاکاسۆنی داهاتوو.", posts: [["ئەپەکەم گەیشتە Google Play 📱", "public"]] },
  { name: "ڤیان سەلیم", city: "دهۆک", age: 18, interests: [W, A], skills: ["نووسین", "وێنەکێشان"], headline: "قوتابی و شاعیر", bio: "شیعر دەنووسم و وێنە دەکێشم. خەونم چاپکردنی دیوانێکە.", posts: [["لە پێشبڕکێی شیعری قوتابیان خەڵاتم وەرگرت 🏅", "followers"]] },
  { name: "زانیار مستەفا", city: "سلێمانی", age: 22, interests: [S, N], skills: ["Python", "توێژینەوە", "GIS"], headline: "خوێندکاری ئەندازیاری ژینگە", bio: "لەسەر پیسبوونی ئاو توێژینەوە دەکەم و GIS بەکاردەهێنم.", posts: [] },
  { name: "تارا حەسەن", city: "هەولێر", age: 21, interests: [V, D, E], skills: ["Canva", "بەڕێوەبردنی پڕۆژە", "زمانی ئینگلیزی"], headline: "ڕێکخەری پڕۆژەی خۆبەخشی", bio: "پڕۆژەی خۆبەخشی بۆ منداڵان ڕێکدەخەم و پۆستەر و بڵاوکراوەکانیان دیزاین دەکەم.", posts: [["کەمپینی جلوبەرگی زستانەمان گەیشتە ٢٠٠ خێزان ❤️", "public"]] },
];

// Who follows whom (by index), so counts and followers-only posts have something to show.
const FOLLOWS = PEOPLE.map((_, i) => [(i + 1) % 20, (i + 3) % 20, (i + 7) % 20].filter((j) => j !== i));

const db = databaseClient();
await db.connect();
try {
  if (process.argv.includes("--remove")) {
    const { rowCount } = await db.query("delete from auth.users where email like 'demo__@darfat.demo'");
    console.log(`Removed ${rowCount} demo accounts.`);
  } else {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const ids = [];
    for (const [i, person] of PEOPLE.entries()) {
      const client = createClient(url, key, { auth: { persistSession: false } });
      const email = EMAIL(i + 1);
      let { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
      if (error) ({ data, error } = await client.auth.signUp({ email, password: PASSWORD, options: { data: { name: person.name } } }));
      if (error || !data.user) throw new Error(`${email}: ${error?.message ?? "no user"}`);
      ids.push(data.user.id);
      await db.query(
        `update public.profiles set name=$2, city=$3, age=$4, interests=$5, skills=$6, headline=$7, bio=$8, onboarding_completed=true where id=$1`,
        [data.user.id, person.name, person.city, person.age, person.interests, person.skills, person.headline, person.bio]
      );
      await db.query("delete from public.posts where author_id=$1", [data.user.id]);
      for (const [h, [body, visibility]] of person.posts.entries()) {
        await db.query(
          `insert into public.posts (author_id, body, visibility, created_at) values ($1, $2, $3, now() - make_interval(hours => $4))`,
          [data.user.id, body, visibility, (i * 7 + h * 30) % 240]
        );
      }
      console.log(`✓ ${email}  ${person.name}`);
    }
    for (const [i, targets] of FOLLOWS.entries()) {
      for (const j of targets) {
        await db.query("insert into public.follows (follower_id, following_id) values ($1, $2) on conflict do nothing", [ids[i], ids[j]]);
      }
    }
    console.log(`\n${ids.length} demo accounts ready. Password for all: ${PASSWORD}`);
  }
} finally {
  await db.end();
}
