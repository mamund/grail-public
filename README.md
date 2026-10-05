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

1.  Resolving the desired goal condition to a capability that can
    establish it.
2.  Attempting that capability.
3.  Identifying unmet conditions when the capability is blocked.
4.  Finding capabilities that can establish those conditions.
5.  Pursuing those capabilities.
6.  Retrying unresolved capabilities as conditions are satisfied.
7.  Excluding capabilities that fail during the current pursuit and
    selecting among the remaining viable producers.
8.  Continuing until the goal condition is satisfied or a required
    condition can no longer be resolved.

Conceptually:

    goal condition
      |
      v
    find a capability
    that can establish it
      |
      v
    attempt capability
      |
      +---- SUCCESS ----> apply effects
      |                       |
      |                       v
      |                  goal satisfied?
      |                    /       \
      |                  yes       no
      |                   |         |
      |                  done     continue
      |
      +---- BLOCKED ----> unmet condition
      |                       |
      |                       v
      |                 find a capability
      |                 that can establish it
      |                       |
      |                       v
      |                     pursue
      |
      +---- FAIL -------> exclude failed capability
                              |
                              v
                        condition still false
                              |
                              v
                        select another viable
                        producer if available

The agent does not need a predefined sequence of steps. The path emerges
from the goal, the current state of the world, the capabilities
available in the environment, and what has happened during the current
pursuit.

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

Multiple capabilities may be able to establish the same condition. GRAIL
can choose among those alternatives as it traverses the environment.

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

The first implemented external binding uses HTTP. Later experiments
added dynamically loaded Node.js modules. Demo 24 adds stdio bindings
for local processes.

This allows GRAIL to retain the behavioral model while capability work
is performed by an independent service, a local JavaScript module, or
a language-independent local process.

**Capabilities define behavior. Bindings define execution.**

The capability implementation does not need to understand the GRAIL
traversal algorithm.

## Enabled affordances and bindings

Affordances and bindings may optionally declare an `enabled` property.

An affordance with `enabled: false` is unavailable to discovery. A
binding with `enabled: false` is not executed; the affordance follows
the normal unbound behavior and succeeds once its preconditions are
satisfied, applying its declared effects.

When `enabled` is omitted, both affordances and bindings are enabled.
This preserves compatibility with existing registry documents.

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
identifies its HTTP representation. This allows the vocabulary used by
the GRAIL environment to remain independent of the vocabulary used by an
external service.

Body values may be represented using:

    application/json

or:

    application/x-www-form-urlencoded

JSON is the default when no content type is specified.

Bindings without an explicit `parameters` declaration retain the
original behavior and send declared capability inputs in the request
body.

## Node bindings

Node bindings allow GRAIL to execute ordinary JavaScript modules
directly.

A binding identifies the module and exported function:

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

The capability receives the resolved GRAIL inputs as an object and
returns a result. The capability itself does not need to know anything
about GRAIL.

Node outputs may be extracted from the returned `result` using simple
dot-separated paths.

Output mappings also provide an anti-corruption layer between capability
implementations and the GRAIL environment. A capability may use its own
result structure and vocabulary while the binding maps those values to
stable output names used by the GRAIL scenario.

## stdio bindings

Demo 24 adds stdio as a third binding protocol.

A stdio binding identifies a local command and optional arguments:

    {
      "protocol": "stdio",
      "command": "python3",
      "args": [
        "../stdio-greet/capabilities/greet.py"
      ],
      "outputs": {
        "message": {
          "from": "stdout",
          "path": "message"
        }
      }
    }

GRAIL serializes the resolved affordance inputs as a JSON object and
writes them to the process on stdin.

A successful stdio interaction requires the process to exit with code
`0` and return valid JSON on stdout. A non-zero exit code or malformed
stdout results in FAIL.

stderr is retained as diagnostic information. Observations also retain
the process exit code, stdout, and any binding error so that detailed
execution evidence remains available without expanding the GRAIL
SUCCESS/FAIL contract.

Declared outputs are extracted from parsed stdout using simple
dot-separated paths. If the process succeeds and returns valid JSON but
a declared output is absent, the affordance still succeeds and that
output is simply not captured.

This is intentional. Outputs are captured data, not postconditions.
The capability remains responsible for determining whether its domain
work succeeded.

