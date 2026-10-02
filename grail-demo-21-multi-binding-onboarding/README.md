# Demo 21: Alternative affordances across Node and HTTP bindings

This demo extends the mixed-binding experiment from Demo 20 by making equivalent Node-bound and HTTP-bound affordances available at the same time.

Demo 20 assigned a single binding to each affordance and demonstrated that one GRAIL scenario could compose capabilities across Node and HTTP boundaries. Demo 21 removes that fixed assignment for the supporting capabilities.

For each semantic capability, the registry exposes both a Node-bound affordance and an HTTP-bound affordance with equivalent preconditions and effects.

GRAIL does not select a binding.

It selects an affordance capable of establishing a required condition. The selected affordance then executes through its declared binding.

The traversal therefore determines not only which capabilities participate, but which available implementations happen to participate during a particular pursuit.

## What this demo proves

Demo 21 demonstrates that GRAIL can:

* expose equivalent affordances with different binding protocols simultaneously
* select affordances according to the conditions they can establish rather than their binding protocol
* compose Node-bound and HTTP-bound alternatives dynamically during a pursuit
* consume learned values without knowing which alternative affordance produced them
* consume learned values without knowing which binding protocol produced them
* preserve a shared application state across alternative invocation mechanisms
* execute many valid traversals without encoding those traversals in the client, server, or registry
* support coarse- and fine-grained alternatives within the same environment

The central result is:

> **GRAIL selects capabilities based on what they can accomplish, independent of how they are bound.**

Binding is an execution property of an affordance, not a property of the traversal.

## Application

The demo uses the same shared customer-onboarding application used by Demos 18 through 20.

The application capabilities are implemented once as Node.js modules and use a shared local file store for application state.

Those capability functions can be reached in two ways:

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

The HTTP server remains an adapter over the existing application capabilities rather than a second implementation of the customer-onboarding domain.

GRAIL does not own or manage the shared application state. The application does.

This is important in Demo 21 because either invocation mechanism may be selected during a pursuit. Both must observe the same underlying application environment.

## Goal

The goal remains:

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

The goal affordance retains a single Node binding for this experiment.

This keeps the experiment focused on selection among alternative supporting affordances rather than introducing multiple goal affordances at the same time.

When a required condition is false, GRAIL searches the registry for affordances whose effects can establish it.

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

## Alternative affordances

Demo 21 contains a single goal affordance and nine pairs of supporting affordances.

Each pair represents the same semantic capability through different invocation mechanisms:

```text
startOnboardingNode             Node
startOnboardingHttp             HTTP

createCustomerProfileNode       Node
createCustomerProfileHttp       HTTP

setCustomerDetailsNode          Node
setCustomerDetailsHttp          HTTP

setCustomerEmailNode            Node
setCustomerEmailHttp            HTTP

setCustomerPhoneNode            Node
setCustomerPhoneHttp            HTTP

setCustomerAddressNode          Node
setCustomerAddressHttp          HTTP

verifyCustomerEmailNode         Node
verifyCustomerEmailHttp         HTTP

verifyCustomerPhoneNode         Node
verifyCustomerPhoneHttp         HTTP

acceptTermsNode                 Node
acceptTermsHttp                 HTTP
```

For example:

```text
setCustomerEmailNode ── Node ──┐
                               ├── customerEmailSet
setCustomerEmailHttp ── HTTP ──┘
```

Both affordances can establish the same condition.

Nothing in the traversal mechanics says "choose Node" or "choose HTTP." GRAIL is choosing among affordances capable of producing the required effect.

The binding becomes relevant only after an affordance has been selected for execution.

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

Other values are learned as capabilities execute:

```text
onboardingId
customerId
emailVerificationId
phoneVerificationId
accountId
```

These values are captured from capability results and made available through `$outputs`.

With multiple equivalent producers in the registry, consumers should not need to know which particular affordance produced a value.

Demo 21 therefore uses scenario-wide output resolution for inter-capability dependencies:

```text
$outputs.latest.onboardingId
$outputs.latest.customerId
$outputs.latest.emailVerificationId
$outputs.latest.phoneVerificationId
```

For example:

```text
setCustomerEmailNode ──┐
                       ├── emailVerificationId
setCustomerEmailHttp ──┘
                                ↓
              $outputs.latest.emailVerificationId
                                ↓
                 verifyCustomerEmail*
```

The consumer does not need to know:

* which affordance produced the value
* which binding protocol was used
* which traversal led to the value being produced

Scenario-level output resolution therefore decouples the consumer from both the producer identity and the producer's invocation mechanism.

Bindings continue to provide an anti-corruption layer between application capabilities and the GRAIL environment. A capability can use its own result structure while its binding maps that result to the output names used by the scenario.

## Selection, not binding selection

Demo 21 does not add a binding-selection mechanism to GRAIL.

The runtime continues to use the same basic traversal mechanics:

```text
attempt desired affordance
        ↓
find an unmet precondition
        ↓
find an affordance whose effects can establish it
        ↓
execute that affordance
        ↓
apply its effects
        ↓
re-evaluate the environment
```

The registry simply contains more possibilities.

When both a Node-bound and HTTP-bound affordance can establish the selected condition, either is a valid producer.

Binding diversity therefore emerges from ordinary affordance selection.

This distinction is important:

```text
GRAIL selects an affordance.
The affordance declares how it is invoked.
```

## Emergent traversal

