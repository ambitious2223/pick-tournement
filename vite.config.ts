import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const SERVER = "http://127.0.0.1:8787";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": SERVER,
      "/events": SERVER,
      "/uploads": SERVER,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
