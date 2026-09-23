import { executeHttpBinding } from "./httpBinding.js";

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
      console.log(
        `[SERVER] Executing binding: ${affordance.binding.method} ${affordance.binding.url}`
      );

      const interaction = await executeHttpBinding(
        affordance.binding,
        resolvedInputs
      );

      const outputs = this.extractOutputs(
        affordance.binding.outputs,
        interaction.response
      );

      const result = interaction.response.ok ? "SUCCESS" : "FAIL";

      this.observationStore.append({
        invocation: {
          id: this.observationStore.nextInvocationId(),
          affordance: affordance.action,
          timestamp: new Date().toISOString(),
          request: interaction.request
        },
        response: {
          status: interaction.response.status,
          headers: interaction.response.headers,
          body: interaction.response.body
        },
        outputs,
        result
      });

      if (!interaction.response.ok) {
        console.log(
          `[SERVER] Binding failed: HTTP ${interaction.response.status}`
        );

        return { success: false, offeredAffordances: [] };
      }

      console.log(
        `[SERVER] Binding succeeded: HTTP ${interaction.response.status}`
      );
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

  extractOutputs(outputDefinitions, response) {
    const outputs = {};

    if (!outputDefinitions) {
      return outputs;
    }

    for (const [outputName, definition] of Object.entries(outputDefinitions)) {
      switch (definition.from) {
        case "body": {
          const extracted = this.readPath(response.body, definition.path);

          if (extracted.found) {
            outputs[outputName] = extracted.value;
          }

          break;
        }

        case "header": {
          const headerName = definition.name.toLowerCase();

          for (const [name, value] of Object.entries(response.headers)) {
            if (name.toLowerCase() === headerName) {
              outputs[outputName] = value;
              break;
            }
          }

          break;
        }

        case "status":
          outputs[outputName] = response.status;
          break;
      }
    }

    return outputs;
  }

  readPath(value, path) {
    const segments = path.split(".");
    let current = value;

    for (const segment of segments) {
      if (
        current === null ||
        current === undefined ||
        (typeof current !== "object" && !Array.isArray(current)) ||
        !(segment in current)
      ) {
        return { found: false };
      }

      current = current[segment];
    }

    return { found: true, value: current };
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
