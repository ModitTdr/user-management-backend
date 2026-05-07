import { User } from "@/lib/generated/prisma/client";

export type LoginRequestData = Pick<User, "username" | "password">
export type RegisterRequestData = Pick<User, "username" | "password" | "email">

export type TokenPayload = {
  id: string,
  username: string,
  role: string
}
