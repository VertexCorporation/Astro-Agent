const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);

// ── 1. REMOVE ENTIRE DIRECTORIES ──────────────────────────────────────────
const dirsToRemove = [
  'tribev2-main',          // Python brain research project — hiç alakası yok
  'packages/web-ui',       // Eski ayrı web-ui paketi — studio-ui.html kullanılıyor
];

// ── 2. REMOVE INDIVIDUAL FILES ─────────────────────────────────────────────
const filesToRemove = [
  // patch/fix scripts at root
  'packages/cli/patch_blender.cjs',
  'packages/cli/patch_blender_unknown.cjs',
  'packages/cli/patch_blender_unknown2.cjs',
  'AstroAgent.cs',

  // test fixture / large data files
  'packages/cli/test/before-compaction.jsonl',
  'packages/cli/test/large-session.jsonl',

  // browser extension cursor files (windows theme junk inside extension)
  'packages/cli/browser-extension/chrome/wait.ani',
  'packages/cli/browser-extension/chrome/appstarting.ani',
  'packages/cli/browser-extension/chrome/pin.cur',
  'packages/cli/browser-extension/chrome/sizenesw.cur',
  'packages/cli/browser-extension/chrome/sizeall.cur',
  'packages/cli/browser-extension/chrome/sizens.cur',
  'packages/cli/browser-extension/chrome/uparrow.cur',
  'packages/cli/browser-extension/chrome/hand.cur',
  'packages/cli/browser-extension/chrome/sizenwse.cur',
  'packages/cli/browser-extension/chrome/sizewe.cur',
  'packages/cli/browser-extension/chrome/help.cur',
  'packages/cli/browser-extension/chrome/crosshair.cur',
  'packages/cli/browser-extension/chrome/arrow.cur',
  'packages/cli/browser-extension/chrome/ibeam.cur',
  'packages/cli/browser-extension/chrome/nwpen.cur',
  'packages/cli/browser-extension/chrome/person.cur',
  'packages/cli/browser-extension/chrome/no.cur',
  'packages/cli/browser-extension/chrome/Install.inf',

  // tools/themes — Windows cursor theme not used by project
  // (whole themes dir)
];

const dirsToRemove2 = [
  'tools/themes/windows-light-cursors',
];

function rmdir(p) {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`✓ Removed dir: ${p}`);
  } else {
    console.log(`  Skip (not found): ${p}`);
  }
}

function rmfile(p) {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { force: true });
    console.log(`✓ Removed file: ${p}`);
  } else {
    console.log(`  Skip (not found): ${p}`);
  }
}

console.log('=== Cleaning up project ===\n');

for (const d of [...dirsToRemove, ...dirsToRemove2]) rmdir(d);
for (const f of filesToRemove) rmfile(f);

console.log('\n=== Done ===');
