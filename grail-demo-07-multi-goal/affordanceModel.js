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
