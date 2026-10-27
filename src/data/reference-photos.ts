/**
 * Exact reference photographs shown beside a 3D figure whenever that figure
 * is not a scan of the exact thing: a disclosed comparison (a herring for
 * ইলিশ) or a Posora-authored teaching illustration (the সুন্দরী, the
 * dishes, the whole spices). The photograph is the identity record; the 3D
 * figure is the thing to turn around.
 *
 * Every photograph is a Wikimedia Commons file under a free licence. The
 * downloaded metadata and the local derivative's size are recorded in
 * docs/animation-remake/evidence/reference-photo-licenses.json.
 */
export type ReferencePhoto = {
  image: string;
  title: string;
  science: string;
  alt: string;
  copy: string;
  kicker: string;
  author: string;
  page: string;
  license: string;
  licenseUrl: string;
};

const BY_SA_3 = 'https://creativecommons.org/licenses/by-sa/3.0/';
const BY_SA_4 = 'https://creativecommons.org/licenses/by-sa/4.0/';
const BY_2 = 'https://creativecommons.org/licenses/by/2.0/';
const BY_4 = 'https://creativecommons.org/licenses/by/4.0/';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const PD = 'https://commons.wikimedia.org/wiki/Commons:Licensing#Material_in_the_public_domain';
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
const SPECIES = 'ঠিক প্রজাতি চিনে নাও';
const PLANT = 'আসল গাছের ছবি';
const SPICE = 'আসল মশলার ছবি';
const DISH = 'আসল খাবারের ছবি';

