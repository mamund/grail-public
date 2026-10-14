import fs from "node:fs";

export class ObservationStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.observations = [];
    this.invocationCounter = 0;
    this.persist();
  }

  nextInvocationId() {
    this.invocationCounter += 1;
    return `inv-${String(this.invocationCounter).padStart(3, "0")}`;
  }

  append(observation) {
    this.observations.push(observation);
    this.persist();
  }

  getByAffordance(affordance) {
    return this.observations.filter(
      observation => observation.invocation.affordance === affordance
    );
  }
  
  resolve(source) {
    const prefix = "$outputs.";

    if (!source.startsWith(prefix)) {
      return { resolved: false };
    }

    const reference = source.slice(prefix.length);
    const parts = reference.split(".");

    // Scenario-level:
    // $outputs.latest.<outputName>
    if (parts.length === 2) {
      const [selector, outputName] = parts;

      if (selector !== "latest" || !outputName) {
        return { resolved: false };
      }

      for (let i = this.observations.length - 1; i >= 0; i--) {
        const observation = this.observations[i];

        if (
          observation.outputs &&
          Object.prototype.hasOwnProperty.call(
            observation.outputs,
            outputName
          )
        ) {
          return {
            resolved: true,
            value: observation.outputs[outputName]
          };
        }
      }

      return { resolved: false };
    }

    if (parts.length !== 3) {
      return { resolved: false };
    }

    const [affordance, selector, outputName] = parts;

    if (!affordance || selector !== "latest" || !outputName) {
      return { resolved: false };
    }

    const matching = this.observations.filter(
      observation => observation.invocation.affordance === affordance
    );

    if (matching.length === 0) {
      return { resolved: false };
    }

    const observation = matching[matching.length - 1];

    if (
      !observation.outputs ||
      !Object.prototype.hasOwnProperty.call(observation.outputs, outputName)
    ) {
      return { resolved: false };
    }

    return {
      resolved: true,
      value: observation.outputs[outputName]
    };
  }

  persist() {
    fs.writeFileSync(
      this.filePath,
      `${JSON.stringify(this.observations, null, 2)}\n`,
      "utf8"
    );
  }
}
