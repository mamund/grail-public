# Customer Onboarding

This directory contains a small customer-onboarding application used by the
GRAIL binding experiments.

The application is intentionally independent of GRAIL.

Its modules implement ordinary application capabilities, maintain their own
application state, and can be invoked directly without a GRAIL runtime.

This separation allows the same application to be used to test different GRAIL
binding mechanisms without changing the underlying business behavior.

## Structure

```text
customer-onboarding/
├── capabilities/
│   ├── onboarding.js
│   ├── customer.js
│   ├── email.js
│   ├── phone.js
│   ├── address.js
│   └── terms.js
├── storage/
│   └── storage.js
├── data/
│   ├── onboardings.json
│   ├── customers.json
│   ├── verifications.json
│   └── accounts.json
├── test.js
└── README.md
```

## Capabilities

The application exposes the following capabilities:

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

Each capability is an ordinary asynchronous JavaScript function.

For example:

```js
const result = await startOnboarding();
```

or:

```js
const result = await createCustomerProfile({
  onboardingId,
  name
});
```

The modules do not know whether they are being invoked directly, through a
GRAIL Node binding, through an HTTP adapter, or by some other caller.

## Application state

The application maintains its own state using JSON files in `data/`.

```text
onboardings.json
customers.json
verifications.json
accounts.json
```

The storage module provides simple operations for reading, finding, inserting,
and updating records.

This storage mechanism is intentionally simple. Its purpose is to provide
persistent application state for the binding experiments, not to model a
production persistence layer.

## Information flow

Some capabilities produce information required by later capabilities.

For example:

```text
startOnboarding
    |
    +-- onboardingId
            |
            v
createCustomerProfile
    |
    +-- customerId
            |
            +--------------------+
            |                    |
            v                    v
    setCustomerEmail      setCustomerPhone
            |                    |
            v                    v
 emailVerificationId     phoneVerificationId
            |                    |
            v                    v
 verifyCustomerEmail     verifyCustomerPhone
```

Other capabilities, such as setting an address or accepting terms, primarily
change application state and do not need to return additional application
identifiers.

## Application success boundary

The final `onboardCustomer` capability checks the actual application state
before completing onboarding.

A customer must have:

```text
email
verified email
phone
verified phone
address
accepted terms
```

If these requirements are satisfied, the capability creates an account and
marks the onboarding record as completed.

This validation belongs to the application.

A composition environment such as GRAIL may determine when the capability
appears eligible to execute, but the capability remains responsible for
protecting its own application-level correctness.

## Direct execution

`test.js` exercises the application without GRAIL.

It explicitly performs the onboarding sequence:

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

This provides a useful baseline.

The application can therefore be demonstrated in two different ways:

```text
Direct application

test.js
   |
   v
explicit sequence of capability calls


GRAIL composition

goal + environment
   |
   v
runtime discovery of capability calls
```

The first explicitly encodes the workflow.

The second allows the sequence to emerge from the environment.

## Relationship to GRAIL

This directory is an application fixture for several GRAIL experiments.

The application defines **behavior**.

GRAIL defines an **environment in which that behavior can be composed**.

Bindings connect the two.

```text
GRAIL affordance
      |
      v
    binding
      |
      v
application capability
      |
      v
application state
```

The same capability implementation can therefore be exposed through different
bindings without changing its application semantics.

This makes the application useful for comparing:

```text
Node bindings
HTTP bindings
mixed Node + HTTP bindings
```

The deployment or invocation mechanism can change while the customer-onboarding
behavior remains the same.

## Design principle

The application is intentionally unaware of GRAIL.

That boundary is important to the experiments:

> Capabilities define behavior. Bindings define execution.

The customer-onboarding modules provide the behavior. GRAIL determines how
those capabilities participate in a goal-directed environment.

