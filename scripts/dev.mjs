/**
 * Dev server starter with automatic port detection.
 * Finds a free port (starting from 3000) and launches Next.js dev server
 * with correct PORT, NEXTAUTH_URL, NEXT_PUBLIC_URL, and NEXT_PUBLIC_APP_URL.
 */
import { createServer } from "node:net";
import { spawn } from "node:child_process";

const START_PORT = 3000;
const MAX_PORT = 3099;

function findFreePort(start) {
  return new Promise((resolve, reject) => {
    const tryPort = async (port) => {
      if (port > MAX_PORT) {
        reject(new Error(`No free port found in range ${START_PORT}-${MAX_PORT}`));
        return;
      }
      const server = createServer();
      server.on("error", () => tryPort(port + 1));
      server.on("listening", () => {
        server.close();
        resolve(port);
      });
      server.listen(port, "127.0.0.1");
    };
    tryPort(start);
  });
}

async function main() {
  const port = await findFreePort(START_PORT);
  const url = `http://localhost:${port}`;

  console.log(`\nStarting dev server on ${url}`);
  if (port !== START_PORT) {
    console.log(`   (port ${START_PORT} was busy, using ${port})`);
  }
  console.log();

  const env = {
    ...process.env,
    PORT: String(port),
    NEXTAUTH_URL: url,
    NEXT_PUBLIC_URL: url,
    NEXT_PUBLIC_APP_URL: url,
  };

  const child = spawn("next", ["dev"], {
    stdio: "inherit",
    env,
    shell: true,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error("Failed to start dev server:", err.message);
  process.exit(1);
});
