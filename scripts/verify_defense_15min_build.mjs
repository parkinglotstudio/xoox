import {build} from 'vite';
import path from 'node:path';
await build({root:process.cwd(),configFile:false,publicDir:false,build:{outDir:'docs/reports/assets/20261004_방어진지와시설동작_Codex/production-check',emptyOutDir:false,copyPublicDir:false,rollupOptions:{input:{forestPlay:path.resolve('forest-play-tool.html')}}}});
