// worldState.js (auto-derived from affordanceRegistry)
export class WorldState {
  constructor(affordanceRegistry) {
    this.state = this.buildInitialStateFromRegistry(affordanceRegistry);
  }

  buildInitialStateFromRegistry(registry) {
    const allKeys = new Set();
    for (let key in registry) {
      const aff = registry[key];
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

