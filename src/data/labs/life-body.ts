import type { Lab } from '../lab-types';

/**
 * মানবদেহ, as one drawing.
 *
 * Fourteen parts is a lot for one diagram, so the head is drawn twice: small
 * and in place on the body, and again enlarged beside it. Four of the fourteen
 * parts live in the head, and at body scale they would all land inside one
 * fingertip.
 */
export const body: Lab = {
  world: 'life', cat: 7,
  n: 'শরীরের ভেতরে',
  lede: 'চোখে যা দেখা যায় তার নিচে একটা গোটা কারখানা - পাম্প, বেলুন, পাইপ, ছাঁকনি আর একটা নিয়ন্ত্রণকক্ষ। নামগুলো নিজের হাতে জায়গামতো বসাও।',
  cards: [
    {
      kind: 'place',
      item: 'কঙ্কাল',
      n: 'কোনটা কোথায়',
      how: 'ডান পাশ থেকে একটা নাম বাছো, তারপর ছবিতে চাপো সেটা যেখানে আছে। মাথার চারটে অংশের জন্য ডান পাশের বড় মাথাটা ব্যবহার করো।',
      view: [460, 440],
      art: `
        <g fill="#e8c9a8" stroke="#c9a274" stroke-width="2">
          <circle cx="140" cy="58" r="34"/>
          <path d="M126 88 h28 v14 h-28 Z"/>
          <path d="M108 104 q32 -10 64 0 l8 130 q-40 10 -80 0 Z"/>
          <path d="M110 112 L72 168 L66 206" stroke-width="14" stroke-linecap="round" fill="none"/>
          <path d="M170 112 L208 168 L214 206" stroke-width="14" stroke-linecap="round" fill="none"/>
          <path d="M124 238 L118 320 L114 398" stroke-width="17" stroke-linecap="round" fill="none"/>
          <path d="M158 238 L172 320 L180 398" stroke-width="17" stroke-linecap="round" fill="none"/>
        </g>
        <path d="M126 40 q6 -12 16 -4 q10 -10 16 2 q8 10 -2 16 q4 12 -10 12 q-12 6 -18 -4 q-12 -2 -2 -22Z" fill="#d98fa6" stroke="#b06a82" stroke-width="1.6"/>
        <path d="M112 118 q-8 26 2 42 q12 8 18 -4 q4 -22 -4 -40Z" fill="#e79a9a" fill-opacity=".9" stroke="#c46f6f" stroke-width="1.6"/>
        <path d="M168 118 q8 26 -2 42 q-12 8 -18 -4 q-4 -22 4 -40Z" fill="#e79a9a" fill-opacity=".9" stroke="#c46f6f" stroke-width="1.6"/>
        <path d="M150 132 q16 -8 20 8 q4 16 -12 22 q-14 4 -14 -12 q0 -12 6 -18Z" fill="#c2493d" stroke="#8f2f27" stroke-width="1.6"/>
        <path d="M204 150 L212 188" stroke="#c2493d" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M200 158 L208 194" stroke="#4a7fc1" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M72 142 q-12 14 -4 26 q10 8 16 -6 q4 -14 -12 -20Z" fill="#d1746f" stroke="#a0524e" stroke-width="1.6"/>
        <path d="M128 178 q26 -12 32 8 q4 18 -14 20 q-10 14 4 22 q16 8 4 18 q-18 10 -32 -6 q-10 -14 2 -24 q-12 -18 4 -38Z" fill="#c9822f" fill-opacity=".85" stroke="#8f5c1d" stroke-width="1.6"/>
        <path d="M172 208 q12 -6 14 8 q2 14 -12 14 q-8 -8 -2 -22Z" fill="#8a4f7a" stroke="#5f3454" stroke-width="1.6"/>
        <path d="M140 100 L140 232" stroke="#f0e6b8" stroke-width="6" fill="none"/>
        <path d="M110 214 L104 232 M104 226 L96 244 M108 236 L100 252" stroke="#e8d24a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M120 276 L116 356" stroke="#f4eed8" stroke-width="7" fill="none" stroke-linecap="round"/>
        <rect x="162" y="300" width="34" height="40" rx="7" fill="#e8c9a8" stroke="#a87f52" stroke-width="2"/>
        <path d="M166 308 h26 M166 318 h26 M166 328 h26" stroke="#c9a274" stroke-width="1.4" fill="none"/>
        <text x="140" y="424" font-size="10.5" text-anchor="middle" fill="var(--muted)">ভেতরের অংশ</text>
        <text x="358" y="34" font-size="10.5" text-anchor="middle" fill="var(--muted)">মাথাটা বড় করে</text>
        <circle cx="358" cy="140" r="86" fill="#e8c9a8" stroke="#c9a274" stroke-width="2"/>
        <g>
          <ellipse cx="332" cy="104" rx="22" ry="13" fill="#fff" stroke="#a87f52" stroke-width="1.8"/>
          <circle cx="332" cy="104" r="7.5" fill="#3f5a7a"/><circle cx="332" cy="104" r="3" fill="#16202e"/>
          <ellipse cx="390" cy="104" rx="22" ry="13" fill="#fff" stroke="#a87f52" stroke-width="1.8"/>
          <circle cx="390" cy="104" r="7.5" fill="#3f5a7a"/><circle cx="390" cy="104" r="3" fill="#16202e"/>
        </g>
        <path d="M280 122 q-20 -18 -4 -32 q16 -12 22 10 q4 18 -8 26 q-6 4 -10 -4Z" fill="#e0b894" stroke="#a87f52" stroke-width="1.8"/>
        <path d="M286 104 q6 -6 6 4" stroke="#a87f52" stroke-width="1.6" fill="none"/>
        <path d="M322 168 q36 -14 72 0 q-14 34 -72 0Z" fill="#7a3b3b" stroke="#4f2424" stroke-width="1.6"/>
        <path d="M326 168 h64" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
        <path d="M334 168 v8 M344 168 v8 M354 168 v8 M364 168 v8 M374 168 v8 M384 168 v8" stroke="#d8d0c0" stroke-width="1.4"/>
        <path d="M356 186 q26 -8 30 4 q-14 12 -34 2Z" fill="#d9748a" stroke="#a84f64" stroke-width="1.6"/>
      `,
      zones: [
        { n: 'মস্তিষ্ক', item: 'মস্তিষ্ক', x: 140, y: 46, r: 20, note: 'শরীরের নিয়ন্ত্রণকক্ষ। ভাবা, মনে রাখা, নড়াচড়া আর শ্বাস - সব এখান থেকেই চলে। ওজনে শরীরের মাত্র দুই শতাংশ, কিন্তু শক্তির প্রায় এক-পঞ্চমাংশ খেয়ে নেয়।' },
        { n: 'ফুসফুস', item: 'ফুসফুস', x: 118, y: 134, r: 19, note: 'বুকের দুই পাশে দুটো স্পঞ্জের মতো থলে। বাতাস থেকে অক্সিজেন রক্তে ঢোকে আর কার্বন ডাই-অক্সাইড বেরিয়ে যায়। ভেতরের ভাঁজ মেলে ধরলে একটা টেনিস কোর্টের সমান জায়গা হবে।' },
        { n: 'হৃৎপিণ্ড', item: 'হৃৎপিণ্ড', x: 160, y: 146, r: 18, note: 'একটা পাম্প, আকারে তোমার মুঠোর সমান। সারা জীবন থামে না - দিনে প্রায় এক লক্ষ বার স্পন্দিত হয় আর গোটা শরীরে রক্ত পাঠায়।' },
        { n: 'রক্ত', item: 'রক্ত', x: 206, y: 172, r: 18, note: 'শরীরের পরিবহন ব্যবস্থা। লোহিত কণিকা অক্সিজেন বয়, শ্বেত কণিকা জীবাণুর সঙ্গে লড়ে, আর অণুচক্রিকা কাটা জায়গায় জমাট বেঁধে রক্ত থামায়। লাল রংটা আসে লোহা থেকে।' },
        { n: 'পেশি', item: 'পেশি', x: 74, y: 152, r: 18, note: 'পেশি শুধু টানতে পারে, ঠেলতে পারে না। তাই হাত ভাঁজ করা আর সোজা করার জন্য আলাদা দুটো পেশি লাগে - একটা টানলে অন্যটা ছেড়ে দেয়।' },
        { n: 'পাচনতন্ত্র', item: 'পাচনতন্ত্র', x: 140, y: 200, r: 19, note: 'মুখ থেকে শুরু, আর পুরোটা টেনে সোজা করলে প্রায় নয় মিটার লম্বা একটা নল। খাবার এখানে ভেঙে এত ছোট করা হয় যে সেটা রক্তে মিশে যেতে পারে।' },
        { n: 'কিডনি', item: 'কিডনি', x: 178, y: 218, r: 17, note: 'দুটো শিমের আকারের ছাঁকনি। সারা দিনে বারবার গোটা রক্তটা ছেঁকে বর্জ্য আর বাড়তি পানি সরিয়ে দেয় - সেটাই প্রস্রাব হয়ে বেরোয়।' },
        { n: 'স্নায়ু', item: 'স্নায়ু', x: 102, y: 238, r: 17, note: 'মস্তিষ্ক আর শরীরের মধ্যে বার্তা চলাচলের তার। সংকেত ছোটে সেকেন্ডে একশো মিটারেরও বেশি গতিতে - তাই গরম কিছুতে হাত পড়লে ভাবার আগেই হাত সরে যায়।' },
        { n: 'কঙ্কাল', item: 'কঙ্কাল', x: 118, y: 320, r: 19, note: 'প্রাপ্তবয়স্ক মানুষের ২০৬টি হাড়। কাঠামো দেয়, মস্তিষ্ক আর হৃৎপিণ্ডকে ঢেকে রাখে, আর বড় হাড়ের ভেতরেই রক্তকণিকা তৈরি হয়। জন্মের সময় হাড় থাকে বেশি - বড় হতে হতে কিছু জোড়া লেগে যায়।' },
        { n: 'ত্বক', item: 'ত্বক', x: 178, y: 320, r: 18, note: 'শরীরের সবচেয়ে বড় অঙ্গ। জীবাণু ঠেকায়, ঘাম দিয়ে শরীর ঠান্ডা রাখে, আর ছোঁয়া টের পাওয়ার কাজটাও এরই। রোদ লাগলে ত্বকেই ভিটামিন ডি তৈরি হয়।' },
        { n: 'চোখ', item: 'চোখ', x: 332, y: 100, r: 18, note: 'আলো লেন্স পেরিয়ে পেছনের পর্দায় উল্টো একটা ছবি ফেলে, আর মস্তিষ্ক সেটাকে সোজা করে নেয়। দুটো চোখ একটু আলাদা কোণ থেকে দেখে বলেই দূরত্ব বোঝা যায়।' },
        { n: 'কান', item: 'কান', x: 288, y: 110, r: 18, note: 'বাইরের অংশটা শব্দ কুড়িয়ে ভেতরে পাঠায়, পর্দা কাঁপে, তিনটে ছোট হাড় কাঁপুনিটা বাড়িয়ে দেয়। কানের ভেতরের অংশ শরীরের ভারসাম্যও রাখে - তাই বেশি ঘুরলে মাথা ঘোরে।' },
        { n: 'দাঁত', item: 'দাঁত', x: 336, y: 172, r: 16, note: 'শরীরের সবচেয়ে শক্ত জিনিস দাঁতের বাইরের এনামেল - হাড়ের চেয়েও শক্ত। কিন্তু হাড়ের মতো নিজে সারতে পারে না, তাই একবার ক্ষয় হলে সেটা ফিরে আসে না।' },
        { n: 'জিভ', item: 'জিভ', x: 382, y: 188, r: 16, note: 'স্বাদ চেনে, খাবার নাড়ায়, আর কথা বলায় সবচেয়ে বড় কাজটা করে। স্বাদের বড় অংশটা আসলে নাক থেকে আসে - তাই সর্দি হলে খাবারের স্বাদ পাওয়া যায় না।' },
      ],
    },
  ],
};
