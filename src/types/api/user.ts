/** Data user persis seperti yang dikirim backend (nama field snake_case). */
export interface UserResource {
  id: number;
  nik: string;
  name: string;
  email: string;
  position: string;
  unit_name: string;
}

/** Isi `data` dari respons login backend. */
export interface LoginResponse {
  token: string;
  user: UserResource;
}
