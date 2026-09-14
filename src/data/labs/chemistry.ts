import type { Lab } from '../lab-types';
import { bn } from '../../lib/bn';

/**
 * The first twenty elements, in proton order.
 *
 * Twenty is where a child's chemistry actually lives - everything in water,
 * air, salt, bone and rust is in here - and it is also where the simple
 * shell-filling story still holds without exceptions.
 */
const ELEMENTS: [string, string][] = [
  ['হাইড্রোজেন', 'H'], ['হিলিয়াম', 'He'], ['লিথিয়াম', 'Li'], ['বেরিলিয়াম', 'Be'],
  ['বোরন', 'B'], ['কার্বন', 'C'], ['নাইট্রোজেন', 'N'], ['অক্সিজেন', 'O'],
  ['ফ্লোরিন', 'F'], ['নিয়ন', 'Ne'], ['সোডিয়াম', 'Na'], ['ম্যাগনেসিয়াম', 'Mg'],
  ['অ্যালুমিনিয়াম', 'Al'], ['সিলিকন', 'Si'], ['ফসফরাস', 'P'], ['সালফার', 'S'],
  ['ক্লোরিন', 'Cl'], ['আর্গন', 'Ar'], ['পটাশিয়াম', 'K'], ['ক্যালসিয়াম', 'Ca'],
];