A pursuit might contain a composition such as:

```text
startOnboardingHttp
    ↓
createCustomerProfileNode
    ↓
setCustomerEmailHttp
    ↓
verifyCustomerEmailNode
    ↓
setCustomerAddressNode
    ↓
setCustomerPhoneNode
    ↓
verifyCustomerPhoneNode
    ↓
acceptTermsNode
```

Another pursuit may use a substantially different combination of capabilities and bindings.

One observed run selected only HTTP-bound supporting affordances:

```text
startOnboardingHttp
    ↓
createCustomerProfileHttp
    ↓
setCustomerPhoneHttp
    ↓
verifyCustomerPhoneHttp
    ↓
acceptTermsHttp
    ↓
setCustomerEmailHttp
    ↓
verifyCustomerEmailHttp
    ↓
setCustomerAddressHttp
```

Other runs repeatedly crossed between Node and HTTP.

None of these traversals is represented as a workflow.

They emerge from repeated selection against the current world state.

```text
Define the environment, not the path.
```

## Multiple effects and alternative granularity

As in the previous onboarding demos, `setCustomerDetails` can establish several conditions in one invocation:

```text
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

The registry also contains fine-grained affordances capable of establishing those conditions independently.

Demo 21 therefore contains alternatives along more than one dimension:

```text
implementation
    Node or HTTP

granularity
    coarse or fine
```

For example, `customerEmailSet` might be established by:

```text
setCustomerEmailNode
setCustomerEmailHttp
setCustomerDetailsNode
setCustomerDetailsHttp
```

GRAIL does not require the scenario author to prescribe which one must be used.

The registry describes the available possibilities.

## Shared application state

All Node-bound and HTTP-bound affordances ultimately invoke the same application capability modules.

Those modules read and write the same local file store.

This allows a capability selected through HTTP to observe application state established by a capability selected through Node, and vice versa.

The shared store is not a GRAIL distributed-state mechanism. It is the application environment used for this experiment.

GRAIL manages the world-state propositions used for traversal. The application capabilities remain responsible for maintaining coherent application state.

Keeping those concerns separate allows invocation mechanism and application state to vary independently.

## Capability correctness

The varying traversal exposed an important requirement for distributed capability design.

A capability cannot safely assume that the environment reached it through a particular execution sequence.

It must behave correctly for the state it actually encounters.

During development of the onboarding experiments, `setCustomerDetails` exposed this issue. The capability originally reset email and phone verification whenever customer details were set.

That behavior was safe only under an assumed sequence in which customer details were always established before verification.

A valid alternative traversal could verify an email or phone first and later invoke `setCustomerDetails` to establish another required condition. Unconditionally resetting verification then invalidated application state that the capability had not actually changed.

The capability was corrected to inspect existing application state, compare the incoming values with the current values, and invalidate verification only when the underlying email or phone actually changed.

This leads to several useful capability-design principles:

* depend on state, not traversal history
* inspect state before acting
* change only what needs to change
* preserve established conditions that remain valid
* invalidate a condition only when the underlying truth has changed

These are not special requirements created by GRAIL.

They are properties of well-behaved distributed capabilities that varying execution order makes easier to expose.

## Experiment

The registry was exercised across 25 repeated pursuits using randomized selection.

Every pursuit completed successfully.

The 25 runs produced 25 distinct executed-affordance traversals.

Across those runs:

```text
pursuits                              25
successful pursuits                   25
unique traversals                     25

supporting alternative affordances    18
alternatives exercised                18

Node selections                       78
HTTP selections                       97
total supporting selections          175
```

Every Node-bound and HTTP-bound supporting alternative was selected at least once.

Selection counts by semantic capability were:

```text
Capability                  Node   HTTP
startOnboarding               11     14
createCustomerProfile          7     18
setCustomerDetails            10      8
setCustomerEmail               3      6
setCustomerPhone               5      6
setCustomerAddress             4      8
verifyCustomerEmail           13     12
verifyCustomerPhone           10     15
acceptTerms                   15     10
```

The counts are not expected to be balanced. The experiment is not testing equal selection probability.

The significant observation is that both alternatives for every semantic capability participated successfully in valid pursuits.

The 25 distinct traversals also demonstrate that the runtime did not merely alternate between a small number of predefined compositions. Different compositions emerged from the same registry and the same simple traversal mechanics.

These repeated runs provide experimental evidence of the behavior demonstrated by this scenario. They are not a proof that every possible composition is correct.

## Result

The experiment demonstrated:

```text
Node alternative selected                  PASS
HTTP alternative selected                  PASS
Node output → HTTP consumer                PASS
HTTP output → Node consumer                PASS
scenario-level producer independence       PASS
binding-protocol independence              PASS
shared application state                   PASS
varying emergent traversal                 PASS
all 18 supporting alternatives exercised   PASS
25 / 25 pursuits completed                 PASS
```

The client supplies the goal.

It does not supply the workflow, choose the binding protocol, identify the output producer, or manage transitions between implementations.

The runtime operates over the possibilities described by the environment.

## Status

```text
Demo 21: PASS
```

Demo 21 demonstrates that binding is an execution property of an affordance, not a property of the traversal.

GRAIL composes capabilities according to the conditions they can establish. How those capabilities are reached remains independent of that composition.

The result is a scenario in which simple traversal mechanics operating over a richer environment produce many valid compositions without those compositions being explicitly encoded.
