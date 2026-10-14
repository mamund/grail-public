import { spawn } from "node:child_process";

export function executeStdioBinding(binding, inputs) {
  return new Promise((resolve, reject) => {
    const args = binding.args || [];

    const child = spawn(binding.command, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (exitCode) => {
      let parsedStdout = null;
      let parseError = null;

      if (stdout.trim()) {
        try {
          parsedStdout = JSON.parse(stdout);
        } catch (error) {
          parseError = `Invalid JSON on stdout: ${error.message}`;
        }
      } else {
        parseError = "No JSON returned on stdout";
      }

      resolve({
        command: binding.command,
        args,
        inputs,
        exitCode,
        stdout: parsedStdout ?? stdout,
        stderr,
        error:
          exitCode !== 0
            ? stderr.trim() || `Process exited with code ${exitCode}`
            : parseError
      });
    });

    child.stdin.write(JSON.stringify(inputs));
    child.stdin.end();
  });
}
