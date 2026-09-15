import { notFound, ok, server, unauthorized } from "@/lib/api-response";
import { decryptToken } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";
import { TokenPayload } from "@/types/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {

    const authHeader = req.headers.get("authorization");
    console.log(authHeader)
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
    if (user.role !== "ADMIN") {
      return unauthorized("Unauthorized: Not authorized to fetch users");
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        profiles: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!users) {
      return notFound("Users not found");
    }
    return ok("Users fetched successfully", users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return server("Failed to fetch users");
  }
}