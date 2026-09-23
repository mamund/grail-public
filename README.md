# GRAIL: Goal Resolution through Affordance Informed Logic

GRAIL is an experimental model for goal-directed autonomous systems.

Instead of giving an agent a predefined workflow, GRAIL describes an
environment of capabilities, conditions, inputs, and effects. The agent
starts with a goal and discovers a path through that environment as it
attempts to achieve the goal.

**Define the environment, not the path.**

## What is GRAIL?

The basic GRAIL algorithm is small.

An agent pursues a goal by:

1. Attempting the capability associated with the goal.
2. Identifying unmet conditions when the capability is blocked.
3. Finding capabilities that can establish those conditions.
4. Pursuing those capabilities.
5. Retrying the original capability as conditions are satisfied.

Conceptually:

    goal
      |
      v
    attempt capability
      |
      +---- SUCCESS ----> done
      |
      +---- BLOCKED
               |
               v
        unmet condition
               |
               v
        find a capability
        that can establish it
               |
               v
             pursue
               |
               v
             retry

The agent does not need a predefined sequence of steps. The path emerges
from the goal, the current state of the world, and the capabilities
available in the environment.

## Start with demo 01

If you are new to GRAIL, start with:

`grail-demo-01`

This is the smallest working demonstration of the GRAIL goal-resolution
model.

The simplicity is intentional. It exposes the basic algorithm without
the additional features explored in later demos.

The original example demonstrates a goal that cannot initially be
completed because required conditions are missing. GRAIL recursively
pursues capabilities that can establish those conditions and retries the
goal as the world changes.

Later demos build on this same basic model.

## Define the environment, not the path

A conventional workflow describes a route:

    do A
    then B
    then C

GRAIL describes the environment in which a goal can be achieved.

A capability declares things such as:

    capability
      |
      +-- preconditions
      +-- inputs
      +-- effects

The environment may contain many capabilities and many possible ways to
establish the conditions required by a goal.

GRAIL traverses that capability space at runtime.

This shifts an important design question from:

> What steps should the agent follow?

to:

> What must be true for this capability to succeed?

When a required condition is identified, another question follows:

> What capability can make that condition true?

The environment grows outward from the goals it is expected to support.

## Stochastic traversal with deterministic results

A GRAIL environment does not necessarily contain a single path to a
goal.

Multiple capabilities may be able to establish the same condition.
GRAIL can choose among those alternatives as it traverses the
environment.

Different runs may therefore follow different paths.

The declared goal remains stable.

This is the idea behind:

**Stochastic Traversal with Deterministic Results**

The traversal may vary while successful traversals converge on the
declared goal state.

## Capabilities

A capability represents behavior available in the environment.

For example:

    setCustomerEmail
      precondition: customerProfileCollected
      input: email
      effect: customerEmailSet

Capabilities can also establish multiple effects:

    setCustomerContactDetails
      |
      +-- customerEmailSet
      +-- customerPhoneNumberSet
      +-- customerAddressSet

Fine-grained and coarse-grained capabilities can coexist in the same
environment.

GRAIL does not need to know whether a capability is a shortcut, a bundle
of operations, or a simple action. It needs to know the conditions under
which the capability can execute and the effects that successful
execution establishes.

**A capability's effects define its success boundary.**

If a capability declares several effects, SUCCESS means that all of
those effects have been established.

## Bindings

The original GRAIL demos execute capabilities locally.

More recent experiments separate the behavioral definition of a
capability from its implementation.

A capability may include a binding:

    capability
        |
        | behavior
        |
      binding
        |
        | execution
        v
    external service

The first implemented external binding uses HTTP.

This allows GRAIL to retain the behavioral model while capability work
is performed by an independent service.

**Capabilities define behavior. Bindings define execution.**

The external service does not need to understand the GRAIL traversal
algorithm.

## HTTP bindings

The current HTTP experiments support external capability execution using
bindings such as:

    {
      "protocol": "http",
      "method": "POST",
      "url": "http://localhost:3001/execute"
    }

Capability inputs may be mapped to four HTTP request locations:

    path
    query
    header
    body

