# Programming the GRAIL World

GRAIL takes a different approach to programming autonomous systems. Instead of programming a sequence of actions for an agent to follow, GRAIL programs the world in which autonomous action takes place.

The central artifact in that world is the registry.

GRAIL carries just enough information to support autonomous traversal and leaves domain interpretation to the capabilities it invokes.

## The registry defines possibilities

The registry is not a checklist of conditions to satisfy. It defines the possibilities available in the world.

Each affordance describes something that can happen. Preconditions identify the conditions that must be established before the affordance can execute. Effects identify the conditions established after successful execution.

The semantic core of the registry is therefore:

**affordances + conditions + effects**

For example:

```text id="j5wptb"
verifyCustomerEmail

preconditions:
  customerEmailSet

effects:
  customerEmailVerified
```

This does not say when `verifyCustomerEmail` must execute. It does not say what comes before or after it in a workflow. It says that the affordance is available when the `customerEmailSet` gate is open and that successful execution opens the `customerEmailVerified` gate.

Relationships between affordances emerge through these conditions and effects. If one affordance establishes a condition required by another, the two are related through the world rather than through an explicitly programmed execution path.

## Programming the world

Programming in GRAIL means setting out the affordances, conditions, and effects that define what is possible.

For each affordance, the author answers three basic questions:

- What can be done?
- What conditions must be established before it can be done?
- What conditions are established when it succeeds?

Preconditions act as gates. GRAIL checks the current world state to determine whether the required gates are open before executing an affordance.

Effects open gates. When an affordance succeeds, its effects are applied to world state, potentially making additional affordances available.

The author programs possibilities and constraints rather than execution order.

This is also where GRAIL draws an important boundary. Conditions can have meaningful domain names such as `customerEmailVerified`, `articleReady`, or `tempIsTooHot`, but GRAIL does not interpret those names.

Their meaning belongs to the application domain.

GRAIL only needs to know how those conditions affect traversal.

## World state is a set of gates

`worldState` is a set of gates. It records which conditions have been established during a pursuit.

It is not a representation of application data and it does not evaluate domain rules.

For example, GRAIL would not ordinarily store:

```text id="0pv04n"
targetTemperature = 57
```

and evaluate:

```text id="q5vabm"
targetTemperature > 50
```

That domain logic belongs to a capability and its binding.

Instead, the GRAIL world might contain:

```text id="njwx9j"
tempIsTooHot = false
```

An affordance can establish that condition:

```text id="eb55sg"
checkIfTempIsOver50C

preconditions:
  none

effects:
  tempIsTooHot
```

The bound capability interacts with the external application space. It can read a sensor, obtain the current temperature, apply the appropriate domain rule, and determine the execution result.

GRAIL does not need to know what a temperature is, what Celsius means, or why 50 degrees matters.

When the affordance succeeds, its declared effect opens the corresponding gate:

```text id="e01knk"
tempIsTooHot = true
```

Another affordance can then depend on that gate:

```text id="7e8upn"
turnOnCoolingFan

preconditions:
  tempIsTooHot

effects:
  coolingFanIsRunning
```

As far as GRAIL is concerned, these are relationships between gates and affordances. The domain interpretation that caused `tempIsTooHot` to be established remains outside the GRAIL engine.

In the environments developed so far, gates initially have a value of `false`. As affordances execute successfully, their effects change corresponding gates to `true`.

For example:

```json id="aj8yda"
{
  "customerEmailSet": false,
  "customerEmailVerified": false
}
```

After the appropriate affordances succeed:

```json id="wrz3lm"
{
  "customerEmailSet": true,
  "customerEmailVerified": true
}
```

A value of `false` does not necessarily assert that some corresponding fact in the external application is false. It means that the condition has not yet been established within the current pursuit.

World state is therefore primarily a runtime concern rather than a primary programming surface.

An authoring environment can maintain much of this representation automatically. Adding a new precondition or effect to an affordance can introduce the corresponding gate into `worldState` without requiring the author to edit `worldState.json` directly.

## Execution is also domain-blind

The same separation applies to affordance execution.

GRAIL uses a small execution vocabulary:

```text id="5fubml"
SUCCESS
BLOCKED
FAIL
```

These values describe the outcome of attempting an affordance. They do not describe the application's domain.

`SUCCESS` does not mean that a temperature is high, an account is valid, or a customer is approved. It means that the affordance executed successfully according to its capability contract.

`BLOCKED` means the capability cannot currently proceed.

`FAIL` means the execution failed.

The capability is responsible for interpreting the application domain and producing the appropriate execution result. GRAIL is responsible for responding to that result according to its traversal mechanics.

This gives GRAIL two deliberately small representations:

```text id="dkp4mr"
EXECUTION

SUCCESS
BLOCKED
FAIL


WORLD STATE

gate closed
gate open
```

Effects connect the two.

