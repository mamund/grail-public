import { executeBinding } from "./bindings/binding.js";

// server.js (generic broker)
export class Server {
  constructor(worldState, affordanceRegistry, observationStore) {
    this.worldState = worldState;
    this.affordanceRegistry = affordanceRegistry;
    this.observationStore = observationStore;
  }

  async attempt(affordance, inputs) {
    console.log(`\n[SERVER] Attempting affordance: ${affordance.action}`);

    const unmetPreconditions = affordance.preconditions.filter(
      pre => !this.worldState.isPreconditionMet(pre)
    );

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

    const resolvedInputs = {};

    for (const [inputName, source] of Object.entries(affordance.inputs)) {
      const resolution = this.resolveInput(source, inputs);

      if (!resolution.resolved) {
        console.log(`[SERVER] Blocked: missing input: ${inputName}`);
        return { success: false, offeredAffordances: [] };
      }

      resolvedInputs[inputName] = resolution.value;
    }

    if (affordance.binding) {
      const interaction = await executeBinding(
        affordance.binding,
        resolvedInputs
      );

      console.log(`[SERVER] Executing binding: ${interaction.description}`);

      this.observationStore.append({
        invocation: {
          id: this.observationStore.nextInvocationId(),
          affordance: affordance.action,
          timestamp: new Date().toISOString(),
          ...interaction.invocation
        },
        response: interaction.response,
        outputs: interaction.outputs,
        result: interaction.ok ? "SUCCESS" : "FAIL"
      });

      if (!interaction.ok) {
        console.log(`[SERVER] Binding failed: ${interaction.summary}`);
        return { success: false, offeredAffordances: [] };
      }

      console.log(`[SERVER] Binding succeeded: ${interaction.summary}`);
    }

    console.log(
      `[SERVER] Success: applying effects - ${affordance.effects}`
    );

    this.worldState.applyEffects(affordance.effects);
    return { success: true, offeredAffordances: [] };
  }

  resolveInput(source, inputs) {
    const inputPrefix = "$inputs.";

    if (source.startsWith(inputPrefix)) {
      const inputName = source.slice(inputPrefix.length);

      if (!inputName || !(inputName in inputs)) {
        return { resolved: false };
      }

      return {
        resolved: true,
        value: inputs[inputName]
      };
    }

    if (source.startsWith("$outputs.")) {
      return this.observationStore.resolve(source);
    }

    return { resolved: false };
  }

  selectUnmetCondition(conditions) {
    if (conditions.length === 0) {
      return null;
    }

    return conditions[
      Math.floor(Math.random() * conditions.length)
    ];
  }

  selectAffordance(affordances) {
    if (affordances.length === 0) {
      return null;
    }

    return affordances[
      Math.floor(Math.random() * affordances.length)
    ];
  }

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
