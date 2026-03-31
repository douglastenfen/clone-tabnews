const { execSync, spawn } = require("child_process");

function runStep(command) {
  try {
    console.log(`\n→ Running: ${command}`);
    execSync(command, { stdio: "inherit", shell: true });
  } catch (err) {
    console.error(`❌ Failed: ${command}`);
    process.exit(err.status ?? 1);
  }
}

runStep("npm run services:up");
runStep("npm run services:wait:database");
runStep("npm run migrations:up");

const dev = spawn("npx next dev", {
  stdio: "inherit",
  shell: true,
});

process.on("SIGINT", () => {
  dev.kill("SIGINT");
});

process.on("SIGTERM", () => {
  dev.kill("SIGTERM");
});

dev.on("exit", (code, signal) => {
  console.log("\n→ Stopping services...");
  try {
    execSync("npm run services:stop", { stdio: "inherit", shell: true });
  } catch (err) {
    console.error("Warning: Failed to stop services gracefully");
  }

  if (signal === "SIGINT" || code === 130) {
    process.exit(0);
  }

  process.exit(code ?? 0);
});
