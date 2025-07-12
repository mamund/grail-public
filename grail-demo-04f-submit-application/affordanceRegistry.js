// affordanceRegistry.js (loads from file at runtime)
import fs from 'fs';
import { Affordance } from './affordanceModel.js';

export function loadAffordanceRegistry(filePath) {
  const rawData = fs.readFileSync(filePath);
  const parsed = JSON.parse(rawData);
  const registry = {};

  for (let key in parsed) {
    registry[key] = new Affordance(parsed[key]);
  }
  
  return registry;
}

