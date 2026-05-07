import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const checkDB = async () => {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export { prisma };