const labs: Lab[] = [
  {
    world: 'chemistry', cat: 1,
    n: 'পরমাণু বানাও',
    lede: 'পরমাণুর ভেতরে মাত্র তিন রকম কণা, আর কে কয়টা - সেটাই ঠিক করে দেয় জিনিসটা কী। প্রোটনের হাতলটা টানলেই দেখবে মৌলের নামই বদলে যাচ্ছে।',
    cards: [
      {
        kind: 'scrub',
        item: 'পরমাণুর গঠন',
        n: 'কণা গুনে মৌল বানাও',
        how: 'প্রোটন বাড়ালে-কমালে কোন মৌল সেটা বদলায়। নিউট্রন বদলালে মৌল একই থাকে, শুধু ভর বদলায়। ইলেকট্রন কম-বেশি হলে পরমাণুতে চার্জ আসে।',
        also: ['প্রোটন', 'নিউট্রন', 'ইলেকট্রন', 'পারমাণবিক সংখ্যা', 'মৌল'],
        source: 'ভরসংখ্যা = প্রোটন + নিউট্রন। চার্জ = প্রোটন − ইলেকট্রন। মৌলের নাম পুরোপুরি প্রোটন সংখ্যা দিয়েই ঠিক হয়।',
        knobs: [
          { k: 'proton', n: 'প্রোটন', min: 1, max: 20, step: 1, value: 6, unit: 'টি' },
          { k: 'neutron', n: 'নিউট্রন', min: 0, max: 24, step: 1, value: 6, unit: 'টি' },
          { k: 'electron', n: 'ইলেকট্রন', min: 0, max: 22, step: 1, value: 6, unit: 'টি' },
        ],
        compute: (v) => {
          const p = v.proton!, n = v.neutron!, e = v.electron!;
          const [name, sym] = ELEMENTS[p - 1]!;
          const mass = p + n;
          const charge = p - e;
          const tot = p + n + e || 1;
          const chargeText = charge === 0 ? 'নিরপেক্ষ' : `${bn(Math.abs(charge))}${charge > 0 ? '+' : '−'}`;
          return {
            lines: [
              { n: 'মৌল', v: `${name} (${sym})` },
              { n: 'পারমাণবিক সংখ্যা', v: bn(p) },
              { n: 'ভরসংখ্যা', v: bn(mass) },
              { n: 'চার্জ', v: chargeText },
            ],
            bars: [
              { n: 'প্রোটন', frac: p / tot, hue: '#c2493d', v: bn(p) },
              { n: 'নিউট্রন', frac: n / tot, hue: '#6b7a8f', v: bn(n) },
              { n: 'ইলেকট্রন', frac: e / tot, hue: '#4a7fc1', v: bn(e) },
            ],
            say: charge === 0
              ? `<b>${name}</b>, ভরসংখ্যা ${bn(mass)}। প্রোটন আর ইলেকট্রন সমান, তাই পরমাণুটা নিরপেক্ষ।<span class="lk-note">প্রোটনের হাতলটা এক ঘর সরালেই এটা আর ${name} থাকবে না - পারমাণবিক সংখ্যাই মৌলের পরিচয়পত্র। নিউট্রন বদলালে কিন্তু নাম বদলায় না, শুধু আইসোটোপ হয়।</span>`
              : `<b>${name} আয়ন</b>, চার্জ ${chargeText}। ${charge > 0 ? `${bn(charge)}টি ইলেকট্রন কম` : `${bn(-charge)}টি ইলেকট্রন বেশি`}, তাই আর নিরপেক্ষ নয়।<span class="lk-note">চার্জওয়ালা পরমাণুকে বলে আয়ন। লবণ ঠিক এভাবেই তৈরি: সোডিয়াম একটা ইলেকট্রন দিয়ে দেয়, ক্লোরিন সেটা নিয়ে নেয়, আর উল্টো চার্জ দুটো পরস্পরকে ধরে রাখে।</span>`,
          };
        },
      },
      {
        kind: 'place',
        item: 'যৌগ',
        n: 'কোনটা কী',
        how: 'ডান পাশ থেকে নাম বাছো, তারপর যে ছবিটা সেটা দেখাচ্ছে তার ওপর চাপো।',
        view: [440, 260],
        art: `
          <text x="78" y="22" font-size="10.5" text-anchor="middle" fill="var(--muted)">দুটো হাইড্রোজেন, একটা অক্সিজেন</text>
          <g transform="translate(78 86)">
            <circle r="26" fill="#c2493d"/>
            <text y="6" font-size="16" text-anchor="middle" fill="#fff" font-weight="700">O</text>
            <circle cx="-30" cy="-26" r="14" fill="#dfeaf6"/>
            <text x="-30" y="-21" font-size="12" text-anchor="middle" fill="#243" font-weight="700">H</text>
            <circle cx="30" cy="-26" r="14" fill="#dfeaf6"/>
            <text x="30" y="-21" font-size="12" text-anchor="middle" fill="#243" font-weight="700">H</text>
            <path d="M-19 -16 L-6 -6 M19 -16 L6 -6" stroke="var(--ink-2)" stroke-width="3" fill="none"/>
          </g>
          <text x="220" y="22" font-size="10.5" text-anchor="middle" fill="var(--muted)">সাজানো ছকে বসানো আয়ন</text>
          <g transform="translate(220 86)">
            <circle cx="-30" cy="-30" r="13" fill="#c9822f"/><circle cx="0" cy="-30" r="11" fill="#5c8f6a"/><circle cx="30" cy="-30" r="13" fill="#c9822f"/>
            <circle cx="-30" cy="0" r="11" fill="#5c8f6a"/><circle cx="0" cy="0" r="13" fill="#c9822f"/><circle cx="30" cy="0" r="11" fill="#5c8f6a"/>
            <circle cx="-30" cy="30" r="13" fill="#c9822f"/><circle cx="0" cy="30" r="11" fill="#5c8f6a"/><circle cx="30" cy="30" r="13" fill="#c9822f"/>
            <path d="M-30 -30 H30 M-30 0 H30 M-30 30 H30 M-30 -30 V30 M0 -30 V30 M30 -30 V30" stroke="var(--line)" stroke-width="1.4" fill="none" stroke-opacity=".7"/>
          </g>
          <text x="360" y="22" font-size="10.5" text-anchor="middle" fill="var(--muted)">দুই মৌল জোড়া লেগে এক পদার্থ</text>
          <g transform="translate(360 86)">
            <circle r="20" fill="#3b3b42"/>
            <text y="5" font-size="14" text-anchor="middle" fill="#fff" font-weight="700">C</text>
            <circle cx="-44" r="16" fill="#c2493d"/><text x="-44" y="5" font-size="12" text-anchor="middle" fill="#fff" font-weight="700">O</text>
            <circle cx="44" r="16" fill="#c2493d"/><text x="44" y="5" font-size="12" text-anchor="middle" fill="#fff" font-weight="700">O</text>
            <path d="M-28 -4 H-20 M-28 4 H-20 M20 -4 H28 M20 4 H28" stroke="var(--ink-2)" stroke-width="2.6" fill="none"/>
          </g>
          <text x="220" y="176" font-size="10.5" text-anchor="middle" fill="var(--muted)">পাশাপাশি আছে, জোড়া লাগেনি</text>
          <g transform="translate(220 212)">
            <path d="M-52 -28 h104 v50 a10 10 0 0 1 -10 10 h-84 a10 10 0 0 1 -10 -10 Z" fill="var(--panel-2)" stroke="var(--line)" stroke-width="2"/>
            <circle cx="-32" cy="10" r="5" fill="#c9822f"/><circle cx="-14" cy="18" r="4" fill="#8a6a46"/><circle cx="2" cy="8" r="5" fill="#c9822f"/>
            <circle cx="18" cy="20" r="4" fill="#8a6a46"/><circle cx="34" cy="12" r="5" fill="#c9822f"/><circle cx="-22" cy="0" r="4" fill="#8a6a46"/>
            <circle cx="10" cy="-4" r="4" fill="#8a6a46"/><circle cx="26" cy="0" r="5" fill="#c9822f"/><circle cx="-4" cy="20" r="4" fill="#8a6a46"/>
          </g>
        `,
        zones: [
          { n: 'পানির অণু', item: 'পানির অণু', x: 78, y: 78, r: 34, note: 'একটা অক্সিজেন আর দুটো হাইড্রোজেন, সোজা লাইনে নয় - কোণ করে বসা। এই বাঁকা গড়নের জন্যই পানির একদিক একটু ধনাত্মক, আরেকদিক ঋণাত্মক, আর সেই কারণেই পানি এত জিনিস গলাতে পারে।' },
          { n: 'লবণের কেলাস', item: 'লবণের কেলাস', x: 220, y: 86, r: 34, note: 'সোডিয়াম আর ক্লোরিন আয়ন পালা করে বসে একটা ছক বানায়। খাবার লবণের দানা চৌকো দেখায় ঠিক এই কারণেই - ভেতরের সাজানোটাই বাইরে ফুটে ওঠে।' },
          { n: 'যৌগ', item: 'যৌগ', x: 360, y: 86, r: 32, note: 'দুই বা তার বেশি মৌল রাসায়নিকভাবে জুড়ে নতুন একটা পদার্থ - এখানে কার্বন আর অক্সিজেন মিলে কার্বন ডাই-অক্সাইড। যৌগের গুণ উপাদানগুলোর গুণের মতো হয় না।' },
          { n: 'মিশ্রণ', item: 'মিশ্রণ', x: 220, y: 212, r: 34, note: 'বালু আর লবণ এক বয়ামে - পাশাপাশি আছে, কিন্তু কেউ কারও সঙ্গে জোড়া লাগেনি। তাই পানি দিয়ে ধুয়ে আবার আলাদা করে ফেলা যায়। যৌগ ভাঙতে রাসায়নিক বিক্রিয়া লাগে, মিশ্রণে লাগে না।' },
        ],
      },
    ],
  },
];

export default labs;
