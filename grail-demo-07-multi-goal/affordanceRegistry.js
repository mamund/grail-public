// affordanceRegistry.js (loads from file at runtime)
import { Affordance } from './affordanceModel.js';

export function loadAffordanceRegistry(registryData) {
  const registry = {};

  for (let key in registryData) {
    registry[key] = new Affordance(registryData[key]);
  }
  
  return registry;
}

