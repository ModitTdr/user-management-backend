import { TokenPayload } from "@/types/auth";
import { compare, hash } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SALT_ROUND = `${process.env.SALT_ROUND}`;
const JWT_ACCESS_SECRET = `${process.env.JWT_ACCESS_SECRET}`;
const JWT_REFRESH_SECRET = `${process.env.JWT_REFRESH_SECRET}`;

export const hashPassword = async (password: string) => {
  return await hash(password, Number(SALT_ROUND));
};

export const comparePassword = async (password: string, hashedPasswordFromDB: string) => {
  return await compare(password, hashedPasswordFromDB);
}

export const generateToken = (
  payload: TokenPayload,
  type: "access" | "refresh"
) => {
  return jwt.sign(
    payload,
    type === "access" ? JWT_ACCESS_SECRET : JWT_REFRESH_SECRET,
    {
      expiresIn: type === "access" ? "1d" : "7d",
      issuer: 'user-management',
    },
  );
}

export const decryptToken = (token: string, type: "access" | "refresh") => {
  try {
    return jwt.verify(
      token,
      type === "access" ? JWT_ACCESS_SECRET : JWT_REFRESH_SECRET,
    );
  } catch (error) {
    console.error(error)
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
}

export const setCookies = async (key: string, token: string) => {
  const cookieStore = cookies();
  (await cookieStore).set(key, token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}
export const deleteCookie = async (key: string) => {
  const cookieStore = cookies();
  (await cookieStore).delete(key);
}
