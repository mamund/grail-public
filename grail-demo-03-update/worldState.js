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

