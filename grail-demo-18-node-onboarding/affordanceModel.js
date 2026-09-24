// affordanceModel.js

export class Affordance {
  constructor({
    id,
    action,
    type,
    preconditions = [],
    inputs = [],
    effects = [],
    binding
  }) {
    this.id = id;
    this.action = action;
    this.type = type;
    this.preconditions = preconditions;
    this.inputs = inputs;
    this.effects = effects;
    this.binding = binding;
  }
}
