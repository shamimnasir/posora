/**
 * Visual-review policy for category contents. Conceptual lessons are allowed
 * to use explanatory diagrams; lists of physical specimens should use exact,
 * rights-cleared object models; mixed lessons may combine both deliberately.
 */
export const MODEL_CATEGORY_POLICIES: Record<string, 'exact-object' | 'mixed-example' | 'teaching-diagram'> = {
  'life:বাংলাদেশের গাছপালা': 'exact-object',
  'life:ঔষধি ও মশলা গাছ': 'exact-object',
  'life:প্রাণীর শ্রেণি': 'exact-object',
  'life:বাংলাদেশের প্রাণী': 'exact-object',
  'food:মশলার জগৎ': 'exact-object',
  'food:বাংলার খাবার': 'exact-object',
  'discovery:পরিমাপের যন্ত্র': 'exact-object',
  'food:খাদ্যের ছয় উপাদান': 'mixed-example',
  'food:রান্নার বিজ্ঞান': 'mixed-example',
  'food:নিরাপদ খাবার ও অভ্যাস': 'teaching-diagram',
  'money:ব্যাংক ও লেনদেন': 'teaching-diagram',
  'money:বাজার ও অর্থনীতি': 'teaching-diagram',
  'social:অনলাইন নিরাপত্তা': 'teaching-diagram',
  'social:আবেগ চেনা': 'teaching-diagram',
  'social:নিরাপত্তা': 'teaching-diagram',
  'discovery:আবিষ্কার ও আবিষ্কারক': 'mixed-example',
  'discovery:বিজ্ঞানের পদ্ধতি': 'teaching-diagram',
  'discovery:বাঙালি বিজ্ঞানী': 'teaching-diagram',
  'discovery:ঘরে বসে পরীক্ষা': 'teaching-diagram',
  // Earth processes stay diagrams; rocks, fossils and dinosaurs are specimens.
  'discovery:পৃথিবী ও ভূতত্ত্ব': 'mixed-example',
  'nature:বাস্তুতন্ত্র': 'teaching-diagram',
  'nature:বাংলাদেশের প্রকৃতি': 'teaching-diagram',
  'language:শব্দভাণ্ডার': 'mixed-example',
};
