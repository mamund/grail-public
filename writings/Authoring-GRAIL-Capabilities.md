# Authoring GRAIL Capabilities

*A guide to building capabilities for safe, independent composition*

GRAIL environments describe possibilities rather than procedures.

A scenario declares goals, conditions, affordances, inputs, effects, and bindings. At runtime, GRAIL determines which conditions need to change and selects capabilities capable of changing them.

This means a capability cannot assume that it occupies a particular position in a predefined workflow.

It may execute earlier or later than expected. Another capability may already have established part of the state it normally establishes. A different capability may have produced the information it consumes. The capability before it may have been invoked through HTTP while the capability after it is a local Node module.

The capability should not need to know.

A well-authored GRAIL capability performs its responsibility correctly for the state it encounters.

The central principle is: fine

> **Build for the state you encounter, not the path you expect.**

## Capabilities participate in an environment

In a conventional workflow, a capability often lives inside an expected sequence:

```text
A → B → C → D
```

That sequence can become an implicit part of the implementation.

`C` may assume that `A` and `B` have already happened. It may assume that `D` has not. Those assumptions may never appear in its interface.

GRAIL removes that protection.

The environment instead describes relationships:

```text
A establishes x

B requires x
B establishes y

C requires x
C establishes z
```

If several capabilities can establish a required condition, GRAIL may select any appropriate one. If several conditions remain unsatisfied, different pursuits may encounter them in different orders.

A capability therefore needs to depend on the state it requires, not on an assumed history of how that state was reached.

## Honor the preconditions

Preconditions are the capability's declared environmental dependencies.

If a capability requires:

```text
customerProfileCollected
```

then that dependency should be visible in the affordance rather than hidden inside an assumed sequence such as:

```text
startOnboarding
    ↓
createCustomerProfile
    ↓
setCustomerEmail
```

The important relationship is not that `createCustomerProfile` happened before `setCustomerEmail`.

It is:

```text
customerProfileCollected
        ↓
setCustomerEmail
```

If execution really depends on something being true, declare that dependency.

Do not rely on traversal order to provide it accidentally.

## Honor the effects

Effects describe what successful execution makes true in the GRAIL environment.

If an affordance declares:

```text
effects:
    customerEmailSet
```

then SUCCESS means that `customerEmailSet` is now true.

For a multi-effect affordance:

```text
effects:
    customerEmailSet
    customerPhoneNumberSet
    customerAddressSet
```

SUCCESS means that all three conditions have been established.

This creates an important contract between the environment and the capability:

> **A capability's effects define its success boundary.**

A capability should not report success when its declared effects have not actually been established.

The GRAIL runtime intentionally remains unaware of the application's domain logic. It therefore depends on the capability implementation to honor this contract.

## Inspect state before acting

A capability should operate on the state that exists when it executes.

A useful pattern is:

```text
inspect current state
        ↓
compare desired state
        ↓
change what actually changed
        ↓
preserve what remains valid
        ↓
return the result
```

This becomes especially important when capabilities overlap.

Consider a coarse-grained capability:

```text
setCustomerDetails
```

that can establish:

```text
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

The environment may also contain:

```text
setCustomerEmail
setCustomerPhone
setCustomerAddress
```

A valid traversal might therefore establish and verify the customer's email before `setCustomerDetails` is later selected to establish the address.

`setCustomerDetails` cannot safely assume that verification has not happened yet.

It must inspect the state it encounters.

## Change only what needs to change

The customer-onboarding experiments exposed a concrete example.

An early implementation of `setCustomerDetails` reset email and phone verification whenever it executed.

That behavior was reasonable under an assumed sequence:

```text
set details
    ↓
verify email
    ↓
verify phone
```

But GRAIL could produce a different valid traversal:

```text
set email
    ↓
verify email
    ↓
setCustomerDetails
```

If `setCustomerDetails` was selected later to establish the customer's address, resetting an unchanged email invalidated an already-established condition.

The capability was relying on traversal history.

The correction was simple:

```text
if email changed
    update email
    invalidate email verification

if phone changed
    update phone
    invalidate phone verification

if address changed
    update address
```

An unchanged value should not cause related state to be destroyed merely because a capability happened to execute.

This suggests a broader rule:

> **Invalidate a condition only when the underlying truth that supports it has changed.**

## Preserve established state

A capability participates in a world that may already contain useful facts.

Those facts should be treated as part of the environment the capability encounters.

A capability should therefore avoid unnecessarily destroying established state.

This does not mean state can never be invalidated.

If the customer's verified email changes, then `customerEmailVerified` may legitimately cease to be true.

The distinction is between:

```text
email changed
    ↓
verification no longer valid
```

and:

```text
capability executed
    ↓
verification reset
```

The first represents a semantic relationship.

The second represents an execution-order assumption.

Capabilities should encode the former.

## Depend on state, not traversal history

This is the broader lesson.

Avoid logic whose correctness depends on statements such as:

```text
this capability always runs first

that capability must already have executed

verification hasn't happened yet

