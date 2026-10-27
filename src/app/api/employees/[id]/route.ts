import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockDeleteEmployee, mockGetEmployee, mockUpdateEmployee } from "@/lib/mock/employee-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/** GET /api/employees/{id} -> GET /employees/{id} — detail satu karyawan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/employees/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetEmployee(id));
  }

  return forward(request, `/employees/${id}`);
}

/** PUT /api/employees/{id} -> PUT /employees/{id} — ubah karyawan (multipart/form-data). */
export async function PUT(request: NextRequest, context: RouteContext<"/api/employees/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockUpdateEmployee(id, await request.formData()));
  }

  return forward(request, `/employees/${id}`);
}

/** DELETE /api/employees/{id} -> DELETE /employees/{id} — hapus karyawan. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/employees/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteEmployee(id));
  }

  return forward(request, `/employees/${id}`);
}
