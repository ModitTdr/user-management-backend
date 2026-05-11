import { ok, server, unauthorized } from "@/lib/api-response";
import { decryptToken } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";
import { TokenPayload } from "@/types/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let accessToken: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }

    if (!accessToken) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get("accessToken")?.value;
    }
    if (!accessToken) {
      return unauthorized("Unauthorized: No access token provided");
    }

    let payload: TokenPayload;
    try {
      payload = decryptToken(accessToken, "access") as TokenPayload;
    } catch (error) {
      console.error("Token decryption failed:", error);
      return unauthorized("Unauthorized: Invalid or expired access token");
    }

    if (!payload || !payload.id) {
      return unauthorized("Unauthorized: Invalid token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        profiles: true,
      },
    });

    if (!user) {
      return unauthorized("Unauthorized: User not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userData } = user;
    return ok("User data retrieved successfully", userData);

  } catch (error) {
    console.error("Error in /me route:", error);
    return server("Something went wrong");
  }
}
