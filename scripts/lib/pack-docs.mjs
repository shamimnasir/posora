/**
 * Assembles one world's document from the section builders.
 */
import { bn } from './pack-kit.mjs';
import { categorySections, missionSections, keySection, coverHtml, tocSection, WORLD_CSS } from './pack-world.mjs';
import { languageSections, mathSections, spaceSections, LANGUAGE_CSS, MATH_CSS, SPACE_CSS } from './pack-special.mjs';

export function buildWorldDoc(pack, world, data) {
  const keys = [];
  const special = [];
  const tocRows = [];
  let css = WORLD_CSS + LANGUAGE_CSS;
  let previewSection = null;
  const sp = (id, label) => tocRows.push({ kind: 'row', n: '★', label, ref: id });

  if (world.slug === 'language') {
    special.push(...languageSections(data.language, keys));
    sp('sp-vowels', `স্বরবর্ণ ট্রেসিং (${bn(data.language.vowels.length)}টি)`);
    sp('sp-consonants', `ব্যঞ্জনবর্ণ ট্রেসিং (${bn(data.language.consonants.length)}টি)`);
    sp('sp-kar', 'কার ও ফলা চার্ট, ট্রেসিংসহ');
    sp('sp-conj', `${bn(data.language.conjuncts.length)}টি যুক্তবর্ণ ভাঙা চার্ট`);
    sp('sp-conj-ex', 'যুক্তবর্ণ জোড়া লাগাও ও ভাঙো');
    previewSection = 'sp-vowels';
  } else if (world.slug === 'math') {
    css += MATH_CSS;
    special.push(...mathSections(data.math, keys));
    sp('sp-numbers', 'সংখ্যা ০ থেকে ১০০, কথায়');
    sp('sp-digits', 'বাংলা অঙ্ক ট্রেসিং');
    sp('sp-numwords', 'অঙ্ক থেকে কথা, কথা থেকে অঙ্ক');
    sp('sp-clock', 'ঘড়ি দেখে সময় বলো');
    sp('sp-clock-draw', 'ঘড়িতে কাঁটা আঁকো');
    sp('sp-shop', 'নোট-কয়েন ও দোকান খেলা');
    previewSection = 'sp-clock';
  } else if (world.slug === 'space') {
    css += SPACE_CSS;
    special.push(...spaceSections(data.bodies, data.beltExtras, keys));
    sp('sp-bodies', `সৌরজগতের ${bn(data.bodies.length + data.beltExtras.length)}টি তথ্য-কার্ড`);
    sp('sp-order', 'দূরত্ব, ওজন আর চাঁদ: আসল সংখ্যা দিয়ে সাজাও');
    sp('sp-quiz', 'সৌরজগৎ যাচাই: সংখ্যা দেখে চিনে নাও');
    previewSection = 'sp-bodies';
  }
  if (world.slug === 'math') css += '';

  const catSecs = [];
  world.readable.forEach((cat, i) => {
    catSecs.push(...categorySections(world, cat, i + 1, keys));
    tocRows.push({ kind: 'cat', n: bn(i + 1), label: cat.name, index: cat.index, ws: !!cat.worksheet, qz: !!cat.quiz?.length });
  });
  if (!previewSection) previewSection = world.readable[0] ? `ws-${world.readable[0].index}` : 'toc';

  const missionSecs = missionSections(world, keys);
  missionSecs.forEach((m, i) => tocRows.push({ kind: 'row', n: `ম${bn(i + 1)}`, label: `মিশন: ${world.missions.find((x) => `ms-${x.index}` === m.id)?.name ?? ''}`, ref: m.id }));
  tocRows.push({ kind: 'row', n: '✓', label: 'উত্তরপত্র (সব অনুশীলনী, যাচাই আর মিশনের উত্তর)', ref: 'key' });

  const cards = world.readable.reduce((n, c) => n + c.items.length, 0) + (world.slug === 'space' ? data.bodies.length + data.beltExtras.length : 0);
  const questions = world.readable.reduce((n, c) => n + (c.quiz?.length ?? 0), 0);
  const exercises = world.readable.reduce((n, c) => n + (c.worksheet ? c.worksheet.blanks.length + c.worksheet.matchKey.length : 0), 0);
  const stats = [
    [`${bn(world.readable.length)}টি`, 'বিভাগ'],
    [`${bn(cards)}টি`, 'তথ্য-কার্ড'],
    [`${bn(exercises)}টি`, 'শূন্যস্থান ও মেলানো'],
    [`${bn(questions)}টি`, 'যাচাই প্রশ্ন'],
    [`${bn(missionSecs.length)}টি`, 'কাগজের মিশন'],
    world.slug === 'language' ? [`${bn(data.language.vowels.length + data.language.consonants.length)}টি`, 'বর্ণ ট্রেসিং']
      : world.slug === 'math' ? ['০-১০০', 'সংখ্যা, ঘড়ি ও টাকা']
        : world.slug === 'space' ? [`${bn(data.bodies.length)}টি`, 'গ্রহ-উপগ্রহের আসল মাপ']
          : ['শেষে', 'পূর্ণ উত্তরপত্র'],
  ];

  const sections = [
    { id: 'cover', cover: coverHtml(pack, world, stats) },
    tocSection(tocRows),
    ...special,
    ...catSecs,
    ...missionSecs,
    keySection(keys),
  ];
  return { title: pack.title, world: world.bn, color: pack.color, css, sections, previewSection, stats };
}
