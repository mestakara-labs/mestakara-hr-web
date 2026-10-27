import type { UserResource } from "@/types/api/user";

/**
 * User yang dipakai di seluruh UI.
 * Nama field memakai camelCase supaya seragam dengan kode TypeScript lainnya.
 */
export interface AuthUser {
  id: number;
  nik: string;
  name: string;
  email: string;
  /** Jabatan, mis. "Staf SDM" */
  position: string;
  /** Unit tempat user bertugas, mis. "Unit Agrowisata" */
  unitName: string;
}

/** Ubah data user dari backend (snake_case) menjadi AuthUser (camelCase). */
export function toAuthUser(user: UserResource): AuthUser {
  return {
    id: user.id,
    nik: user.nik,
    name: user.name,
    email: user.email,
    position: user.position,
    unitName: user.unit_name,
  };
}
