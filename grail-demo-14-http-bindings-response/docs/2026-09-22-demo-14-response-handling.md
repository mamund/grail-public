# GRAIL Demo 14 context

## Starting point

Demo 14 follows the HTTP binding work completed through Demo 13.

The progression is:

```text
Demo 11
External HTTP capability execution

Demo 12
Send GRAIL inputs to HTTP capabilities
JSON and FORM representations

Demo 13
Map inputs to HTTP locations
path | query | header | body
plus HTTP-side naming

Demo 14
Capture and use results from capability execution
```

Demo 13 established the outbound side of HTTP capability execution. Demo 14 should concentrate on what happens after an external capability responds.

## Existing GRAIL model

GRAIL describes an environment rather than a predefined workflow.

A capability declares:

```text
preconditions
inputs
effects
binding
```

The runtime attempts capabilities in pursuit of a goal. Missing preconditions lead it to capabilities capable of establishing those conditions.

Traversal may vary, while the mechanics of capability execution and state change remain deterministic.

Important existing principles include:

> Define the environment, not the path.

> Capabilities define behavior. Bindings define execution.

> A capability's effects define its success boundary.

## Current runtime configuration

The main runtime artifacts have distinct responsibilities.

### `registry.json`

Describes the environment:

* capabilities
* preconditions
* required inputs
* effects
* external bindings

### `inputs.json`

Contains immutable seed values established at the beginning of a run.

Values returned by capabilities should **not** be written into `inputs.json`.

### `worldstate.json`

Represents facts currently true in the GRAIL environment.

Returned HTTP data should not automatically become world state. Declared capability effects remain responsible for changing world state.

This distinction should be preserved:

```text
inputs
    values supplied at run start

world state
    facts currently true

observations
    what happened during execution
```

## HTTP bindings after Demo 13

HTTP bindings now support input placement in:

```text
path
query
header
body
```

The registry may also provide an HTTP-side `name`, creating indirection between the GRAIL vocabulary and the external API vocabulary.

Example:

```json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/customers/{customerId}",
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
      "name": "X-Terms-Version"
    },
    "email": {
      "in": "body",
      "name": "emailAddress"
    }
  }
}
```

The capability declares what inputs it requires. The HTTP binding determines how those values are represented externally.

Bindings without `parameters` retain the previous behavior of sending declared inputs in the request body.

The HTTP mechanics have been separated into an `httpBinding.js` module rather than continuing to accumulate HTTP-specific behavior in `server.js`.

## Demo 13 verification

The location-binding implementation was tested end-to-end using a temporary capability and stub endpoint.

The resulting request successfully demonstrated:

```text
GRAIL input      HTTP representation

customerId   →   path
region       →   query "lang"
termsVersion →   header "X-Test-Token"
email        →   body "emailAddress"
```

The capability stub received:

```text
POST /binding-test/customer-123?lang=en

X-Test-Token: 2026-07

{
  "emailAddress": "jordan@example.com"
}
```

The stub returned HTTP 200.

The temporary affordance and onboarding precondition used for this test were removed afterward. They may be useful later in a dedicated regression-test registry.

## Demo 14 problem

External capabilities now receive GRAIL inputs correctly.

The next problem is handling what those capabilities return.

Requirements identified so far:

1. Preserve HTTP responses so they can be inspected later.
2. Allow selected returned values to become inputs to subsequent capabilities.
3. Support capabilities being invoked more than once during a single run.
4. Preserve every invocation rather than overwriting previous results.
5. Keep `run`, `server`, and `client` generic.
6. Require no environment-specific programming in the runtime.
7. Keep HTTP-specific concerns in the HTTP binding layer where practical.

## Observation store

The proposed runtime mechanism is an **observation store**.

Each capability invocation produces one immutable observation.

Repeated invocation of the same capability therefore produces multiple observations.

Conceptually:

```text
run
 |
 +-- inv-001
 +-- inv-002
 +-- inv-003
 +-- inv-004
```

An observation should contain four major elements:

```text
Observation
 |
 +-- invocation
 |
 +-- response
 |
 +-- outputs
 |
 +-- result
```

### Invocation

Records the execution itself.

Likely contents include:

```json
"invocation": {
  "id": "inv-007",
  "affordance": "lookupCustomer",
  "timestamp": "...",
  "attempt": 2,
  "request": {
    "method": "GET",
    "url": "https://example.com/customers/123",
    "headers": {},
    "body": null
  }
}
```

The request should represent the **fully resolved HTTP request actually sent**, rather than the unresolved binding template.

This makes an observation useful for tracing and debugging.

Input provenance may eventually be useful, for example:

```json
"inputs": {
  "customerId": {
    "value": "123",
    "source": "$inputs.customerId"
  }
}
```

This was identified as a possible later addition, not a Demo 14 requirement yet.

### Response

Preserves what the external capability actually returned.

For HTTP:

```json
"response": {
  "status": 200,
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "id": "123",
    "account": {
      "id": "A97"
    }
  }
}
```

The response is evidence of the external interaction.

### Outputs

Contains named values extracted from the response for later GRAIL use.

Example:

```json
"outputs": {
  "customerId": "123",
  "accountId": "A97"
}
```

The registry should declaratively specify how these values are extracted from the external response.

The exact extraction syntax has **not yet been decided**.