Bindings declare these mappings using `parameters`:

    {
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

The parameter key identifies the GRAIL input. The optional `name`
identifies its HTTP representation. This allows the vocabulary used by the
GRAIL environment to remain independent of the vocabulary used by an
external service.

Body values may be represented using:

    application/json

or:

    application/x-www-form-urlencoded

JSON is the default when no content type is specified.

Bindings without an explicit `parameters` declaration retain the original
behavior and send declared capability inputs in the request body.

## Source-aware inputs

Demo 14 introduces a breaking change to capability input declarations.

Earlier demos declare inputs as an array:

    "inputs": [
      "customerId"
    ]

The current model maps each local input name to a source expression:

    "inputs": {
      "customerId": "$inputs.customerId"
    }

This separates the name used by the capability from the source of the value.

`$inputs` refers to values supplied at the beginning of a run.

Values learned during execution may be resolved from observations using
`$outputs`:

    "inputs": {
      "accountId": "$outputs.lookupCustomer.latest.accountId"
    }

The currently supported form is:

    $outputs.<affordance>.latest.<output>

This is an intentional breaking change. The current runtime does not support
both the older input-array form and the newer source-aware form.

## Observations and learned values

The current runtime can record completed capability interactions as
observations.

An observation records:

    invocation
    response
    outputs
    result

Conceptually:

    invocation   what GRAIL attempted
    response     what the binding returned
    outputs      what GRAIL extracted
    result       what GRAIL concluded

HTTP bindings may declare values to extract from a response:

    "outputs": {
      "accountId": {
        "from": "body",
        "path": "account.id"
      }
    }

Extracted values remain part of the observation that produced them. `$outputs`
is a resolver over observations, not a separate mutable output store.

This gives the current model four distinct kinds of information:

    $inputs        what was known when the run began
    worldstate     what is currently true
    observations   what actually happened
    $outputs       what can be learned from what happened

For the current demos, observations are persisted in `observations.json`.
That file is a runtime artifact rather than part of the environment
configuration.

## Result semantics

The current runtime distinguishes three results:

    BLOCKED
    SUCCESS
    FAIL

BLOCKED is determined before capability execution. It means the capability
could not currently be executed because an environmental requirement was not
satisfied.

SUCCESS and FAIL are determined after capability execution.

For an unbound capability, SUCCESS remains the default once its environmental
requirements have been satisfied.

For the current HTTP binding, HTTP 2xx responses result in SUCCESS and other
HTTP responses result in FAIL.

A failed interaction may still produce an observation and extracted
information.

## Environment validation

The repository includes a standalone environment validator:

    grail-validate.js

Use it before running an environment:

    node grail-validate.js config

It validates:

    registry.json
    inputs.json
    worldstate.json
    goal.json

against the schemas in the repository's `schemas` directory.

`observations.json` is intentionally not required because it is generated
during execution.

A successful validation exits with status `0`. Missing files, invalid JSON,
or schema failures result in status `1`.

The normal GRAIL runtime continues to perform its own configuration
validation. The standalone validator provides an independent static check
before execution.

## The demos

The repository records the evolution of GRAIL through a series of
working experiments.

The early demos establish the basic goal-resolution model and explore
different application scenarios.

Later demos introduce increasingly dynamic environments, including
multiple goals and randomized traversal.

Recent experiments focus on several areas:

### Random conditions

`grail-demo-09-random-conditions`

Explores traversal when the engine can select among unmet conditions
rather than following a fixed ordering.

### Multiple effects

`grail-demo-10-multi-effects`

Explores capabilities that establish multiple effects and environments
where more than one capability can satisfy a condition.

### External HTTP bindings

`grail-demo-11-initial-http-bindings`

Moves capability execution outside the GRAIL process through HTTP while
retaining GRAIL's declared preconditions and effects.

### HTTP binding inputs

`grail-demo-12-http-bindings-inputs`

Adds transmission of capability inputs to external HTTP services using
JSON and FORM representations.

### HTTP binding locations

`grail-demo-13-http-binding-locations`

Extends HTTP bindings by allowing capability inputs to be mapped to path,
query, header, or body locations. Bindings may also assign HTTP-side names
to inputs, allowing the GRAIL environment and external service to use
different vocabularies.

### HTTP response observations and outputs

`grail-demo-14-http-response-observations`

Introduces source-aware capability inputs, records HTTP interactions as
observations, extracts declared values from responses, and allows later
capabilities to consume learned values through `$outputs`.

This demo introduces a breaking change from input arrays to mappings between
local input names and source expressions.

### HTTP binding migration

`grail-demo-15-http-bindings-location-bc`

Ports the Demo 13 HTTP binding-location environment to the Demo 14 declaration
model and runs it using the Demo 14 runtime.

This verifies that path, query, header, body, and HTTP-side naming behavior
survive the migration without adding a backward-compatibility layer to the
runtime.

Each experiment builds on the same small GRAIL goal-resolution model.

## Current architecture

The current experiments can be viewed as three cooperating elements:

    GRAIL environment

        goal
          |
          v
      capability
       /   |   \
      /    |    \
    pre-  inputs effects
    conditions
          |
       binding
          |
          v
    implementation

The environment describes what capabilities mean and how they relate to
world state.

Bindings describe how capability implementations are reached.

Implementations perform the work.

This separation allows a GRAIL environment to compose capabilities
without requiring all implementations to share the same internal
architecture.

## Current boundaries

GRAIL is still experimental.

The current HTTP binding treats HTTP 2xx responses as SUCCESS and other
HTTP responses as FAIL.

Response output extraction currently supports `from: "body"` with simple
dot-separated paths. `$outputs` currently supports only the `latest`
observation selector.

The current `$outputs.<affordance>.latest.<output>` form explicitly couples
a consumer to a particular producer. Future experiments may explore
producer selection as a separate decision point.

Other areas for future experiments include:

- richer observation selection and extraction;
- richer FAIL semantics and the use of information learned from failed calls;
- alternate capability selection after BLOCKED or FAIL;
- observation timing, retention, and redaction policies;
- additional binding protocols.

These are intentionally being introduced through small experiments
rather than designed into GRAIL in advance.

## Running the demos

Each demo is self-contained. See the README and notes within an
individual demo for its requirements and instructions.

For the simplest introduction to the algorithm, begin with:

    grail-demo-01

For the most recent binding experiments, see:

    grail-demo-10-multi-effects
    grail-demo-11-initial-http-bindings
    grail-demo-12-http-bindings-inputs
    grail-demo-13-http-binding-locations
    grail-demo-14-http-response-observations
    grail-demo-15-http-bindings-location-bc

## Key principles

The experiments have produced a small set of principles that describe
the direction of GRAIL:

**Define the environment, not the path.**

**Stochastic Traversal with Deterministic Results.**

**A capability's effects define its success boundary.**

**Capabilities define behavior. Bindings define execution.**

**Keep the physics fixed. Make judgment configurable.**

GRAIL remains intentionally small. The complexity belongs primarily in
the environment: the capabilities available, the conditions they
require, and the effects they can establish.

The agent's job is to traverse that environment in pursuit of a goal.
