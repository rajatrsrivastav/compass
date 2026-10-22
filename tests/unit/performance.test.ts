import { it, expect } from "vitest";
import { performance } from "node:perf_hooks";
import { arch, platform, cpus } from "node:os";
import { rank } from "../../src/shared/ranking";
import { mapItem } from "../../src/main/github/sync";
import { defaultProfile } from "../../src/main/database/store";
it.skipIf(!process.env.COMPASS_BENCH)(
  "measures ranking of 1,000 issues and 1,000 explicitly related PRs",
  () => {
    const items = Array.from({ length: 2000 }, (_, n) =>
      mapItem(
        "bench/repo",
        {
          number: n + 1,
          title: `Fixture ${n}`,
          body: n >= 1000 ? `Fixes #${n - 999}` : "Reproduce the issue",
          state: "open",
          created_at: "2026-10-01",
          updated_at: "2026-10-01",
        },
        n < 1000 ? "issue" : "pr",
      ),
    );
    const samples: number[] = [];
    for (let n = 0; n < 12; n++) {
      const start = performance.now();
      const result = rank(items, [], defaultProfile);
      expect(result).toHaveLength(1000);
      if (n >= 2) samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    console.log(
      JSON.stringify({
        workload: "1000 issues + 1000 PRs, 2 warmups + 10 samples",
        node: process.version,
        platform: platform(),
        arch: arch(),
        cpu: cpus()[0].model,
        medianMs: samples[5],
        minMs: samples[0],
        maxMs: samples.at(-1),
      }),
    );
  },
);
