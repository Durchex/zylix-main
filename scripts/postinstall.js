// Some hosting platforms (e.g. Netlify's automatic pre-build dependency
// install) run `npm install` in a context where apps/api's devDependencies
// aren't guaranteed to be present. This postinstall hook regenerates the
// Prisma client when the CLI is available, and skips harmlessly otherwise
// instead of failing the whole install — the platform-specific build
// command (Render's Dockerfile, Netlify's netlify.toml build command) is
// responsible for running prisma generate for real where it's actually needed.
const { existsSync } = require("node:fs");
const { execSync } = require("node:child_process");
const path = require("node:path");

const isWindows = process.platform === "win32";
const prismaCli = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  isWindows ? "prisma.cmd" : "prisma",
);

if (!existsSync(prismaCli)) {
  console.log("postinstall: prisma CLI not found in this install scope, skipping prisma generate.");
  process.exit(0);
}

execSync("npm run prisma:generate", { stdio: "inherit" });