The stdio contract provides a language-independent local capability
boundary. Any implementation that can read JSON from stdin, write JSON
to stdout, and communicate success or failure through its process exit
code can participate in a GRAIL environment.

HTTP, Node, and stdio execution are routed through a common binding layer:

    GRAIL mechanics
          |
          v
       binding
      /   |   \
   HTTP  Node  stdio

This keeps protocol-specific execution outside the generic GRAIL
mechanics.

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

This separates the name used by the capability from the source of the
value.

`$inputs` refers to values supplied at the beginning of a run.

Values learned during execution may be resolved from observations using
`$outputs`:

    "inputs": {
      "accountId": "$outputs.lookupCustomer.latest.accountId"
    }

Two forms are currently supported:

    $outputs.<affordance>.latest.<output>
    $outputs.latest.<output>

The affordance-scoped form resolves the latest matching output produced
by a specific affordance. The scenario-scoped form searches observations
from newest to oldest and resolves the latest matching output regardless
of which affordance produced it.

Scenario-scoped resolution is useful when multiple affordances can
produce equivalent information. It allows a consumer to depend on the
GRAIL output vocabulary without being coupled to a particular producer.
Use the affordance-scoped form when the identity of the producer is
semantically important.

This is an intentional breaking change. The current runtime does not
support both the older input-array form and the newer source-aware form.

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

Bindings may declare values to extract from their execution results.

For HTTP:

    "outputs": {
      "accountId": {
        "from": "body",
        "path": "account.id"
      }
    }

Node bindings use `from: "result"` to extract values from the value
returned by a module.

stdio bindings use `from: "stdout"` to extract values from the parsed
JSON object returned by a local process.

Extracted values remain part of the observation that produced them.
`$outputs` is a resolver over observations, not a separate mutable
output store.

The current observation vocabulary still uses `response`, which is
natural for HTTP but less natural for Node execution. Demo 17 records
this as an observed design pressure rather than introducing a new
generic observation model.

This gives the current model four distinct kinds of information:

    $inputs        what was known when the run began
    worldstate     what is currently true
    observations   what actually happened
    $outputs       what can be learned from what happened

For the current demos, observations are persisted in
`observations.json`. That file is a runtime artifact rather than part of
the environment configuration.

## Result semantics

The current runtime distinguishes three results:

    BLOCKED
    SUCCESS
    FAIL

BLOCKED is determined before capability execution. It means the
capability could not currently be executed because an environmental
requirement was not satisfied.

SUCCESS and FAIL are determined after capability execution.

For an unbound capability, SUCCESS remains the default once its
environmental requirements have been satisfied.

For the current HTTP binding, HTTP 2xx responses result in SUCCESS and
other HTTP responses result in FAIL.

For stdio, exit code `0` plus valid JSON stdout results in SUCCESS.
A non-zero exit code or invalid JSON stdout results in FAIL. Missing
declared outputs do not by themselves change a successful execution
into FAIL.

A failed interaction may still produce an observation and diagnostic
information.

A capability-level FAIL does not necessarily end the pursuit. During the
current pursuit, a failed affordance is excluded from later selection.
If another enabled affordance can establish the still-unresolved
condition, GRAIL may select that producer and continue.

If a required condition remains false and no viable producer remains,
GRAIL can conclude that the condition is unresolvable. This is a
pursuit-level conclusion, not a fourth capability execution result.

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

`observations.json` is intentionally not required because it is
generated during execution.

A successful validation exits with status `0`. Missing files, invalid
JSON, or schema failures result in status `1`.

The normal GRAIL runtime continues to perform its own configuration
validation. The standalone validator provides an independent static
check before execution.

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

Extends HTTP bindings by allowing capability inputs to be mapped to
path, query, header, or body locations. Bindings may also assign
HTTP-side names to inputs, allowing the GRAIL environment and external
service to use different vocabularies.

### HTTP response observations and outputs

`grail-demo-14-http-response-observations`

Introduces source-aware capability inputs, records HTTP interactions as
observations, extracts declared values from responses, and allows later
capabilities to consume learned values through `$outputs`.

This demo introduces a breaking change from input arrays to mappings
between local input names and source expressions.

### HTTP binding migration

`grail-demo-15-http-bindings-location-bc`

