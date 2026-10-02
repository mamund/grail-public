# Demo 20: Customer onboarding with mixed Node and HTTP bindings

This demo exercises the same customer-onboarding environment using a deliberate mixture of local Node.js and HTTP capability bindings within a single GRAIL scenario.

Demo 18 established the all-Node baseline and Demo 19 established the all-HTTP counterpart. Demo 20 keeps the same goal, conditions, affordances, preconditions, effects, inputs, and output relationships while composing capabilities reached through both binding protocols.

The important point is that GRAIL does not contain a predefined onboarding workflow.

It knows the goal, the current world state, the available capabilities, and the conditions those capabilities require and produce. The traversal emerges at runtime.

## What this demo proves

Demo 20 Test 1 demonstrates that GRAIL can:

* compose Node-bound and HTTP-bound capabilities within the same scenario
* cross binding boundaries repeatedly during a single pursuit
* consume outputs produced through one binding protocol from capabilities invoked through another
* apply effects from Node and HTTP capabilities to the same GRAIL world state
* resolve learned values through `$outputs` without regard to the binding that produced them
* use the same application capabilities and application state through different invocation mechanisms
* execute varying emergent traversals without encoding binding transitions in the client or server

No changes to the core GRAIL traversal mechanics or world model are required for mixed-binding composition.

## Application

The demo uses the shared customer-onboarding application introduced in Demo 18.

The application capabilities are implemented once as Node.js modules and use a shared local file store for application state.

Those same capability functions can be reached in two ways:

```text
Node binding
    ↓
capability module
    ↓
shared file store
```

or:

```text
HTTP binding
    ↓
HTTP adapter
    ↓
capability module
    ↓
shared file store
```

The HTTP server is therefore an adapter over the existing application capabilities rather than a second implementation of the customer-onboarding domain.

GRAIL does not own or manage the shared application state. The application does.

## Goal

The goal is:

```json
{
  "goal": "onboardCustomer"
}
```

The `onboardCustomer` affordance requires these conditions:

```text
customerProfileCollected
customerEmailVerified
customerPhoneNumberVerified
customerAddressSet
customerTermsAccepted
```

When one of these conditions is false, GRAIL searches the registry for an affordance whose effects can satisfy it.

## Initial world state

The demo begins with the onboarding conditions false:

```text
onboardingStarted
customerProfileCollected
customerEmailSet
customerEmailVerified
customerPhoneNumberSet
customerPhoneNumberVerified
customerAddressSet
customerTermsAccepted
customerOnboarded
```

The world state contains propositions about the environment, not application data.

## Initial and learned values

Some values are known when the pursuit begins:

```text
name
email
phone
street
city
state
postalCode
termsVersion
```

These are supplied through `$inputs`.

Other values do not exist until capabilities execute:

```text
onboardingId
customerId
emailVerificationId
phoneVerificationId
accountId
```

These values are captured from capability results and become available through `$outputs`.

For example:

```text
startOnboarding
    ↓ onboardingId
createCustomerProfile
    ↓ customerId
setCustomerEmail
    ↓ emailVerificationId
verifyCustomerEmail
```

A capability can therefore consume information produced by an earlier capability without the client managing that information flow.

Outputs can be resolved either from a specific affordance:

```text
$outputs.setCustomerEmail.latest.emailVerificationId
```

or from the scenario as a whole:

```text
$outputs.latest.emailVerificationId
```

Scenario-wide resolution searches observations for the latest matching output
without requiring the consumer to know which affordance produced it.

This is useful when multiple affordances can establish the same condition and
produce equivalent information. For example, both `setCustomerEmail` and
`setCustomerDetails` can produce `emailVerificationId`. The downstream
`verifyCustomerEmail` affordance can therefore use:

```text
$outputs.latest.emailVerificationId
```

without being coupled to either producer.

Bindings provide an anti-corruption layer between application capabilities and
the GRAIL environment. A capability may use its own result structure and
vocabulary while the binding maps that result to the output names used within
the GRAIL scenario.

## Mixed bindings

Each affordance retains a single binding, but the registry deliberately mixes Node and HTTP bindings across the scenario.

Test 1 uses:

```text
onboardCustomer          Node
verifyCustomerEmail      Node
setCustomerEmail         HTTP
createCustomerProfile    HTTP
setCustomerDetails       Node
startOnboarding          Node
acceptTerms              HTTP
setCustomerAddress       Node
verifyCustomerPhone      HTTP
setCustomerPhone         Node
```

