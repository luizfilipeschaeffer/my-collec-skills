import { spawnSync } from "node:child_process";
import process from "node:process";
import { createInterface } from "node:readline/promises";

const filters = [
  "--filter",
  "my-collec-skills-manifest",
  "--filter",
  "my-collec-skills-apply-engine",
  "--filter",
  "my-collec-skills",
];

function run(args, options = {}) {
  const result = spawnSync("pnpm", args, {
    cwd: process.cwd(),
    shell: process.platform === "win32",
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function readOtp() {
  const fromEnv = process.env.NPM_CONFIG_OTP?.trim();
  if (fromEnv) {
    if (!/^\d{6}$/.test(fromEnv)) {
      throw new Error("NPM_CONFIG_OTP deve conter exatamente 6 dígitos.");
    }
    return fromEnv;
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "Terminal não interativo. Defina NPM_CONFIG_OTP com o código de 6 dígitos.",
    );
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const otp = (await rl.question(
      "\nDigite um código OTP novo do npm (6 dígitos): ",
    )).trim();
    if (!/^\d{6}$/.test(otp)) {
      throw new Error("O código OTP deve conter exatamente 6 dígitos.");
    }
    return otp;
  } finally {
    rl.close();
  }
}

console.log("Validando build e testes antes de solicitar o OTP...");
run([...filters, "--recursive", "run", "build"]);
run([...filters, "--recursive", "run", "test"]);

const otp = await readOtp();

// Lifecycle scripts already ran above. Skipping them here keeps all three
// registry requests inside the same short TOTP validity window.
run([
  ...filters,
  "--recursive",
  "publish",
  "--access",
  "public",
  "--ignore-scripts",
  "--otp",
  otp,
]);

