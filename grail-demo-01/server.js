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