The mix is intentionally designed to create cross-binding data dependencies.

For example, `startOnboarding` is Node-bound and produces `onboardingId`. The HTTP-bound `createCustomerProfile` consumes that value.

Likewise, the HTTP-bound `setCustomerEmail` can produce `emailVerificationId`, which the Node-bound `verifyCustomerEmail` consumes.

The reverse direction is also exercised: the Node-bound `setCustomerPhone` can produce `phoneVerificationId`, which the HTTP-bound `verifyCustomerPhone` consumes.

The binding determines how an affordance reaches the capability.

It does not change the affordance's preconditions, effects, inputs, or role in the GRAIL environment.

## Enabling affordances and bindings

During development of this demo, the registry was extended with optional
`enabled` properties for affordances and bindings.

An affordance with `enabled: false` is unavailable to discovery. A binding
with `enabled: false` is not executed; the affordance follows the existing
unbound behavior and succeeds once its preconditions are satisfied, applying
its declared effects.

When `enabled` is omitted, both affordances and bindings remain enabled.
This preserves compatibility with existing registry documents, including
the Demo 18 configuration.

## Emergent traversal

A possible traversal might look like:

```text
onboardCustomer
    ↓
customerEmailVerified missing

verifyCustomerEmail
    ↓
customerEmailSet missing

setCustomerEmail
    ↓
customerProfileCollected missing

createCustomerProfile
    ↓
onboardingStarted missing

startOnboarding
    ↓
SUCCESS
```

GRAIL then re-evaluates the environment and continues.

Another run may encounter the address, terms, or phone requirements first.

There is no required path through the environment.

The selection mechanism chooses among currently relevant possibilities while the underlying mechanics remain deterministic.

## Multiple effects

An affordance may establish more than one condition when it succeeds.

For example, `setCustomerDetails` establishes:

```text
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

in a single invocation.

The registry can therefore contain both fine-grained affordances such as
`setCustomerEmail`, `setCustomerPhone`, and `setCustomerAddress`, and a
coarser-grained affordance that establishes all three conditions.

GRAIL does not require a predefined choice between them. The available
affordances describe alternative possibilities within the environment.

When `setCustomerDetails` is selected, its binding also captures
`emailVerificationId` and `phoneVerificationId`. Scenario-wide output
resolution allows the later verification affordances to consume those values
without depending on which affordance produced them.

## Effects without outputs

Not every successful capability needs to produce a value.

For example, `acceptTerms` establishes:

```text
customerTermsAccepted
```

and `setCustomerAddress` establishes:

```text
customerAddressSet
```

Neither capability needs to manufacture an output value merely to participate in the traversal.

This preserves the distinction between:

```text
effects     what becomes true
outputs     what information was learned
```

## Shared application state

The Node and HTTP bindings ultimately invoke the same application capability modules.

Those modules read and write the same local file store.

This is important because mixed binding support does not imply that GRAIL provides shared application state. GRAIL composes affordances and invokes their bindings. The capabilities themselves must participate in a coherent application environment.

For this experiment, the shared local file store provides that environment.

The arrangement allows an HTTP-bound capability to observe application state established by a Node-bound capability, and vice versa, without GRAIL knowing how that state is maintained.

This is not intended as a general solution for distributed state management. It is a concrete demonstration that binding protocol and application state are separate concerns.

## Result

The mixed registry was exercised across 25 repeated runs.

All 25 pursuits completed successfully despite randomized traversal and repeated transitions between Node and HTTP bindings.

The tests demonstrated that:

```text
Node output → HTTP consumer    PASS
HTTP output → Node consumer    PASS
Node effect → shared world     PASS
HTTP effect → shared world     PASS
mixed traversal                PASS
```

The client supplies the goal.

It does not supply the workflow or manage binding transitions.

```text
Define the environment, not the path.
```

## Status

```text
Demo 20 Test 1: PASS
```

This establishes the first mixed-binding baseline: a single GRAIL scenario can compose capabilities reached through different binding protocols while preserving the same world model and application semantics.

A subsequent Demo 20 experiment can expose equivalent Node-bound and HTTP-bound affordances simultaneously, allowing affordance selection to determine which implementation is used during each pursuit.
