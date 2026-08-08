#!/usr/bin/env node

'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const EXCLUDED_PREFIXES = [
  'data/',
  'reports/',
  'scripts/node_modules/',
  'vocaloid-songs-'
];

const SECRET_PATTERNS = [
  ['private-key', /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/g],
  ['github-token', /gh[pousr]_[A-Za-z0-9]{20,}/g],
  ['aws-access-key', /AKIA[0-9A-Z]{16}/g],
  ['openai-key', /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ['slack-token', /xox[baprs]-[A-Za-z0-9-]{20,}/g],
  ['gitlab-token', /glpat-[A-Za-z0-9_-]{20,}/g],
  ['npm-token', /npm_[A-Za-z0-9]{20,}/g],
  ['jwt', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ['bearer-token', /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/g]
];

const GENERIC_ASSIGNMENT = /\b(api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|cookie)\b\s*[:=]\s*['"]([^'"\r\n]{8,})['"]/gi;
const UNQUOTED_ASSIGNMENT = /\b(api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|cookie)\b\s*[:=]\s*([^'"\s#,{][^\s#,;}]{7,})/gi;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IPV6_CANDIDATE = /(?:^|[^A-Za-z0-9])((?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4})(?=$|[^A-Za-z0-9])/g;
const SENSITIVE_FILE_NAME = /(?:^|\/)(?:\.env(?:\..+)?|[^/]+\.(?:key|pem|p12|pfx))$/i;

function stagedFiles() {
  return new Set(
    execFileSync('git', ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], {
      cwd: ROOT,
      encoding: 'buffer'
    })
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
  );
}

function gitFiles(staged) {
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: ROOT, encoding: 'buffer' }
  );
  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((file) => staged.has(file) || !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)))
    .sort();
}

function lineNumber(text, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

function isPublicIpv4(value) {
  const octets = value.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function looksLikePlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes('process.env') ||
    normalized.includes('os.environ') ||
    normalized.includes('${') ||
    normalized.includes('<') ||
    normalized.includes('redacted') ||
    normalized.includes('placeholder') ||
    normalized.includes('example') ||
    normalized.includes('change-me') ||
    normalized === 'null' ||
    normalized === 'undefined'
  );
}

function isPublicIpv6(value) {
  if (net.isIP(value) !== 6) return false;
  const normalized = value.toLowerCase();
  return !(
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('::ffff:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8')
  );
}

function addFinding(findings, file, text, offset, kind) {
  findings.push({ file, line: lineNumber(text, offset), kind });
}

function readCandidate(file, staged) {
  if (staged.has(file)) {
    const object = `:${file}`;
    const size = Number(execFileSync('git', ['cat-file', '-s', object], { cwd: ROOT, encoding: 'utf8' }).trim());
    if (size > MAX_FILE_BYTES) return { skipped: 'too-large' };
    return { buffer: execFileSync('git', ['show', object], { cwd: ROOT, encoding: 'buffer' }) };
  }

  const absolute = path.join(ROOT, file);
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) return { skipped: 'not-file' };
  if (stat.size > MAX_FILE_BYTES) return { skipped: 'too-large' };
  return { buffer: fs.readFileSync(absolute) };
}

function scanFile(file, staged, findings, skipped) {
  if (SENSITIVE_FILE_NAME.test(file) && !file.endsWith('.env.example')) {
    findings.push({ file, line: 1, kind: 'sensitive-file-name' });
  }
  const candidate = readCandidate(file, staged);
  if (candidate.skipped) {
    skipped.push({ file, reason: candidate.skipped });
    return;
  }
  const { buffer } = candidate;
  if (buffer.includes(0)) {
    skipped.push({ file, reason: 'binary' });
    return;
  }
  const text = buffer.toString('utf8');

  for (const [kind, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) addFinding(findings, file, text, match.index, kind);
  }

  GENERIC_ASSIGNMENT.lastIndex = 0;
  for (const match of text.matchAll(GENERIC_ASSIGNMENT)) {
    if (!looksLikePlaceholder(match[2])) addFinding(findings, file, text, match.index, 'sensitive-assignment');
  }

  UNQUOTED_ASSIGNMENT.lastIndex = 0;
  for (const match of text.matchAll(UNQUOTED_ASSIGNMENT)) {
    if (!looksLikePlaceholder(match[2])) addFinding(findings, file, text, match.index, 'sensitive-assignment');
  }

  IPV4.lastIndex = 0;
  for (const match of text.matchAll(IPV4)) {
    if (isPublicIpv4(match[0])) addFinding(findings, file, text, match.index, 'public-ipv4');
  }

  IPV6_CANDIDATE.lastIndex = 0;
  for (const match of text.matchAll(IPV6_CANDIDATE)) {
    if (isPublicIpv6(match[1])) addFinding(findings, file, text, match.index + match[0].indexOf(match[1]), 'public-ipv6');
  }
}

function main() {
  const findings = [];
  const skipped = [];
  const staged = stagedFiles();
  const files = gitFiles(staged);
  for (const file of files) scanFile(file, staged, findings, skipped);

  const unique = [...new Map(findings.map((finding) => [`${finding.file}:${finding.line}:${finding.kind}`, finding])).values()];
  for (const finding of unique) console.error(`${finding.file}:${finding.line} [${finding.kind}]`);
  console.log(`sensitive scan complete: files=${files.length} findings=${unique.length} skipped=${skipped.length}`);
  if (skipped.length) console.log(`skipped files: ${skipped.map((item) => `${item.file}(${item.reason})`).join(', ')}`);
  if (unique.length || skipped.length) process.exitCode = 1;
}

main();
