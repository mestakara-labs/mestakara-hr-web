import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Spinner } from "@mestakara/ui/spinner";

/** Tampilan saat data halaman sedang dimuat. */
export function PageLoading({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-16 text-fg-tertiary">
      <Spinner />
      <p className="typo-body-s">{label}</p>
    </div>
  );
}

/** Tampilan saat data halaman gagal dimuat. */
export function PageError({ message }: { message: string }) {
  return (
    <Alert variant="danger">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
