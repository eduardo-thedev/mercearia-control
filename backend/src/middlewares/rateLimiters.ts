import rateLimit from "express-rate-limit";

// Login: alvo classico de brute-force. 10 tentativas por 15min por IP -
// da folga pra erro de digitacao, mas barra varredura automatizada.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

// Registro: nao precisa ser tao restrito quanto login, mas evita spam de
// contas automatizado.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de cadastro. Tente novamente mais tarde." },
});

// Esqueci minha senha: o mais restrito dos tres, porque sem limite vira
// ferramenta de spam de e-mail pra qualquer endereco (nao precisa nem ser
// conta valida - o endpoint sempre responde 200 igual).
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente mais tarde." },
});

// Limite geral da API inteira, como segunda camada de defesa alem dos
// limites especificos acima.
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
