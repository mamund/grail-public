# What Is Not in the Agent Must Be in the Environment

*Notes on bounded autonomy in GRAIL*

GRAIL began with a simple change in perspective.

Instead of giving an agent a predefined workflow, GRAIL describes an
environment of capabilities, conditions, inputs, and effects. The agent
begins with a goal and acts within that environment until the goal is
satisfied or it determines that the goal cannot be reached with the
capabilities currently available.

This leads to a broader observation:

> **What is not in the agent must be in the environment.**

An autonomous system needs enough information somewhere to determine
what actions are possible, when those actions are possible, and what
changes when they succeed.

That information does not necessarily need to live inside the agent.

GRAIL deliberately puts much of it in the environment.

## Moving intelligence into the environment

Many discussions of autonomous systems focus on the intelligence of the
agent.

The agent is expected to understand the goal, develop a plan, choose
actions, interpret results, recover from failure, and determine what to
do next.

This naturally leads toward increasingly capable decision-making
systems, often involving large language models.

GRAIL takes another approach.

A GRAIL environment explicitly describes:

``` text
capabilities
conditions
preconditions
effects
inputs
bindings
```

The runtime does not need to invent these relationships.

If an affordance requires:

``` text
customerEmailVerified
```

that requirement is declared.

If another affordance can establish:

``` text
customerEmailVerified
```

that possibility is also declared.

The agent does not need to understand customer onboarding well enough to
construct that relationship itself.

The environment already contains it.

## The environment is not a workflow

Putting more information into the environment does not mean encoding a
predefined route.

A workflow might say:

``` text
A
↓
B
↓
C
↓
D
```

A GRAIL environment instead describes relationships:

``` text
A establishes X

B requires X
B establishes Y

C also establishes Y

D requires Y
```

There may be several ways to establish a required condition.

There may be capabilities that establish several conditions at once.

A capability may fail and another capability may remain available.

The environment defines the possibilities without prescribing the path
through them.

This is the distinction behind:

> **Define the environment, not the path.**

The human defines the world.

The runtime traverses it.

## A small agent can still behave autonomously

Once these relationships exist in the environment, the runtime can be
comparatively small.

When a capability is blocked, GRAIL can identify an unmet condition.

It can discover affordances whose effects can establish that condition.

It can select one and attempt it.

If that affordance succeeds, the world changes.

If it fails, GRAIL can remove that possibility from the current pursuit
and select another producer when one exists.

When the goal condition becomes true, the pursuit is complete.

When a required condition remains false and no viable producer remains,
the pursuit cannot continue.

None of these mechanics inherently requires an LLM.

The choices can be made using simple selection algorithms.

The resulting behavior can nevertheless vary from one pursuit to another
because the environment may contain several valid possibilities.

This is a form of bounded autonomy.

## Bounded autonomy

GRAIL does not provide an agent with unlimited freedom.

The agent operates inside a world that humans have defined.

The registry establishes what actions are available.

Preconditions establish when those actions can occur.

Effects establish how successful actions change the world.

Bindings connect those possibilities to executable implementations.

The goal establishes the desired condition.

Within those boundaries, GRAIL can decide what to attempt as
circumstances change.

That distinction matters.

The system is autonomous because the path does not need to be specified
in advance.

The autonomy is bounded because the space of possible action has been
explicitly constructed.

The runtime can choose among possibilities.

It does not invent the world in which those possibilities exist.

## What the recent experiments showed

The later GRAIL experiments make this distinction increasingly visible.

Condition-based goals allow the goal to describe what should become true
rather than which affordance should execute.

Alternative affordances allow several capabilities to establish the same
condition.

Mixed bindings demonstrate that those alternatives do not need to share
an invocation mechanism.

Failure recovery allows a pursuit to continue after an affordance fails
when another viable producer remains.

Unresolvable-condition detection allows the pursuit to stop when the
environment no longer contains a way to establish a required condition.

