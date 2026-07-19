const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🔍 Starting complete local validation...");

function runCommand(command, description) {
  console.log(`\n➡️  ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully!`);
  } catch (err) {
    console.error(`❌ ${description} failed!`);
    process.exit(1);
  }
}

// 1. Lint
runCommand("npm run lint", "Running linter");

// 2. Typecheck
runCommand("npm run typecheck", "Running TypeScript typecheck");

// 3. Unit tests with coverage
runCommand("npm run test", "Running unit tests and checking coverage threshold");

// 4. Build the application
runCommand("npm run build", "Building Next.js application");

// 5. Run E2E tests via Playwright
runCommand("npx playwright test", "Running Playwright E2E tests");

console.log("\n🎉 ALL LOCAL VALIDATIONS PASSED SUCCESSFULLY! Your code is fully verified and ready for CI.");
