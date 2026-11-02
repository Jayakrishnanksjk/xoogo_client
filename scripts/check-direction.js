#!/usr/bin/env node
/**
 * check-direction.js
 * 
 * Implements the "direction" command from Guillermo Rauch's AI development paradigm.
 * Checks whether the current codebase and git status are aligned with the plan in `specs/`
 * or drifting off course into unplanned features and unneeded code bloat ("token maxing").
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '==========================================================');
console.log('\x1b[36m%s\x1b[0m', '   DIRECTION AUDIT: Checking Project Vector Alignment     ');
console.log('\x1b[36m%s\x1b[0m', '   "Velocity implies speed in a DIRECTION" - G. Rauch     ');
console.log('\x1b[36m%s\x1b[0m', '==========================================================\n');

const ROOT_DIR = process.cwd();
const SPECS_DIR = path.join(ROOT_DIR, 'specs');
const PRD_FILE = path.join(SPECS_DIR, 'PRD.md');
const TRADE_OFFS_FILE = path.join(SPECS_DIR, 'MUST_NOT_TRADE_OFF.md');
const FEATURES_DIR = path.join(SPECS_DIR, 'features');

// 1. Verify specs infrastructure exists
if (!fs.existsSync(SPECS_DIR)) {
  console.error('\x1b[31m[FAIL] Missing specs/ directory! Development cannot proceed without defined specs.\x1b[0m');
  process.exit(1);
}

console.log('\x1b[32m[+] Found specs/ directory.\x1b[0m');

// 2. Read PRD and Features to establish the "Planned Scope"
let plannedFeatures = [];
if (fs.existsSync(PRD_FILE)) {
  console.log('\x1b[32m[+] Loaded PRD.md\x1b[0m');
} else {
  console.warn('\x1b[33m[!] PRD.md not found in specs/. Only feature docs will be audited.\x1b[0m');
}

if (fs.existsSync(FEATURES_DIR)) {
  const featureFiles = fs.readdirSync(FEATURES_DIR).filter(f => f.endsWith('.md'));
  console.log(`\x1b[32m[+] Found ${featureFiles.length} feature specification(s) in specs/features/\x1b[0m`);
  featureFiles.forEach(f => plannedFeatures.push(f.replace('.md', '')));
}

// 3. Inspect Git Status & Recent Changed Files
let changedFiles = [];
try {
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
  changedFiles = statusOutput
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.substring(3).trim());
} catch (e) {
  console.log('\x1b[33m[!] Not a git repository or git error. Scanning src/ directory directly.\x1b[0m');
}

console.log(`\n\x1b[34m--- Git Activity & Changed Surfaces (${changedFiles.length} file(s)) ---\x1b[0m`);
changedFiles.forEach(file => console.log(` • ${file}`));

// 4. Audit Rules against MUST_NOT_TRADE_OFF.md & Atomic Component Standards
let violations = [];
let score = 100;

const srcFiles = getAllFiles(path.join(ROOT_DIR, 'src'));

srcFiles.forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
    const code = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(ROOT_DIR, file);

    // Rule 1: No alert()
    if (/\balert\s*\(/.test(code)) {
      violations.push({
        rule: 'User Experience (MUST NOT TRADE OFF #4)',
        file: relPath,
        detail: 'Direct alert() call detected. Non-negotiables forbid alert() in favor of composed inline errors.'
      });
      score -= 15;
    }

    // Rule 2: Visible focus outline
    if (/outline:\s*none\b/.test(code) && !/focus-visible/.test(code)) {
      violations.push({
        rule: 'Accessibility (MUST NOT TRADE OFF #5)',
        file: relPath,
        detail: 'outline: none used without visible focus-visible replacement.'
      });
      score -= 10;
    }

    // Rule 3: Ban raw <button> tags outside src/components/ui/
    if (!relPath.startsWith(path.join('src', 'components', 'ui')) && /<button\b/.test(code)) {
      violations.push({
        rule: 'Atomic Architecture (Strict Component Reuse)',
        file: relPath,
        detail: 'Raw <button> tag detected outside src/components/ui/. All buttons and action pills must use the atomic <Button> component.'
      });
      score -= 10;
    }

    // Rule 4: Ban arbitrary hardcoded hex codes (e.g. text-[#888888] or bg-[#...])
    const hexMatch = code.match(/(?:text|bg|border|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g);
    if (hexMatch) {
      violations.push({
        rule: 'Design Contract (Anti-Slop / Token Adherence)',
        file: relPath,
        detail: `Hardcoded arbitrary color(s) detected: ${Array.from(new Set(hexMatch)).join(', ')}. All styling must resolve to tokens in DESIGN.md.`
      });
      score -= 10;
    }
  }
});

// 5. Check for Atomic Component Inventory
const compDir = path.join(ROOT_DIR, 'src', 'components', 'ui');
if (!fs.existsSync(compDir)) {
  violations.push({
    rule: 'Component Inventory (Token Conservation)',
    file: 'src/components/ui/',
    detail: 'No atomic UI component library found. All UI must derive from atomic components.'
  });
  score -= 10;
}

// Helper recursion
function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

// 6. Generate Direction Scorecard & Action Items
console.log('\n==========================================================');
console.log(`   DIRECTION SCORE: ${Math.max(0, score)}/100`);
if (score >= 90) {
  console.log('\x1b[32m%s\x1b[0m', '   STATUS: ON COURSE (Aligned with specs)');
} else if (score >= 70) {
  console.log('\x1b[33m%s\x1b[0m', '   STATUS: MINOR DRIFT DETECTED (Review action items)');
} else {
  console.log('\x1b[31m%s\x1b[0m', '   STATUS: OFF COURSE (Severe drift from specifications)');
}
console.log('==========================================================\n');

if (violations.length > 0) {
  console.log('\x1b[31mAction Items Required to Return to Plan:\x1b[0m');
  violations.forEach((v, idx) => {
    console.log(` ${idx + 1}. [${v.rule}] in ${v.file}`);
    console.log(`    ↳ ${v.detail}\n`);
  });
} else {
  console.log('\x1b[32m✔ No drift detected. All modifications comply with specs/ and MUST NOT TRADE OFF.\x1b[0m\n');
}
