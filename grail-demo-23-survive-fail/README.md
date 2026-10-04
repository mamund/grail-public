# Demo 23: Surviving affordance failure

This demo extends Demo 22 by changing how GRAIL responds when an affordance fails during a pursuit.

Demo 22 introduced condition-based goals:

```json
{
  "goal": "customerOnboarded"
}
```

GRAIL discovered affordances capable of establishing that condition, selected one, and passed the selected affordance into the existing pursuit machinery.

Demo 23 asks a new question:

> **What happens when a selected affordance fails but another affordance can still establish the required condition?**

The answer changes the meaning of failure within a GRAIL pursuit.

An affordance may fail without causing the pursuit to fail.

If another viable affordance can establish the unresolved condition, GRAIL can select that affordance and continue.

The central result is:

> **An affordance can fail while the pursuit continues. The pursuit fails only when a required condition can no longer be established by the available capabilities.**

## What this demo proves

Demo 23 demonstrates that GRAIL can:

- record execution failure as part of the observation history
- exclude an affordance that has already failed during the current pursuit
- select another affordance capable of establishing the same condition
- continue pursuit after a supporting affordance fails
- continue pursuit after the selected goal affordance itself fails
- preserve the goal independently of the affordance currently selected to achieve it
- distinguish between a failed affordance and an unresolvable condition
- stop when no viable affordance remains capable of establishing a required condition
- recover across Node and HTTP alternatives without declaring fallback relationships between them

No fallback chains, retry routes, or protocol-specific recovery rules are declared in the registry.

Alternative behavior emerges from affordances sharing effects.

## Application

The demo uses the same shared customer-onboarding application used by Demos 18 through 22.

The application capabilities are implemented once as Node.js modules and use a shared local file store for application state.

Those capability functions can be reached through either Node or HTTP bindings:

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

## Goal

The external goal remains the condition introduced in Demo 22:

```json
{
  "goal": "customerOnboarded"
}
```

`customerOnboarded` describes the desired state of the environment.

Two affordances can establish it:

```text
onboardCustomerNode          Node
onboardCustomerHttp          HTTP
```

Both produce:

```text
customerOnboarded
```

Demo 22 resolved the goal condition to one of these affordances before beginning the pursuit.

Conceptually:

```text
goal condition
    ↓
select goal affordance
    ↓
client.pursue(goalAffordance)
```

That model works as long as the selected goal affordance succeeds.

Demo 23 revealed what happens when it does not.

## Failure during pursuit

Suppose GRAIL needs:

```text
customerProfileCollected
```

and two affordances can establish it:

```text
createCustomerProfileNode
createCustomerProfileHttp
```

If the HTTP affordance is selected and its binding fails:

```text
createCustomerProfileHttp
    ↓
FAIL
```

the failed affordance is recorded in the observation history.

The client removes that affordance from the current stack.

Its parent remains unresolved because:

```text
customerProfileCollected = false
```

When the parent is attempted again, the server searches for producers of `customerProfileCollected`.

The failed HTTP affordance is no longer eligible during this pursuit.

The Node affordance remains available:

```text
customerProfileCollected
        ↑
        │
createCustomerProfileNode
```

GRAIL can therefore continue.

Conceptually:

```text
need condition X
        ↓
select producer A
        ↓
FAIL
        ↓
return to unresolved parent
        ↓
condition X still false
        ↓
find eligible producers
        ↓
select producer B
        ↓
continue
```

No explicit relationship between producer A and producer B is required.

They are related because both can establish condition X.

## Observation history and selection

Demo 23 uses the observation store as pursuit history.

When an affordance executes, the observation records whether the invocation resulted in:

```text
SUCCESS
```

or:

```text
FAIL
```

Affordance selection now considers that history.

Before selecting among candidate producers, GRAIL removes candidates that have already produced a `FAIL` observation during the current pursuit.

Conceptually:

```text
find affordances capable of establishing X
        ↓
candidate producers
        ↓
remove producers that failed during this pursuit
        ↓
eligible producers
        ↓
select one
```

The registry still describes what is possible.

World state describes what is currently true.

The observation store describes what has happened during the pursuit.

Selection interprets all three.

## Failure does not mean pursuit failure

This experiment makes an important distinction between two different kinds of failure.

An affordance can fail:

```text
affordance
    ↓
execute binding
    ↓
FAIL
```

without the overall pursuit failing.

If another eligible affordance can establish the required condition, GRAIL continues.

Therefore:

```text
affordance FAIL
```

does not imply:

```text
pursuit FAIL
```

Instead:

```text
affordance FAIL
        ↓
condition remains false
        ↓
another viable producer?
        │
     yes│
        ↓
continue pursuit
```

Only when no viable producer remains does the pursuit become unable to continue.

## The stack retains unresolved intent

Failure recovery works naturally for supporting affordances because of the GRAIL stack.

Consider:

```text
onboardCustomer
    ↓
needs customerProfileCollected
    ↓
createCustomerProfileHttp
```

If `createCustomerProfileHttp` fails, it is removed from the stack.

But `onboardCustomer` remains.

