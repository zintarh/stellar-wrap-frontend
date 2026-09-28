/**
 * Environment variable validation script
 * Validates .env.example documentation and contract address formats. With
 * --build (run by `prebuild`), validates the values set in the environment
 * instead, so a build missing a required variable fails.
 *
 * Usage: node scripts/validate-env.js [--build]
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation failed
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

let hasErrors = false;
let hasWarnings = false;

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  hasErrors = true;
  log(`❌ ERROR: ${message}`, colors.red);
}

function warning(message) {
  hasWarnings = true;
  log(`⚠️  WARNING: ${message}`, colors.yellow);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Every variable in .env.example (kept in sync by __tests__/validate-env.test.ts).
// phase "build": NEXT_PUBLIC_* values are inlined into the bundle by `next build`,
//   so a missing one cannot be fixed without rebuilding. Missing + required fails the build.
// phase "runtime": read by server code per request, so the deployment can provide it
//   after the build. Missing + required only warns at build time.
const ENV_VARS = [
  { name: 'NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET', phase: 'build', required: false },
  { name: 'NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET', phase: 'build', required: false },
  { name: 'NEXT_PUBLIC_CONTRACT_ADDRESS', phase: 'build', required: false },
  { name: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', phase: 'build', required: false },
  { name: 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN', phase: 'build', required: false },
  { name: 'NEXT_PUBLIC_SOROBAN_RPC_URL_MAINNET', phase: 'build', required: false },
  { name: 'NEXT_PUBLIC_SOROBAN_RPC_URL_TESTNET', phase: 'build', required: false },
  { name: 'CRON_SECRET', phase: 'runtime', required: true },
  { name: 'RATE_LIMIT_WINDOW_SECONDS', phase: 'runtime', required: false },
  { name: 'RATE_LIMIT_IP_MAX', phase: 'runtime', required: false },
  { name: 'RATE_LIMIT_ACCOUNT_MAX', phase: 'runtime', required: false },
];

// At least one contract address must be set at build time (see .env.example).
const CONTRACT_ADDRESS_VARS = [
  'NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET',
  'NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET',
  'NEXT_PUBLIC_CONTRACT_ADDRESS',
];

// Soroban contract address validation (C + 55 base32 chars = 56 total)
const CONTRACT_ADDRESS_REGEX = /^C[A-Z2-7]{55}$/;

function isValidContractAddress(address) {
  if (typeof address !== 'string' || address.length !== 56) {
    return false;
  }
  return CONTRACT_ADDRESS_REGEX.test(address);
}

/** Variable names declared in .env.example content. */
function parseEnvExample(content) {
  return content
    .split('\n')
    .map((line) => line.match(/^([A-Z_][A-Z0-9_]*)=/))
    .filter(Boolean)
    .map((match) => match[1]);
}

/** Checks the values in `env` for a build; returns error and warning messages. */
function checkBuildEnv(env) {
  const errors = [];
  const warnings = [];
  const isSet = (name) => Boolean(env[name] && env[name].trim());

  if (!CONTRACT_ADDRESS_VARS.some(isSet)) {
    errors.push(
      `Missing required build-time variable: set at least one of ${CONTRACT_ADDRESS_VARS.join(', ')}`
    );
  }

  CONTRACT_ADDRESS_VARS.filter(isSet).forEach((name) => {
    if (!isValidContractAddress(env[name].trim())) {
      errors.push(
        `${name} is not a valid contract address (56 characters: C followed by 55 base32 chars)`
      );
    }
  });

  ENV_VARS.filter((v) => v.required && !isSet(v.name)).forEach(({ name, phase }) => {
    if (phase === 'build') {
      errors.push(`Missing required build-time variable: ${name}`);
    } else {
      warnings.push(
        `Missing runtime variable: ${name} (required at runtime; set it in the deployment environment)`
      );
    }
  });

  return { errors, warnings };
}

function validateBuildEnv() {
  log('\n' + '='.repeat(70), colors.bold);
  log('Build Environment Validation', colors.bold);
  log('='.repeat(70) + '\n', colors.bold);

  // Load .env files with the same loader and precedence `next build` uses.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS script, like the requires above
  const { loadEnvConfig } = require(
    require.resolve('@next/env', { paths: [require.resolve('next')] })
  );
  loadEnvConfig(rootDir);

  const { errors, warnings } = checkBuildEnv(process.env);
  errors.forEach(error);
  warnings.forEach(warning);
  if (errors.length === 0) {
    success('Required build-time variables are set');
  }
}

