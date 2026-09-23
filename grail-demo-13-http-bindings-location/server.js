import { executeHttpBinding } from "./httpBinding.js";

// server.js (unchanged, fully generic broker)
export class Server {
  constructor(worldState, affordanceRegistry) {
    this.worldState = worldState;
    this.affordanceRegistry = affordanceRegistry;
  }

  async attempt(affordance, inputs) {
    console.log(`\n[SERVER] Attempting affordance: ${affordance.action}`);

    // are there any unmet preconditions?
    const unmetPreconditions = affordance.preconditions.filter(
      pre => !this.worldState.isPreconditionMet(pre)
    );

    // if yes, select one and then find & select an affordance 
    // that will satisfy the precondition
    if (unmetPreconditions.length > 0) {
      const pre = this.selectUnmetCondition(unmetPreconditions);
      
      console.log(`[SERVER] Blocked: selected unmet precondition: ${pre}`);
      
      const candidates = this.findAffordancesForCondition(pre);
      const nextAffordance = this.selectAffordance(candidates);

      if (nextAffordance) {
        return { success: false, offeredAffordances: [nextAffordance] };
      } else {
        return { success: false, offeredAffordances: [] };
      }
    }

    // if there are missing inputs, stop
    for (let requiredInput of affordance.inputs) {
      if (!(requiredInput in inputs)) {
        console.log(`[SERVER] Blocked: missing input: ${requiredInput}`);
        return { success: false, offeredAffordances: [] };
      }
    }

    // Execute external binding when present
    if (affordance.binding) {
      console.log(
        `[SERVER] Executing binding: ${affordance.binding.method} ${affordance.binding.url}`
      );

      // HTTP-specific request construction and execution live in the binding module.
      const response = await executeHttpBinding(
        affordance.binding,
        affordance.inputs,
        inputs
      );

      if (!response.ok) {
        console.log(
          `[SERVER] Binding failed: HTTP ${response.status}`
        );

        return { success: false, offeredAffordances: [] };
      }

      console.log(
        `[SERVER] Binding succeeded: HTTP ${response.status}`
      );
    }

    console.log(
      `[SERVER] Success: applying effects - ${affordance.effects}`
    );

    this.worldState.applyEffects(affordance.effects);
    return { success: true, offeredAffordances: [] };
  }

  // Selection policy #1:
  // Choose which unmet condition to pursue.
  selectUnmetCondition(conditions) {
    if (conditions.length === 0) {
      return null;
    }

    return conditions[
      Math.floor(Math.random() * conditions.length)
    ];
  }

  // Selection policy #2:
  // Choose which affordance to use for the selected condition.
  selectAffordance(affordances) {
    if (affordances.length === 0) {
      return null;
    }

    return affordances[
      Math.floor(Math.random() * affordances.length)
    ];
  }

  // Discovery:
  // Find all affordances capable of establishing the condition.
  findAffordancesForCondition(condition) {
    const candidates = [];

    for (let key in this.affordanceRegistry) {
      const candidate = this.affordanceRegistry[key];

      if (candidate.effects.includes(condition)) {
        candidates.push(candidate);
      }
    }

    return candidates;
  }
}
