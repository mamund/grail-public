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

