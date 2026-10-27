/** Huruf depan dari dua kata pertama nama, mis. "Admin SDM" -> "AS". */
export function getInitials(name: string): string {
  const words = name.split(" ").slice(0, 2);
  const firstLetters = words.map((word) => word.charAt(0));

  return firstLetters.join("").toUpperCase();
}