This is one of the first Demo 14 design questions.

### Result

Records GRAIL's interpretation of the capability execution:

```json
"result": "SUCCESS"
```

Possible values remain:

```text
SUCCESS
BLOCKED
FAIL
```

The HTTP response and the GRAIL result are distinct concepts.

The current runtime largely treats HTTP 2xx as SUCCESS and other HTTP responses as FAIL. Richer interpretation may come later.

## Outputs are part of observations

A significant design decision from the discussion:

There probably should **not** be a second mutable output store.

Instead, outputs belong to the immutable observation that produced them.

For example:

```json
{
  "invocation": {
    "id": "inv-007",
    "affordance": "lookupCustomer"
  },
  "response": {
    "status": 200,
    "body": {
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

The observation is the authoritative record.

## `$outputs` as an addressing mechanism

`$outputs` is proposed as a convenient resolver namespace over the observation history, rather than as a separate data store.

For example:

```text
$outputs.lookupCustomer.latest.accountId
```

means:

> Find the most recent observation produced by `lookupCustomer` and return its declared `accountId` output.

If the capability executes several times:

```text
inv-007 lookupCustomer → accountId A97
inv-012 lookupCustomer → accountId B14
inv-019 lookupCustomer → accountId C22
```

then:

```text
$outputs.lookupCustomer.latest.accountId
```

would resolve to:

```text
C22
```

Potential addressing forms discussed include:

```text
$outputs.lookupCustomer.latest.accountId
$outputs.lookupCustomer.first.accountId
```

Individual observations should also have unique invocation IDs so they can be addressed unambiguously when necessary.

The exact addressing syntax and required selectors still need to be settled.

## Why immutable observations matter

Capabilities may execute repeatedly because of:

* repeated traversal;
* changing preconditions;
* alternative capability selection;
* retries;
* duplicate capability use;
* future runtime behavior.

Overwriting the previous result would destroy execution history.

One invocation should therefore always produce one new observation.

This gives GRAIL both history and data access without introducing mutable capability-result slots.

## Emerging runtime model

The run can now be viewed as containing:

```text
Run Context
 |
 +-- inputs
 |     immutable seed values
 |
 +-- worldState
 |     current environmental facts
 |
 +-- observations
       immutable execution history
```

`$outputs` is a resolver view into observations.

This produces a useful symmetry:

```text
$inputs.customerId
$outputs.lookupCustomer.latest.accountId
```

The first refers to information supplied before execution.

The second refers to information learned during execution.

## Observation store value beyond data passing

The observation mechanism appears likely to become the foundation for several GRAIL runtime capabilities:

```text
history
trace
debugging
data flow
replay
Workbench visualization
```

The same record can explain:

* which capability was selected;
* which invocation it was;
* what request was actually sent;
* what response was actually received;
* what useful values were extracted;
* what GRAIL concluded from the interaction.

This aligns well with the planned GRAIL Workbench scenario tracing and debugging ideas.

## Important architectural constraint

Demo 14 should preserve the generic runtime.

Avoid code such as:

```text
if capability == lookupCustomer:
    extract accountId
```

The registry should describe extraction and data relationships declaratively.

The runtime should understand generic mechanisms such as:

```text
invoke binding
capture response
extract declared outputs
record observation
resolve output references
```

It should have no knowledge of customer IDs, accounts, onboarding, or other environment-specific concepts.

## Likely Demo 14 execution pipeline

The emerging execution pipeline is:

```text
resolve capability inputs
        |
        v
construct HTTP request
        |
        v
execute HTTP request
        |
        v
capture request + response
        |
        v
extract declared outputs
        |
        v
create immutable observation
        |
        v
determine SUCCESS / BLOCKED / FAIL
        |
        v
apply declared effects
        |
        v
continue traversal
```

The ordering around result determination, observation creation, and effect application should be reviewed during implementation.

## Likely first design questions for Demo 14

Before coding, settle:

1. The exact observation JSON structure.
2. Where observations live during a run and whether/how they are persisted.
3. How the registry declares response output extraction.
4. The minimum extraction mechanism needed for Demo 14.
5. The `$outputs` addressing syntax.
6. How output resolution integrates with the existing input resolver.
7. What happens when an output cannot be found.
8. Whether outputs from FAIL or BLOCKED observations are addressable.
9. What `latest` means: latest invocation, latest successful invocation, or another rule.
10. What portion of HTTP request and response headers should be retained, especially credentials or other sensitive values.

The last point becomes important once observations are persisted as trace/debug artifacts.

## Suggested Demo 14 scope

Keep the first implementation narrow.

A useful initial target would be:

```text
Capability A
    |
    | HTTP call
    v
response body
    |
    | declarative extraction
    v
observation.outputs.foo
    |
    | $outputs.A.latest.foo
    v
Capability B input
```

Prove one returned JSON value can be captured, retained, and supplied to another capability without custom runtime code.

Once that works, repeated invocation can verify that observation history and `latest` selection behave correctly.

Avoid designing a general response transformation language at this stage. As with Demo 13 body mapping, introduce richer transformation only when concrete use cases require it.

## Working principle

A useful principle emerging from this design is:

> **Store what happened once. Provide different ways to address it.**

The observation is the authoritative execution record. History, tracing, debugging, and output resolution become different uses of that same record rather than separate runtime systems.

