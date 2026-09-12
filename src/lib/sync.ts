/**
 * Cross-device progress for a family plan child. Client side.
 *
 * The device keeps localStorage exactly as before; this only mirrors it to
 * the server for the child the page was rendered for, and pulls the server's
 * copy in on load so a tablet at দাদুর বাড়ি and a phone at home agree. Every
 * failure is silent: the page must behave identically with the server gone.
 */
import { getProgress, importSeen } from './progress';

const post = (body: unknown) =>
  fetch('/api/account/progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);

/** Pull the server's keys for this world into the device, then push the union back. */
export async function syncWorld(world: string): Promise<void> {
  try {
    const res = await fetch(`/api/account/progress?world=${encodeURIComponent(world)}`, { headers: { accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as { keys?: string[] };
      if (Array.isArray(data.keys)) importSeen(world, data.keys);
    }
  } catch { /* offline, or not a member: the device copy stands */ }
  const keys = getProgress().seen[world] ?? [];
  if (keys.length) await post({ world, keys });
}

/** Mirror one newly seen item. */
export function pushSeen(world: string, key: string): void {
  void post({ world, keys: [key] });
}
