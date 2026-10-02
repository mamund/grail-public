# Demo 19: Customer onboarding with HTTP bindings

This demo exercises the same customer-onboarding environment as Demo 18 using HTTP capability bindings instead of local Node.js bindings.

Demo 18 established the richer all-Node baseline. Demo 19 keeps the same goal, conditions, affordances, preconditions, effects, inputs, and output relationships while changing how the capabilities are invoked.

The important point is that GRAIL does not contain a predefined onboarding workflow.

It knows the goal, the current world state, the available capabilities, and the conditions those capabilities require and produce. The traversal emerges at runtime.

## What this demo proves

Demo 19 demonstrates that GRAIL can:

* pursue a goal across a larger capability environment
* invoke application capabilities through HTTP bindings
* map affordance inputs to HTTP path and body parameters
* capture learned values from HTTP response bodies
* discover capabilities from unmet preconditions
* execute capabilities in an emergent order
* pass initial values through `$inputs`
* capture values returned by capabilities
* consume learned values through `$outputs`
* resolve learned values by affordance or across the scenario
* allow multiple affordances to produce equivalent learned values
* apply multiple effects from a single successful affordance
* apply capability effects to world state
* support capabilities that produce effects without producing output values
* repeatedly re-evaluate the goal until its conditions are satisfied
* complete the scenario without encoding a workflow in the client or server

No changes to the core GRAIL traversal mechanics or world model are required for this scenario.

## Application

The demo uses a stateful HTTP capability service that exposes the customer-onboarding capabilities on port `3001`.

The service exists independently of GRAIL and can be exercised directly.

Its capabilities include:

```text
startOnboarding
createCustomerProfile
setCustomerEmail
verifyCustomerEmail
setCustomerPhone
verifyCustomerPhone
setCustomerAddress
acceptTerms
onboardCustomer
```

The HTTP capabilities share in-memory application state.

GRAIL does not own or manage that application state. It interacts with the application through bindings.

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

## HTTP bindings

Each application capability is invoked using an HTTP binding.

For example:

```json
{
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/customers",
  "parameters": {
    "onboardingId": {
      "in": "body"
    },
    "name": {
      "in": "body"
    }
  },
  "outputs": {
    "customerId": {
      "from": "body",
      "path": "customerId"
    }
  }
}
```

Other affordances combine path parameters and body values. For example, customer-specific operations use URLs such as:

```text
/customers/{customerId}/email
/customers/{customerId}/phone
/customers/{customerId}/address
/customers/{customerId}/onboarding
```

The binding determines how the capability is executed.

The affordance determines what the capability means within the GRAIL environment.

Changing the binding protocol does not change the goal, preconditions, effects, or data relationships expressed by the scenario.

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

## Application state and GRAIL world state

The customer-onboarding HTTP service maintains its own application state.

GRAIL maintains its declared world state.

These are related, but they are not the same thing.

Repeated runs exposed an important interaction between the coarse-grained `setCustomerDetails` capability and the fine-grained verification capabilities.

A valid traversal could verify a phone number first and later invoke `setCustomerDetails` to establish another missing condition. The original HTTP implementation unconditionally reset both email and phone verification state whenever `setCustomerDetails` executed. GRAIL still correctly knew that `customerPhoneNumberVerified` had already been established, but the application had silently invalidated that fact.

The final onboarding capability detected the discrepancy and returned an HTTP `409`.

The capability was corrected so that an established verification is invalidated only when the underlying email or phone value actually changes. Existing verification identifiers are also reused when the value remains unchanged.

This illustrates an important capability-design rule:

> A capability should not invalidate an already-established condition unless it actually changes the underlying state on which that condition depends.

It also reinforces the boundary established in Demo 18:

> A successful capability invocation must actually establish and preserve the effects that the GRAIL environment associates with that success.

After the correction, 50 repeated runs completed successfully across varying emergent traversals.

## Result

With the HTTP registry and capability service in place, GRAIL can autonomously discover and execute the capabilities required to onboard the customer over HTTP.

The client supplies the goal.

It does not supply the workflow.

```text
Define the environment, not the path.
```

## Status

```text
Demo 19: PASS
```

This establishes the all-HTTP counterpart to the Demo 18 Node baseline.

Together, the two demos show that the same GRAIL environment can be executed through different binding protocols without changing its world model.
