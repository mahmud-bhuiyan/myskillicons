/** Normalize to `#RRGGBB` or null. Accepts `#rgb`, `#rrggbb`, with/without `#`. */
export const normalizeHex = (value) => {
  if (!value) return null;
  let s = String(value).trim();
  if (!s.startsWith('#')) s = `#${s}`;
  const short = s.match(/^#([0-9a-fA-F]{3})$/);
  if (short) {
    return `#${short[1]
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toUpperCase()}`;
  }
  const full = s.match(/^#([0-9a-fA-F]{6})$/);
  if (full) return `#${full[1].toUpperCase()}`;
  return null;
};

export const hexToRgbChannels = (hex) => {
  const n = normalizeHex(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
};

export const hexToRgbString = (hex) => {
  const c = hexToRgbChannels(hex);
  if (!c) return '';
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
};

export const channelsToHex = (r, g, b) => {
  const raw = [r, g, b].map((v) => String(v ?? '').trim());
  if (raw.some((v) => v === '' || !/^\d{1,3}$/.test(v))) return null;
  const channels = raw.map(Number);
  if (channels.some((c) => Number.isNaN(c) || c < 0 || c > 255)) return null;
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

/**
 * Digits-only RGB channel typing: commas auto-insert every 3 digits.
 * e.g. "2551530" → "255, 153, 0"
 */
export const formatRgbChannelDigits = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 9);
  const parts = [];
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join(', ');
};

/** Parse channel text / paste into hex when all 3 channels are valid 0–255. */
export const parseRgbChannelsToHex = (channelsText) => {
  const s = String(channelsText || '').trim();
  if (!s) return null;

  // Prefer explicit comma / rgb() groups when present
  const grouped =
    s.match(
      /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*[,/]\s*[\d.]+)?\s*\)/i
    ) || s.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
  if (grouped) {
    return channelsToHex(grouped[1], grouped[2], grouped[3]);
  }

  // Digits-only paste: chunk every 3 (e.g. 255153000)
  const digits = s.replace(/\D/g, '');
  if (digits.length < 3) return null;
  const parts = [];
  for (let i = 0; i < digits.length && parts.length < 3; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  if (parts.length < 3) return null;
  return channelsToHex(parts[0], parts[1], parts[2]);
};

/** Format complete channels for display from a hex value. */
export const hexToChannelText = (hex) => {
  const c = hexToRgbChannels(hex);
  if (!c) return '';
  return `${c.r}, ${c.g}, ${c.b}`;
};
