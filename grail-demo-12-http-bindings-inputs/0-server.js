// server.js (unchanged, fully generic broker)
export class Server {
  constructor(worldState, affordanceRegistry) {
    this.worldState = worldState;
    this.affordanceRegistry = affordanceRegistry;
  }

  async attempt(affordance, inputs) {
    console.log(`\n[SERVER] Attempting affordance: ${affordance.action}`);

    const unmetPreconditions = affordance.preconditions.filter(
      pre => !this.worldState.isPreconditionMet(pre)
    );

    if (unmetPreconditions.length > 0) {
      const pre =
        unmetPreconditions[
          Math.floor(Math.random() * unmetPreconditions.length)
        ];

      console.log(`[SERVER] Blocked: selected unmet precondition: ${pre}`);

      const nextAffordance = this.findAffordanceForPrecondition(pre);

      if (nextAffordance) {
        return { success: false, offeredAffordances: [nextAffordance] };
      } else {
        return { success: false, offeredAffordances: [] };
      }
    }
    
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

      const body = Object.fromEntries(
        affordance.inputs.map(name => [name, inputs[name]])
      );

      const contentType =
        affordance.binding.contentType || "application/json";

      let requestBody;

      if (contentType === "application/x-www-form-urlencoded") {
        requestBody = new URLSearchParams(body).toString();
      } else {
        requestBody = JSON.stringify(body);
      }

      const response = await fetch(affordance.binding.url, {
        method: affordance.binding.method,
        headers: {
          "Content-Type": contentType
        },
        body: requestBody
      });
      
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

  selectUnmetCondition(conditions) {
    return conditions[
      Math.floor(Math.random() * conditions.length)
    ];
  }
  
  selectAffordance(affordances) {
    return affordances[
      Math.floor(Math.random() * affordances.length)
    ];
  }
    
  findAffordanceForPrecondition(precondition) {
    const candidates = [];

    for (let key in this.affordanceRegistry) {
      const candidate = this.affordanceRegistry[key];

      if (candidate.effects.includes(precondition)) {
        candidates.push(candidate);
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}

