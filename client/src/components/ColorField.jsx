import { useState, useEffect, useRef } from 'react';
import {
  normalizeHex,
  hexToChannelText,
  channelsToHex,
  formatRgbChannelDigits,
  parseRgbChannelsToHex,
} from '../utils/color';

function sanitizeHexInput(raw) {
  const s = String(raw || '').replace(/[^#0-9a-fA-F]/g, '');
  if (!s) return '';
  const body = s.replace(/#/g, '').slice(0, 6);
  return `#${body}`;
}

function clampChannelDigits(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return '';
  if (n > 255) return '255';
  return digits;
}

function channelsFromHex(hex) {
  const text = hexToChannelText(hex);
  const [r = '', g = '', b = ''] = text.split(',').map((p) => p.trim());
  return { r, g, b };
}

/**
 * Reusable color control: swatch + hex + rgb(r, g, b) with digit-only channels.
 * Canonical value is always `#RRGGBB`.
 */
export default function ColorField({ label, value, onChange, className = '' }) {
  const safeHex = normalizeHex(value) || '#000000';
  const [hexText, setHexText] = useState(safeHex);
  const [channels, setChannels] = useState(() => channelsFromHex(safeHex));
  const gRef = useRef(null);
  const bRef = useRef(null);

  useEffect(() => {
    const next = normalizeHex(value);
    if (!next) return;
    setHexText(next);
    setChannels(channelsFromHex(next));
  }, [value]);

  const commitHex = (hex) => {
    const next = normalizeHex(hex);
    if (!next) return;
    setHexText(next);
    setChannels(channelsFromHex(next));
    onChange(next);
  };

  const commitChannels = (nextChannels) => {
    setChannels(nextChannels);
    const hex = channelsToHex(nextChannels.r, nextChannels.g, nextChannels.b);
    if (hex) {
      setHexText(hex);
      onChange(hex);
    }
  };

  const onChannelChange = (key, raw) => {
    const digits = clampChannelDigits(raw);
    const nextChannels = { ...channels, [key]: digits };
    commitChannels(nextChannels);

    if (digits.length === 3) {
      if (key === 'r') gRef.current?.focus();
      if (key === 'g') bRef.current?.focus();
    }
  };

  const onRgbPaste = (e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (!pasted) return;

    const fromHex = normalizeHex(pasted);
    if (fromHex) {
      e.preventDefault();
      commitHex(fromHex);
      return;
    }

    const hex = parseRgbChannelsToHex(pasted);
    if (hex) {
      e.preventDefault();
      commitHex(hex);
      return;
    }

    // Partial paste — fill what we can from comma groups or digit chunks
    const grouped = pasted.match(/(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3}))?/);
    if (grouped) {
      e.preventDefault();
      commitChannels({
        r: clampChannelDigits(grouped[1]),
        g: clampChannelDigits(grouped[2]),
        b: clampChannelDigits(grouped[3] || ''),
      });
      return;
    }

    const formatted = formatRgbChannelDigits(pasted);
    const parts = formatted.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      e.preventDefault();
      commitChannels({
        r: parts[0] || '',
        g: parts[1] || '',
        b: parts[2] || '',
      });
    }
  };

  const channelInputClass =
    'w-5 shrink-0 bg-transparent p-0 text-center font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300 outline-none';

  return (
    <label className={`flex-1 min-w-0 text-xs text-zinc-400 space-y-1 ${className}`}>
      {label ? <span>{label}</span> : null}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          className="w-9 h-9 shrink-0 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer"
          value={safeHex}
          onChange={(e) => commitHex(e.target.value)}
          aria-label={label ? `${label} swatch` : 'Color swatch'}
        />
        <input
          type="text"
          spellCheck={false}
          className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300"
          value={hexText}
          onChange={(e) => {
            const next = sanitizeHexInput(e.target.value);
            setHexText(next);
            const normalized = normalizeHex(next);
            if (normalized) {
              setChannels(channelsFromHex(normalized));
              onChange(normalized);
            }
          }}
          onBlur={() => {
            const next = normalizeHex(hexText);
            if (next) commitHex(next);
            else {
              setHexText(safeHex);
              setChannels(channelsFromHex(safeHex));
            }
          }}
          placeholder="#FFFFFF"
          aria-label={label ? `${label} hex` : 'Hex color'}
        />
      </div>

      <div
        className="flex items-center w-full min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-1.5 font-mono text-xs"
        onPaste={onRgbPaste}
      >
        <span className="text-zinc-500 select-none shrink-0">rgb(</span>
        <input
          type="text"
          inputMode="numeric"
          spellCheck={false}
          maxLength={3}
          className={channelInputClass}
          value={channels.r}
          onChange={(e) => onChannelChange('r', e.target.value)}
          aria-label={label ? `${label} red` : 'Red'}
        />
        <span className="text-zinc-500 select-none shrink-0">,</span>
        <input
          ref={gRef}
          type="text"
          inputMode="numeric"
          spellCheck={false}
          maxLength={3}
          className={channelInputClass}
          value={channels.g}
          onChange={(e) => onChannelChange('g', e.target.value)}
          aria-label={label ? `${label} green` : 'Green'}
        />
        <span className="text-zinc-500 select-none shrink-0">,</span>
        <input
          ref={bRef}
          type="text"
          inputMode="numeric"
          spellCheck={false}
          maxLength={3}
          className={channelInputClass}
          value={channels.b}
          onChange={(e) => onChannelChange('b', e.target.value)}
          aria-label={label ? `${label} blue` : 'Blue'}
        />
        <span className="text-zinc-500 select-none shrink-0">)</span>
      </div>
    </label>
  );
}
