const { cpSync, existsSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const webRoot = join(__dirname, "..", "apps", "web");
const standaloneRoot = join(webRoot, ".next", "standalone", "apps", "web");

for (const [source, destination] of [
  [join(webRoot, "public"), join(standaloneRoot, "public")],
  [join(webRoot, ".next", "static"), join(standaloneRoot, ".next", "static")],
]) {
  if (!existsSync(source)) {
    throw new Error(`Required build output is missing: ${source}`);
  }

  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}
