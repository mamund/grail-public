# Demo 17: Node Module Bindings

Demo 17 demonstrates that GRAIL capabilities can be realized as dynamically loaded Node.js modules while preserving the same GRAIL mechanics previously used with HTTP capabilities.

The experiment introduces a Node binding alongside the existing HTTP binding and establishes a common binding layer between the GRAIL runtime and capability execution.

## Goal

The goal of this experiment was to answer a narrow question:

> Can GRAIL execute capabilities as dynamically loaded Node modules without changing its goal-pursuit mechanics?

Demo 17 demonstrates that it can.

The same environment mechanics used for HTTP capabilities continue to apply:

* evaluate preconditions
* resolve inputs
* select available affordances
* execute a binding
* observe the result
* extract outputs
* apply effects
* continue pursuing the goal

Only the realization of the capability changes.

## Scenario

The experiment uses two capabilities:

```text
lookupCustomer
lookupAccount
```

The goal is:

```json
{
  "goal": "lookupAccount"
}
```

Initially, `lookupAccount` cannot execute because its `customerLoaded` precondition is not satisfied.

GRAIL discovers that `lookupCustomer` can establish that condition and executes it.

The resulting traversal is:

```text
lookupAccount
    ↓
BLOCKED: customerLoaded
    ↓
lookupCustomer
    ↓
Node module execution
    ↓
customerLoaded
accountId = A97
    ↓
lookupAccount
    ↓
Node module execution
    ↓
accountLoaded
    ↓
SUCCESS
```

This sequence is an execution trace, not an execution plan.

## Node capabilities

The capabilities are ordinary JavaScript modules.

For example:

```js
export async function lookupCustomer(inputs) {
  return {
    id: inputs.customerId,
    name: "Jordan",
    account: {
      id: "A97"
    }
  };
}
```

The account capability follows the same pattern:

```js
export async function lookupAccount(inputs) {
  return {
    id: inputs.accountId,
    status: "active"
  };
}
```

The capability modules know nothing about GRAIL.

Their contract is simply:

```text
inputs object
    ↓
function
    ↓
returned result
```

There is no GRAIL API, world state, observation store, HTTP request, or GRAIL result code inside the capability.

This separation means the same application logic could later be invoked through another mechanism, such as HTTP, without rewriting the capability itself.

## Node binding declaration

A Node capability is declared in the registry using a Node binding:

```json
{
  "protocol": "node",
  "module": "./capabilities/customer.js",
  "function": "lookupCustomer",
  "outputs": {
    "accountId": {
      "from": "result",
      "path": "account.id"
    }
  }
}
```

The binding identifies:

* the binding protocol
* the module containing the capability
* the exported function to invoke
* any values GRAIL should extract from the returned result

The `accountId` output is extracted from:

```text
result.account.id
```

producing:

```json
{
  "accountId": "A97"
}
```

## Dynamic module loading

The Node binding dynamically loads the declared module and locates the named exported function.

Conceptually:

```text
binding declaration
    ↓
resolve module
    ↓
dynamic import
    ↓
locate exported function
    ↓
invoke with resolved inputs
    ↓
receive result
```

The module does not need to be registered in GRAIL code ahead of time.

Its location and function name are properties of the environment declaration.

## Binding architecture

Demo 17 introduces an explicit binding layer:

```text
GRAIL mechanics
      ↓
bindings/binding.js
      ↓
 ┌────┴────┐
 ↓         ↓
HTTP      Node
 ↓         ↓
service   module
```

The binding files are organized as:

```text
bindings/
    binding.js
    httpBinding.js
    nodeBinding.js
```

`binding.js` dispatches execution according to the declared protocol.

The HTTP and Node binding implementations contain the mechanics specific to their respective execution environments.

The generic GRAIL server does not need to know how either protocol works.

This establishes an important architectural boundary:

> An affordance describes what the environment makes possible. A binding describes how that possibility is realized.

## Inputs

Capability inputs remain source-aware.

For example:

```json
{
  "customerId": "$inputs.customerId"
}
```

means that `customerId` is known when the run begins.

The second capability uses information learned during execution:

```json
{
  "accountId": "$outputs.lookupCustomer.latest.accountId"
}
```

The source of the value is independent of how the producing capability was executed.

The same `$outputs` mechanism previously demonstrated with HTTP works unchanged with Node modules.

## Outputs

Output interpretation belongs to the binding.

For HTTP, an output may come from:

```text
body
header
status
```

For Node, an output may come from:

```text
result
```

For example:

```json
{
  "accountId": {
    "from": "result",
    "path": "account.id"
  }
}
```

The Node binding understands what `result` means.

GRAIL sees only the named output:

```json
{
  "accountId": "A97"
}
```

This keeps protocol-specific interpretation outside the generic GRAIL mechanics.

