"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@mestakara/ui/input-group";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** true kalau isian ini sedang menampilkan pesan error (kotaknya jadi merah). */
  invalid?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

/**
 * Kotak isian kata sandi dengan ikon gembok dan tombol mata
 * untuk menampilkan / menyembunyikan kata sandi.
 */
export function PasswordInput({
  id,
  value,
  onChange,
  invalid = false,
  placeholder,
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup>
      <InputGroupAddon>
        <Lock />
      </InputGroupAddon>

      <InputGroupInput
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />

      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
