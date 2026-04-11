import { spawnSync } from "node:child_process"

const env = { ...process.env, NODE_ENV: "production" }

const cleanup = spawnSync("node", ["scripts/prebuild-cleanup.mjs"], {
  stdio: "inherit",
  shell: true,
  env,
})

if (cleanup.status !== 0) {
  process.exit(cleanup.status ?? 1)
}

const build = spawnSync("next", ["build"], {
  stdio: "inherit",
  shell: true,
  env,
})

process.exit(build.status ?? 1)
