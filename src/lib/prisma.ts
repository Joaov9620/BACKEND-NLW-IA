//conectar o banco de dados automaticamente
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient(); 