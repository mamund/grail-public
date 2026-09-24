import { executeHttpBinding } from "./httpBinding.js";
import { executeNodeBinding } from "./nodeBinding.js";

export async function executeBinding(binding, inputs) {
  switch (binding.protocol) {
    case "http":
      return executeHttp(binding, inputs);

    case "node":
      return executeNode(binding, inputs);

    default:
      throw new Error(`Unsupported binding protocol: ${binding.protocol}`);
  }
}

async function executeHttp(binding, inputs) {
  const interaction = await executeHttpBinding(binding, inputs);
  const outputs = extractHttpOutputs(binding.outputs, interaction.response);

  return {
    ok: interaction.response.ok,
    description: `${binding.method} ${binding.url}`,
    summary: interaction.response.error?.type === "network"
      ? `network error (${interaction.response.error.message})`
      : `HTTP ${interaction.response.status}`,
    invocation: {
      request: interaction.request
    },
    response: {
      status: interaction.response.status,
      headers: interaction.response.headers,
      body: interaction.response.body
    },
    outputs
  };
}

async function executeNode(binding, inputs) {
  try {
    const interaction = await executeNodeBinding(binding, inputs);
    const outputs = extractNodeOutputs(binding.outputs, interaction.result);

    return {
      ok: true,
      description: `${binding.module} :: ${binding.function}`,
      summary: `${binding.module} :: ${binding.function}`,
      invocation: {
        module: interaction.module,
        function: interaction.function,
        inputs: interaction.inputs
      },
      response: {
        result: interaction.result
      },
      outputs
    };
  } catch (error) {
    return {
      ok: false,
      description: `${binding.module} :: ${binding.function}`,
      summary: error.message,
      invocation: {
        module: binding.module,
        function: binding.function,
        inputs
      },
      response: {
        error: error.message
      },
      outputs: {}
    };
  }
}

function extractHttpOutputs(outputDefinitions, response) {
  const outputs = {};

  if (!outputDefinitions) {
    return outputs;
  }

  for (const [outputName, definition] of Object.entries(outputDefinitions)) {
    switch (definition.from) {
      case "body": {
        const extracted = readPath(response.body, definition.path);
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

function extractNodeOutputs(outputDefinitions, result) {
  const outputs = {};

  if (!outputDefinitions) {
    return outputs;
  }

  for (const [outputName, definition] of Object.entries(outputDefinitions)) {
    if (definition.from !== "result") {
      continue;
    }

    const extracted = readPath(result, definition.path);

    if (extracted.found) {
      outputs[outputName] = extracted.value;
    }
  }

  return outputs;
}

function readPath(value, path) {
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
