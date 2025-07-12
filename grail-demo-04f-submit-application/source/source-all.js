// GRAIL Phase 4f: Externalized Goal and WorldState Initialization

// affordanceModel.js (unchanged)
export class Affordance {
  constructor({ id, action, type, preconditions = [], inputs = [], effects = [] }) {
    this.id = id;
    this.action = action;
    this.type = type;
    this.preconditions = preconditions;
    this.inputs = inputs;
    this.effects = effects;
  }
}

// affordanceRegistry.js (unchanged loader)
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

// worldState.js (now applies external worldstate.json overrides)
import fs from 'fs';

export class WorldState {
  constructor(affordanceRegistry, worldStateFilePath) {
    this.state = this.buildInitialState(affordanceRegistry, worldStateFilePath);
  }

  buildInitialState(registry, filePath) {
    const allKeys = new Set();
    for (let key in registry) {
      const aff = registry[key];
      aff.preconditions.forEach(pre => allKeys.add(pre));
      aff.effects.forEach(eff => allKeys.add(eff));
    }
    const state = {};
    allKeys.forEach(k => state[k] = false);

    if (fs.existsSync(filePath)) {
      const rawState = fs.readFileSync(filePath);
      const initialState = JSON.parse(rawState);
      for (let key in initialState) {
        if (key in state) {
          state[key] = initialState[key];
        }
      }
    }

    return state;
  }

  applyEffects(effects) {
    for (let effect of effects) {
      this.state[effect] = true;
    }
  }

  isPreconditionMet(precondition) {
    return this.state[precondition] === true;
  }
}

// server.js (unchanged)
export class Server {
  constructor(worldState, affordanceRegistry) {
    this.worldState = worldState;
    this.affordanceRegistry = affordanceRegistry;
  }

  attempt(affordance, inputs) {
    console.log(`\n[SERVER] Attempting affordance: ${affordance.action}`);

    for (let pre of affordance.preconditions) {
      if (!this.worldState.isPreconditionMet(pre)) {
        console.log(`[SERVER] Blocked: unmet precondition: ${pre}`);
        const nextAffordance = this.findAffordanceForPrecondition(pre);
        if (nextAffordance) {
          return { success: false, offeredAffordances: [nextAffordance] };
        } else {
          return { success: false, offeredAffordances: [] };
        }
      }
    }

    for (let requiredInput of affordance.inputs) {
      if (!(requiredInput in inputs)) {
        console.log(`[SERVER] Blocked: missing input: ${requiredInput}`);
        return { success: false, offeredAffordances: [] };
      }
    }

    console.log(`[SERVER] Success: applying effects`);
    this.worldState.applyEffects(affordance.effects);
    return { success: true, offeredAffordances: [] };
  }

  findAffordanceForPrecondition(precondition) {
    for (let key in this.affordanceRegistry) {
      const candidate = this.affordanceRegistry[key];
      if (candidate.effects.includes(precondition)) {
        return candidate;
      }
    }
    return null;
  }
}

// client.js (unchanged)
export class Client {
  constructor(server, inputs) {
    this.server = server;
    this.inputs = inputs;
    this.stack = [];
  }

  pursue(goalAffordance) {
    console.log(`\n[CLIENT] Starting pursuit: ${goalAffordance.action}`);
    this.stack.push(goalAffordance);

    while (this.stack.length > 0) {
      const current = this.stack[this.stack.length - 1];
      const response = this.server.attempt(current, this.inputs);

      if (response.success) {
        console.log(`[CLIENT] Affordance succeeded: ${current.action}`);
        this.stack.pop();
      } else if (response.offeredAffordances.length > 0) {
        const next = response.offeredAffordances[0];
        console.log(`[CLIENT] Pushing next affordance: ${next.action}`);
        this.stack.push(next);
      } else {
        console.log(`[CLIENT] Cannot proceed: no offered affordances`);
        break;
      }
    }
  }
}

// run.js (now fully runtime-configurable)
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

// Load external world state
const worldState = new WorldState(affordanceRegistry, 'worldstate.json');
const server = new Server(worldState, affordanceRegistry);
const client = new Client(server, inputs);

// Load external goal
const rawGoal = fs.readFileSync('goal.json');
const goalObj = JSON.parse(rawGoal);
const goalAffordance = affordanceRegistry[goalObj.goal];
if (!goalAffordance) {
  console.error("Invalid goal specified:", goalObj.goal);
  process.exit(1);
}

// Start pursuit
client.pursue(goalAffordance);

