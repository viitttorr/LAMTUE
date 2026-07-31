import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { criarToken, validarToken, SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/sessionToken";

/**
 * Janela deslizante de 15min: toda requisição autenticada renova o cookie.
 * Sem essa renovação, o usuário seria deslogado 15min após o login mesmo
 * usando o site ativamente — o pedido era expirar por INATIVIDADE.
 */
export async function middleware(req: NextRequest) {
  const validado = await validarToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!validado) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, await criarToken(validado.userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