Ports the Demo 13 HTTP binding-location environment to the Demo 14
declaration model and runs it using the Demo 14 runtime.

This verifies that path, query, header, body, and HTTP-side naming
behavior survive the migration without adding a backward-compatibility
layer to the runtime.

### HTTP output sources

`grail-demo-16-http-output-sources`

Extends HTTP output extraction beyond response bodies. Declared outputs
may be captured from the response body, a response header, or the HTTP
status code.

Body outputs use `from: "body"` and a dot-separated `path`. Header
outputs use `from: "header"` and a case-insensitive header `name`.
Status outputs use `from: "status"`.

This demo also reinforces the separation between capture and
consumption: GRAIL may observe and preserve information even when no
later capability currently consumes it.

### Node module bindings

`grail-demo-17-node-module-bindings`

Adds dynamically loaded Node.js modules as a second capability
realization mechanism alongside HTTP.

A Node binding declares a module and exported function. Resolved GRAIL
inputs are passed to that function, and declared outputs may be
extracted from the returned result using `from: "result"`.

Demo 17 introduces a common binding layer so the generic GRAIL mechanics
do not need to know whether a capability is realized through HTTP or a
local Node module.

The experiment demonstrates that the same precondition,
input-resolution, observation, output, effect, and goal-pursuit
mechanics work across both binding types.

### Customer onboarding with Node bindings

`grail-demo-18-node-customer-onboarding`

Extends the Node binding model to a complete customer-onboarding
application composed of multiple independent capabilities sharing
application state.

The demo begins with the single goal `onboardCustomer`. GRAIL discovers
the capabilities needed to satisfy its unmet conditions at runtime
rather than following a predefined onboarding workflow.

Initial values such as customer name, email, phone, address, and terms
version are supplied through `$inputs`. Values learned during execution,
including `onboardingId`, `customerId`, and verification identifiers,
are captured from Node capability results and consumed by later
capabilities through `$outputs`.

The experiment demonstrates multi-step information flow across Node
bindings, capabilities that establish effects without producing output
values, multiple effects from a single affordance, scenario-scoped
output resolution, and repeated goal re-evaluation as the environment
changes.

The scenario includes both fine-grained setters and a coarse-grained
`setCustomerDetails` affordance. Either can produce the verification
identifiers needed by later verification affordances. Those consumers
use `$outputs.latest.<output>` so they depend on the learned value
rather than on a specific producer.

The customer-onboarding application maintains its own application state
independently of GRAIL's world state. The experiment also exposed an
important contract boundary: a capability that reports SUCCESS must
actually establish the effects associated with that success in the GRAIL
environment.

Demo 18 demonstrates that the richer customer-onboarding scenario
requires no changes to the generic GRAIL traversal mechanics.

During development of Demo 18, optional `enabled` properties were added
for affordances and bindings. These allow an affordance to be removed
from discovery or a binding to be bypassed without changing existing
registry behavior when the property is omitted.

### Customer onboarding with HTTP bindings

`grail-demo-19-http-customer-onboarding`

Ports the Demo 18 customer-onboarding environment from Node bindings to
HTTP while preserving the same goal, conditions, preconditions, effects,
inputs, outputs, and application semantics.

The HTTP layer is a thin adapter over the same application capability
modules used by the Node version. Both invocation mechanisms therefore
operate against the same application implementation and shared
application state.

Repeated randomized runs exposed an important capability-design
requirement: a capability must behave correctly for the state it
encounters rather than for an assumed execution sequence. In particular,
`setCustomerDetails` was corrected to preserve existing email and phone
verification when the underlying values had not changed.

Demo 19 demonstrates that the same GRAIL environment can be realized
through HTTP without changing the generic traversal mechanics, while
also showing how varying traversal can expose hidden sequencing
assumptions inside capability implementations.

### Customer onboarding with mixed bindings

`grail-demo-20-mixed-customer-onboarding`

Combines Node-bound and HTTP-bound capabilities within the same
customer-onboarding pursuit.

The registry deliberately assigns different capabilities to different
binding protocols. Outputs produced through Node are consumed through
HTTP and vice versa, while both invocation mechanisms operate against
the same application state.

Across repeated randomized runs, GRAIL crosses binding boundaries
without the client, server, or scenario encoding those transitions.

