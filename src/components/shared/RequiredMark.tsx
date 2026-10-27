/** Tanda bintang merah di label isian yang wajib diisi. */
export function RequiredMark() {
  return (
    <span className="text-fg-danger" aria-hidden="true">
      *
    </span>
  );
}
