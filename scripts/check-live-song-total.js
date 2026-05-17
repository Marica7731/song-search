#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.culua.com';

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    minTotal: null,
    requireBvs: [],
    json: false
  };

  argv.forEach(arg => {
    if (arg === '--json') {
      args.json = true;
    } else if (arg.startsWith('--base=')) {
      args.baseUrl = arg.slice('--base='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--min-total=')) {
      args.minTotal = Number(arg.slice('--min-total='.length));
    } else if (arg.startsWith('--require-bv=')) {
      const bv = arg.slice('--require-bv='.length).trim();
      if (bv) args.requireBvs.push(bv);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  });

  if (args.minTotal !== null && (!Number.isFinite(args.minTotal) || args.minTotal < 0)) {
    throw new Error('--min-total must be a non-negative number');
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/check-live-song-total.js [--base=https://www.culua.com] [--min-total=25785] [--require-bv=BVxxxx] [--json]

Examples:
  node scripts/check-live-song-total.js --json
  node scripts/check-live-song-total.js --min-total=25785 --require-bv=BV1xd5g61Egu
`);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const bootstrap = await fetchJson(`${args.baseUrl}/api/bootstrap`);
  const checks = [];
  const failures = [];
  const totalSongs = Number(bootstrap.totalSongs || 0);
  const totalUnique = Number(bootstrap.totalUnique || 0);

  if (args.minTotal !== null) {
    const ok = totalSongs >= args.minTotal;
    checks.push({ type: 'min-total', expected: args.minTotal, actual: totalSongs, ok });
    if (!ok) {
      failures.push(`totalSongs ${totalSongs} is below required minimum ${args.minTotal}`);
    }
  }

  for (const bv of args.requireBvs) {
    const params = new URLSearchParams({
      q: bv,
      fields: 'bvid,collection,source,title,artist',
      page: '1',
      pageSize: '1'
    });
    const result = await fetchJson(`${args.baseUrl}/api/search?${params.toString()}`);
    const count = Number(result.total || 0);
    const ok = count > 0;
    checks.push({ type: 'require-bv', bv, actual: count, ok });
    if (!ok) {
      failures.push(`${bv} matched 0 songs`);
    }
  }

  const payload = {
    baseUrl: args.baseUrl,
    totalSongs,
    totalUnique,
    sourceCount: Object.keys(bootstrap.sourceStats || {}).length,
    checks,
    ok: failures.length === 0,
    failures
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`base=${payload.baseUrl}`);
    console.log(`totalSongs=${payload.totalSongs}`);
    console.log(`totalUnique=${payload.totalUnique}`);
    console.log(`sourceCount=${payload.sourceCount}`);
    checks.forEach(check => {
      if (check.type === 'min-total') {
        console.log(`check min-total actual=${check.actual} expected>=${check.expected} ${check.ok ? 'ok' : 'fail'}`);
      } else if (check.type === 'require-bv') {
        console.log(`check require-bv ${check.bv} matches=${check.actual} ${check.ok ? 'ok' : 'fail'}`);
      }
    });
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(`check-live-song-total failed: ${error.message}`);
  process.exit(1);
});
