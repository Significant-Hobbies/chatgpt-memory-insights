import { execFileSync } from "node:child_process";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const branch = git("branch", "--show-current");
const dirty = git("status", "--porcelain");
const head = git("rev-parse", "HEAD");
const remoteHead = git("rev-parse", "origin/main");

if (branch !== "main" || dirty || head !== remoteHead) {
  console.error(
    "Deploy requires clean, synced main. " +
      `branch=${branch || "detached"} dirty=${Boolean(dirty)} synced=${head === remoteHead}`,
  );
  process.exit(1);
}

console.log("Deploy guard: clean, synced main confirmed.");
