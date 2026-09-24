// utils/validateWithSchema.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);

function loadSchema(schemaName) {
  const schemaPath = path.join(__dirname, '../schemas', schemaName);
  const raw = fs.readFileSync(schemaPath, 'utf8');
  return JSON.parse(raw);
}

export function validateConfig(
  data,
  schemaName,
  label = 'config',
  { silent = false } = {}
) {
  const schema = loadSchema(schemaName);
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    if (!silent) {
      console.error(`❌ Validation failed for ${label}:`);
      console.error(validate.errors);
    }

    const error = new Error(`Invalid ${label} file`);
    error.validationErrors = validate.errors;
    throw error;
  }

  return true;
}