Its requirement has not changed:

```text
customerProfileCollected = false
```

When `onboardCustomer` is attempted again, GRAIL must resolve that condition again.

This gives the runtime an opportunity to select another producer.

The parent affordance therefore retains the unresolved intent.

## Root failure

Repeated testing exposed an important exception.

A supporting affordance has a parent on the stack.

The root affordance does not.

In Demo 22, the goal condition was resolved once before pursuit:

```text
customerOnboarded
        ↓
onboardCustomerHttp
        ↓
client.pursue(onboardCustomerHttp)
```

If `onboardCustomerHttp` eventually failed, the client removed it from the stack.

The stack then became empty.

There was no parent affordance left to retain the unresolved intent:

```text
customerOnboarded = false
```

The pursuit stopped even though another producer existed:

```text
onboardCustomerNode
```

This exposed an architectural consequence of condition-based goals.

The goal and the affordance selected to establish the goal are not the same thing.

## The goal persists independently

Demo 23 changes the pursuit so that the goal condition persists independently of the stack.

The client now begins with:

```text
goal = customerOnboarded
```

rather than:

```text
goal affordance = onboardCustomerHttp
```

When the stack is empty, the client asks the server to resolve the goal.

The server uses the same producer discovery and affordance selection machinery used for ordinary conditions:

```text
customerOnboarded
        ↓
findAffordancesForCondition()
        ↓
selectAffordance()
        ↓
selected goal producer
```

The selected affordance is pushed onto the stack.

If it fails:

```text
onboardCustomerHttp
        ↓
FAIL
        ↓
pop
```

the stack becomes empty, but the goal still exists:

```text
customerOnboarded = false
```

The client therefore asks the server to resolve the goal again.

Because `onboardCustomerHttp` has already failed, it is excluded from selection.

The remaining producer can then be selected:

```text
customerOnboarded
        ↑
        │
onboardCustomerNode
```

This produces the full recovery:

```text
goal: customerOnboarded
        ↓
select onboardCustomerHttp
        ↓
resolve preconditions
        ↓
execute
        ↓
FAIL
        ↓
goal still false
        ↓
select onboardCustomerNode
        ↓
execute
        ↓
SUCCESS
        ↓
customerOnboarded = true
```

## Goal controls pursuit lifetime

This leads to an important change in the client model.

Previously:

```text
empty stack
    ↓
pursuit finished
```

Demo 23 establishes a different rule:

```text
empty stack
    ↓
check goal
```

If the goal is true:

```text
goal satisfied
    ↓
SUCCESS
```

If the goal is false and another producer exists:

```text
goal unsatisfied
    ↓
select producer
    ↓
continue
```

If the goal is false and no viable producer exists:

```text
goal unsatisfied
    ↓
no viable producer
    ↓
cannot proceed
```

The resulting architectural distinction is:

> **The goal controls the lifetime of the pursuit. The stack represents the work currently being attempted.**

An empty stack does not mean success.

A satisfied goal means success.

## Goal resolution moves into pursuit

Demo 22 resolved the goal in `run.js`:

```text
goal.json
    ↓
goal condition
    ↓
find producer
    ↓
select goal affordance
    ↓
client.pursue(goalAffordance)
```

Demo 23 removes goal-affordance selection from `run.js`.

The runner now supplies only the desired condition:

```text
goal.json
    ↓
goal condition
    ↓
client.pursue(goalCondition)
```

The client retains that condition for the lifetime of the pursuit.

When goal resolution is required, the server performs producer discovery and selection.

This preserves the responsibility split:

```text
client
    pursuit + stack

server
    resolution + selection

registry
    possibilities

world state
    current conditions

observations
    pursuit history
```

## Selection, not fallback

Demo 23 does not introduce a fallback mechanism.

There is no declaration such as:

```text
if HTTP fails:
    use Node
```

There is also no relationship such as:

```text
primary: createCustomerProfileHttp
fallback: createCustomerProfileNode
```

Instead, both affordances independently declare their effects:

```text
createCustomerProfileHttp ──┐
                            ├── customerProfileCollected
createCustomerProfileNode ──┘
```

If one fails, selection operates over the remaining eligible possibilities.

This distinction is important.

GRAIL does not follow a fallback route.

It re-evaluates the environment and selects an affordance that can establish the still-unresolved condition.

## Alternatives do not need to be equivalent

The recovery mechanism is based on effects, not implementation identity.

This means the replacement affordance does not necessarily need to perform the same operation as the failed affordance.

For example, GRAIL may need:

```text
customerPhoneNumberSet
```

A fine-grained producer may fail:

```text
setCustomerPhoneHttp
    ↓
FAIL
```

Another affordance may establish several conditions at once:

```text
setCustomerDetailsNode
    ↓
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

Because `setCustomerDetailsNode` establishes the required condition, it remains a valid producer.

Recovery therefore means:

> find another affordance capable of producing the required effect

not:

> find another implementation of the same operation

## Unresolvable conditions

Demo 23 also distinguishes failure from exhaustion.

Suppose GRAIL requires:

```text
customerEmailVerified
```

and the available producers are:

```text
verifyCustomerEmailHttp
verifyCustomerEmailNode
```

During the exhaustion experiment:

- the HTTP service was unavailable
- `verifyCustomerEmailHttp` executed and failed
- `verifyCustomerEmailNode` was deliberately disabled

The resulting world was:

```text
customerEmailVerified = false

