/**
 * Which figure stands for which item, for the categories that are a list of
 * different things rather than one thing with parts.
 *
 * Every key maps to an exact figure identity: either an authored teaching
 * diagram or an individually licensed object in LICENSED_FIGURES. Species and
 * object names must not silently inherit a visually unrelated stand-in.
 *
 * Keyed by "<world slug>:<category name>", exactly as the category is written
 * in worlds.ts. An item with no entry falls back to the category's `fallback`,
 * so a new item added through the admin panel still gets a body rather than
 * disappearing.
 */
export type Collection = { fallback: string; items: Record<string, string> };

export const COLLECTIONS: Record<string, Collection> = {
  /* ---------- উদ্ভিদ ও প্রাণিজগৎ ---------- */
  'life:বাংলাদেশের গাছপালা': {
    fallback: 'mango',
    items: {
      'আম': 'mango', 'কাঁঠাল': 'jackfruitScan', 'বট': 'banyanTreeScan', 'তাল': 'palmyraPalm',
      'শিমুল': 'bombaxCeibaScan', 'কৃষ্ণচূড়া': 'krishnachura', 'সুন্দরী': 'sundari',
      'গোলপাতা': 'golpata', 'বাঁশ': 'bamboo', 'ধান': 'paddyPlant', 'পাট': 'jute',
      'শাপলা': 'waterLilySpecimen', 'কদম': 'kodom', 'হিজল': 'hijol',
    },
  },
  'life:ঔষধি ও মশলা গাছ': {
    fallback: 'herbGreen',
    items: {
      'তুলসী': 'tulsiSpecimen', 'নিম': 'neem', 'অ্যালোভেরা': 'aloeVeraScan',
      'আদা': 'gingerRoot', 'হলুদ': 'turmericRootScan', 'দারুচিনি': 'cinnamonStickScan',
      'এলাচ': 'cardamom', 'পুদিনা': 'mintLeavesSpecimen', 'থানকুনি': 'shrubGreen',
    },
  },
  'life:প্রাণীর শ্রেণি': {
    fallback: 'tiger',
    items: {
      'স্তন্যপায়ী': 'mammalSpecimen', 'পাখি': 'birdSpecimen', 'সরীসৃপ': 'reptileSpecimen', 'উভচর': 'amphibianSpecimen',
      'মাছ': 'fishSmall', 'পতঙ্গ': 'beeSpecimen', 'মেরুদণ্ডী': 'mammalSpecimen',
      'অমেরুদণ্ডী': 'octopusSpecimen', 'শীতল রক্ত': 'reptileSpecimen', 'উষ্ণ রক্ত': 'birdSpecimen',
    },
  },
  'life:বাংলাদেশের প্রাণী': {
    fallback: 'tiger',
    items: {
      'রয়েল বেঙ্গল টাইগার': 'runningTiger', 'ইলিশ': 'hilsa', 'দোয়েল': 'doel',
      'হাতি': 'asianElephant', 'শুশুক': 'gangesDolphinSkeleton', 'কুমির': 'saltwaterCrocodileScan',
      'মাছরাঙা': 'whiteThroatedKingfisherScan', 'চিতা বিড়াল': 'leopardCat', 'বানর': 'monkey',
      'শকুন': 'vulture', 'কচ্ছপ': 'greenSeaTurtle', 'মধুমক্ষিকা': 'beeSpecimen',
    },
  },

  /* ---------- প্রকৃতি ও পরিবেশ ---------- */
  'nature:বাস্তুতন্ত্র': {
    fallback: 'polyPottedPlant',
    items: {
      'খাদ্যশৃঙ্খল': 'sunDisc', 'খাদ্যজাল': 'coral', 'উৎপাদক': 'polyPottedPlant',
      'খাদক': 'tiger', 'বিয়োজক': 'soil', 'আবাসস্থল': 'house',
      'অভিযোজন': 'croc', 'পরিযায়ী পাখি': 'flyingBird', 'প্রবাল': 'coral',
    },
  },

  /* ---------- খাদ্য ও পুষ্টি ---------- */
  'food:খাদ্যের ছয় উপাদান': {
    fallback: 'riceBowl',
    items: {
      'শর্করা': 'riceBowlScan', 'আমিষ': 'fishSmall', 'স্নেহ': 'oilDrop',
      'ভিটামিন': 'polyLime', 'খনিজ লবণ': 'salt', 'পানি': 'glassWater',
      'আঁশ': 'shrubPale', 'ক্যালরি': 'sunDisc',
    },
  },
  'food:মশলার জগৎ': {
    fallback: 'turmeric',
    items: {
      'আদা': 'gingerRoot',
      'হলুদ': 'turmericRootScan', 'জিরা': 'cumin', 'ধনে': 'coriander',
      'মরিচ': 'redChilliScan', 'এলাচ': 'cardamomBowl', 'দারুচিনি': 'cinnamonStickScan',
      'তেজপাতা': 'bayLeaf', 'সরিষা': 'mustard', 'মেথি': 'fenugreek',
      'গরম মশলা': 'garamMasala',
    },
  },
  'food:রান্নার বিজ্ঞান': {
    fallback: 'pot',
    items: {
      'সেদ্ধ': 'polyEnamelPot', 'ভাজা': 'polyBrassPan', 'বাষ্পে রান্না': 'cloudDrop',
      'খামির ফোলা': 'riceBowl', 'দই জমা': 'glassWater', 'ক্যারামেল': 'sugarFruit',
      'আচার সংরক্ষণ': 'flask', 'হিমায়িত রাখা': 'salt',
    },
  },
  'food:নিরাপদ খাবার ও অভ্যাস': {
    fallback: 'tap',
    items: {
      'হাত ধোয়া': 'tap', 'পানি ফোটানো': 'polyEnamelPot', 'মেয়াদ দেখা': 'polyPantryFoods',
      'ফরমালিন': 'flask', 'রাস্তার খাবার': 'stall', 'খাবার ঢেকে রাখা': 'riceBowl',
      'দাঁত ব্রাশ': 'tap', 'চিনি ও লবণ কমানো': 'salt',
    },
  },

  /* ---------- ব্যবসা ও টাকা ---------- */
  'money:ব্যাংক ও লেনদেন': {
    fallback: 'building',
    items: {
      'ব্যাংক কী করে': 'building', 'জমা': 'coins', 'উত্তোলন': 'coins',
      'চেক': 'sheet', 'ডেবিট কার্ড': 'card', 'এটিএম': 'building',
      'মোবাইল ব্যাংকিং': 'phone', 'অনলাইন পেমেন্ট': 'phone',
      'লেনদেনের রসিদ': 'sheet', 'হিসাব মেলানো': 'book',
    },
  },
  'money:বাজার ও অর্থনীতি': {
    fallback: 'stall',
    items: {
      'বাজার কীভাবে চলে': 'polyCashRegister', 'দাম কেন বাড়ে': 'arrowUp',
      'মূল্যস্ফীতি': 'arrowUp', 'আমদানি': 'envelope', 'রপ্তানি': 'envelope',
      'কর ও ভ্যাট': 'sheet', 'রেমিট্যান্স': 'phone', 'পোশাক শিল্প': 'building',
      'কৃষি': 'paddyPlant', 'ওষুধ শিল্প': 'flask',
    },
  },

  /* ---------- সামাজিক দক্ষতা ---------- */
  'social:অনলাইন নিরাপত্তা': {
    fallback: 'phone',
    items: {
      'পাসওয়ার্ড': 'lock', 'ব্যক্তিগত তথ্য': 'sheet', 'অচেনা মেসেজ': 'envelope',
      'সাইবার বুলিং': 'phone', 'ভুয়া খবর': 'sheet', 'স্ক্রিন টাইম': 'polyLaptop',
      'গেমে কেনাকাটা': 'polyGamepad', 'বড়দের জানানো': 'personBlue',
    },
  },

  /* ---------- বিজ্ঞান ও আবিষ্কার ---------- */
  'discovery:আবিষ্কার ও আবিষ্কারক': {
    fallback: 'gear',
    items: {
      'চাকা': 'wheel', 'লিখন': 'polyNotebook', 'কাগজ': 'sheet', 'ছাপাখানা': 'book',
      'বাষ্পীয় ইঞ্জিন': 'gear', 'বিদ্যুৎ': 'bulb', 'টেলিফোন': 'telephone',
      'উড়োজাহাজ': 'flyingBird', 'টিকা': 'flask', 'পেনিসিলিন': 'flask',
      'কম্পিউটার': 'polyLaptop', 'ইন্টারনেট': 'monitor',
    },
  },
  'discovery:বিজ্ঞানের পদ্ধতি': {
    fallback: 'flask',
    items: {
      'প্রশ্ন করা': 'polyNotebook', 'অনুমান': 'sheet', 'পরীক্ষা': 'polyChemistrySet',
      'পর্যবেক্ষণ': 'polyMagnifier', 'তথ্য লেখা': 'polyNotebook',
      'সিদ্ধান্ত': 'bulb', 'পুনরাবৃত্তি': 'clockFace', 'ভুল থেকে শেখা': 'gear',
    },
  },
  'discovery:বাঙালি বিজ্ঞানী': {
    fallback: 'personBlue',
    items: {
      'জগদীশচন্দ্র বসু': 'personGreen', 'সত্যেন্দ্রনাথ বসু': 'personBlue',
      'প্রফুল্লচন্দ্র রায়': 'personRed', 'মেঘনাদ সাহা': 'personTeal',
      'ফজলুর রহমান খান': 'personSand', 'আব্দুল্লাহ আল-মুতী': 'personPlum',
      'মাকসুদুল আলম': 'personSlate',
    },
  },
  'discovery:পরিমাপের যন্ত্র': {
    fallback: 'ruler',
    items: {
      'থার্মোমিটার': 'thermometer', 'দাঁড়িপাল্লা': 'balanceScale', 'স্কেল': 'polyRuler',
      'মাপার ফিতা': 'polyMeasuringTape',
      'মাইক্রোস্কোপ': 'microscope', 'দূরবীন': 'polyBinoculars', 'কম্পাস': 'compass',
      'ঘড়ি': 'polyDigitalWatch', 'ব্যারোমিটার': 'barometer', 'স্টপওয়াচ': 'analogStopwatch',
    },
  },


  /* ---------- প্রকৃতি: the places themselves ---------- */
  'nature:বাংলাদেশের প্রকৃতি': {
    fallback: 'forest',
    items: {
      'সুন্দরবন': 'mangrove', 'কক্সবাজার': 'beach', 'সেন্ট মার্টিন': 'island',
      'হাওর': 'wetland', 'চা বাগান': 'teaGarden', 'পার্বত্য চট্টগ্রাম': 'hills',
      'মধুপুর বন': 'forest', 'পদ্মা সেতু অঞ্চল': 'bridge', 'লালমাই পাহাড়': 'hills',
    },
  },

  /* ---------- খাবার: the dishes themselves ---------- */
  'food:বাংলার খাবার': {
    fallback: 'riceDal',
    items: {
      'ভাত ও ডাল': 'riceDal', 'মাছ ভাজা': 'friedFishScan', 'ভর্তা': 'bhorta',
      'খিচুড়ি': 'khichuri', 'পিঠা': 'pitha', 'পায়েস': 'payesh',
      'মিষ্টি': 'sweet', 'হালিম': 'haleem', 'ইফতার': 'dateBowl', 'পান্তা ভাত': 'panta',
    },
  },

  /* ---------- ভাষা: a picture for each kind of word ---------- */
  'language:শব্দভাণ্ডার': {
    fallback: 'bubble',
    items: {
      'ছবি ও শব্দ': 'bubble', 'রং': 'swatches', 'ফল': 'jackfruitScan',
      'সবজি': 'polySweetPotato', 'প্রাণী': 'tiger', 'পরিবার': 'family',
      'শরীরের অংশ': 'palmHand', 'পোশাক': 'shirt', 'যানবাহন': 'bus',
      'বিপরীত শব্দ': 'opposites', 'সমার্থক শব্দ': 'bubble', 'ধ্বনি-শব্দ': 'bubble',
    },
  },

  /* ---------- সামাজিক: a face per feeling, an object per risk ---------- */
  'social:আবেগ চেনা': {
    fallback: 'faceHappy',
    items: {
      'খুশি': 'faceHappy', 'দুঃখ': 'faceSad', 'রাগ': 'faceAngry', 'ভয়': 'faceAfraid',
      'লজ্জা': 'faceShy', 'ঈর্ষা': 'faceJealous', 'গর্ব': 'faceProud',
      'একাকিত্ব': 'faceLonely', 'উত্তেজনা': 'faceExcited', 'হতাশা': 'faceFlat',
    },
  },
  'social:নিরাপত্তা': {
    fallback: 'palmHand',
    items: {
      'ভালো ও খারাপ স্পর্শ': 'palmHand', 'না বলার অধিকার': 'stopSign',
      'অচেনা মানুষ': 'personSlate', 'হারিয়ে গেলে': 'family',
      'জরুরি নম্বর ৯৯৯': 'phone', 'রাস্তা পার': 'crossing', 'আগুন': 'flame',
      'পানিতে সাবধানতা': 'waterSafe', 'ওষুধ ও রাসায়নিক': 'polyMedicalBox',
    },
  },

  /* ---------- আবিষ্কার: the experiment, and the ground under it ---------- */
  'discovery:ঘরে বসে পরীক্ষা': {
    fallback: 'flask',
    items: {
      'বেকিং সোডার আগ্নেয়গিরি': 'volcano', 'লেবুর ব্যাটারি': 'polyLemon',
      'রংধনু কাগজ': 'rainbowPaper', 'ঘনত্বের স্তর': 'layers',
      'বেলুন রকেট': 'balloonRocket', 'অদৃশ্য কালি': 'sheet',
      'ডিম ভাসানো': 'floatEgg', 'মেঘ বানানো': 'cloudDrop',
      'ছায়া ঘড়ি': 'sundial', 'চুম্বকের খেলা': 'magnet', '… ৬০টি': 'flask',
    },
  },
  'discovery:পৃথিবী ও ভূতত্ত্ব': {
    fallback: 'rock',
    items: {
      'শিলা': 'rock', 'খনিজ': 'mineral', 'জীবাশ্ম': 'fossil', 'ডাইনোসর': 'dino',
      'বরফযুগ': 'iceberg', 'মাটির স্তর': 'strata', 'কয়লা ও তেল': 'coalOil',
      'মহাদেশের সরণ': 'continents',
    },
  },
};

export const collectionFor = (slug: string, cat: string): Collection | undefined =>
  COLLECTIONS[`${slug}:${cat}`];
