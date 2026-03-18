import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        // Proxy all /api calls and backend routes through Vite in dev mode
        // This removes CORS issues during development
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/overview-fast": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/overview": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/structure": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/chat": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/generate": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/health": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            framer: ["framer-motion"],
            markdown: ["react-markdown"],
          },
        },
      },
    },
  };
});
