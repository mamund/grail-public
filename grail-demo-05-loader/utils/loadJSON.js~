// utils/loadJSON.js
import fs from 'fs';

export function loadJSON(path) {
  try {
    const content = fs.readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[GRAIL Loader] Failed to load ${path}`);
    console.error(err.message);
    process.exit(1);
  }
}

//module.exports = loadJSON;

