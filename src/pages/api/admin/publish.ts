/** Flip a world between draft and published. Posted from the worlds list. */
import type { APIRoute } from 'astro';
import { isLoggedIn, sameOrigin } from '../../../lib/auth';
import { audit, requireDb, selectWorld, setStatus } from '../../../lib/db';
import { bustCache } from '../../../lib/content';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });
  if (!(await isLoggedIn(ctx))) return Response.redirect(new URL('/admin/login', url), 303);

  const form = await request.formData();
  const slug = String(form.get('slug') ?? '');
  const status = form.get('status') === 'draft' ? 'draft' : 'published';

  const d = requireDb();
  if (await selectWorld(d, slug)) {
    await setStatus(d, slug, status);
    await audit(d, status === 'published' ? 'world.publish' : 'world.unpublish', slug);
    bustCache();
  }

  return Response.redirect(new URL(form.get('back')?.toString() || '/admin/worlds', url), 303);
};
