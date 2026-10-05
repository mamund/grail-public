// worldState.js (now applies external worldstate.json overrides)

export class WorldState {
  constructor(affordanceRegistry, worldStateFilePath) {
    this.state = this.buildInitialState(affordanceRegistry, worldStateFilePath);
  }

  buildInitialState(registry, worldState) {
    const allKeys = new Set();
    for (let key in registry) {
      const aff = registry[key];
      aff.preconditions.forEach(pre => allKeys.add(pre));
      aff.effects.forEach(eff => allKeys.add(eff));
    }
    const state = {};
    allKeys.forEach(k => state[k] = false);

    for (let key in worldState) {
      if (key in state) {
        state[key] = worldState[key];
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

