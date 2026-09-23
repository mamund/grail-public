# GRAIL Demo 14: HTTP Response Observation and Output Consumption

Demo 14 extends GRAIL's HTTP binding so that information returned by a capability can be observed, recorded, extracted, and used as input to a later capability.

This is an important architectural step.

Earlier demos established that GRAIL could use HTTP to execute external capabilities. Demo 14 establishes that an HTTP interaction can also teach GRAIL something about its environment.

The basic progression is:

```text
initial input
    ↓
HTTP capability
    ↓
HTTP response
    ↓
observation
    ↓
output extraction
    ↓
later capability input
```

The sequence that results is an **execution trace, not an execution plan**.

## What this demo demonstrates

The goal for this demo is:

```json
{
  "goal": "lookupAccount"
}
```

The environment initially knows only a customer identifier:

```json
{
  "customerId": "customer-123"
}
```

The `lookupCustomer` capability uses that identifier to call an HTTP service:

```text
GET /customers/customer-123
```

The service returns:

```json
{
  "id": "customer-123",
  "name": "Jordan",
  "account": {
    "id": "A97"
  }
}
```

GRAIL records the interaction as an observation and extracts:

```text
accountId = A97
```

The `lookupAccount` capability can then obtain its required `accountId` from the observations produced during execution and call:

```text
GET /accounts/A97
```

No predefined workflow tells GRAIL to execute `lookupCustomer` and then `lookupAccount`.

The sequence emerges from the goal, current world state, capability requirements, and information learned during execution.

## Breaking change: capability inputs

Demo 14 changes the declaration of capability inputs.

Previous demos represented inputs as an array:

```json
"inputs": [
  "customerId"
]
```

Demo 14 represents inputs as an object:

```json
"inputs": {
  "customerId": "$inputs.customerId"
}
```

The general form is:

```text
inputs = {
  local-name: source-expression
}
```

This separates two ideas that had previously been implicit:

1. the name by which the capability knows the input
2. the source from which GRAIL obtains its value

For example:

```json
"inputs": {
  "accountId": "$outputs.lookupCustomer.latest.accountId"
}
```

Here:

```text
accountId
```

is the local capability input name, while:

```text
$outputs.lookupCustomer.latest.accountId
```

describes where GRAIL obtains the value.

This is an intentional breaking change. The runtime does not support both input declaration formats.

## `$inputs`

`$inputs` refers to values supplied when the GRAIL run begins.

For example:

```json
"inputs": {
  "customerId": "$inputs.customerId"
}
```

resolves `customerId` from `inputs.json`.

These values represent information known at the beginning of the run.

For this demo:

```json
{
  "customerId": "customer-123"
}
```

The initial input collection is treated as immutable during execution.

## Observations

Demo 14 introduces an observation collection.

Every completed capability interaction can produce an immutable observation describing what GRAIL attempted and what happened.

For example:

```json
{
  "invocation": {
    "id": "inv-001",
    "affordance": "lookupCustomer",
    "timestamp": "2026-09-23T16:38:27.302Z",
    "request": {
      "method": "GET",
      "url": "http://localhost:3001/customers/customer-123",
      "headers": {},
      "body": null
    }
  },
  "response": {
    "status": 200,
    "headers": {
      "content-type": "application/json"
    },
    "body": {
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

The four important parts are:

```text
invocation   what GRAIL attempted
response     what the binding returned
outputs      what GRAIL extracted
result       what GRAIL concluded
```

For this demo, observations are persisted in:

```text
observations.json
```

The file is reset at the beginning of each run.

The file itself should not be considered part of the GRAIL architecture. The important architectural concept is the **observation collection**. A future server or Workbench implementation could persist observations differently without changing the model.

## Output extraction

A capability can declare values that should be extracted from its response.

For example:

```json
"outputs": {
  "accountId": {
    "from": "body",
    "path": "account.id"
  }
}
```

This declaration appears inside the capability's binding.

For Demo 14:

* only `from: "body"` is supported
* `path` uses simple dot traversal
* numeric path segments can address array elements
* only explicitly declared outputs are extracted
* a missing path means the output is absent
* an actual JSON `null` value remains a legitimate value
* extraction may occur even when capability execution does not result in SUCCESS

The extracted value is stored as part of the observation.

It is not copied into `inputs.json` or `worldstate.json`.

## `$outputs`

`$outputs` provides a way to resolve information learned from previous observations.

Demo 14 supports:

```text
$outputs.<affordance>.latest.<output>
```

For example:

```text
$outputs.lookupCustomer.latest.accountId
```

means:

1. find observations produced by `lookupCustomer`
2. select the latest observation
3. look for `accountId` in that observation's extracted outputs

If there is no matching observation, the expression is unresolved.

If the latest matching observation does not contain the requested output, the expression is unresolved.

GRAIL does not walk backward through earlier observations looking for another value.

`latest` means the most recent invocation regardless of whether its result was SUCCESS, BLOCKED, or FAIL.

In practice, BLOCKED capabilities are not executed and therefore do not produce an HTTP response observation. The distinction becomes more important for FAIL: an attempted capability may fail while still returning information worth observing.

## `$outputs` is a view, not a second store

There is no separate mutable output database.

Conceptually:

```text
HTTP interaction
      ↓
 observation
      ↓
 extracted output
      ↓
