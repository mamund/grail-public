// run.js (loads everything at runtime)
import fs from 'fs';
import { loadAffordanceRegistry } from './affordanceRegistry.js';
import { WorldState } from './worldState.js';
import { Server } from './server.js';
import { Client } from './client.js';

// Load external inputs
const rawInputs = fs.readFileSync('inputs.json');
const inputs = JSON.parse(rawInputs);

// Load external registry
const affordanceRegistry = loadAffordanceRegistry('registry.json');

// Create world state and server
const worldState = new WorldState(affordanceRegistry);
const server = new Server(worldState, affordanceRegistry);
const client = new Client(server, inputs);

// Start pursuit with top-level goal
client.pursue(affordanceRegistry.approveDocument);

