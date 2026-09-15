import { User } from "@/lib/generated/prisma/client";

export type userCreateDataAdmin = Pick<User, "username" | "email" | "password" | "role">