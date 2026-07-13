const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🚀 Initializing test compilation and coverage run...");

const compiledDir = path.join(__dirname, 'compiled');
if (!fs.existsSync(compiledDir)) {
  fs.mkdirSync(compiledDir, { recursive: true });
}

const coverageDir = path.join(__dirname, '../coverage');
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

try {
  // 1. Compile TS dependency
  console.log("📦 Compiling TypeScript dependencies...");
  execSync('npx tsc lib/rfcValidator.ts --outDir scripts/compiled --module commonjs --target es2020', { stdio: 'inherit' });

  // 2. Run tests with coverage collection
  console.log("🧪 Running unit tests with native V8 coverage...");
  const lcovPath = path.join(coverageDir, 'lcov.info');
  const output = execSync(`node --test --experimental-test-coverage --test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination="${lcovPath}" scripts/run-tests.js`, { encoding: 'utf8' });
  console.log(output);

  // 3. Parse code coverage metrics from Node.js report
  const lines = output.split('\n');
  const allFilesLine = lines.find(line => line.includes('all files'));
  
  if (allFilesLine) {
    // Format: "all files   | 100.00 |   100.00 |  100.00 |"
    const parts = allFilesLine.split('|').map(s => s.trim());
    if (parts.length >= 4) {
      const linePct = parseFloat(parts[1]);
      const branchPct = parseFloat(parts[2]);
      const funcPct = parseFloat(parts[3]);

      console.log("=========================================");
      console.log(`📊 Native Coverage Metrics:`);
      console.log(`  - Line Coverage  : ${linePct}% (Required: >=85%)`);
      console.log(`  - Branch Coverage: ${branchPct}% (Required: >=85%)`);
      console.log(`  - Function Cov.  : ${funcPct}%`);
      console.log("=========================================");

      if (isNaN(linePct) || isNaN(branchPct)) {
        console.error("❌ Error parsing coverage percentages from native report.");
        process.exit(1);
      }

      if (linePct < 85 || branchPct < 85) {
        console.error(`❌ CODE COVERAGE THRESHOLD FAILED: Coverage must be >= 85%.`);
        process.exit(1);
      } else {
        console.log(`✅ CODE COVERAGE THRESHOLD PASSED!`);
      }
    } else {
      console.error("❌ Failed to parse code coverage table layout.");
      process.exit(1);
    }
  } else {
    console.warn("⚠️ Native coverage report format not recognized. 'all files' row missing.");
  }
} catch (err) {
  console.error("❌ Test suite run failed:");
  console.error(err.stdout || err.message);
  process.exit(1);
} finally {
  // Clean up compiled files
  console.log("🧹 Cleaning up compiled test artifacts...");
  try {
    fs.rmSync(compiledDir, { recursive: true, force: true });
  } catch (err) {}
}