$outputs resolver
      ↓
    value
```

`$outputs` is a resolver over observations.

This preserves provenance. A learned value remains associated with the interaction that produced it.

## Information model

Demo 14 makes four different kinds of information visible:

```text
$inputs        what was known when the run began
worldstate     what is currently true
observations   what actually happened
$outputs       what can be learned from what happened
```

These categories should not be collapsed.

For example:

```text
customerLoaded = true
```

is a proposition about the current environment and belongs in world state.

By contrast:

```text
accountId = "A97"
```

is information learned from an interaction. It belongs in an observation and can be accessed through `$outputs`.

Learning a value does not automatically make it world state.

## Capture and consumption are separate

Demo 14 deliberately separates capturing information from consuming it.

Capture:

```text
HTTP response
    ↓
extract
    ↓
observation
```

Consumption:

```text
capability input
    ↓
source expression
    ↓
$outputs
    ↓
observation lookup
    ↓
value
```

This separation is important.

A capability can produce useful observations without another capability necessarily consuming them.

Likewise, future resolution mechanisms can change without changing how observations are captured.

## Result semantics

GRAIL distinguishes three capability results:

```text
BLOCKED
SUCCESS
FAIL
```

Their timing matters.

### BLOCKED

BLOCKED is determined **before capability execution**.

It means GRAIL cannot currently execute the capability.

Possible reasons include unmet preconditions, unavailable required inputs, or another environmental requirement that prevents execution.

```text
BLOCKED = capability was not executed
```

### SUCCESS

SUCCESS is determined after capability execution.

For a bound capability, the external capability was invoked and the binding determined that execution succeeded.

For a capability with no binding, SUCCESS remains the default once its environmental requirements have been satisfied.

```text
SUCCESS = capability executed successfully
```

or, for an unbound capability:

```text
SUCCESS = environment requirements were satisfied
```

### FAIL

FAIL occurs after an attempted capability execution that does not succeed.

```text
FAIL = capability was executed but did not succeed
```

An HTTP error response therefore should not automatically be interpreted as BLOCKED. Once the HTTP capability has been invoked, the pre-execution BLOCKED decision point has already passed.

A failed interaction may still produce an observation and useful extracted information.

## HTTP remains an ordinary service

The HTTP services used by this demo do not need to understand GRAIL.

For example:

```text
GET /customers/customer-123
```

simply returns ordinary JSON.

The service does not need to know:

* GRAIL world-state names
* GRAIL preconditions
* which later capability may use its response
* how the response participates in goal resolution

The registry contains the composition knowledge.

This keeps the service reusable outside the GRAIL environment.

## Runtime artifacts

A Demo 14 run works with four conceptually distinct artifacts:

```text
registry.json       declared environment
inputs.json         immutable initial values
worldstate.json     current facts
observations.json   execution history/evidence
```

`observations.json` is generated during execution. It is not an environment configuration file.

## Environment validation

Demo 14 also introduces a standalone environment validator:

```text
grail-validate.js
```

Run it before executing the environment:

```bash
node grail-validate.js config
```

A successful validation looks like:

```text
GRAIL Environment Validator

registry.json       PASS
inputs.json         PASS
worldstate.json     PASS
goal.json           PASS

VALID
```

The command exits with status `0` when the environment is valid and status `1` when it is invalid.

For example, a schema error may produce:

```text
registry.json       FAIL
inputs.json         PASS
worldstate.json     PASS
goal.json           PASS

registry.json:
  /lookupCustomer/inputs
  must be object