## Observations

Node executions are recorded in the same observation collection used by HTTP executions.

An example observation is:

```json
{
  "invocation": {
    "id": "inv-001",
    "affordance": "lookupCustomer",
    "timestamp": "2026-09-24T00:30:44.714Z",
    "module": "./capabilities/customer.js",
    "function": "lookupCustomer",
    "inputs": {
      "customerId": "customer-123"
    }
  },
  "response": {
    "result": {
      "id": "customer-123",
      "name": "Jordan",
      "account": {
        "id": "A97"
      }
    }
  },
  "outputs": {
    "accountId": "A97"
  },
  "result": "SUCCESS"
}
```

This preserves the distinction between:

```text
invocation    what GRAIL attempted
response      what the binding produced
outputs       what GRAIL extracted
result        what GRAIL concluded
```

The experiment also exposed a vocabulary issue.

`response` is natural for HTTP but less natural for a Node function invocation. This suggests that a future observation model may use more binding-neutral terminology such as `outcome`.

Demo 17 does not attempt to solve that problem. The current observation structure is sufficient for the experiment and provides concrete evidence for a future revision.

## Result semantics

Demo 17 preserves the existing GRAIL result semantics.

```text
BLOCKED
    capability was not executed

SUCCESS
    capability executed successfully
    or an unbound capability passed its environment checks

FAIL
    capability was executed but did not succeed
```

For a Node binding, a successful function invocation produces `SUCCESS`.

A module-loading failure, missing exported function, thrown exception, or rejected promise produces `FAIL`.

A Node capability cannot return `BLOCKED` as a way of controlling GRAIL traversal. `BLOCKED` is determined by GRAIL before capability execution.

## Successful run

A successful Demo 17 run produces a trace similar to:

```text
[CLIENT] Starting pursuit: lookupAccount

[SERVER] Attempting affordance: lookupAccount
[SERVER] Blocked: selected unmet precondition: customerLoaded
[CLIENT] Pushing next affordance: lookupCustomer

[SERVER] Attempting affordance: lookupCustomer
[SERVER] Executing binding: ./capabilities/customer.js :: lookupCustomer
[SERVER] Binding succeeded: ./capabilities/customer.js :: lookupCustomer
[SERVER] Success: applying effects - customerLoaded
[CLIENT] Affordance succeeded: lookupCustomer

[SERVER] Attempting affordance: lookupAccount
[SERVER] Executing binding: ./capabilities/account.js :: lookupAccount
[SERVER] Binding succeeded: ./capabilities/account.js :: lookupAccount
[SERVER] Success: applying effects - accountLoaded
[CLIENT] Affordance succeeded: lookupAccount
```

The traversal is effectively identical to the corresponding HTTP experiment.

Only the capability realization has changed.

## What Demo 17 proves

Demo 17 demonstrates that:

* GRAIL can dynamically load Node.js capability modules.
* Capabilities can be selected by module and exported function name.
* Resolved GRAIL inputs can be passed directly to Node capabilities.
* Returned Node values can be observed and preserved.
* Declared outputs can be extracted from Node results.
* Extracted outputs can be consumed by later capabilities through `$outputs`.
* Existing precondition, effect, and goal-pursuit mechanics remain unchanged.
* HTTP and Node execution can exist behind a common binding boundary.
* Capability implementation does not need to know anything about GRAIL.
* GRAIL mechanics do not depend on HTTP.

The central result is:

> The GRAIL traversal model is independent of the mechanism used to realize a capability.

## Architecture

The experiment leaves the runtime with a relatively small structure:

```text
GRAIL mechanics
    server.js
    client.js
    worldState.js
    observationStore.js

bindings/
    binding.js
    httpBinding.js
    nodeBinding.js

capabilities/
    customer.js
    account.js

utils/
    loadJSON.js
    validateWithSchema.js

config/
    goal.json
    inputs.json
    worldstate.json
    registry.json
    observations.json

schemas/
    goal.schema.json
    inputs.schema.json
    worldstate.schema.json
    registry.schema.json
    observations.schema.json
```

Bindings are intentionally separate from `utils`.

Utilities support the implementation.

Bindings are part of the GRAIL architecture.

## Design principle

Demo 17 reinforces the separation between GRAIL mechanics and the mechanisms used to realize capabilities.

The environment determines what is possible.

Selection determines which eligible capability to attempt.

The binding determines how the selected capability is executed.

GRAIL mechanics determine how the resulting information, effects, and evidence are handled.

This preserves a core design principle:

> **Keep the physics fixed. Make judgment configurable.**

## Status

**Demo 17: Node module binding — PASS**

The experiment is complete.

A larger Node-based environment can now build on this working baseline without changing the fundamental GRAIL execution model.

