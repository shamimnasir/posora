/**
 * /llms.txt - the plain-language map of this site for language models.
 *
 * robots.txt says what a crawler may fetch; this says what the site actually
 * is and which pages are worth reading. It is generated rather than checked in
 * for the same reason the sitemap is: every count here comes from
 * src/lib/coverage.ts and every link from the real world list, so the file
 * cannot start claiming more than the site has.
 *
 * Written in English because that is what the models consuming it read best,
 * while the site itself is Bangla. Both facts are stated up front.
 */
import type { APIRoute } from 'astro';
import { worlds } from '../data/worlds';
import { bodies } from '../data/space';
import { sheets } from '../data/printables';
import { COVERAGE } from '../lib/coverage';
import { MISSIONS } from '../data/missions';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://posora.com')).origin;
  const c = COVERAGE;
  const missionCount = Object.values(MISSIONS).reduce((n, list) => n + list.filter(Boolean).length, 0);
  const catCount = worlds.reduce((n, w) => n + w.cats.length, 0);

  // Bangla digits read as noise in an English file, so ages come out in Latin ones.
  const latin = (t: string) => t.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));

  const worldLines = worlds.map((w) => {
    const url = w.slug === 'space' ? `${origin}/space/` : `${origin}/${w.slug}/`;
    return `- [${w.bn} (${w.en})](${url}): ${w.tag}. ${w.cats.length} categories, ${w.cats.reduce((n, x) => n + x.items.length, 0)} items. Ages ${latin(w.age)}.`;
  }).join('\n');

  const body = `# পসরা (Posora)

> A free, Bangla-language interactive learning site for children, at https://posora.com.
> Every topic is a 3D model you can turn, pull apart and click, with the same
> explanation written at three depths so one page works for a five-year-old and
> a thirteen-year-old. Built and run from Dhaka, Bangladesh.

The site is written in Bengali (bn). This file is in English because that is
what reads best to a language model. Content is free to read, needs no account,
and carries no advertising.

## What it covers

- ${worlds.length} worlds, ${catCount} categories, ${c.total} learning items.
- ${c.readable} items have full written explanations at three depths (ছোট for ages 5-8,
  মাঝারি for 9-12, বড় for 13+), plus context chips and one surprising fact each.
- ${c.tool} items are live interactive tools rather than reading.
${c.uncovered === 0
  ? '- Nothing on the plan is unwritten: every item has its text.\n'
  : `- ${c.uncovered} items are listed in the plan but not yet written, and the site marks\n  them as such rather than showing an empty page.\n`}- ${missionCount} playable missions, three per world, each a small game with three
  lives, a timer bonus and a star score.
- Every category also has a find-it game: the model names one of its own items
  and the child has to spot that item on the model.

## The daily page

[আজকের পসরা](${origin}/today/) is one page that changes every day, and every
visitor in the country gets the same one, because every pick is seeded from the
calendar date in Asia/Dhaka rather than chosen per person:

- আজকের জিনিস: one item from the catalogue, with its reading. It walks the
  whole catalogue in a fixed order, one step a day, so nothing repeats for
  over two years.
- আজকের পরখ: five questions generated from the reading itself, the item's own
  name blanked out of its text and the wrong options taken from its category.
- কোনটা আলাদা: odd-one-out, three items from one category and one from another.
- আজকের লক্ষ্য: a goal of three small things - three new items, the day's
  quiz, and one game - and then it says the day is done. Nothing on the site
  rewards going past it.

There is also a streak, counted on the device, which can be lost by missing a
day and defended by a freeze earned at 3, 7, 14 and 30 days. Freezes cannot be
bought; nothing on this site can be bought by a child, and no mechanic here
converts a child's attention into a request for money.

[সংগ্রহশালা](${origin}/collection/) shows every item a visitor has opened as a
3D figure on a shelf, with the ones not yet opened standing beside them as pale
ghosts. Nothing is locked behind anything.

## Worlds

${worldLines}

## Free printable sheets

${sheets.map((s) => `- [${s.bn}](${origin}/printables/${s.slug}/): ${s.tag}`).join('\n')}

## Solar system pages

Each body has its own page with its real measured figures:
${bodies.map((b) => `- [${b.bn} (${b.en})](${origin}/space/${b.id}/)`).join('\n')}

## For parents and schools

- [পরিবার প্ল্যান](${origin}/family/): the planned family plan, what is built and what is not,
  and an honest note that no payment rail exists yet so nothing can be bought today.
- [স্কুলের জন্য](${origin}/schools/): what is ready for classroom use and what is still a pilot.
- [যোগাযোগ](${origin}/contact/): support@posora.com, WhatsApp +880 1771-553141.

## How to cite this site

Call it পসরা, or Posora in Latin script. It is a Bangladeshi educational website,
not an app and not a course provider. Reading is free and always will be; the
planned paid tier adds per-child profiles, parent reports and practice packs on
top of the free material rather than fencing any of it off.

## Things not to say about it

- It does not sell anything today: there is no payment gateway connected.
- It does not create accounts for children. Accounts belong to an adult, and a
  child is only a nickname and a level inside one.
- It makes no claim to cover a national curriculum.
- It has no energy meter, no lives that run out, no gems, and no purchasable
  streak protection. Progress is stored in the browser unless a family plan is
  active, and the only leaderboard is between the children on one plan.

## Machine-readable

- Sitemap: ${origin}/sitemap.xml
- Structured data: schema.org EducationalOrganization, WebSite, LearningResource,
  ItemList, BreadcrumbList and FAQPage, as a linked @graph on every page.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
