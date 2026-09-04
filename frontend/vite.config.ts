import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // escuta na rede local, nao so em localhost - pra testar no celular
    proxy: {
      // Encaminha /api pro backend SEM o navegador saber que sao portas
      // diferentes - elimina o problema de cookie cross-origin no celular,
      // e antecipa como vai funcionar em producao atras do Nginx.
      "/api": {
        target: "http://localhost:3333",
        changeOrigin: true,
      },
    },
  },
});