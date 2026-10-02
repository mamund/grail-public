#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { validateConfig } from "./utils/validateWithSchema.js";

const CONFIG_FILES = [
  ["registry.json", "registry.schema.json"],
  ["inputs.json", "inputs.schema.json"],
  ["worldstate.json", "worldstate.schema.json"],
  ["goal.json", "goal.schema.json"]
];

function showHelp() {
  console.log(`GRAIL Environment Validator

Usage:
  node grail-validate.js <config-directory>

Example:
  node grail-validate.js config

Validates:
  registry.json
  inputs.json
  worldstate.json
  goal.json

Schemas are loaded from the repository's /schemas directory.

Exit codes:
  0  Environment is valid
  1  Environment is invalid`);
}

function formatValidationError(error) {
  if (!error.validationErrors?.length) return [`  ${error.message}`];
  const lines = [];
  for (const item of error.validationErrors) {
    lines.push(`  ${item.instancePath || "/"}`);
    lines.push(`  ${item.message}`);
  }
  return lines;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  showHelp();
  process.exit(0);
}
if (args.length !== 1) {
  showHelp();
  process.exit(1);
}

const configDir = path.resolve(args[0]);
console.log("GRAIL Environment Validator\n");

const results = [];
const details = [];

for (const [fileName, schemaName] of CONFIG_FILES) {
  const filePath = path.join(configDir, fileName);

  if (!fs.existsSync(filePath)) {
    results.push([fileName, "MISSING"]);
    continue;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    results.push([fileName, "FAIL"]);
    details.push({ fileName, lines: [`  Invalid JSON: ${error.message}`] });
    continue;
  }

  try {
    validateConfig(data, schemaName, fileName, { silent: true });
    results.push([fileName, "PASS"]);
  } catch (error) {
    results.push([fileName, "FAIL"]);
    details.push({ fileName, lines: formatValidationError(error) });
  }
}

const width = Math.max(...results.map(([name]) => name.length)) + 4;
for (const [fileName, status] of results) {
  console.log(`${fileName.padEnd(width)}${status}`);
}
for (const detail of details) {
  console.log(`\n${detail.fileName}:`);
  for (const line of detail.lines) console.log(line);
}

const valid = results.every(([, status]) => status === "PASS");
console.log(`\n${valid ? "VALID" : "INVALID"}`);
process.exit(valid ? 0 : 1);