Demo 20 establishes that capabilities participating in one GRAIL
environment do not need to share an invocation protocol.

The binding determines how an affordance reaches its implementation. It
does not determine how that affordance participates in the environment.

### Alternative affordances across Node and HTTP bindings

`grail-demo-21-alternative-bindings`

Extends Demo 20 by making equivalent Node-bound and HTTP-bound
affordances available simultaneously.

The supporting capabilities are represented as nine semantic pairs. Each
pair contains a Node-bound affordance and an HTTP-bound affordance with
equivalent preconditions and effects. GRAIL continues to select
affordances according to the conditions they can establish; the selected
affordance then executes through its declared binding.

Demo 21 does not introduce a binding-selection mechanism. Binding
diversity emerges from ordinary affordance selection.

Scenario-scoped output resolution allows downstream capabilities to
consume learned values without knowing which alternative affordance
produced them or which binding protocol was used.

The registry was exercised across 25 repeated pursuits. All 25 completed
successfully, all 18 supporting alternatives were selected at least
once, and the 25 runs produced 25 distinct executed-affordance
traversals.

The experiment demonstrates that:

**GRAIL selects capabilities based on what they can accomplish,
independent of how they are bound.**

It also reinforces a broader capability-design principle:

**Depend on state, not traversal history.**

**The goal persists independently of the affordance selected to achieve
it.**

**The goal controls the lifetime of the pursuit. The stack controls the
work currently being attempted.**

### Condition-based goals

`grail-demo-22-condition-based-goals`

Demo 22 changes how a pursuit begins. Earlier demos use `goal.json` to
name the affordance that should ultimately execute. Demo 22 instead uses
`goal.json` to name the world-state condition that should become true.

This is an intentional breaking semantic change to the goal declaration.

Earlier demos declare:

``` json
{
  "goal": "onboardCustomer"
}
```

Demo 22 declares:

``` json
{
  "goal": "customerOnboarded"
}
```

The runtime resolves `customerOnboarded` by finding enabled affordances
whose effects can establish that condition and selecting one before
handing the selected affordance to the existing pursuit machinery.

The registry exposes both `onboardCustomerNode` and
`onboardCustomerHttp` as producers of `customerOnboarded`. Across 25
repeated pursuits, all 25 completed successfully; the Node goal producer
was selected 12 times and the HTTP goal producer 13 times.

No change was required to the existing `client.pursue()` traversal
mechanics. The same producer-selection idea already used for unmet
preconditions is now also used to resolve the initial goal.

The experiment demonstrates a potentially more uniform goal model:

**The goal specifies what should become true. GRAIL selects an
affordance capable of making it true.**

Demo 22 remains an experiment. Whether condition-based goals become the
standard GRAIL goal semantics is an architectural decision to be made
before beta.

### Surviving affordance failure

`grail-demo-23-survive-fail`

Demo 23 extends condition-based goals by allowing a pursuit to continue
when a selected affordance fails but another viable affordance can
establish the same required condition.

Failed affordances are recorded in the observation history and excluded
from later selection during the current pursuit. The runtime then
selects among the remaining producers of the unresolved condition. No
fallback chains, retry routes, or protocol-specific recovery
relationships are declared in the registry.

The experiment also exposed an important consequence of condition-based
goals. The goal must persist independently of the particular affordance
selected to achieve it. Demo 23 therefore changes the client to pursue
the goal condition itself. When the stack becomes empty, the goal is
re-evaluated rather than treating an empty stack as completion.

This allows recovery even when the selected goal producer fails. With
the HTTP service unavailable, 25 randomized pursuits all reached
`customerOnboarded`. Twelve initially selected `onboardCustomerHttp`;
each recovered from that root failure by later selecting
`onboardCustomerNode`.

A second experiment disabled the remaining Node producer for
`customerEmailVerified`. After the HTTP producer failed, no viable
producer remained and GRAIL stopped with that condition identified as
unresolvable.

The experiment demonstrates:

**An affordance can fail while the pursuit continues. The pursuit stops
only when the goal is satisfied or a required condition can no longer be
resolved.**

It also establishes a stronger separation between pursuit and temporary
work:

**The goal controls the lifetime of the pursuit. The stack controls the
work currently being attempted.**

### Local process bindings with stdio

`grail-demo-24-stdio-binding`

