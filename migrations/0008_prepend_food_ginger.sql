-- SQLite's json_insert does not shift an occupied array index. Prepend the
-- missing ginger record by rebuilding only this exact, unchanged seed array.
-- Any category an admin has already edited is deliberately left untouched.
UPDATE worlds
SET cats_json = json_set(
      cats_json,
      '$[5].items',
      json('["আদা",' || substr(json_extract(cats_json, '$[5].items'), 2))
    ),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug = 'food'
  AND json_extract(cats_json, '$[5].n') = 'মশলার জগৎ'
  AND json_extract(cats_json, '$[5].items') = '["হলুদ","জিরা","ধনে","মরিচ","এলাচ","দারুচিনি","তেজপাতা","সরিষা","মেথি","গরম মশলা"]';
