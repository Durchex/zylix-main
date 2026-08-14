const { spawnSync } = require("node:child_process");
const path = require("node:path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "..");
const apiDir = path.join(rootDir, "apps", "api");
const prismaCli = path.join(rootDir, "node_modules", "prisma", "build", "index.js");

dotenv.config({ path: path.join(rootDir, ".env") });

const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  cwd: apiDir,
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
