import {spawnSync} from 'node:child_process'
const result=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','tests/integration/live.test.ts'],{stdio:'inherit',env:{...process.env,OSS_COMPASS_LIVE_TEST:'1'}})
process.exit(result.status??1)
