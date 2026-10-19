-- Keep the production editor's source-of-truth JSON aligned with two additions
-- already present in src/data/worlds.ts and their exact model/reading records.
-- The exact old-array guards are deliberate: a teacher/admin-edited category
-- is never replaced by this seed correction.

UPDATE worlds
SET cats_json = json_set(
      cats_json,
      '$[5].items',
      json(json_insert(
        json_extract(cats_json, '$[5].items'),
        '$[0]',
        'আদা'
      ))
    ),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug = 'food'
  AND json_extract(cats_json, '$[5].n') = 'মশলার জগৎ'
  AND json_extract(cats_json, '$[5].items') = '["হলুদ","জিরা","ধনে","মরিচ","এলাচ","দারুচিনি","তেজপাতা","সরিষা","মেথি","গরম মশলা"]';

UPDATE worlds
SET cats_json = json_set(
      cats_json,
      '$[6].items',
      json(json_insert(
        json_extract(cats_json, '$[6].items'),
        '$[#]',
        'মাপার ফিতা'
      ))
    ),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug = 'discovery'
  AND json_extract(cats_json, '$[6].n') = 'পরিমাপের যন্ত্র'
  AND json_extract(cats_json, '$[6].items') = '["থার্মোমিটার","দাঁড়িপাল্লা","স্কেল","মাইক্রোস্কোপ","দূরবীন","কম্পাস","ঘড়ি","ব্যারোমিটার","স্টপওয়াচ"]';
