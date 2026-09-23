import type { DocumentData } from 'firebase/firestore';

// Web-safe fonts need no loading; decorative ones are pulled from Google
// Fonts on demand (see ensureFontLoaded) since they're not installed on
// most devices. Kept to a small, clearly-different-looking set rather
// than the full Google Fonts catalogue, so the dropdown in the event
// form stays easy to scan.
export const CERTIFICATE_FONTS: { label: string; value: string; googleFont?: string; weight?: string }[] = [
  { label: 'Arial (Clean)', value: 'Arial, sans-serif' },
  { label: 'Georgia (Classic Serif)', value: 'Georgia, serif' },
  { label: 'Times New Roman (Formal)', value: '"Times New Roman", serif' },
  { label: 'Playfair Display (Elegant Serif)', value: '"Playfair Display", serif', googleFont: 'Playfair+Display:wght@700', weight: '700' },
  { label: 'Great Vibes (Signature Script)', value: '"Great Vibes", cursive', googleFont: 'Great+Vibes', weight: '400' },
  { label: 'Montserrat (Modern Sans)', value: '"Montserrat", sans-serif', googleFont: 'Montserrat:wght@700', weight: '700' },
  { label: 'Merriweather (Warm Serif)', value: '"Merriweather", serif', googleFont: 'Merriweather:wght@700', weight: '700' },
  { label: 'Pacifico (Casual Script)', value: '"Pacifico", cursive', googleFont: 'Pacifico', weight: '400' },
];

const loadedFonts = new Set<string>();

/** Injects a Google Fonts stylesheet and waits for the font to actually be
 *  ready, so canvas doesn't silently fall back to a system font on the
 *  first render (a common gotcha — the browser can return from the
 *  stylesheet <link> loading before the font file itself is parsed). */
const ensureFontLoaded = async (font: { googleFont?: string; value: string; weight?: string }): Promise<void> => {
  if (!font.googleFont) return; // web-safe font, nothing to load
  if (loadedFonts.has(font.googleFont)) {
    await document.fonts.ready;
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleFont}&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(font.googleFont);

  const family = font.value.replace(/^"|"$/g, '').split(',')[0].trim();
  try {
    await document.fonts.load(`${font.weight || '400'} 48px "${family}"`);
  } catch {
    /* best-effort — canvas will fall back gracefully if this fails */
  }
  await document.fonts.ready;
};

export const getCertificateFont = (fontFamily?: string) =>
  CERTIFICATE_FONTS.find((f) => f.value === fontFamily) || CERTIFICATE_FONTS[0];

/**
 * Composites the attendee's name onto the coordinator's uploaded
 * certificate template using a plain <canvas> — no server needed. The
 * template's natural pixel size is used as the canvas size so the
 * position/font values saved on the event (set against the same image in
 * the coordinator's form) line up exactly.
 */
export const generateCertificateDataUrl = async (event: DocumentData, name: string): Promise<string> => {
  if (!event.certificate_template_url) throw new Error('This event has no certificate template.');

  const pos = event.certificate_name_position || { xPercent: 50, yPercent: 50, fontSize: 48, color: '#1D1D1F' };
  const fontDef = getCertificateFont(pos.fontFamily);
  await ensureFontLoaded(fontDef);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not load the certificate template image'));
    img.src = event.certificate_template_url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0);

  const x = (pos.xPercent / 100) * canvas.width;
  const y = (pos.yPercent / 100) * canvas.height;

  ctx.font = `${fontDef.weight || 'bold'} ${pos.fontSize}px ${pos.fontFamily || fontDef.value}`;
  ctx.fillStyle = pos.color || '#1D1D1F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x, y);

  return canvas.toDataURL('image/png');
};

export const downloadCertificate = async (event: DocumentData, name: string): Promise<void> => {
  const dataUrl = await generateCertificateDataUrl(event, name);
  const link = document.createElement('a');
  link.download = `${(event.title || 'certificate').replace(/\s+/g, '-').toLowerCase()}-certificate.png`;
  link.href = dataUrl;
  link.click();
};