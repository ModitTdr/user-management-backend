import { ok, server, unauthorized } from "@/lib/api-response";
import { decryptToken, deleteCookie } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";
import { TokenPayload } from "@/types/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) {
      return unauthorized("Unauthorized: No token provided");
    }

    let payload: TokenPayload;
    try {
      payload = decryptToken(refreshToken, "refresh") as TokenPayload;
    } catch (error) {
      console.error("Token decryption failed:", error);
      return unauthorized("Unauthorized: Invalid or expired access token");
    }
    if (!payload || !payload.id) {
      return unauthorized("Unauthorized: Invalid token payload");
    }

    const user = await prisma.user.update({
      where: { id: payload.id },
      data: {
        refreshToken: null,
      },
    });

    if (!user) {
      return unauthorized("Unauthorized: User not found");
    }
    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");
    return ok("User logged out");


  } catch (error) {
    console.error("Error in /logout route:", error);
    return server("Something went wrong");
  }
}
