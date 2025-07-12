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

