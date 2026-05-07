import { ok, unauthorized } from "@/lib/api-response";
import { decryptToken, generateToken, setCookies } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const oldRefreshToken = cookieStore.get("refreshToken")?.value;

  if (!oldRefreshToken) {
    return unauthorized("Refresh Token is missing");
  }

  const payload = decryptToken(oldRefreshToken, "refresh");
  const user = await prisma.user.findUnique({
    where: { username: payload.id }
  })

  if (!user) {
    return unauthorized("Invalid token");
  }
  if (user.refreshToken !== oldRefreshToken) {
    return unauthorized("Invalid refresh token");
  }

  const accessToken = generateToken(user, 'access');
  const refreshToken = generateToken(user, 'refresh');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: refreshToken
    }
  });
  await setCookies("refreshToken", accessToken);
  await setCookies("accessToken", refreshToken);

  return ok("New Token Generated", { accessToken });
}
