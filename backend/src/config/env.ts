import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
};

export const isProduction = env.nodeEnv === "production";

// Recusa subir em producao com o segredo de exemplo do .env.example ou um
// segredo curto demais - sem isso, um deploy apressado pode ir ao ar com um
// JWT_SECRET que qualquer um consegue adivinhar/copiar do repositorio.
if (isProduction) {
  const PLACEHOLDER = "troque-isso-por-um-segredo-forte-antes-de-subir-pra-producao";
  if (env.jwtSecret === PLACEHOLDER) {
    throw new Error("JWT_SECRET ainda esta com o valor de exemplo do .env.example. Troque antes de subir em producao.");
  }
  if (env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres em producao.");
  }
}
