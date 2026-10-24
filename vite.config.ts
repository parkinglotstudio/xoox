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
        forestMapTool: resolve(__dirname, "forest-map-tool.html"),
        islandCoastTool: resolve(__dirname, "island-coast-tool.html"),
        forestPlayTool: resolve(__dirname, "forest-play-tool.html"),
        forestPropTool: resolve(__dirname, "forest-prop-tool.html"),
        objectTool: resolve(__dirname, "object-tool.html"),
        unitLabTool: resolve(__dirname, "unit-lab-tool.html"),
        combatSkillTool: resolve(__dirname, "combat-skill-tool.html"),
        characterCompareTool: resolve(__dirname, "character-compare-tool.html"),
        blockCatTool: resolve(__dirname, "block-cat-tool.html"),
        petPackTool: resolve(__dirname, "pet-pack-tool.html"),
        main: resolve(__dirname, "index.html"),
        toolsHub: resolve(__dirname, "tools.html"),
        scenarioTool: resolve(__dirname, "scenario-tool.html"),
        layoutEditor: resolve(__dirname, "layout-editor.html"),
        hudLayoutTool: resolve(__dirname, "hud-layout-tool.html"),
        sectorEditor: resolve(__dirname, "sector-editor.html"),
        playLogTool: resolve(__dirname, "play-log-tool.html"),
        mapProto: resolve(__dirname, "map-proto.html"),
        mapMaskTool: resolve(__dirname, "map-mask-tool.html"),
        fillerProto: resolve(__dirname, "filler-proto.html"),
      },
    },
  },
});
