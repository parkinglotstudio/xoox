// Scoped production build: no public asset copy, no change to the main dist.
import {build} from 'vite';
import path from 'node:path';
await build({root:process.cwd(),configFile:false,publicDir:false,build:{outDir:'docs/reports/assets/20261004_펫4종_Codex/production-check',emptyOutDir:false,copyPublicDir:false,rollupOptions:{input:{forestPlay:path.resolve('forest-play-tool.html'),petPack:path.resolve('pet-pack-tool.html')}}}});
