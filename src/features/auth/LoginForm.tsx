"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck, User } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import { Checkbox } from "@mestakara/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@mestakara/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@mestakara/ui/input-group";
import { Spinner } from "@mestakara/ui/spinner";

import { PasswordInput } from "@/components/shared/PasswordInput";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost } from "@/lib/http-client";
import { mustBeNikOrEmail, requireText } from "@/lib/validation";
import type { UserResource } from "@/types/api/user";
import { toAuthUser } from "@/types/auth";

import { useAuth } from "./AuthProvider";

/** Isian form login. */
interface LoginValues {
  login: string;
  password: string;
}

/**
 * Halaman tujuan setelah login. Hanya path di dalam aplikasi ini yang diterima
 * (diawali "/", bukan "//"), supaya link berisi `callbackUrl=https://situs-lain.com`
 * tidak bisa membawa user keluar aplikasi.
 */
function safeCallbackUrl(callbackUrl: string | null): string {
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }

  return "/dashboard";
}

/**
 * Form login: NIK/Email, kata sandi, "Ingat saya", dan tombol masuk.
 *
 * Alurnya:
 *   1. User mengisi form lalu menekan "Masuk ke Dashboard".
 *   2. `validate` memeriksa isian di browser.
 *   3. Kalau lolos, data dikirim ke route handler /api/auth/login (BFF).
 *   4. Login berhasil -> data user disimpan di AuthProvider, lalu pindah ke dashboard.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const { submit, saving, errors, formError } = useFormSubmit<LoginValues>({
    validate: (form) => ({
      login: requireText(form.login, "NIK / Email") ?? mustBeNikOrEmail(form.login, "NIK / Email"),
      password: requireText(form.password, "Kata Sandi"),
    }),
    onSubmit: async (form) => {
      // Kirim ke route handler BFF, bukan langsung ke backend.
      const { data } = await apiPost<UserResource>("/api/auth/login", {
        login: form.login.trim(),
        password: form.password,
        rememberMe,
      });

      setUser(toAuthUser(data));

      // Kembali ke halaman yang tadi dituju, atau ke dashboard.
      router.replace(safeCallbackUrl(searchParams.get("callbackUrl")));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit({ login, password });
  }

  return (
    <>
      {/* Pesan error dari server, mis. "NIK/Email atau kata sandi salah." */}
      {formError && (
        <Alert variant="danger" className="mt-6">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* noValidate: pengecekan lewat `validate` supaya pesannya seragam */}
      <form noValidate onSubmit={handleSubmit} className="mt-8">
        <FieldGroup>
          {/* NIK / Email */}
          <Field data-invalid={Boolean(errors.login)}>
            <FieldLabel htmlFor="login">NIK / Email Akun</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <User />
              </InputGroupAddon>
              <InputGroupInput
                id="login"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                aria-invalid={Boolean(errors.login)}
                autoComplete="username"
                placeholder="NIK atau email perusahaan"
              />
            </InputGroup>
            <FieldError>{errors.login}</FieldError>
          </Field>

          {/* Kata sandi */}
          <Field data-invalid={Boolean(errors.password)}>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
              <a href="#" className="ml-auto typo-body-s text-fg-link hover:underline">
                Lupa Kata Sandi?
              </a>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              invalid={Boolean(errors.password)}
              placeholder="Masukkan kata sandi"
            />
            <FieldError>{errors.password}</FieldError>
          </Field>

          {/* Ingat saya + lama sesi */}
          <div className="flex items-center justify-between gap-3">
            <Field orientation="horizontal" className="w-auto">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <FieldLabel htmlFor="remember-me" className="font-normal">
                Ingat saya di perangkat ini
              </FieldLabel>
            </Field>
            <Badge variant="success" dot={false}>
              <ShieldCheck />
              Sesi 8 Jam
            </Badge>
          </div>

          {/* Tombol masuk: saat menunggu jawaban server, tampil ikon berputar */}
          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Spinner />
                Memproses...
              </>
            ) : (
              <>
                Masuk ke Dashboard
                <ArrowRight />
              </>
            )}
          </Button>
        </FieldGroup>
      </form>
    </>
  );
}
