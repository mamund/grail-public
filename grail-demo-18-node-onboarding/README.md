# Demo 18: Customer onboarding with Node bindings

This demo exercises GRAIL against a complete customer-onboarding application using local Node.js capability bindings.

Unlike the smaller Node binding example in Demo 17, this demo uses multiple capabilities, shared application state, learned values, and a goal that requires several conditions to become true before it can succeed.

The important point is that GRAIL does not contain a predefined onboarding workflow.

It knows the goal, the current world state, the available capabilities, and the conditions those capabilities require and produce. The traversal emerges at runtime.

## What this demo proves

Demo 18 demonstrates that GRAIL can:

* pursue a goal across a larger capability environment
* invoke application capabilities through Node bindings
* discover capabilities from unmet preconditions
* execute capabilities in an emergent order
* pass initial values through `$inputs`
* capture values returned by capabilities
* consume learned values through `$outputs`
* apply capability effects to world state
* support capabilities that produce effects without producing output values
* repeatedly re-evaluate the goal until its conditions are satisfied
* complete the scenario without encoding a workflow in the client or server

No changes to the core GRAIL traversal mechanics are required for this scenario.

## Application

The demo uses the shared customer-onboarding application located at:

```text
../customer-onboarding/
```

The application exists independently of GRAIL and can be exercised directly.

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

The capabilities share simple JSON-file application storage.

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

## Node bindings

Each application capability is invoked using a Node binding.

For example:

```json
{
  "protocol": "node",
  "module": "../customer-onboarding/capabilities/customer.js",
  "function": "createCustomerProfile",
  "outputs": {
    "customerId": {
      "from": "result",
      "path": "customerId"
    }
  }
}
```

The binding determines how the capability is executed.

The affordance determines what the capability means within the GRAIL environment.

The application module itself does not need to know that GRAIL invoked it.

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

The customer-onboarding application maintains its own persistent state.

GRAIL maintains its declared world state.

These are related, but they are not the same thing.

During development of this demo, an address capability successfully returned even though its input contract did not match the flattened GRAIL inputs. GRAIL therefore applied the declared `customerAddressSet` effect, while the application had not actually stored a valid address.

The final onboarding capability detected the discrepancy and failed.

Correcting the application input contract resolved the problem.

This illustrates an important boundary:

> A successful capability invocation must actually establish the effects that the GRAIL environment associates with that success.

GRAIL's declared world model and application reality can diverge if that contract is violated.

## Result

With the complete registry in place, GRAIL can autonomously discover and execute the capabilities required to onboard the customer.

The client supplies the goal.

It does not supply the workflow.

```text
Define the environment, not the path.
```

## Status

```text
Demo 18: PASS
```

This establishes the richer all-Node baseline for the next binding experiments:

```text
Demo 19   Same customer-onboarding environment, all HTTP
Demo 20   Same customer-onboarding environment, mixed Node + HTTP
Demo 21   Multiple affordances and multiple effects
```

