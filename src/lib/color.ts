/**
 * ALAT BANTU WARNA: membaca kode warna yang diketik pengguna dan memilih warna teks
 * yang tetap terbaca di atasnya. Dipakai pemilih warna shift (browser) DAN mock (server).
 *
 * Warna selalu DISIMPAN sebagai HEX 6 digit huruf besar, mis. "#1BAA4E".
 * Format yang boleh diketik:
 *   HEX : "#1BAA4E", "1baa4e", "#1A4"            (3 digit = singkatan)
 *   RGB : "rgb(27, 170, 78)" atau "27, 170, 78"   (0–255)
 *   HSL : "hsl(141, 73%, 39%)" atau "141, 73, 39" (0–360, 0–100%, 0–100%)
 */

/** Format kode warna yang bisa diketik sendiri. */
export const COLOR_FORMATS = [
  { value: "hex", label: "HEX", placeholder: "#1BAA4E" },
  { value: "rgb", label: "RGB", placeholder: "rgb(27, 170, 78)" },
  { value: "hsl", label: "HSL", placeholder: "hsl(141, 73%, 39%)" },
] as const;

export type ColorFormat = (typeof COLOR_FORMATS)[number]["value"];

/** Apakah teks berupa HEX tersimpan yang sah ("#RRGGBB")? */
export function isHexColor(text: string): boolean {
  return /^#[0-9A-F]{6}$/.test(text);
}

/**
 * Teks yang diketik -> HEX tersimpan. null = formatnya salah.
 *   parseColor("rgb(27, 170, 78)", "rgb")  -> "#1BAA4E"
 *   parseColor("#1a4", "hex")              -> "#11AA44"
 */
export function parseColor(text: string, format: ColorFormat): string | null {
  if (format === "hex") return parseHex(text);

  // Ambil 3 angka, boleh dengan atau tanpa "rgb(...)" / "hsl(...)" dan tanda "%".
  const pattern = new RegExp(`^(?:${format}a?\\()?\\s*([\\d.]+)%?\\s*,\\s*([\\d.]+)%?\\s*,\\s*([\\d.]+)%?\\s*\\)?$`, "i");
  const match = text.trim().match(pattern);
  if (!match) return null;
  const [first, second, third] = match.slice(1, 4).map(Number);

  if (format === "rgb") {
    if ([first, second, third].some((value) => value > 255)) return null;
    return toHex(first, second, third);
  }
  if (first > 360 || second > 100 || third > 100) return null;
  return toHex(...hslToRgb(first, second, third));
}

/**
 * HEX tersimpan -> teks dalam format tertentu (untuk mengisi kotak saat format diganti).
 *   formatColor("#1BAA4E", "rgb") -> "rgb(27, 170, 78)"
 */
export function formatColor(hex: string, format: ColorFormat): string {
  if (!isHexColor(hex)) return "";
  const [red, green, blue] = hexToRgb(hex);
  if (format === "rgb") return `rgb(${red}, ${green}, ${blue})`;
  if (format === "hsl") {
    const [hue, saturation, lightness] = rgbToHsl(red, green, blue);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  return hex;
}

/**
 * Warna teks yang terbaca di atas warna latar ini: hitam untuk latar terang, putih untuk latar gelap.
 * Memakai rumus kecerahan (luminance) standar WCAG.
 */
export function readableTextColor(hex: string): "#000000" | "#FFFFFF" {
  if (!isHexColor(hex)) return "#000000";
  const [red, green, blue] = hexToRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  // 0.179 = titik di mana kontras hitam dan putih sama besar.
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}

// ---------------------------------------------------------------------------
// Alat bantu
// ---------------------------------------------------------------------------

/** "#1a4" / "1BAA4E" -> "#11AA44" / "#1BAA4E". null = bukan HEX. */
function parseHex(text: string): string | null {
  const digits = text.trim().replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{3}$/.test(digits)) return `#${[...digits].map((digit) => digit + digit).join("")}`;
  return /^[0-9A-F]{6}$/.test(digits) ? `#${digits}` : null;
}

/** 27, 170, 78 -> "#1BAA4E" */
function toHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** "#1BAA4E" -> [27, 170, 78] */
function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as [number, number, number];
}

/** HSL (0–360, 0–100, 0–100) -> RGB (0–255). */
function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    return 255 * (l - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [channel(0), channel(8), channel(4)];
}

/** RGB (0–255) -> HSL dibulatkan (0–360, 0–100, 0–100). */
function rgbToHsl(red: number, green: number, blue: number): [number, number, number] {
  const [r, g, b] = [red / 255, green / 255, blue / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return [0, 0, Math.round(lightness * 100)];

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  return [Math.round(hue), Math.round(saturation * 100), Math.round(lightness * 100)];
}
