/**
 * Vite publicDir(data) copies the whole tree into dist.
 * Drop backup / scratch assets so Vercel deploy stays small.
 */
import { readdirSync, statSync, unlinkSync, rmdirSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");

function shouldDropDir(name) {
  return name.includes("_bak_");
}

function shouldDropFile(name) {
  return name.includes("_bak_") || /\.bak[\w.-]*$/i.test(name) || name.endsWith(".tmp.png");
}

function rmTree(root) {
  let files = 0;
  let bytes = 0;
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    const p = join(root, ent.name);
    if (ent.isDirectory()) {
      const sub = rmTree(p);
      files += sub.files;
      bytes += sub.bytes;
    } else if (ent.isFile()) {
      bytes += statSync(p).size;
      unlinkSync(p);
      files += 1;
    }
  }
  rmdirSync(root);
  return { files, bytes };
}

function pruneDir(dir) {
  let removedFiles = 0;
  let removedBytes = 0;

  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (shouldDropDir(ent.name)) {
        const { files, bytes } = rmTree(p);
        removedFiles += files;
        removedBytes += bytes;
        continue;
      }
      const sub = pruneDir(p);
      removedFiles += sub.removedFiles;
      removedBytes += sub.removedBytes;
      continue;
    }
    if (ent.isFile() && shouldDropFile(ent.name)) {
      removedBytes += statSync(p).size;
      unlinkSync(p);
      removedFiles += 1;
    }
  }

  return { removedFiles, removedBytes };
}

if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
  console.warn("prune-dist-public: dist/ missing — skip");
  process.exit(0);
}

const { removedFiles, removedBytes } = pruneDir(DIST);
const mb = (removedBytes / 1024 / 1024).toFixed(1);
console.log(`prune-dist-public: removed ${removedFiles} files (${mb} MB)`);
