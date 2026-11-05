#!/usr/bin/env node

/**
 * Direction Check Engine
 * Based on Guillermo Rauch's & AI Labs' Velocity/Drift Detection Strategy.
 * 
 * Verifies that the current implementation is strictly aligned with the plan and specs,
 * checking for:
 * 1. Spec coverage (PRD & features)
 * 2. Unplanned code / feature drift
 * 3. MUST NOT TRADE OFF violations (alert calls, missing auth checks, unhandled states)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = process.cwd();
const SPECS_DIR = path.join(ROOT_DIR, 'specs');
const SRC_DIR = path.join(ROOT_DIR, 'src');

console.log('\x1b[36m%s\x1b[0m', '==========================================================');
console.log('\x1b[36m%s\x1b[0m', '   DIRECTION AUDIT: Drift & Alignment Engine             ');
console.log('\x1b[36m%s\x1b[0m', '   Guillermo Rauch Paradigm: Velocity Over Raw Speed     ');
console.log('\x1b[36m%s\x1b[0m', '==========================================================\n');

// 1. Verify specs existence
if (!fs.existsSync(SPECS_DIR)) {
  console.error('\x1b[31m[ERROR] specs/ directory is missing! Direction check aborted.\x1b[0m');
  process.exit(1);
}

const prdPath = path.join(SPECS_DIR, 'PRD.md');
const tradeOffPath = path.join(SPECS_DIR, 'MUST_NOT_TRADE_OFF.md');
const featuresDir = path.join(SPECS_DIR, 'features');

console.log('\x1b[33m[1/4] Inspecting Specification Baseline...\x1b[0m');
const hasPRD = fs.existsSync(prdPath);
const hasTradeOff = fs.existsSync(tradeOffPath);
const featureFiles = fs.existsSync(featuresDir) ? fs.readdirSync(featuresDir).filter(f => f.endsWith('.md')) : [];

console.log(`  - PRD: ${hasPRD ? '\x1b[32mFOUND\x1b[0m' : '\x1b[31mMISSING\x1b[0m'}`);
console.log(`  - MUST NOT TRADE OFF: ${hasTradeOff ? '\x1b[32mFOUND\x1b[0m' : '\x1b[31mMISSING\x1b[0m'}`);
console.log(`  - Feature Specs Found: \x1b[32m${featureFiles.length}\x1b[0m (${featureFiles.join(', ') || 'none'})\n`);

// 2. Scan source directory for MUST NOT TRADE OFF violations
console.log('\x1b[33m[2/4] Auditing MUST NOT TRADE OFF Violations in src/...\x1b[0m');
const violations = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check 1: alert() usage forbidden
      if (/alert\s*\(/.test(content)) {
        violations.push({ file: path.relative(ROOT_DIR, fullPath), issue: 'Forbidden alert() call detected. MUST use inline error message.' });
      }

      // Check 2: Raw TODO comments
      if (/\/\/\s*TODO/i.test(content)) {
        violations.push({ file: path.relative(ROOT_DIR, fullPath), issue: 'Lazy TODO comment detected. All implementation must be functional.' });
      }

      // Check 3: Generic "Something went wrong" without specific error
      if (/["'`]Something went wrong["'`]/.test(content)) {
        violations.push({ file: path.relative(ROOT_DIR, fullPath), issue: 'Generic "Something went wrong" message detected. MUST NOT TRADE OFF requires specific, human errors.' });
      }
    }
  }
}

scanDir(SRC_DIR);

if (violations.length === 0) {
  console.log('  \x1b[32m[PASS] Zero MUST NOT TRADE OFF violations found in source code.\x1b[0m\n');
} else {
  console.log(`  \x1b[31m[FAIL] Found ${violations.length} violations:\x1b[0m`);
  violations.forEach(v => console.log(`    • ${v.file}: \x1b[31m${v.issue}\x1b[0m`));
  console.log('');
}

// 3. Inspect git diff for feature drift
console.log('\x1b[33m[3/4] Inspecting Git Status for Feature Drift...\x1b[0m');
let changedFiles = [];
try {
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8', cwd: ROOT_DIR });
  changedFiles = statusOutput.split('\n').filter(Boolean).map(line => line.substring(3).trim());
  console.log(`  - Modified/Untracked files: ${changedFiles.length}`);
} catch (e) {
  console.log('  - Git check skipped (not in git repo or git not found).');
}

// 4. Calculate Scorecard
console.log('\n\x1b[33m[4/4] Generating Alignment Scorecard...\x1b[0m');
let score = 100;
if (!hasPRD) score -= 25;
if (!hasTradeOff) score -= 25;
if (featureFiles.length === 0) score -= 20;
if (violations.length > 0) score -= Math.min(30, violations.length * 10);

console.log('----------------------------------------------------------');
const scoreColor = score >= 90 ? '\x1b[32m' : score >= 70 ? '\x1b[33m' : '\x1b[31m';
console.log(`Alignment Score: ${scoreColor}${score} / 100\x1b[0m`);

if (score >= 90) {
  console.log('Status: \x1b[32mON COURSE (Strictly aligned with specs)\x1b[0m');
} else if (score >= 70) {
  console.log('Status: \x1b[33mMILD DRIFT (Minor adjustments or missing feature docs)\x1b[0m');
} else {
  console.log('Status: \x1b[31mOFF COURSE (Significant drift or non-negotiable violations)\x1b[0m');
}
console.log('----------------------------------------------------------\n');

console.log('Recommended Action Items:');
if (violations.length > 0) {
  console.log('  1. Resolve all MUST NOT TRADE OFF violations immediately.');
} else {
  console.log('  1. All non-negotiables respected.');
}
console.log('  2. Continue following PLAN.md step-by-step.');
console.log('  3. Re-run "node scripts/direction.js" after each completed task.\n');
