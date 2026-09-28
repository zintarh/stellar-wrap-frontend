#!/usr/bin/env node
/**
 * Fails when an App Router special file under app/ is not lowercase.
 *
 * macOS resolves `Page.tsx` as `page.tsx`, but Vercel builds on a
 * case-sensitive filesystem where it is not a route file, so the route
 * works locally and 404s in production.
 */
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const appDir = join(process.cwd(), "app");
const specialFiles = new Set([
  "page",
  "layout",
  "loading",
  "error",
  "global-error",
  "not-found",
  "forbidden",
  "unauthorized",
  "template",
  "default",
  "route",
]);
const fileName = /^([^.]+)\.(jsx?|tsx?|mdx)$/;

const entries = await readdir(appDir, { recursive: true, withFileTypes: true });
const offenders = entries
  .filter((entry) => entry.isFile())
  .filter((entry) => {
    const base = entry.name.match(fileName)?.[1];
    return base && base !== base.toLowerCase() && specialFiles.has(base.toLowerCase());
  })
  .map((entry) => relative(process.cwd(), join(entry.parentPath, entry.name)));

if (offenders.length > 0) {
  console.error("❌ App Router files must be lowercase to resolve on case-sensitive filesystems:");
  for (const file of offenders) console.error(`   ${file}`);
  console.error("Rename them with `git mv` in two steps (e.g. Page.tsx -> tmp.tsx -> page.tsx).");
  process.exit(1);
}

console.log("✅ All App Router route files are lowercase");
