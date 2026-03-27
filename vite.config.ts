import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const virtualModuleId = "virtual:data-files";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

function listJsonFiles(dir: string, rootDir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return listJsonFiles(fullPath, rootDir);
    }

    if (!entry.toLowerCase().endsWith(".json")) {
      return [];
    }

    if (entry.toLowerCase().endsWith(".sample.json")) {
      return [];
    }

    return [`/${path.relative(rootDir, fullPath).replace(/\\/g, "/")}`];
  });
}

function dataFilesPlugin() {
  return {
    name: "job-review-data-files",
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id: string) {
      if (id !== resolvedVirtualModuleId) {
        return null;
      }

      const publicDataDir = path.resolve(process.cwd(), "public", "data");
      const files = listJsonFiles(publicDataDir, path.resolve(process.cwd(), "public")).sort();
      return `export default ${JSON.stringify(files)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), dataFilesPlugin()],
});
