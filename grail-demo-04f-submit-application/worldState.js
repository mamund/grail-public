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

