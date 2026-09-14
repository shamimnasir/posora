/**
 * Drawing the site's icon font onto a canvas.
 *
 * Everywhere else an icon is a character in a paragraph and CSS decides which
 * font draws it. The 3D scenes cannot do that: a sprite is a picture, so the
 * glyph has to be painted into a canvas first, and canvas takes a font string
 * rather than the page's cascade. Left alone they asked for "Apple Color
 * Emoji", which is how a glossy sticker ended up on a shelf of otherwise
 * monochrome medallions.
 *
 * Two things are needed and the second is easy to forget: name the family, and
 * wait for it. A webfont that has not finished loading is not an error on a
 * canvas - `fillText` quietly falls back to whatever is at hand and the
 * texture is uploaded to the GPU with the wrong drawing in it, once, for the
 * life of the scene. So callers paint immediately (nothing blocks) and hand
 * over a repaint to run when the face is ready.
 */

/** The canvas font string for the icon face, at a pixel size. */
export const iconFont = (px: number): string => `${px}px "Noto Emoji", sans-serif`;

let ready: Promise<void> | null = null;

/**
 * Resolves once the icon face can be drawn.
 *
 * `document.fonts.load` is what pulls a `font-display: swap` face in for
 * canvas, which never triggers a load by itself. Kept as one shared promise so
 * a shelf of two hundred medallions asks once.
 */
function whenReady(): Promise<void> {
  if (!ready) {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    ready = fonts
      ? fonts.load(iconFont(64), '\u{1F9EA}').then(() => undefined).catch(() => undefined)
      : Promise.resolve();
  }
  return ready;
}

/**
 * Paint now, and paint again when the icon font arrives.
 *
 * `repaint` is only called if the face was not already in hand, so a scene
 * built after the page has settled does no extra work.
 */
export function withIconFont(repaint: () => void): void {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts?.check(iconFont(64), '\u{1F9EA}')) return;
  void whenReady().then(repaint);
}
