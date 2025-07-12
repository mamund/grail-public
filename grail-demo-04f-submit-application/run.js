// run.js (now fully runtime-configurable)
import fs from 'fs';
import { loadAffordanceRegistry } from './affordanceRegistry.js';
import { WorldState } from './worldState.js';
import { Server } from './server.js';
import { Client } from './client.js';

// Load external inputs
const rawInputs = fs.readFileSync('./config/inputs.json');
const inputs = JSON.parse(rawInputs);

// Load external registry
const affordanceRegistry = loadAffordanceRegistry('./config/registry.json');

// Load external world state
const worldState = new WorldState(affordanceRegistry, './config/worldstate.json');
const server = new Server(worldState, affordanceRegistry);
const client = new Client(server, inputs);

// Load external goal
const rawGoal = fs.readFileSync('./config/goal.json');
const goalObj = JSON.parse(rawGoal);
const goalAffordance = affordanceRegistry[goalObj.goal];
if (!goalAffordance) {
  console.error("Invalid goal specified:", goalObj.goal);
  process.exit(1);
}

// Start pursuit
client.pursue(goalAffordance);

