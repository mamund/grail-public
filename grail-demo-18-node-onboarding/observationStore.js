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

  resolve(source) {
    const prefix = "$outputs.";

    if (!source.startsWith(prefix)) {
      return { resolved: false };
    }

    const reference = source.slice(prefix.length);
    const parts = reference.split(".");

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