When an affordance returns `SUCCESS`, GRAIL applies its declared effects. Those effects open gates in world state. The newly established conditions may make additional affordances available.

The engine therefore does not need domain-specific operators, rules, predicates, or data models in order to manage traversal.

## The goal supplies direction

A goal identifies the condition GRAIL is attempting to establish.

For example:

```text id="v4f6pe"
customerOnboarded
```

The goal supplies direction without specifying a route.

A pursuit succeeds when the goal gate has been opened. GRAIL does not need every gate represented in the world to become true. Other capabilities may remain unused and other gates may remain closed.

A registry containing twenty affordances therefore does not imply that all twenty must participate in a successful pursuit.

The registry defines what is possible. The goal identifies which condition currently matters.

## Inputs provide starting values

Inputs provide values available when a pursuit begins.

They may include values such as a customer name, email address, identifier, search term, document, temperature threshold, or other information required by capabilities.

Additional values may be produced during execution and passed to later capabilities.

Inputs are application values. They are distinct from world state, which contains gates used to control traversal.

GRAIL can transport application values without interpreting their domain meaning.

Inputs therefore belong to a particular pursuit rather than defining the GRAIL world itself.

## One world, many pursuits

A GRAIL world is independent of any single goal.

The same registry can support different goals, inputs, and resulting traversals.

A customer environment, for example, might support goals such as:

```text id="y3t7v9"
customerProfileCollected
customerEmailVerified
customerOnboarded
```

Each goal can result in a different pursuit through the same set of possibilities.

Changing the goal does not require rewriting the world.

Likewise, different starting inputs can be supplied to the same world without changing its affordances, conditions, or effects.

This separation is fundamental:

```text id="pn3nsu"
WORLD

registry
  affordances
  preconditions
  effects


PURSUIT

goal
inputs
world state
```

The world defines possibilities. The goal supplies direction. Inputs supply starting values. World state records the gates established as the pursuit proceeds.

## Bindings connect GRAIL to the domain

An affordance describes what can happen in the GRAIL world. A binding connects that affordance to an implementation.

A binding might invoke a Node function, make an HTTP request, execute a command-line program, or use another execution mechanism.

Bindings therefore belong to the realization of the world rather than its semantic core.

The same affordance can retain its preconditions and effects while its implementation changes:

```text id="t2m8y6"
               verifyCustomerEmail
                        |
             preconditions/effects
                        |
             +----------+----------+
             |          |          |
            Node       HTTP       CLI
```

This separation allows the GRAIL world model to remain stable while implementations change.

It also allows affordances to be exercised before implementations exist. An unbound affordance can use GRAIL's simulated successful execution, allowing the world model and its possible traversals to be explored before every capability has been connected to a working implementation.

Bindings form an important boundary between GRAIL and the application domain.

A capability reached through a binding can inspect application data, call services, read sensors, evaluate predicates, enforce business rules, perform calculations, or interact with other systems.

Those responsibilities remain outside the GRAIL engine.

The capability interprets the domain. GRAIL manages traversal.

This means that adding new domain rules does not necessarily require extending the GRAIL runtime. A new capability can encapsulate the rule and expose its result through the existing affordance contract.

## A deliberately small runtime model

The resulting runtime model is intentionally compact.

A pursuit repeatedly asks questions such as:

```text id="dl2nup"
Is the required gate open?

Can this affordance be attempted?

What was the execution result?

What effects should be applied?

Which gates are now open?

Has the goal gate been opened?
```

The engine does not need to ask:

```text id="n8nwnk"
Is 57 greater than 50?

Is this customer creditworthy?

Does this document satisfy company policy?

Is this article appropriate for publication?
```

Those are domain questions.

Capabilities answer domain questions. GRAIL uses the resulting conditions to manage autonomous traversal.

This gives the architecture a useful discipline:

> **GRAIL carries just enough information to support autonomous traversal and leaves domain interpretation to the capabilities it invokes.**

That principle also provides a useful test when extending GRAIL. If a proposed feature helps manage affordances, gates, execution, effects, or goal pursuit, it may belong in the runtime. If it requires GRAIL itself to understand the meaning of application data or business rules, that responsibility may belong in a capability instead.

## A different programming model

Traditional programs commonly encode execution sequences directly. GRAIL encodes the conditions under which actions are possible and the effects those actions have on the world.

The runtime determines traversal from the gates that have been established during a pursuit.

This gives GRAIL a compact programming model:

**Affordances define what can happen. Preconditions determine when it can happen. Effects determine which gates open when it succeeds.**

World state records those gates. Execution reports `SUCCESS`, `BLOCKED`, or `FAIL`. Inputs carry application values. The goal supplies direction and determines completion.

Domain interpretation remains with the capabilities GRAIL invokes.

In GRAIL, programming the world means defining a space of possibilities within which autonomous pursuit can occur.