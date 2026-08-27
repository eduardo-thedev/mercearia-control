import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env, isProduction } from "./config/env";
import { pool } from "./config/database";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { generalLimiter } from "./middlewares/rateLimiters";

const app = express();

app.use(helmet());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true, // necessario para o cookie httpOnly do JWT
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Health check falhou - banco inacessivel:", err);
    res.status(503).json({ status: "error", detail: "banco de dados inacessivel" });
  }
});

app.use("/api", routes);

// tem que ser o ultimo app.use
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API rodando em http://localhost:${env.port}`);
});
