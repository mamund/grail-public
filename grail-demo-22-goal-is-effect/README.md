# Demo 22: Condition-based goals

This demo extends Demo 21 by changing how a GRAIL pursuit begins.

In Demo 21, the goal named a specific affordance:

``` json
{
  "goal": "onboardCustomer"
}
```

The client therefore began with an affordance that had already been
selected.

Demo 22 changes the goal to a desired world condition:

``` json
{
  "goal": "customerOnboarded"
}
```

GRAIL now resolves that condition to an affordance capable of
establishing it before beginning the existing pursuit.

The central result is:

> **The goal specifies what should become true. GRAIL selects an
> affordance capable of making it true.**

## What this demo proves

Demo 22 demonstrates that GRAIL can:

-   express a goal as a desired world condition rather than a named
    affordance
-   discover enabled affordances whose effects can establish that goal
    condition
-   select among multiple affordances capable of establishing the goal
-   select either Node-bound or HTTP-bound implementations of the goal
    capability
-   pass the selected affordance into the existing pursuit machinery
    unchanged
-   preserve the alternative-affordance behavior demonstrated in Demo 21
-   complete the same customer-onboarding scenario without the caller
    selecting the goal implementation

The important architectural observation is that condition-based goal
resolution can be added at the top of the pursuit without changing the
existing traversal mechanics.

## Application

The demo uses the same shared customer-onboarding application used by
Demos 18 through 21.

The application capabilities are implemented once as Node.js modules and
use a shared local file store for application state.

Those capability functions can be reached through either Node or HTTP
bindings:

``` text
Node binding
    ↓
capability module
    ↓
shared file store
```

or:

``` text
HTTP binding
    ↓
HTTP adapter
    ↓
capability module
    ↓
shared file store
```

The HTTP server remains an adapter over the existing application
capabilities rather than a second implementation of the
customer-onboarding domain.

GRAIL does not own or manage the shared application state. The
application does.

## Goal

Demo 22 changes the meaning of the external goal.

The goal is:

``` json
{
  "goal": "customerOnboarded"
}
```

`customerOnboarded` is a world-state condition.

It describes the desired state of the environment rather than the
affordance that must be executed to reach that state.

This differs from Demo 21:

``` text
Demo 21

goal
    ↓
onboardCustomer
    ↓
execute this affordance
```

Demo 22 instead begins:

``` text
Demo 22

goal
    ↓
customerOnboarded
    ↓
find affordances whose effects include customerOnboarded
    ↓
select an affordance
    ↓
pursue that affordance
```

The caller therefore declares what should become true without selecting
how GRAIL should make it true.

## Goal affordances

Demo 22 exposes two affordances capable of establishing the goal
condition:

``` text
onboardCustomerNode          Node
onboardCustomerHttp          HTTP
```

Both have the same semantic contract.

They require:

``` text
customerProfileCollected
customerEmailVerified
customerPhoneNumberVerified
customerAddressSet
customerTermsAccepted
```

Both establish:

``` text
customerOnboarded
```

Their bindings differ:

``` text
onboardCustomerNode
        │
        │ Node
        ↓
onboarding.js :: onboardCustomer
```

and:

``` text
onboardCustomerHttp
        │
        │ HTTP
        ↓
HTTP adapter
        ↓
onboarding.js :: onboardCustomer
```

The registry therefore contains two valid producers for the goal
condition:

``` text
                     customerOnboarded
                            ↑
                  ┌─────────┴─────────┐
                  │                   │
       onboardCustomerNode   onboardCustomerHttp
               Node                 HTTP
```

GRAIL selects between them using the same affordance-selection mechanism
used elsewhere in the traversal.

## Goal resolution

The implementation change for Demo 22 is intentionally small.

Previously, `run.js` treated the value in `goal.json` as an affordance
registry key:

``` text
goal.json
    ↓
affordance registry lookup
    ↓
goal affordance
    ↓
client.pursue(goalAffordance)
```

Demo 22 treats the value as a condition:

``` text
goal.json
    ↓
goal condition
    ↓
findAffordancesForCondition(goalCondition)
    ↓
selectAffordance(candidates)
    ↓
goal affordance
    ↓
client.pursue(goalAffordance)
```

The existing server methods are reused for both producer discovery and
affordance selection.

No separate goal-selection algorithm was introduced.

## Existing pursuit remains unchanged

A key constraint of the experiment was to avoid changing the traversal
runtime.

After the goal condition has been resolved, the existing call remains:

``` text
client.pursue(goalAffordance)
```

From that point forward, GRAIL behaves exactly as it did in Demo 21.

The selected goal affordance is attempted.

If it is blocked, GRAIL selects an unmet precondition, finds affordances
capable of establishing that condition, selects one, executes it,
applies its effects, and continues.

``` text
resolve goal condition
        ↓
select goal affordance
        ↓
client.pursue(goalAffordance)
        ↓
existing GRAIL traversal
```

This isolation is significant.

Condition-based goals did not require a redesign of `client.pursue()` or
the existing precondition-resolution mechanics.

## Initial world state

The demo begins with the onboarding conditions false:

