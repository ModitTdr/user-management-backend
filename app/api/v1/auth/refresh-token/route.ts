import { ok, unauthorized } from "@/lib/api-response";
import { decryptToken, generateToken, setCookies } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";
import { TokenPayload } from "@/types/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const oldRefreshToken = cookieStore.get("refreshToken")?.value;
  if (!oldRefreshToken) {
    return unauthorized("Refresh Token is missing");
  }

  let payload: TokenPayload;
  try {
    payload = decryptToken(oldRefreshToken, "refresh") as TokenPayload;
  } catch {
    return unauthorized("Refresh token expired or invalid");
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.id }
  })

  if (!user || user.refreshToken !== oldRefreshToken) {
    return unauthorized("Invalid refresh token");
  }
  const userPayload = { id: user.id, username: user.username, role: user.role };
  const accessToken = generateToken(userPayload, 'access');
  const refreshToken = generateToken(userPayload, 'refresh');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: refreshToken
    }
  });
  await setCookies("accessToken", accessToken);
  await setCookies("refreshToken", refreshToken);

  return ok("New Token Generated", { accessToken });
}
