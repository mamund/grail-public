// affordanceModel.js

export class Affordance {
  constructor({
    id,
    action,
    type,
    enabled,
    preconditions = [],
    inputs = [],
    effects = [],
    binding
  }) {
    this.id = id;
    this.action = action;
    this.type = type;
    this.enabled = enabled;
    this.preconditions = preconditions;
    this.inputs = inputs;
    this.effects = effects;
    this.binding = binding;
  }
}