``` text
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

The world state contains propositions about the environment, not
application data.

The goal now names one of those propositions directly.

## Alternative affordances

Demo 22 retains the alternative supporting affordances introduced in
Demo 21 and adds alternatives for the goal itself.

The registry therefore exposes Node-bound and HTTP-bound alternatives
for:

``` text
startOnboarding
createCustomerProfile
setCustomerDetails
setCustomerEmail
setCustomerPhone
setCustomerAddress
verifyCustomerEmail
verifyCustomerPhone
acceptTerms
onboardCustomer
```

For example:

``` text
setCustomerEmailNode ── Node ──┐
                               ├── customerEmailSet
setCustomerEmailHttp ── HTTP ──┘
```

and now:

``` text
onboardCustomerNode ── Node ──┐
                              ├── customerOnboarded
onboardCustomerHttp ── HTTP ──┘
```

The same producer-selection model now applies from the first goal
resolution through the rest of the pursuit.

## Selection, not binding selection

As in Demo 21, Demo 22 does not add a binding-selection mechanism.

GRAIL selects an affordance because its effects can establish a desired
condition.

The selected affordance then executes through its declared binding.

At startup:

``` text
desired goal condition
        ↓
find producer affordances
        ↓
select affordance
        ↓
use its binding
```

During traversal:

``` text
unmet precondition
        ↓
find producer affordances
        ↓
select affordance
        ↓
use its binding
```

The same model now applies at both levels.

This distinction remains important:

``` text
GRAIL selects an affordance.
The affordance declares how it is invoked.
```

## A more uniform model

Demo 21 contained one intentional exception.

Supporting conditions could have multiple possible producers, but the
goal affordance was selected externally.

Demo 22 removes that exception.

The caller no longer says:

``` text
execute onboardCustomer
```

It says:

``` text
make customerOnboarded true
```

GRAIL then performs the same basic producer-selection operation already
used for other conditions.

Conceptually:

``` text
desired condition
        ↓
select an affordance capable of establishing it
        ↓
if blocked, identify an unmet condition
        ↓
select an affordance capable of establishing it
        ↓
repeat
```

The initial goal is therefore expressed in the same vocabulary as the
conditions encountered during pursuit.

## Initial and learned values

As in Demo 21, some values are known when the pursuit begins:

``` text
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

``` text
onboardingId
customerId
emailVerificationId
phoneVerificationId
accountId
```

These values are captured from capability results and made available
through `$outputs`.

Inter-capability dependencies continue to use scenario-wide output
resolution:

``` text
$outputs.latest.onboardingId
$outputs.latest.customerId
$outputs.latest.emailVerificationId
$outputs.latest.phoneVerificationId
```

Consumers therefore remain independent of both producer identity and
producer binding.

This is particularly relevant now that the goal itself also has
alternative producers.

## Shared application state

All Node-bound and HTTP-bound affordances ultimately invoke the same
application capability modules.

Those modules read and write the same local file store.

A capability selected through HTTP can therefore observe application
state established through Node, and vice versa.

The shared store is not a GRAIL distributed-state mechanism. It is the
application environment used for this experiment.

GRAIL manages the world-state propositions used for traversal. The
application capabilities remain responsible for maintaining coherent
application state.

## Experiment

The Demo 22 registry was exercised across 25 repeated pursuits using
randomized affordance selection.

Every pursuit completed successfully.

The goal condition was:

``` text
customerOnboarded
```

For every pursuit, GRAIL first selected one of the two affordances
capable of establishing that condition.

Across the 25 runs:

``` text
pursuits                    25
successful pursuits         25

goal producer selections:

onboardCustomerNode         12
onboardCustomerHttp         13
                            --
total                       25
```

Both goal alternatives were therefore exercised repeatedly.

The supporting traversal continued to select among the Node-bound and
HTTP-bound alternatives introduced in Demo 21.

These repeated runs provide experimental evidence of the behavior
demonstrated by this scenario. They are not a proof that every possible
composition is correct.

## Result

The experiment demonstrated:

``` text
condition used as external goal                 PASS
goal condition resolved to producer             PASS
Node goal producer selected                     PASS
HTTP goal producer selected                     PASS
existing client.pursue() unchanged              PASS
existing traversal mechanics unchanged          PASS
supporting alternative selection preserved      PASS
25 / 25 pursuits completed                      PASS
```

The client supplies the desired condition.

It does not select the goal affordance, choose the binding protocol,
supply the workflow, identify intermediate producers, or manage
transitions between implementations.

The runtime operates over the possibilities described by the
environment.

## Status

``` text
Demo 22: PASS
```

Demo 22 demonstrates that a GRAIL goal can be expressed as a desired
condition rather than a specific affordance.

The change is small in implementation but significant in semantics.

The caller now states what should become true:

``` text
customerOnboarded
```

GRAIL determines which available affordance can establish that condition
and then hands the selected affordance to the existing pursuit
machinery.

This makes the beginning of a pursuit more consistent with the rest of
the GRAIL model:

> **Given a desired condition, select an affordance capable of
> establishing it.**

For Demo 22, this remains an experiment. Whether condition-based goals
become the standard GRAIL goal model is a separate architectural
decision.