/** Keyed by `${world}:${category}`, then by item. */
export const REFERENCE_PHOTOS: Record<string, Record<string, ReferencePhoto>> = {
  'life:বাংলাদেশের প্রাণী': {
    'ইলিশ': { image: '/images/species-reference/hilsa-chandpur.jpg', title: 'ইলিশ', science: 'Tenualosa ilisha', kicker: SPECIES, alt: 'চাঁদপুরের বাজারে আসল ইলিশ মাছ',
      copy: 'ছবিতে আসল ইলিশের রুপালি, পাশ থেকে চাপা দেহ দেখো। ৩ডি দৃশ্যের Pacific herring একই পরিবারের তুলনা - ইলিশ নয়।',
      author: 'Nahid Sultan', page: commons('Tenualosa ilisha (Hilsa fish) at Chandpur Fish Market (1).jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'দোয়েল': { image: '/images/species-reference/doel-oriental-magpie-robin.jpg', title: 'দোয়েল', science: 'Copsychus saularis', kicker: SPECIES, alt: 'আসল দোয়েল বা Oriental magpie-robin',
      copy: 'আসল দোয়েলের কালো-সাদা পালক, সাদা ডানার দাগ ও লম্বা লেজ দেখো। ৩ডি robin-টি শুধু ছোট গায়ক-পাখির দেহরূপের তুলনা।',
      author: 'Challiyil Eswaramangalath Vipin', page: commons('Oriental Magpie Robin.jpg'), license: 'CC BY-SA 3.0', licenseUrl: BY_SA_3 },
    'চিতা বিড়াল': { image: '/images/species-reference/leopard-cat-sundarban.jpg', title: 'চিতা বিড়াল', science: 'Prionailurus bengalensis', kicker: SPECIES, alt: 'সুন্দরবনের বন্য চিতা বিড়াল',
      copy: 'ছবিটি সুন্দরবনের বন্য চিতা বিড়াল। মাথার ডোরা ও ছোট গাঢ় দাগ দেখো; ৩ডি domestic Bengal cat বন্য প্রজাতিটি নয়।',
      author: 'Soumyajit Nandy', page: commons('Leopard Cat in Sundarban.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'বানর': { image: '/images/species-reference/rhesus-macaque.jpg', title: 'রেসাস বানর', science: 'Macaca mulatta', kicker: SPECIES, alt: 'পুরুষ রেসাস বানর',
      copy: '“বানর” অনেক প্রজাতির সাধারণ নাম। ছবিতে রেসাস বানর; ৩ডি Japanese macaque একই গণের হলেও আলাদা প্রজাতি।',
      author: 'Charles J. Sharp', page: commons('Rhesus macaque (Macaca mulatta mulatta), male, Gokarna.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'শকুন': { image: '/images/species-reference/white-rumped-vulture-bangladesh.jpg', title: 'সাদা-পিঠ শকুন', science: 'Gyps bengalensis', kicker: SPECIES, alt: 'বাংলাদেশের সাদা-পিঠ শকুন',
      copy: 'বাংলাদেশে তোলা সাদা-পিঠ শকুনের ছবি। পিঠের সাদা অংশ দেখো; ৩ডি Griffon vulture একই Gyps গণের হলেও আলাদা প্রজাতি।',
      author: 'Mahmudul Bari', page: commons('White-rumped vulture Sunderbans Bangladesh.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
  },
  'life:বাংলাদেশের গাছপালা': {
    'তাল': { image: '/images/reference-photos/tal-palmyra-dhaka.jpg', title: 'তাল', science: 'Borassus flabellifer', kicker: PLANT, alt: 'ঢাকার হাতিরঝিলের পাড়ে দুটি তালগাছ',
      copy: 'হাতিরঝিলের পাড়ে তোলা আসল তালগাছ। পাখার মতো ছড়ানো পাতা আর লম্বা, খাড়া কাণ্ড দেখো। ৩ডি দৃশ্যটি পসরার আঁকা শিক্ষামডেল, স্ক্যান নয়।',
      author: 'Salim Khandoker', page: commons('Borassus flabellifer (Palm) ( তাল).jpg'), license: 'CC BY-SA 3.0', licenseUrl: BY_SA_3 },
    'সুন্দরী': { image: '/images/reference-photos/sundari-heritiera-fomes.jpg', title: 'সুন্দরী', science: 'Heritiera fomes', kicker: PLANT, alt: 'নামফলকসহ একটি আসল সুন্দরী গাছ',
      copy: 'নামফলক দেওয়া আসল সুন্দরী গাছ। ৩ডি শিক্ষামডেলে কাদা থেকে উঠে আসা শ্বাসমূল আর পাতার রুপালি নিচের দিক দেখানো; পাতা বোঝার সুবিধায় বড় করা।',
      author: 'Sarangib', page: commons('Sundari Tree.JPG'), license: 'CC0 1.0', licenseUrl: CC0 },
    'গোলপাতা': { image: '/images/reference-photos/golpata-nipa-sundarbans.jpg', title: 'গোলপাতা', science: 'Nypa fruticans', kicker: PLANT, alt: 'সুন্দরবনের খালের ধারে গোলপাতার ঝাড়',
      copy: 'সুন্দরবনের আসল গোলপাতার ঝাড়। কাণ্ড থাকে কাদার নিচে, তাই পাতা সরাসরি মাটি থেকে ওঠে। ফলগুচ্ছের ৩ডি মডেলটি আসল নমুনার; পাতার অংশটি পসরার আঁকা।',
      author: 'Kmonsoor', page: commons('Bangladeshi Nipa Palm in the Sundarbans.jpg'), license: 'CC BY-SA 3.0', licenseUrl: BY_SA_3 },
    'পাট': { image: '/images/reference-photos/jute-field-bangladesh.jpg', title: 'পাট', science: 'Corchorus', kicker: PLANT, alt: 'বাংলাদেশের একটি পাটখেত',
      copy: 'বাংলাদেশের আসল পাটখেত। লম্বা, প্রায় শাখাহীন কাণ্ড ঘন হয়ে দাঁড়ায়, পাতা থাকে ওপরের দিকে। ৩ডি দৃশ্যটি তোষা পাটের (Corchorus olitorius) শিক্ষামডেল।',
      author: 'Malcolm Manners', page: commons('Jute Field Bangladesh (7749587518).jpg'), license: 'CC BY 2.0', licenseUrl: BY_2 },
    'কদম': { image: '/images/reference-photos/kadam-flower.jpg', title: 'কদম', science: 'Neolamarckia cadamba', kicker: PLANT, alt: 'পাতার মাঝে একটি কদম ফুল',
      copy: 'আসল কদম ফুল: সোনালি-কমলা বলের গায়ে সাদা সুতার মতো গর্ভদণ্ড। ৩ডি শিক্ষামডেলে স্তরে স্তরে আড়াআড়ি ডাল দেখানো, আর ফুল বড় করে।',
      author: 'AjayDas', page: commons('Neolamarckia cadamba flower 01.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'হিজল': { image: '/images/reference-photos/hijal-flowers.jpg', title: 'হিজল', science: 'Barringtonia acutangula', kicker: PLANT, alt: 'ঝুলন্ত মঞ্জরিতে হিজলের লাল-গোলাপি ফুল',
      copy: 'আসল হিজল ফুল লম্বা ঝুলন্ত সুতায় ফোটে, প্রতিটি ফুলে অনেক লাল পুংকেশর। ৩ডি শিক্ষামডেলে জলাভূমিতে দাঁড়ানো বাঁকা কাণ্ডের গাছ দেখানো।',
      author: 'Rupak73', page: commons('Barringtonia acutangula flower.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
  },
  'life:ঔষধি ও মশলা গাছ': {
    'এলাচ': { image: '/images/reference-photos/cardamom-plant.jpg', title: 'এলাচ গাছ', science: 'Elettaria cardamomum', kicker: PLANT, alt: 'পূর্ণবয়স্ক এলাচ গাছের ঝাড়',
      copy: 'আসল এলাচ গাছ: মাটি থেকে গুচ্ছ হয়ে ওঠা লম্বা পাতার কাণ্ড। ফল ধরে গোড়ার কাছে মাটির ওপর ছড়ানো ডাঁটায়। পাশের বাটিটি শুকনো এলাচের আলাদা মডেল।',
      author: 'Aseedtolife', page: commons('Cardamom Plant Elettaria cardamomum.jpg'), license: 'CC BY 4.0', licenseUrl: BY_4 },
    'থানকুনি': { image: '/images/reference-photos/thankuni-centella.jpg', title: 'থানকুনি', science: 'Centella asiatica', kicker: PLANT, alt: 'থানকুনির গোল, কিনারা খাঁজকাটা পাতা',
      copy: 'আসল থানকুনির গোল, কিনারা খাঁজকাটা পাতা দেখো। লতানো কাণ্ডের গিঁট থেকে লম্বা বোঁটায় পাতা ওঠে। ৩ডি দৃশ্যটি পসরার আঁকা শিক্ষামডেল।',
      author: 'Md. Siddiq Hasan', page: commons('Centella asiatica 04.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
  },
  'food:মশলার জগৎ': {
    'জিরা': { image: '/images/reference-photos/cumin-seeds.jpg', title: 'জিরা', science: 'Cuminum cyminum', kicker: SPICE, alt: 'শুকনো জিরার স্তূপ',
      copy: 'আসল জিরা সরু, লম্বাটে ও একটু বাঁকা, গায়ে লম্বালম্বি দাগ; একেকটি প্রায় ৫ মিলিমিটার। ৩ডি মডেলে দানা বড় করে দেখানো।',
      author: 'Sanjay Acharya', page: commons('Seeds of Cumin.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'ধনে': { image: '/images/reference-photos/coriander-seeds.jpg', title: 'ধনে', science: 'Coriandrum sativum', kicker: SPICE, alt: 'শুকনো ধনের দানা',
      copy: 'আসল ধনে গোল, খাঁজকাটা ও হালকা বাদামি; অনেক দানা দুই ভাগে ভেঙে যায়। একেকটি ৩ থেকে ৫ মিলিমিটার।',
      author: 'Sanjay Acharya', page: commons('Coriander Seeds.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'তেজপাতা': { image: '/images/reference-photos/tejpata-dried.jpg', title: 'তেজপাতা', science: 'Cinnamomum tamala', kicker: SPICE, alt: 'তিনটি শুকনো তেজপাতা',
      copy: 'আসল শুকনো তেজপাতা। গোড়া থেকে আগা পর্যন্ত তিনটি প্রধান শিরা থাকে; ইউরোপের বে-লিফ থেকে আলাদা করার এটাই সহজ উপায়।',
      author: 'Sonja Pauen', page: commons('Indian bay leaf - tejpatta - indisches Lorbeerblatt.jpg'), license: 'Public domain', licenseUrl: PD },
    'সরিষা': { image: '/images/reference-photos/mustard-seeds.jpg', title: 'সরিষা', science: 'Brassica', kicker: SPICE, alt: 'সরিষার দানা',
      copy: 'আসল সরিষার দানা ছোট, গোল, লালচে-বাদামি থেকে হলদেটে। ৩ডি মডেলে দানা অনেক বড় করে দেখানো।',
      author: 'Ajay Suresh', page: commons('Mustard Seeds (Sarson) (49696132737).jpg'), license: 'CC BY 2.0', licenseUrl: BY_2 },
    'মেথি': { image: '/images/reference-photos/fenugreek-seeds.jpg', title: 'মেথি', science: 'Trigonella foenum-graecum', kicker: SPICE, alt: 'বাটিতে মেথির দানা',
      copy: 'আসল মেথি দানা শক্ত, কোণাকার ও হলদে-বাদামি; গায়ে একটি খাঁজ থাকে।',
      author: 'Atudu', page: commons('Fenugreek seeds(মেথি).JPG'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'গরম মশলা': { image: '/images/reference-photos/whole-garam-masala.jpg', title: 'গোটা গরম মশলা', science: 'দারুচিনি, এলাচ, লবঙ্গ', kicker: SPICE, alt: 'দারুচিনি, এলাচ, লবঙ্গ, জায়ফলসহ গোটা গরম মশলা',
      copy: 'ছবিতে দারুচিনি, ছোট ও বড় এলাচ, লবঙ্গ, জায়ফল, জয়ত্রী ও গোলমরিচ। বাঙালি রান্নার গরম মশলায় সাধারণত দারুচিনি, এলাচ ও লবঙ্গ; ৩ডি মডেলে এই তিনটি।',
      author: 'Miansari66', page: commons('Garam Masala.JPG'), license: 'Public domain', licenseUrl: PD },
  },
  'food:বাংলার খাবার': {
    'ভাত ও ডাল': { image: '/images/reference-photos/rice-dal-meal.jpg', title: 'ভাত ও ডাল', science: 'ভাত, ডাল, বেগুন ভাজা, বাঁধাকপি', kicker: DISH, alt: 'কাঁসার থালায় ভাত, বেগুন ভাজা, ডাল ও বাঁধাকপি',
      copy: 'আসল বাঙালি পাতে ভাত ও ডাল, সঙ্গে বেগুন ভাজা ও বাঁধাকপি। ৩ডি মডেলটি একটি প্রতিনিধিত্বমূলক পরিবেশন; ঘরে ঘরে ডাল ও পরিবেশন আলাদা।',
      author: 'HridoyKundu', page: commons('Eggplant, Dal, Cabbage and Rice (বেগুন, ডাল, বাঁধাকপি আর ভাত).jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'ভর্তা': { image: '/images/reference-photos/tomato-bhorta.jpg', title: 'টমেটো ভর্তা', science: 'বাংলাদেশের ঘরে তৈরি', kicker: DISH, alt: 'বাটিতে ঘরে তৈরি টমেটো ভর্তা',
      copy: 'আসল টমেটো ভর্তা। ভর্তা আলু, বেগুন, টমেটো, শুঁটকি, নানা কিছু দিয়ে হয়; ৩ডি মডেলে আলু, বেগুন ও টমেটো ভর্তা পাশাপাশি।',
      author: 'Sm faysal', page: commons('Homemade tomato bhorta from Bangladesh.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'খিচুড়ি': { image: '/images/reference-photos/vegetable-khichuri.jpg', title: 'সবজি খিচুড়ি', science: 'চাল, ডাল ও সবজি', kicker: DISH, alt: 'মটরশুঁটি ও ফুলকপি দেওয়া সবজি খিচুড়ি',
      copy: 'চাল, ডাল, হলুদ আর সবজি দিয়ে রান্না আসল খিচুড়ি। ৩ডি মডেলেও চাল-ডালের দানা, আলু, মটর আর গাজর দেখানো।',
      author: 'Rajeeb Dutta', page: commons('খিচুড়ি (Khichuri)-MA18.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'পিঠা': { image: '/images/reference-photos/bhapa-pitha.jpg', title: 'ভাপা পিঠা', science: 'চালের গুঁড়া ও খেজুরের গুড়', kicker: DISH, alt: 'থালায় গুড় দেওয়া ভাপা পিঠা',
      copy: 'আসল ভাপা পিঠা: চালের গুঁড়ার নরম পিঠার ভেতরে খেজুরের গুড়। ৩ডি মডেলে ভাপা, পাটিসাপটা, চিতই ও পুলি, চার রকম পিঠা।',
      author: 'Dolon Prova', page: commons('Bhapa Pitha ভাপা পিঠা.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'পায়েস': { image: '/images/reference-photos/payesh.jpg', title: 'পায়েস', science: 'দুধ ও চাল', kicker: DISH, alt: 'বাটিতে ঘরে তৈরি পায়েস',
      copy: 'দুধ জ্বাল দিয়ে চাল রান্না করা আসল পায়েস। ৩ডি মডেলে মাটির বাটিতে কিশমিশ, কাজু, তেজপাতা ও এলাচ।',
      author: 'Sm faysal', page: commons('Bengali home made Payesh.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'মিষ্টি': { image: '/images/reference-photos/kalojam.jpg', title: 'কালোজাম', science: 'বাংলাদেশের মিষ্টির দোকান', kicker: DISH, alt: 'দোকানে সাজানো কালোজাম মিষ্টি',
      copy: 'বাংলাদেশের দোকানে আসল কালোজাম। ৩ডি মডেলে রসগোল্লা, কালোজাম, চমচম ও সন্দেশ, চেনা চার রকম মিষ্টি।',
      author: 'Tanvir Rahman', page: commons('Kalojam - Bangladeshi Sweets from Banoful.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'হালিম': { image: '/images/reference-photos/haleem-bangladesh.jpg', title: 'হালিম', science: 'বাংলাদেশি শাহি হালিম', kicker: DISH, alt: 'লেবু ও বেরেস্তা দেওয়া হালিম',
      copy: 'আসল হালিম: গম, ডাল ও মাংস দিয়ে ঘন করে রান্না, ওপরে বেরেস্তা, আদা, কাঁচামরিচ, ধনেপাতা ও লেবু।',
      author: 'Dead.rabbit', page: commons('Bangladeshi style Shahi Haleem.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'ইফতার': { image: '/images/reference-photos/iftar-plate-rajshahi.jpg', title: 'ইফতার', science: 'রাজশাহী, ২০২৬', kicker: DISH, alt: 'খেজুর ও ভাজা খাবারসহ ইফতারের প্লেট',
      copy: 'রাজশাহীতে তোলা আসল ইফতারের প্লেট: খেজুর ও ভাজা খাবার। ইফতারের আয়োজন একেক ঘরে একেক রকম; ৩ডি মডেলে খেজুর, পেঁয়াজু, বেগুনি, জিলাপি ও ছোলা।',
      author: 'ROCKY', page: commons('Iftar Items of WikiIftar in Rajshahi, 2026.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
    'পান্তা ভাত': { image: '/images/reference-photos/panta-bhat.jpg', title: 'পান্তা ভাত', science: 'পান্তা, শাক ভাজি, মাছ ভাজা ও ভর্তা', kicker: DISH, alt: 'পান্তা ভাত, শাক ভাজি, মাছ ভাজা ও ভর্তা',
      copy: 'আসল পান্তা ভাত: রাতভর পানিতে ভেজানো ভাত, সঙ্গে কাঁচামরিচ, পেঁয়াজ, ভর্তা ও ভাজা। ৩ডি মডেলে মাটির সানকিতে পান্তা।',
      author: 'Dolon Prova', page: commons('Panta bhat & Bhurta.jpg'), license: 'CC BY-SA 4.0', licenseUrl: BY_SA_4 },
  },
};

export const referencePhotosFor = (world: string, category: string) => REFERENCE_PHOTOS[`${world}:${category}`] ?? null;
