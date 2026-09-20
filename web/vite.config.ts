import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/interview": "http://127.0.0.1:8000",
      "/transcribe-audio": "http://127.0.0.1:8000",
      "/text-to-speech": "http://127.0.0.1:8000",
      "/candidates": "http://127.0.0.1:8000",
      "/jobs": "http://127.0.0.1:8000",
      "/candidate": "http://127.0.0.1:8000",
      "/database-test": "http://127.0.0.1:8000",
    },
  },
});