verifyCustomerEmailHttp = failed
verifyCustomerEmailNode = disabled
```

When GRAIL attempted to resolve `customerEmailVerified` again, no eligible producer remained.

The client reported:

```text
Cannot proceed: condition is unresolvable - customerEmailVerified
```

This is not an execution result for an affordance.

Nothing was invoked to produce an `UNRESOLVABLE` result.

Instead, unresolvability is a conclusion about the current pursuit:

```text
required condition is false
        +
no viable producer remains
        =
condition cannot currently be resolved
```

## Execution results and pursuit conclusions

Demo 23 therefore keeps execution results separate from pursuit-level conclusions.

An invoked affordance produces:

```text
SUCCESS
```

or:

```text
FAIL
```

An affordance may also be:

```text
BLOCKED
```

before execution because a required condition or input is unavailable.

Unresolvable is different.

It is derived from the combination of:

```text
world state
+
registry
+
observation history
```

No synthetic `UNRESOLVABLE` observation is added to the observation store because no capability invocation occurred.

## Experiment 1: recovery

The first experiment disabled the HTTP service while leaving all Node affordances enabled.

This caused selected HTTP-bound affordances to fail with network errors.

The registry was not modified to prefer Node affordances.

Across 25 randomized pursuits:

```text
pursuits                     25
successful pursuits          25

initial goal producer:

onboardCustomerNode          13
onboardCustomerHttp          12
                             --
total                        25
```

All 12 pursuits that initially selected `onboardCustomerHttp` recovered after that root affordance failed.

The resulting behavior was:

```text
onboardCustomerHttp
        ↓
FAIL
        ↓
customerOnboarded still false
        ↓
onboardCustomerNode
        ↓
SUCCESS
        ↓
customerOnboarded true
```

The supporting affordances exhibited the same recovery behavior throughout the pursuits.

Different runs also continued to exercise different valid compositions of the available capabilities.

For example, some pursuits used:

```text
setCustomerDetailsNode
```

while others used combinations of:

```text
setCustomerEmailNode
setCustomerPhoneNode
setCustomerAddressNode
```

The path remained emergent.

The goal remained stable.

## Experiment 2: exhaustion

The second experiment kept the HTTP service unavailable and deliberately disabled:

```text
verifyCustomerEmailNode
```

GRAIL eventually required:

```text
customerEmailVerified
```

It selected:

```text
verifyCustomerEmailHttp
```

The HTTP invocation failed.

When the parent affordance again required `customerEmailVerified`, the server searched for an eligible producer.

The HTTP producer had already failed.

The Node producer was disabled.

No viable producer remained.

The pursuit terminated with:

```text
[CLIENT] Cannot proceed: condition is unresolvable - customerEmailVerified
```

This demonstrates the other side of failure recovery:

```text
FAIL + viable producer
    ↓
continue pursuit

FAIL + no viable producer
    ↓
condition unresolvable
    ↓
stop pursuit
```

## Result

The experiment demonstrated:

```text
supporting affordance FAIL does not end pursuit       PASS
failed affordance excluded from later selection       PASS
alternative producer selected after FAIL              PASS
Node alternative survives HTTP failure                PASS
multi-effect alternative can satisfy condition        PASS
goal persists independently of selected producer      PASS
root goal affordance FAIL is recoverable              PASS
goal producer can be reselected after root FAIL        PASS
empty stack does not imply pursuit success             PASS
goal condition determines pursuit completion           PASS
unresolvable condition detected                        PASS
no synthetic UNRESOLVABLE execution status             PASS
25 / 25 recovery pursuits completed                    PASS
intentional exhaustion stopped correctly               PASS
```

No fallback chains were added.

No retry workflow was added.

No Node-versus-HTTP preference was added.

No special relationship between alternative affordances was added.

The registry continues to describe possibilities.

The runtime uses current state and pursuit history to determine which of those possibilities remain viable.

## Status

```text
Demo 23: PASS
```

Demo 23 demonstrates that failure of an individual capability does not necessarily imply failure of an autonomous pursuit.

A failed affordance changes the set of possibilities available to the runtime.

If another affordance can establish the unresolved condition, GRAIL can continue.

If none remains, GRAIL can identify the condition it can no longer resolve and stop.

The experiment also exposes a deeper consequence of condition-based goals:

> **The goal must persist independently of any affordance selected to achieve it.**

This separates the desired outcome from the temporary work used to reach it.

The resulting model is:

```text
goal
    ↓
desired condition
    ↓
select viable producer
    ↓
attempt
    ↓
SUCCESS ──→ apply effects
    │
    └─ FAIL ──→ remove that possibility
                     ↓
                condition still false
                     ↓
                select again
```

The path may change as capabilities succeed or fail.

The goal does not.
