import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: { port: 5173 },
  publicDir: "data",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        regionKitTool: resolve(__dirname, "region-kit-tool.html"),
      },
    },
  },
});
