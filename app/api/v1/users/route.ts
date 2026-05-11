import { notFound, ok, server } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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