function validateEnvExample() {
  log('\n' + '='.repeat(70), colors.bold);
  log('Environment Variable Validation', colors.bold);
  log('='.repeat(70) + '\n', colors.bold);

  const envExamplePath = path.join(rootDir, '.env.example');

  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    error('.env.example file not found');
    info('Create .env.example to document required environment variables');
    return;
  }

  success('.env.example file exists');

  // Read .env.example
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  const documentedVars = new Set(parseEnvExample(envExampleContent));

  log('\n📋 Checking environment variables are documented...\n');

  ENV_VARS.forEach(({ name }) => {
    if (documentedVars.has(name)) {
      success(`${name} is documented`);
    } else {
      error(`${name} is not documented in .env.example`);
    }
  });

  documentedVars.forEach((name) => {
    if (!ENV_VARS.some((v) => v.name === name)) {
      error(`${name} is in .env.example but not in ENV_VARS in scripts/validate-env.js`);
    }
  });

  // Validate contract address format examples in .env.example
  log('\n🔍 Validating contract address format examples...\n');

  const lines = envExampleContent.split('\n');
  lines.forEach((line, index) => {
    const match = line.match(/^(NEXT_PUBLIC_CONTRACT_ADDRESS[^=]*)=(.+)$/);
    if (match) {
      const varName = match[1];
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      
      // Skip empty values (which is fine for examples)
      if (!value) {
        info(`${varName} has no example value (line ${index + 1})`);
        return;
      }

      // If a value is provided, it should be valid
      if (!isValidContractAddress(value)) {
        error(
          `${varName} has invalid example contract address format (line ${index + 1}): ${value}`
        );
        info('Contract addresses must be 56 characters: C followed by 55 base32 chars (A-Z, 2-7)');
      } else {
        success(`${varName} has valid example format (line ${index + 1})`);
      }
    }
  });
}

function validateContractConfig() {
  log('\n' + '='.repeat(70), colors.bold);
  log('Contract Configuration Validation', colors.bold);
  log('='.repeat(70) + '\n', colors.bold);

  const contractsConfigPath = path.join(rootDir, 'config', 'contracts.ts');

  // Check if contracts.ts exists
  if (!fs.existsSync(contractsConfigPath)) {
    error('config/contracts.ts not found');
    return;
  }

  success('config/contracts.ts exists');

  const content = fs.readFileSync(contractsConfigPath, 'utf8');

  // Check for validation function
  if (content.includes('isValidContractAddress')) {
    success('Contract address validation function exists');
  } else {
    warning('No contract address validation function found in contracts.ts');
  }

  // Check for regex validation
  if (content.includes('CONTRACT_ADDRESS_REGEX')) {
    success('Contract address regex pattern defined');
  } else {
    warning('No contract address regex pattern found');
  }

  // Check for proper environment variable loading
  const envVarChecks = [
    'NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET',
  ];

  log('\n🔍 Checking environment variable references...\n');

  envVarChecks.forEach((varName) => {
    if (content.includes(varName)) {
      success(`${varName} is referenced in contracts.ts`);
    } else {
      warning(`${varName} is not referenced in contracts.ts`);
    }
  });
}

function validateREADME() {
  log('\n' + '='.repeat(70), colors.bold);
  log('README Documentation Validation', colors.bold);
  log('='.repeat(70) + '\n', colors.bold);

  const readmePath = path.join(rootDir, 'README.md');

  if (!fs.existsSync(readmePath)) {
    warning('README.md not found');
    return;
  }

  const content = fs.readFileSync(readmePath, 'utf8');

  // Check if environment variables section exists
  if (content.includes('Environment variables') || content.includes('⚙️ Configuration')) {
    success('Environment variables section found in README');
  } else {
    warning('No environment variables section found in README');
  }

  // Check if contract addresses are documented
  const varsToDocument = [
    'NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET',
  ];

  log('\n📋 Checking environment variable documentation...\n');

  varsToDocument.forEach((varName) => {
    if (content.includes(varName)) {
      success(`${varName} is documented in README`);
    } else {
      warning(`${varName} is not documented in README`);
    }
  });

  // Check for contract address format documentation
  if (content.match(/56.*char/i) || content.includes('C...')) {
    success('Contract address format is documented');
  } else {
    info('Consider documenting the contract address format (56 chars, C-prefix)');
  }
}

// Main execution
function main() {
  log('\n🚀 Starting environment variable validation...\n', colors.bold);

  if (process.argv.includes('--build')) {
    validateBuildEnv();
  } else {
    validateEnvExample();
    validateContractConfig();
    validateREADME();
  }

  // Summary
  log('\n' + '='.repeat(70), colors.bold);
  log('Validation Summary', colors.bold);
  log('='.repeat(70) + '\n', colors.bold);

  if (hasErrors) {
    error('Validation failed with errors');
    log('\n💡 Please fix the errors above and try again.\n', colors.yellow);
    process.exit(1);
  } else if (hasWarnings) {
    warning('Validation passed with warnings');
    log('\n💡 Consider addressing the warnings above.\n', colors.yellow);
    process.exit(0);
  } else {
    success('All validations passed!');
    log('\n✨ Environment configuration is properly documented.\n', colors.green);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ENV_VARS, CONTRACT_ADDRESS_VARS, parseEnvExample, checkBuildEnv };
