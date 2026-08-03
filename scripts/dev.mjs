import { spawn } from "node:child_process";

const incoming = process.argv.slice(2);
const args = ["dev"];

for (let index = 0; index < incoming.length; index += 1) {
  const argument = incoming[index];
  if (argument === "--strictPort") continue;
  if (argument === "--host") {
    args.push("-H", incoming[index + 1]);
    index += 1;
    continue;
  }
  args.push(argument);
}

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