Demo 24 adds stdio as a third capability execution mechanism alongside
HTTP and Node.

The binding launches a local process, serializes resolved affordance
inputs as JSON on stdin, and expects JSON on stdout. Declared outputs
may be extracted from the returned object using `from: "stdout"`.

The experiment exercises successful execution, non-zero process exits,
a missing capability file, malformed stdout with exit code `0`, and a
successful capability that omits a declared output.

The failure experiments also improve stdio observations. When a process
runs, GRAIL retains the exit code, stdout, stderr, and any binding error
rather than reducing the interaction to an error message before the
observation is created.

The experiment establishes a deliberately small execution contract:

    exit 0 + valid JSON
        |
        v
      SUCCESS

    non-zero exit
        |
        v
       FAIL

    exit 0 + invalid JSON
        |
        v
       FAIL

A successful process that returns valid JSON but omits a declared output
remains SUCCESS. The unavailable output is simply not captured.

This reinforces the boundary between execution mechanics and domain
semantics:

**Outputs are captured data, not postconditions.**

The capability owns the judgment about whether its domain work
succeeded. GRAIL records what happened, extracts available data, and
retains the simple SUCCESS/FAIL execution contract.

Demo 24 required no changes to the pursuit machinery.

It demonstrates that GRAIL can now invoke language-independent local
capabilities through a small process boundary.

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

Bindings describe how capability implementations are reached. The
current runtime supports HTTP services, dynamically loaded Node.js
modules, and local stdio processes behind a common binding layer.

Implementations perform the work.

This separation allows a GRAIL environment to compose capabilities
without requiring all implementations to share the same internal
architecture.

## Current boundaries

GRAIL is still experimental.

The current HTTP binding treats HTTP 2xx responses as SUCCESS and other
HTTP responses as FAIL. Node module execution succeeds when the selected
function completes normally and fails when module loading or execution
fails. stdio execution succeeds when the process exits with code `0` and
returns valid JSON on stdout. Non-zero exits or invalid JSON result in
FAIL.

HTTP output extraction currently supports response body, header, and
status sources. Node output extraction supports returned results using
simple dot-separated paths. stdio output extraction supports parsed
stdout using simple dot-separated paths. `$outputs` currently supports
only the `latest` observation selector.

The current observation structure was originally shaped around HTTP
request/response interactions. Node bindings expose the need for more
binding-neutral observation vocabulary, but that model has not yet been
redesigned.

The current resolver supports both producer-specific
`$outputs.<affordance>.latest.<output>` references and scenario-scoped
`$outputs.latest.<output>` references. Both use the `latest` selector
over observations. Scenario-scoped resolution assumes that output names
have stable semantics within the GRAIL environment; producer-specific
resolution remains available when provenance matters or output names
would otherwise be ambiguous.

Other areas for future experiments include:

-   richer observation selection and extraction;
-   richer FAIL semantics and the use of information learned from failed
    calls;
-   generalized selection among capabilities that can satisfy a missing
    requirement;
-   observation timing, retention, and redaction policies;
-   diagnostic provenance for unresolved inputs and missing learned
    outputs;
-   additional binding protocols as concrete needs emerge.

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
    grail-demo-16-http-output-sources
    grail-demo-17-node-module-bindings
    grail-demo-18-node-customer-onboarding
    grail-demo-19-http-customer-onboarding
    grail-demo-20-mixed-customer-onboarding
    grail-demo-21-alternative-bindings
    grail-demo-22-condition-based-goals
    grail-demo-23-survive-fail
    grail-demo-24-stdio-binding

## Key principles

The experiments have produced a small set of principles that describe
the direction of GRAIL:

**Define the environment, not the path.**

**Stochastic Traversal with Deterministic Results.**

**A capability's effects define its success boundary.**

**Capabilities define behavior. Bindings define execution.**

**An affordance describes what the environment makes possible. A binding
describes how that possibility is realized.**

**Binding is an execution property of an affordance, not a property of
the traversal.**

**Depend on state, not traversal history.**

**Keep the physics fixed. Make judgment configurable.**

GRAIL remains intentionally small. The complexity belongs primarily in
the environment: the capabilities available, the conditions they
require, and the effects they can establish.

The agent's job is to traverse that environment in pursuit of a desired
goal condition.
