import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const apiRoutes = [
  "attendance",
  "auth",
  "dashboard",
  "employee",
  "employees",
  "me",
  "objects",
  "setup",
  "utils",
];

const buildSrcDir = join("build", "src");
const sourceApiDir = join("src", "app", "api");
const targetApiDir = join(buildSrcDir, "app", "api");

rmSync(buildSrcDir, { recursive: true, force: true });
mkdirSync(targetApiDir, { recursive: true });

for (const route of apiRoutes) {
  cpSync(join(sourceApiDir, route), join(targetApiDir, route), {
    recursive: true,
  });
}
