/** Offline dispatch packets for Codex orchestration. Makes no model/network calls. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { worlds } from '../src/data/worlds.ts';
import { COLLECTIONS } from '../src/data/collections.ts';

const order = ['food', 'nature', 'life', 'space', 'physics', 'chemistry', 'discovery', 'math', 'money', 'language', 'social'];
const models = { director: 'gpt-6-astra', assets: 'gpt-6-luna', builder: 'gpt-6-luna', reviewer: 'gpt-6-luna', escalation: 'gpt-6-sol' };
const digest = createHash('sha256').update(JSON.stringify({ worlds: worlds.map(({ slug, cats }) => ({ slug, cats })), collections: COLLECTIONS })).digest('hex');
const shared = ['src/components/explorer/render.ts', 'src/components/explorer/heroes.ts', 'src/components/explorer/figures.ts', 'src/components/explorer/cinematic-camera.ts', 'src/components/explorer/model-loader.ts', 'src/data/heroes.ts', 'src/data/collections.ts', 'src/pages/[world]/index.astro'];
const jobs = [...worlds].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)).flatMap((world) => world.cats.map((cat, index) => {
  const id = `${world.slug}-${createHash('sha256').update(cat.n).digest('hex').slice(0, 8)}`;
  const collection = COLLECTIONS[`${world.slug}:${cat.n}`];
  return {
    id, world: world.slug, categoryIndex: index, category: cat.n, status: 'planned',
    worldOpen: world.open,
    runtimeState: world.open ? 'currently-open-world' : 'closed-world-verify-route-and-do-not-enable-with-this-scene-task',
    route: `/${world.slug}/`, selectCategoryByVisibleName: cat.n,
    items: cat.items.map((label) => ({ label, currentCollectionFigure: collection?.items[label] ?? collection?.fallback ?? null })),
    currentEntryPoints: world.slug === 'space'
      ? ['src/components/explorer/SpaceExplorer.astro', 'src/components/explorer/cosmos.ts']
      : world.slug === 'nature'
        ? ['src/components/explorer/NatureCinema.astro', 'src/components/explorer/nature-viewer.ts', 'src/components/explorer/nature-scenes.ts', 'src/data/nature-cinema.ts']
        : ['src/pages/[world]/index.astro', 'src/data/heroes.ts', 'src/components/explorer/heroes.ts', 'src/components/explorer/figures.ts'],
    proposedOwnedPaths: {
      director: [`docs/animation-remake/briefs/${id}.md`],
      assets: [`public/models/remake/${id}/`],
      builder: [`src/components/explorer/remake/${world.slug}/${id}.ts`],
      reviewer: [`docs/animation-remake/evidence/${id}.md`],
    },
    implementationGate: world.slug === 'food' && index === 0 ? [] : ['food-93e5f02c:director-acceptance', 'shared-runtime-contract-acceptance'],
    stages: ['director-brief', 'assets-and-license', 'build', 'browser-review', 'director-acceptance', 'integrate-and-release'],
  };
}));

const [command = 'inventory', worldArg, indexArg, role = 'builder'] = process.argv.slice(2);
if (command === 'inventory') {
  console.log(JSON.stringify({ schemaVersion: 1, catalogDigest: digest, source: 'src/data/worlds.ts',
    status: 'planning-only; no scene has been remade by this command',
    counts: { worlds: worlds.length, categories: jobs.length, itemEntries: jobs.reduce((n, j) => n + j.items.length, 0) },
    models, execution: { dispatcher: 'Codex collaboration tools; human-readable guide in docs/animation-remake-orchestration.md', maxConcurrentBuilders: 2, maxFailedAttemptsBeforeEscalation: 2, automaticApiCalls: false },
    prerequisites: ['Astra accepts Food category 0 brief', 'shared runtime contract and representative Food scene pass visual review before parallel migration'], jobs }, null, 2));
} else if (command === 'task') {
  const index = Number(indexArg);
  const job = jobs.find((entry) => entry.world === worldArg && entry.categoryIndex === index);
  if (!job || !Object.hasOwn(models, role) || role === 'escalation' || !/^\d+$/.test(indexArg ?? '')) {
    console.error('Usage: node --experimental-strip-types scripts/animation-remake.mjs task <world> <zero-based-category-index> <director|assets|builder|reviewer>');
    process.exitCode = 1;
  } else {
    const template = readFileSync(new URL(`../docs/animation-remake/prompts/${role}.md`, import.meta.url), 'utf8');
    const message = [
      'Read applicable AGENTS.md and docs/animation-remake-direction.md plus docs/animation-remake-orchestration.md first.',
      `Catalog digest: ${digest}. Recompute inventory before work; stop and refresh this packet if it differs.`,
      `Task: ${job.id}. Category index is zero-based. Exact Bengali category: ${job.category}.`,
      `Route: ${job.route}. World runtime state: ${job.runtimeState}. Verify the route and category are actually available before browser-based integration; do not invent a category URL parameter or silently enable a closed world.`,
      `Items: ${job.items.map((item) => item.label).join(' | ')}`,
      `Current entry points: ${job.currentEntryPoints.join(', ')}`,
      `Owned output paths (create only if needed): ${job.proposedOwnedPaths[role].join(', ')}`,
      `Implementation gate: ${job.implementationGate.length ? job.implementationGate.join('; ') : 'pilot brief may start now; implementation still waits for approved runtime contract and asset/scene brief'}`,
      `Shared integration files are root/director-owned: ${shared.join(', ')}. Request changes through a handoff; do not edit them concurrently.`,
      template,
      'Report status, exact files changed, measured checks and evidence paths, remaining failures, asset provenance, and next dependency. No commit, push, or deploy from workers; the root handles the user-authorized release after review.',
    ].join('\n\n');
    console.log(JSON.stringify({ task_name: `${role}_${job.id.replaceAll('-', '_')}`, model: models[role], reasoning_effort: role === 'director' ? 'high' : 'medium', fork_turns: 'none', message }, null, 2));
  }
} else {
  console.error('Commands: inventory | task <world> <zero-based-category-index> <director|assets|builder|reviewer>');
  process.exitCode = 1;
}