Demo 24 adds stdio as another execution boundary. A capability may now
be implemented as an independent local process rather than as a Node
module or HTTP service.

None of these changes required GRAIL to understand the application
domain.

The runtime continues to operate on the declared structure of the
environment.

## The capability owns its domain

Demo 24 also exposed an important boundary.

A stdio capability can exit successfully and return valid JSON while
omitting an output that the binding expected to capture.

GRAIL does not reinterpret that omission as domain failure.

The process satisfied the binding contract, so the affordance succeeds
and its declared effects are applied.

The missing output is simply not captured.

This can be summarized as:

> **Outputs are captured data, not postconditions.**

If producing a particular value is necessary for the capability to
consider its work successful, the capability must make that
determination.

GRAIL should not inspect the returned data and attempt to infer whether
the domain operation really succeeded.

The application domain remains opaque to the runtime.

That boundary is another example of moving responsibility to the
appropriate part of the environment rather than increasing the semantic
intelligence of the agent.

## Bindings extend the world

The current GRAIL runtime supports three binding styles:

``` text
Node    → local JavaScript capability
HTTP    → network-accessible capability
stdio   → local process capability
```

These bindings expand the set of actions that can exist in a GRAIL
environment.

They do not change the pursuit model.

A Python program, HTTP service, or JavaScript function can participate
in the same world because GRAIL cares about the affordance around the
implementation:

``` text
what conditions it requires
what inputs it consumes
what effects it establishes
how it can be invoked
what information can be observed
```

The implementation performs the work.

The environment explains how that work participates in pursuit of the
goal.

## Where the complexity goes

There is no claim here that GRAIL eliminates complexity.

It relocates some of it.

A system with a simpler agent requires a sufficiently expressive
environment.

Someone must identify the relevant conditions.

Someone must decide what capabilities exist.

Someone must declare their preconditions and effects.

Someone must implement those capabilities correctly.

Someone must decide what constitutes success.

In GRAIL, much of that work happens during composition rather than being
deferred to runtime reasoning.

This is the trade.

Less knowledge inside the agent requires more knowledge represented
outside the agent.

Or, more compactly:

> **What is not in the agent must be in the environment.**

## The role of human design

GRAIL works because a human has defined the world first.

That is not a limitation hidden by the architecture. It is one of its
central assumptions.

The composer decides which parts of reality matter for the goal being
pursued and constructs a bounded representation of them.

The resulting world is intentionally incomplete.

It does not need to describe everything that might be true.

It needs enough structure to support the goals the environment is
intended to make possible.

This is why the quality of a GRAIL system depends heavily on
composition.

Autonomy emerges inside the boundaries created by that design.

## LLMs become optional

This also changes the role an LLM might play.

An LLM can still be useful in GRAIL.

It might help select among conditions.

It might help select among affordances.

A capability invoked through HTTP, Node, or stdio might internally use
an LLM to perform its work.

But none of those uses requires the basic pursuit architecture itself to
depend on an LLM.

GRAIL therefore demonstrates something useful:

> **A meaningful level of bounded autonomy can be achieved without an
> LLM.**

The runtime can pursue a goal, choose among alternatives, react to
changing state, recover from failed actions, and recognize when no
viable path remains using a world that has been explicitly structured in
advance.

An LLM can add judgment where judgment is useful.

It does not have to supply the structure that makes autonomy possible.

## Designing for autonomy

This suggests a different starting point for autonomous-system design.

Instead of asking only:

> How intelligent does the agent need to be?

we can also ask:

> What can the environment make explicit so the agent does not need to
> know it?

That question shifts attention from constructing increasingly capable
agents toward constructing environments in which useful autonomous
behavior can emerge from simpler mechanics.

GRAIL is one experiment in that direction.

Its working proposition is increasingly clear:

> **Define the environment, not the path.**

And beneath that proposition is an even more general one:

> **What is not in the agent must be in the environment.**
