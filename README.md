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

Capability inputs can be sent in the request body using:

    application/json

or:

    application/x-www-form-urlencoded

JSON is the default when no content type is specified.

These experiments also distinguish two aspects of HTTP input binding:

    Placement
      path
      query
      header
      body

    Representation
      application/json
      application/x-www-form-urlencoded

Body placement is implemented today. Additional placement options are
planned for later experiments.

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

Future experiments may explore:

- input placement in paths, query arguments, and headers;
- response bodies and response headers;
- values returned by capability execution;
- richer SUCCESS, FAIL, and BLOCKED semantics;
- alternate capability selection after an execution failure;
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

## Key principles

The experiments have produced a small set of principles that describe
the direction of GRAIL:

**Define the environment, not the path.**

**Stochastic Traversal with Deterministic Results.**

**A capability's effects define its success boundary.**

**Capabilities define behavior. Bindings define execution.**

GRAIL remains intentionally small. The complexity belongs primarily in
the environment: the capabilities available, the conditions they
require, and the effects they can establish.

The agent's job is to traverse that environment in pursuit of a goal.
