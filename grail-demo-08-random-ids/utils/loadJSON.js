// utils/loadJSON.js
import fs from 'fs';
import path from 'path';
import { validateConfig } from './validateWithSchema.js';

/**
 * Load a JSON file from disk and parse it without validation.
 * Use for legacy or optional config files.
 *
 * @param {string} filePath - Full path to the JSON file
 * @returns {object} Parsed JSON content
 */
export function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Load and validate a JSON file using a provided schema.
 * Throws an error on schema mismatch or parsing failure.
 *
 * @param {string} filePath - Full path to the JSON file
 * @param {string} schemaName - File name of the schema in /schemas (e.g. "goal.schema.json")
 * @returns {object} Parsed and validated JSON content
 */
export function loadAndValidateJSON(filePath, schemaName) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  validateConfig(json, schemaName, path.basename(filePath));
  return json;
}

