# GRAIL Demo 15: Porting HTTP Binding Locations to the Current Runtime

Demo 15 is a migration and regression test.

It takes the HTTP binding-location environment developed in Demo 13, ports its configuration to the declaration model introduced in Demo 14, and runs it using the unchanged Demo 14 runtime.

The purpose is simple:

> **Can an environment built for the earlier HTTP binding model be migrated to the current GRAIL model without changing the execution mechanics?**

The answer is yes.

## Background

Demo 13 introduced explicit placement of capability inputs into HTTP requests.

A binding can declare that an input belongs in the:

```text
path
query
header
body
```

It can also give the protocol-level parameter a name different from the GRAIL input name.

For example, the Demo 13 HTTP binding test maps four GRAIL inputs independently:

```json
"parameters": {
  "customerId": {
    "in": "path"
  },
  "region": {
    "in": "query",
    "name": "lang"
  },
  "termsVersion": {
    "in": "header",
    "name": "X-Test-Token"
  },
  "email": {
    "in": "body",
    "name": "emailAddress"
  }
}
```

This means:

```text
customerId     → URL path
region         → query parameter "lang"
termsVersion   → header "X-Test-Token"
email          → body property "emailAddress"
```

Demo 14 subsequently introduced a breaking change to the way capability inputs are declared.

Demo 15 brings those two pieces together.

## What changed

Demo 13 declared capability inputs as arrays:

```json
"inputs": [
  "customerId",
  "region",
  "termsVersion",
  "email"
]
```

Demo 14 changed capability inputs to mappings between a local input name and its source:

```json
"inputs": {
  "customerId": "$inputs.customerId",
  "region": "$inputs.region",
  "termsVersion": "$inputs.termsVersion",
  "email": "$inputs.email"
}
```

The general form is:

```text
inputs = {
  local-name: source-expression
}
```

Demo 15 ports all Demo 13 capability input declarations to this model.

For capabilities with no inputs:

```json
"inputs": []
```

becomes:

```json
"inputs": {}
```

No compatibility layer was added to the runtime.

The old array syntax remains invalid under the current schema and runtime model.

## What did not change

The important part of this experiment is what was left alone.

The HTTP binding declaration from Demo 13 remains intact.

For example:

```json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/binding-test/{customerId}",
  "parameters": {
    "customerId": {
      "in": "path"
    },
    "region": {
      "in": "query",
      "name": "lang"
    },
    "termsVersion": {
      "in": "header",
      "name": "X-Test-Token"
    },
    "email": {
      "in": "body",
      "name": "emailAddress"
    }
  }
}
```

The HTTP placement semantics were not redesigned or rewritten for Demo 15.

The migrated environment continues to exercise:

```text
path parameters
query parameters
headers
body properties
protocol-side parameter names
```

The goal and world-state model also remain the same in meaning.

## Runtime

Demo 15 uses the Demo 14 runtime.

That includes the current versions of components such as:

```text
run.js
client.js
server.js
worldState.js
httpBinding.js
observationStore.js
```

The runtime was not modified to accommodate the Demo 13 configuration.

Instead, the configuration was migrated to the runtime's current declaration model.

This distinction is the point of the demo.

```text
Demo 13 behavior
        +
migrated Demo 13 configuration
        +
Demo 14 schemas
        +
unchanged Demo 14 runtime
        ↓
successful execution
```

## Validation

Before running the environment, Demo 15 can be checked using the standalone validator introduced alongside Demo 14:

```bash
node grail-validate.js config
```

The migrated Demo 15 configuration passes the current schemas:

```text
GRAIL Environment Validator

registry.json       PASS
inputs.json         PASS
worldstate.json     PASS
goal.json           PASS

VALID
```

This separates two questions:

```text
Is the environment structurally valid?
              ↓
Can the environment execute successfully?
```

The validator answers the first question without requiring a GRAIL run.

## Running the demo

Validate the environment:

```bash
node grail-validate.js config
```

Then run the environment using the same HTTP stub and runtime process used by the preceding HTTP demos.

The goal remains:

```json
{
  "goal": "onboardCustomer"
}
```

GRAIL resolves the unmet conditions required for `onboardCustomer`, selecting and executing the available affordances until those conditions can be satisfied.

As part of that traversal, `testHttpBinding` exercises the HTTP input-placement behavior inherited from Demo 13.

## An informative migration failure

During the initial Demo 15 test, the migrated configuration was accidentally run with the older Demo 13 `server.js`.

Validation succeeded, but execution failed when the old runtime encountered the new input declaration:

```text
TypeError: affordance.inputs is not iterable
```

The older runtime expected:

```json
"inputs": [
  "customerId"
]
```

while the migrated environment correctly supplied:

```json
"inputs": {
  "customerId": "$inputs.customerId"
}
```

No change was made to the migrated configuration.

No compatibility patch was added to the old runtime.

The Demo 14 runtime files were installed as intended, and the environment then executed successfully.

This failure helped identify exactly where the breaking change introduced in Demo 14 resides:

```text
old declaration + old runtime       compatible

new declaration + old runtime       incompatible

new declaration + new runtime       compatible
```

Demo 15 therefore does not demonstrate backward runtime compatibility.

It demonstrates **configuration migration to the current runtime**.

## What this demo proves

Demo 15 demonstrates that the HTTP binding capabilities introduced before Demo 14 remain usable after the architectural changes introduced there.

The environment declaration needed to change.

The HTTP binding mechanics did not.

In particular, the Demo 13 behavior for:

```text
path placement
query placement
header placement
body placement
parameter renaming
```

continues to operate using the Demo 14 runtime.

This is useful evidence that the newer source-aware input model extends GRAIL's declaration model without invalidating the HTTP binding work that preceded it.

## Migration rather than compatibility

It is useful to be precise about what happened here.

Demo 15 is not a backward-compatibility layer.

The Demo 14 input declaration is intentionally a breaking change.

Instead:

```text
Demo 13 configuration
        ↓
migrate declarations
        ↓
validate against current schemas
        ↓
run on current runtime
```

This is a migration path.

The distinction allows the current runtime to remain simple rather than accumulating logic for every previous configuration representation.

## Architectural result

Demo 15 reinforces a useful separation in GRAIL:

```text
environment declaration
        ↓
execution mechanics
```

When the declaration model changes, an older environment can be migrated to the current representation without necessarily changing the mechanics that implement its capabilities.

In this case:

```text
HTTP behavior stayed the same
configuration representation changed
runtime stayed the same
```

That is the result Demo 15 was intended to test.

## Summary

Demo 13 established HTTP input placement.

Demo 14 introduced source-aware inputs, observations, output extraction, and learned-value resolution.

Demo 15 verifies that the earlier HTTP binding behavior can be carried forward by migrating the environment to the newer declaration model.

The result is:

> **Demo 13 behavior + Demo 14 model = Demo 15**

The configuration changed.

The HTTP semantics did not.

The current runtime required no special accommodation for the older environment.

