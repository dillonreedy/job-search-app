import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
var virtualModuleId = "virtual:data-files";
var resolvedVirtualModuleId = "\0".concat(virtualModuleId);
function listJsonFiles(dir, rootDir) {
    return readdirSync(dir).flatMap(function (entry) {
        var fullPath = path.join(dir, entry);
        var stats = statSync(fullPath);
        if (stats.isDirectory()) {
            return listJsonFiles(fullPath, rootDir);
        }
        if (!entry.toLowerCase().endsWith(".json")) {
            return [];
        }
        if (entry.toLowerCase().endsWith(".sample.json")) {
            return [];
        }
        return ["/".concat(path.relative(rootDir, fullPath).replace(/\\/g, "/"))];
    });
}
function dataFilesPlugin() {
    return {
        name: "job-review-data-files",
        resolveId: function (id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
            return null;
        },
        load: function (id) {
            if (id !== resolvedVirtualModuleId) {
                return null;
            }
            var publicDataDir = path.resolve(process.cwd(), "public", "data");
            var files = listJsonFiles(publicDataDir, path.resolve(process.cwd(), "public")).sort();
            return "export default ".concat(JSON.stringify(files), ";");
        },
    };
}
export default defineConfig({
    plugins: [react(), dataFilesPlugin()],
});
