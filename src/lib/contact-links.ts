/**
 * Membuat link untuk menghubungi pegawai: telepon, email, dan WhatsApp.
 *
 *   phoneLink("0812-3456-7890")    -> "tel:081234567890"
 *   emailLink("nama@ptpn1.co.id")  -> "mailto:nama@ptpn1.co.id"
 *   whatsAppLink("0812-3456-7890") -> "https://wa.me/6281234567890"
 */

/** Ambil angkanya saja: "0812-3456 7890" -> "081234567890" */
function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function phoneLink(phone: string): string {
  return `tel:${digitsOnly(phone)}`;
}

export function emailLink(email: string): string {
  return `mailto:${email}`;
}

/**
 * WhatsApp butuh nomor berformat internasional tanpa "+" dan tanpa "0" di depan.
 * Nomor Indonesia "08xx" diubah menjadi "628xx".
 */
export function whatsAppLink(phone: string): string {
  let number = digitsOnly(phone);

  if (number.startsWith("0")) {
    number = `62${number.slice(1)}`;
  }

  return `https://wa.me/${number}`;
}
