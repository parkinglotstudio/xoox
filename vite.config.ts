import { defineConfig } from "vite";
import { resolve } from "path";
import { layoutSavePlugin } from "./scripts/vite-layout-save";

export default defineConfig({
  server: { port: 5173 },
  publicDir: "data",
  plugins: [layoutSavePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        toolsHub: resolve(__dirname, "tools.html"),
        regionKitTool: resolve(__dirname, "region-kit-tool.html"),
        scenarioTool: resolve(__dirname, "scenario-tool.html"),
        layoutEditor: resolve(__dirname, "layout-editor.html"),
        hudLayoutTool: resolve(__dirname, "hud-layout-tool.html"),
        sectorEditor: resolve(__dirname, "sector-editor.html"),
        fpvTool: resolve(__dirname, "fpv-tool.html"),
        wandererAnim: resolve(__dirname, "wanderer-anim.html"),
        purifyRaidTool: resolve(__dirname, "purify-raid-tool.html"),
        purifySkillProto: resolve(__dirname, "purify-skill-proto-tool.html"),
        culpritCloudTool: resolve(__dirname, "culprit-cloud-tool.html"),
        playLogTool: resolve(__dirname, "play-log-tool.html"),
        mapProto: resolve(__dirname, "map-proto.html"),
        mapMaskTool: resolve(__dirname, "map-mask-tool.html"),
        fillerProto: resolve(__dirname, "filler-proto.html"),
      },
    },
  },
});
