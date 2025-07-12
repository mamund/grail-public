// GRAIL Phase 3: Fully Self-Describing, Auto-Derived World Model

// affordanceModel.js
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

// affordanceRegistry.js
import { Affordance } from './affordanceModel.js';

export const affordanceRegistry = {
  updateEmail: new Affordance({
    id: 'aff-1',
    action: 'updateEmail',
    type: 'update',
    preconditions: ['recordLoaded'],
    inputs: ['newEmail'],
    effects: ['emailUpdated']
  }),
  readRecord: new Affordance({
    id: 'aff-2',
    action: 'readRecord',
    type: 'read',
    preconditions: ['authenticated'],
    inputs: ['recordId'],
    effects: ['recordLoaded']
  }),
  login: new Affordance({
    id: 'aff-3',
    action: 'login',
    type: 'authenticate',
    preconditions: [],
    inputs: ['username', 'password'],
    effects: ['authenticated']
  })
};

// worldState.js
import { affordanceRegistry } from './affordanceRegistry.js';

export class WorldState {
  constructor() {
    this.state = this.buildInitialStateFromRegistry();
  }

  buildInitialStateFromRegistry() {
    const allKeys = new Set();
    for (let key in affordanceRegistry) {
      const aff = affordanceRegistry[key];
      aff.preconditions.forEach(pre => allKeys.add(pre));
      aff.effects.forEach(eff => allKeys.add(eff));
    }
    const state = {};
    allKeys.forEach(k => state[k] = false);
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

// server.js
import { affordanceRegistry } from './affordanceRegistry.js';

export class Server {
  constructor(worldState) {
    this.worldState = worldState;
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
    for (let key in affordanceRegistry) {
      const candidate = affordanceRegistry[key];
      if (candidate.effects.includes(precondition)) {
        return candidate;
      }
    }
    return null;
  }
}

// client.js
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

// run.js
import { affordanceRegistry } from './affordanceRegistry.js';
import { WorldState } from './worldState.js';
import { Server } from './server.js';
import { Client } from './client.js';

const worldState = new WorldState();
const server = new Server(worldState);

const inputs = {
  newEmail: 'user@example.com',
  recordId: '12345',
  username: 'testuser',
  password: 'hunter2'
};

const client = new Client(server, inputs);

client.pursue(affordanceRegistry.updateEmail);

