-- Rename the space item for Bangladesh's first communications satellite, which
-- the government renamed from বঙ্গবন্ধু-১ to বাংলাদেশ স্যাটেলাইট-১ in 2025, and
-- carry three "পর্দায়" cue fixes from worlds.ts that never reached D1: each
-- named a figure the scene does not show.
-- Apply with:  npx wrangler d1 migrations apply posora --remote
--
-- Every statement is guarded on the exact seed value, so a category an admin
-- has already edited is left alone, the same rule as 0008.

UPDATE worlds
SET cats_json = json_set(cats_json, '$[4].items[7]', 'বাংলাদেশ স্যাটেলাইট-১'),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug = 'space'
  AND json_extract(cats_json, '$[4].n') = 'মহাকাশ অভিযান'
  AND json_extract(cats_json, '$[4].items[7]') = 'বঙ্গবন্ধু-১ স্যাটেলাইট';

UPDATE worlds
SET cats_json = json_set(cats_json, '$[5].play', 'প্রতিটি শ্রেণির একটা করে প্রাণী সামনে দাঁড়ানো - স্তন্যপায়ীর জায়গায় লাল শিয়াল, পাখির জায়গায় ময়ূর, সরীসৃপের জায়গায় ক্যামেলিয়ন। স্লাইডার টানলে একেকটা এগিয়ে আসে।'),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug = 'life'
  AND json_extract(cats_json, '$[5].n') = 'প্রাণীর শ্রেণি'
  AND json_extract(cats_json, '$[5].play') = 'প্রতিটি শ্রেণির একটা করে প্রাণী সামনে দাঁড়ানো - স্তন্যপায়ীর জায়গায় বাঘ, পাখির জায়গায় দোয়েল, সরীসৃপের জায়গায় কুমির। স্লাইডার টানলে একেকটা এগিয়ে আসে।';

UPDATE worlds
SET cats_json = json_set(cats_json, '$[5].play', 'গোটা হলুদ আর লাল মরিচ, পাশে জিরা-ধনে-সরিষার দানা, দারুচিনির কাঠি আর তেজপাতা। স্লাইডার টানলে একেকটা মশলা সামনে আসে, ক্লিক করলে তার কথা খোলে।'),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug = 'food'
  AND json_extract(cats_json, '$[5].n') = 'মশলার জগৎ'
  AND json_extract(cats_json, '$[5].play') = 'বাটিতে হলুদ আর মরিচগুঁড়ো, পাশে জিরা-ধনে-সরিষার স্তূপ, দারুচিনির কাঠি আর তেজপাতা। স্লাইডার টানলে একেকটা মশলা সামনে আসে, ক্লিক করলে তার কথা খোলে।';

UPDATE worlds
SET cats_json = json_set(cats_json, '$[7].play', 'স্লাইডার টানলে শহীদ মিনার ঘুরে যায়, সূর্য ওঠা-নামা করে।'),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug = 'language'
  AND json_extract(cats_json, '$[7].n') = 'ভাষার গল্প'
  AND json_extract(cats_json, '$[7].play') = 'স্লাইডার টানলে স্মৃতিসৌধ ঘুরে যায়, সূর্য ওঠা-নামা করে।';
