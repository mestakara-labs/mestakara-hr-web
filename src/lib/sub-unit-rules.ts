/**
 * ATURAN SUB UNIT, dipakai form (browser) DAN data mock (server).
 *
 * Kode Afdeling: opsional, tetapi kalau diisi harus unik antarsub unit.
 * Disimpan dalam huruf besar tanpa spasi di ujung, mis. " afd03 " -> "AFD03".
 */

/** Panjang maksimal kode afdeling. */
export const AFDELING_CODE_MAX_LENGTH = 20;

/** Rapikan kode afdeling: tanpa spasi di ujung, huruf besar. "" = tanpa kode. */
export function normalizeAfdelingCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Periksa bentuk kode afdeling (keunikan diperiksa server). Hasilnya pesan error, atau undefined. */
export function checkAfdelingCode(code: string): string | undefined {
  const normalized = normalizeAfdelingCode(code);
  if (!normalized) return undefined;
  if (normalized.length > AFDELING_CODE_MAX_LENGTH) return `Kode Afdeling maksimal ${AFDELING_CODE_MAX_LENGTH} karakter`;
  if (/\s/.test(normalized)) return "Kode Afdeling tidak boleh berisi spasi";
  return undefined;
}
