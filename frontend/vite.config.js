import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // /api istekleri backend'e yönlendirilir: tarayıcı için API ve uygulama aynı adreste olur,
  // böylece oturum çerezi (SameSite=Strict) sorunsuz gönderilir. Yayında aynı yönlendirme
  // barındırma servisinde yapılmalıdır (README > Deployment).
  server: { port: 3000, proxy: { "/api": "http://localhost:5000" } },
  preview: { port: 3000, proxy: { "/api": "http://localhost:5000" } },
  build: { outDir: "build" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
  },
});
