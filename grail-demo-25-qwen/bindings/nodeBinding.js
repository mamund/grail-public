import path from "node:path";
import { pathToFileURL } from "node:url";

export async function executeNodeBinding(binding, inputs, baseDir = process.cwd()) {
  const modulePath = path.resolve(baseDir, binding.module);
  const moduleUrl = pathToFileURL(modulePath).href;

  const loaded = await import(moduleUrl);
  const fn = loaded[binding.function];

  if (typeof fn !== "function") {
    throw new Error(
      `Node binding function not found: ${binding.function} in ${binding.module}`
    );
  }

  const result = await fn(inputs);

  return {
    module: binding.module,
    function: binding.function,
    inputs,
    result
  };
}