the HTTP implementation always comes after the Node implementation
```

If one of those facts is genuinely required, express the underlying condition as part of the environment.

Otherwise, the capability should behave correctly without knowing the traversal history.

The capability should ask:

> **What is true now?**

rather than:

> **What probably happened before I got here?**

## Keep data dependencies explicit

Conditions and data play different roles.

A condition tells GRAIL what is true:

```text
customerProfileCollected
```

An input gives a capability information it needs to act:

```text
customerId
```

Capabilities should declare the data they require rather than retrieving it through hidden assumptions about previous execution.

Values known at the beginning of a pursuit may come from:

```text
$inputs
```

Values learned during the pursuit may come from:

```text
$outputs
```

When multiple affordances can produce equivalent information, scenario-level resolution allows a consumer to depend on the information rather than a particular producer:

```text
$outputs.latest.customerId
```

This keeps the capability independent of which valid producer happened to execute.

## Do not depend on the binding

A capability's semantic role should not depend on whether it is reached through Node, HTTP, or another binding mechanism.

The affordance describes what the environment makes possible.

The binding describes how that possibility is realized.

Demo 21 makes this distinction explicit by exposing equivalent Node-bound and HTTP-bound affordances simultaneously.

GRAIL selects an affordance because its effects can establish a required condition.

Only after that selection does the binding determine how the implementation is invoked.

A capability should therefore not require knowledge of the traversal's invocation topology.

```text
semantic responsibility
        │
        ├── Node
        ├── HTTP
        └── other bindings
```

The protocol may change.

The capability contract should remain meaningful.

## Expect alternative producers

A capability should not assume it is the only way to establish a condition.

An environment might contain:

```text
setCustomerEmail
        ↓
customerEmailSet
```

and:

```text
setCustomerDetails
        ↓
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

It might also contain Node and HTTP realizations of both.

These are not exceptional cases.

They are alternative possibilities in the environment.

Capability authors should expect their implementations to coexist with other implementations capable of establishing overlapping state.

## Make capabilities independently composable

A useful test for a capability is:

> **Would this capability still behave correctly if a different valid capability executed immediately before it?**

That question exposes many hidden assumptions.

Another is:

> **Would it still behave correctly if some of the state it normally establishes were already established?**

And another:

> **Would it still behave correctly if its inputs were produced by a different valid producer?**

These questions shift testing away from a single expected workflow and toward composability.

## Test compositions, not just capabilities

Unit tests remain valuable.

A capability should be tested against its own inputs, outputs, state transitions, and failure behavior.

But independently correct capabilities can still fail when composed.

GRAIL's varying traversal provides another form of testing.

Given several valid producers and several unsatisfied conditions, repeated pursuits can exercise different combinations:

```text
Run 1: A → C → E → G

Run 2: B → D → E → F

Run 3: A → D → F → G
```

The GRAIL runtime is not generating arbitrary invalid sequences. It is selecting capabilities according to declared conditions and effects.

This makes repeated traversal useful as a kind of **composition fuzzing**.

Traditional fuzzing varies inputs to discover behavior that individual tests may miss.

Composition fuzzing varies valid capability compositions to expose assumptions that a single expected traversal may hide.

It can reveal:

* hidden ordering dependencies
* destructive side effects
* undeclared preconditions
* producer coupling
* overlapping-state problems
* assumptions about invocation mechanisms

The goal is not merely to prove that one workflow succeeds.

It is to gain confidence that independently authored capabilities remain correct across the valid compositions permitted by the environment.

## Let varying traversal expose assumptions

A failed alternative traversal is useful information.

The first question should not necessarily be:

> How do we prevent GRAIL from choosing that path?

Instead ask:

> Was the traversal invalid according to the declared environment?

If it was invalid, the environment may be missing a dependency.

If it was valid, ask:

> Was the capability correct for the state it encountered?

That distinction helps locate the problem.

```text
invalid traversal
    ↓
inspect the environment model

valid traversal + incorrect behavior
    ↓
inspect the capability
```

GRAIL can therefore expose disagreements between the world the scenario declares and the world the capability implementation assumes.

## A capability-authoring checklist

Before considering a capability ready for composition, ask:

* Are all genuine environmental dependencies represented as preconditions?
* Does SUCCESS actually establish every declared effect?
* Does the capability inspect relevant current state before modifying it?
* Does it change only state that actually needs to change?
* Does it preserve established conditions that remain valid?
* Does it invalidate state only when the underlying truth changes?
* Are required data dependencies explicit?
* Can it consume equivalent information without depending unnecessarily on a specific producer?
* Is its semantic behavior independent of its binding mechanism?
* Can it coexist with other capabilities that establish overlapping effects?
* Would it remain correct if valid capabilities executed in a different order?

These questions do not eliminate the complexity of distributed applications.

They make some of that complexity explicit.

## The craft of capability authoring

GRAIL deliberately keeps domain logic inside capabilities.

The runtime understands conditions, affordances, inputs, effects, bindings, and observations.

It does not need to understand what customer verification means, how an account is created, or when changing an email should invalidate verification.

Those decisions belong to the application.

That separation gives capability authors an important responsibility.

Capabilities must preserve the semantic integrity of the environment in which they participate.

The runtime should not need to protect a capability from unexpected but valid composition.

The scenario should not need to prescribe a workflow merely to keep a capability safe.

And the capability should not need to know the path that brought the world to its current state.

The aim is not to make every capability independent of everything else.

It is to make its dependencies explicit and its behavior correct wherever those dependencies are satisfied.

That is what makes independent composition possible.

> **Build for the state you encounter, not the path you expect.**
