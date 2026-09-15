import { prisma } from "@/lib/prisma";
import * as response from "@/lib/api-response";
import { hashPassword } from "@/lib/authHelper";
import { NextRequest } from "next/server";
import { Role } from "@/lib/generated/prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profiles: true,
      },
    });

    if (!user) {
      return response.notFound("User not found");
    }

    const { password: _, ...userWithoutPassword } = user;

    return response.ok("User fetched successfully", userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    return response.server("Failed to fetch user");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { username, email, password, role, profile } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return response.notFound("User not found");
    }

    const updateData: {
      username?: string;
      email?: string;
      role?: Role;
      password?: string;
      profiles?: {
        update: Record<string, unknown>;
      };
    } = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (profile) {
      updateData.profiles = {
        update: profile,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profiles: true,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return response.ok("User updated successfully", userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    return response.server("Failed to update user");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { profiles: true }
    });

    if (!existingUser) {
      return response.notFound("User not found");
    }

    await prisma.$transaction(async (tx) => {
      if (existingUser.profiles) {
        await tx.profile.delete({
          where: { userId: id },
        });
      }
      await tx.user.delete({
        where: { id },
      });
    });

    return response.ok("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    return response.server("Failed to delete user");
  }
}
