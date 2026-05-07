import { badRequest, created, server, unauthorized } from "@/lib/api-response";
import { comparePassword, generateToken, setCookies } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";
import { LoginRequestData } from "@/types/auth";

export async function POST(req: Request) {
  let body: LoginRequestData;

  //handling json body errors
  try {
    body = await req.json();
  } catch (error) {
    console.error(error);
    return badRequest("Invalid Json Syntax");
  }

  //handling incomming json data
  const { username, password } = body;
  const missingField = [];
  if (!username) missingField.push("username");
  if (!password) missingField.push("password");
  if (missingField.length > 0) {
    return badRequest(`${missingField} is required`);
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return unauthorized("Invalid Credentials");
    }

    const matchPassword = await comparePassword(password, user.password);
    if (!matchPassword) {
      return unauthorized("Invalid Credentials");
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const access = generateToken(payload, "access");
    const refresh = generateToken(payload, "refresh");

    const updatedToken = await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: refresh
      }
    });

    const { password: _password, refreshToken, ...userData } = updatedToken;
    await setCookies("refreshToken", refresh);
    await setCookies("accessToken", access);
    return created("User Logged In", { userData, accessToken: access });
  } catch (error) {
    console.error(error);
    return server("Something went wrong");
  }
}
