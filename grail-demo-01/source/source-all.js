// GRAIL Phase 1 Prototype

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
export class WorldState {
  constructor() {
    this.state = {
      authenticated: false,
      recordLoaded: false
    };
  }

  applyEffects(effects) {
    for (let effect of effects) {
      if (effect === 'authenticated') this.state.authenticated = true;
      if (effect === 'recordLoaded') this.state.recordLoaded = true;
      if (effect === 'emailUpdated') this.state.emailUpdated = true;
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
        const nextAffordance = this.mapPreconditionToAffordance(pre);
        return { success: false, offeredAffordances: [nextAffordance] };
      }
    }

    for (let requiredInput of affordance.inputs) {
      if (!(requiredInput in inputs)) {
        console.log(`[SERVER] Blocked: missing input: ${requiredInput}`);
        return { success: false, offeredAffordances: [] }; // no next affordance, terminal blockage
      }
    }

    console.log(`[SERVER] Success: applying effects`);
    this.worldState.applyEffects(affordance.effects);
    return { success: true, offeredAffordances: [] };
  }

  mapPreconditionToAffordance(precondition) {
    if (precondition === 'recordLoaded') return affordanceRegistry.readRecord;
    if (precondition === 'authenticated') return affordanceRegistry.login;
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

// Pre-seeded inputs for Phase 1 demo
const inputs = {
  newEmail: 'user@example.com',
  recordId: '12345',
  username: 'testuser',
  password: 'hunter2'
};

const client = new Client(server, inputs);

client.pursue(affordanceRegistry.updateEmail);