INVALID
```

The validator checks:

```text
registry.json
inputs.json
worldstate.json
goal.json
```

It intentionally does not require `observations.json`, because observations are generated by runtime execution rather than supplied as part of the environment definition.

The validator uses the schemas installed in the repository's `schemas` directory. It contains no Demo 14-specific version logic.

This means the schemas remain the authority for the configuration model.

The normal GRAIL runtime continues to validate configuration and print validation errors as before. The standalone validator adds a separate validation step without changing normal execution behavior.

## Running the demo

Validate the environment first:

```bash
node grail-validate.js config
```

Then start the HTTP capability stub and run GRAIL using the same process used by the other HTTP demos.

The expected traversal is conceptually:

```text
lookupAccount
    ↓
BLOCKED: customerLoaded is false
    ↓
lookupCustomer
    ↓
GET /customers/customer-123
    ↓
accountId "A97" observed
    ↓
customerLoaded = true
    ↓
lookupAccount
    ↓
resolve accountId from observations
    ↓
GET /accounts/A97
    ↓
accountLoaded = true
    ↓
SUCCESS
```

Again, this is the resulting execution trace. It is not a workflow encoded in advance.

## What this demo proves

Demo 14 demonstrates that GRAIL can use an ordinary HTTP interaction not only to execute a capability, but also to acquire information from the environment, preserve evidence of that interaction, and use the acquired information to enable subsequent capability execution without encoding a predefined workflow.

The important progression is:

```text
execute
observe
learn
resolve
execute
```

The mechanics remain deterministic even though the decisions that determine which capability to attempt may use different selection policies.

## Deliberate compromises

Demo 14 intentionally keeps several mechanisms small.

### Only `latest`

The only supported observation selector is:

```text
latest
```

There is no history query language, successful-only selector, timestamp selector, or other observation-selection mechanism.

### Simple output paths

Output extraction uses simple dot-separated paths.

There is no JSONPath, transformation language, expression engine, or mapping language.

### Explicit producer coupling

This expression:

```text
$outputs.lookupCustomer.latest.accountId
```

explicitly names the capability that produced the value.

That gives Demo 14 deterministic resolution and clear provenance, but it also couples the consumer to a particular producer.

This becomes important as GRAIL gains alternate capabilities.

A future environment may know that a capability needs `accountId` without requiring that capability to know which producer supplies it.

That problem is intentionally not solved in this demo.

### Primitive observation persistence

The current observation collection is maintained in memory and persisted to a JSON file.

That is an implementation choice for the demo, not a requirement of the GRAIL model.

### Limited timing information

Observations currently contain a timestamp but do not capture richer timing information such as start time, completion time, or duration.

Execution time may eventually become useful to selection policies.

### No sensitive-data policy

HTTP requests and responses may contain information that should not be retained verbatim.

Redaction, filtering, retention, and other observation-security policies are outside the scope of this demo.

### Transport failures

The observation model is strongest when an HTTP response exists.

Failures where no response is available, such as some connection or transport failures, will need more explicit treatment in a later version.

### FAIL observations can contain information

A capability can fail and still return information that can be extracted.

Demo 14 preserves that possibility.

It does not yet define broader policies governing how information learned from failed executions should influence subsequent decisions.

## Architectural pressure exposed by this demo

Demo 14 reveals an important future design question.

Today a capability can say:

```text
I need accountId from the latest lookupCustomer observation.
```

A more autonomous model may instead allow it to say simply:

```text
I need accountId.
```

The environment could then determine:

```text
Is accountId available?
        ↓ no
Which capabilities can produce it?
        ↓
select producer
        ↓
attempt capability
        ↓
observe result
        ↓
resolve value
```

This begins to parallel GRAIL's existing treatment of conditions:

```text
Need condition             Need value
      ↓                         ↓
Is it satisfied?           Is it available?
      ↓ no                      ↓ no
find affordances           find producers
      ↓                         ↓
select                    select
      ↓                         ↓
attempt                   attempt
```

Producer selection would then become another explicit GRAIL decision point.

Possible future policies might select a producer based on recency, success, cost, elapsed time, external judgment, or other criteria.

That work belongs after Demo 14.

The important architectural rule is becoming clearer:

> **Keep the physics fixed. Make judgment configurable.**

## Summary

Demo 14 adds an important new capability to GRAIL:

**the environment can learn from execution.**

It introduces:

```text
source-aware capability inputs
HTTP response observation
declared output extraction
observation persistence
$outputs resolution
standalone environment validation
```

It also establishes a useful distinction among:

```text
what was supplied
what is true
what happened
what was learned
```

That distinction gives GRAIL a foundation for richer autonomous behavior without turning the registry into a predefined workflow.

The next demo tests whether the HTTP binding behavior developed before this architectural change can be migrated to the new declaration model and executed using the Demo 14 runtime.

