import { badRequest, conflict, created, server } from "@/lib/api-response";
import { hashPassword } from "@/lib/authHelper";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { RegisterRequestData } from "@/types/auth";

export async function POST(req: Request) {
  let body: RegisterRequestData;

  //handling json body errors
  try {
    body = await req.json();
  } catch (error) {
    console.error(error);
    return badRequest("Invalid Json Syntax");
  }

  //handling incomming json data
  const { username, email, password } = body;
  const missingField = [];
  if (!username) missingField.push("username");
  if (!email) missingField.push("email");
  if (!password) missingField.push("password");
  if (missingField.length > 0) {
    return badRequest(`${missingField} is required`);
  }

  try {
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'USER'
      }
    })
    if (user) {
      const { password, ...newUserData } = user;
      return created("User Registered", newUserData);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return conflict("User already exists");
      }
    }

    return server("Something went wrong");
  }

}
