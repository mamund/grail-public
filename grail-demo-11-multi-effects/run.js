// run.js (now fully runtime-configurable)
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAndValidateJSON } from './utils/loadJSON.js';
import { loadAffordanceRegistry } from './affordanceRegistry.js';
import { WorldState } from './worldState.js';
import { Server } from './server.js';
import { Client } from './client.js';
//import { loadJSON } from './utils/loadJSON.js';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to config files
const configDir = path.join(__dirname, 'config');

// Load configs
const inputs = loadAndValidateJSON(path.join(configDir, 'inputs.json'), 'inputs.schema.json');
const registry = loadAndValidateJSON(path.join(configDir, 'registry.json'), 'registry.schema.json');
const state = loadAndValidateJSON(path.join(configDir, 'worldstate.json'), 'worldstate.schema.json');
const goalObj = loadAndValidateJSON(path.join(configDir, 'goal.json'), 'goal.schema.json');

// Load external registry
const affordanceRegistry = loadAffordanceRegistry(registry);

// Load external world state
const worldState = new WorldState(affordanceRegistry, state);
const server = new Server(worldState, affordanceRegistry);
const client = new Client(server, inputs);

// Load external goal
const goalAffordance = affordanceRegistry[goalObj.goal];
if (!goalAffordance) {
  console.error("Invalid goal specified:", goalObj.goal);
  process.exit(1);
}

// Start pursuit
client.pursue(goalAffordance);

