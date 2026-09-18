# GRAIL Multi-Effect Capability Experiment

## Purpose

This experiment tests whether a GRAIL environment can support capabilities that produce multiple effects while continuing to support existing fine-grained capabilities.

The original customer onboarding environment primarily used capabilities that produced a single effect:

```text
setCustomerEmail
  → customerEmailSet

setCustomerPhoneNumber
  → customerPhoneNumberSet

setCustomerAddress
  → customerAddressSet
```

The experiment introduces a coarse-grained capability capable of establishing all three conditions:

```text
setCustomerContactDetails
  ├─→ customerEmailSet
  ├─→ customerPhoneNumberSet
  └─→ customerAddressSet
```

The fine-grained capabilities remain in the environment.

This creates overlapping affordances at different levels of granularity and allows GRAIL to reach the same required world state through different combinations of capabilities.

## The challenge

The goal of the environment remains:

```text
onboardCustomer
```

`onboardCustomer` requires eight conditions:

```text
onboardingStarted
customerProfileCollected
customerEmailSet
customerEmailVerified
customerPhoneNumberSet
customerPhoneNumberVerified
customerAddressSet
customerTermsAccepted
```

The registry confirms these as the preconditions for the goal.

The original environment provides separate capabilities for establishing email, phone number, and address conditions.

The experiment asks:

1. Can one capability establish multiple effects?
2. Can fine-grained and multi-effect capabilities coexist in the same environment?
3. Will GRAIL recognize every effect produced by a multi-effect capability?
4. Can later traversal take advantage of effects established earlier?
5. What happens when more than one capability can satisfy the same precondition?
6. Can different traversals still converge on the same goal?

## Registry change

A new capability was added to the registry:

```json
"setCustomerContactDetails": {
  "id": "aff-c17",
  "action": "setCustomerContactDetails",
  "type": "task",
  "preconditions": [
    "customerProfileCollected"
  ],
  "inputs": [
    "email",
    "phoneNumber",
    "streetAddress",
    "locality",
    "region",
    "postalCode",
    "country"
  ],
  "effects": [
    "customerEmailSet",
    "customerPhoneNumberSet",
    "customerAddressSet"
  ]
}
```

The new capability requires `customerProfileCollected` and produces three effects.

No new world-state properties or input values were required. The original fine-grained capabilities were retained.

The resulting capability space therefore contains overlapping affordances:

```text
customerEmailSet
  ← setCustomerEmail
  ← setCustomerContactDetails

customerPhoneNumberSet
  ← setCustomerPhoneNumber
  ← setCustomerContactDetails

customerAddressSet
  ← setCustomerAddress
  ← setCustomerContactDetails
```

The registry confirms that the individual setters remain available alongside the multi-effect capability.

## Capability-selection change

The original capability resolver returned the first registry entry whose effects contained the required condition:

```js
findAffordanceForPrecondition(precondition) {
  for (let key in this.affordanceRegistry) {
    const candidate = this.affordanceRegistry[key];

    if (candidate.effects.includes(precondition)) {
      return candidate;
    }
  }

  return null;
}
```

This made registry order an implicit capability-selection policy.

For the experiment, the method was changed to collect all eligible capabilities and randomly select one:

```js
findAffordanceForPrecondition(precondition) {
  const candidates = [];

  for (let key in this.affordanceRegistry) {
    const candidate = this.affordanceRegistry[key];

    if (candidate.effects.includes(precondition)) {
      candidates.push(candidate);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
```

The method contract remains unchanged. Given an unmet precondition, it returns one capability capable of establishing that condition.

The difference is that registry ordering no longer determines which eligible capability is selected.

## Test method

Five runs were performed from the same initial environment.

For this experiment, two counts are useful.

**Traversal count** is the number of capability attempts made by GRAIL. This includes attempts that return BLOCKED and are later retried.

**Successful executions** count only capability attempts that return SUCCESS.

Traversal count therefore measures movement through the capability space, while successful executions provide a simple measure of the work actually performed.

## Results

| Run | Traversal count | Successful executions | Goal reached |
| --- | --------------: | --------------------: | ------------ |
| 01  |              15 |                     8 | Yes          |
| 02  |              13 |                     7 | Yes          |
| 03  |              13 |                     7 | Yes          |
| 04  |              13 |                     7 | Yes          |
| 05  |              17 |                     8 | Yes          |

All five runs reached:

```text
onboardCustomer
  → customerOnboarded
```

Run 01 required 15 capability attempts and 8 successful executions.

Runs 02, 03, and 04 each required 13 attempts and 7 successful executions.
Run 05 required 17 attempts and 8 successful executions.

The five executions therefore demonstrate different traversals through the same declared capability space while reaching the same goal.

## Multi-effect behavior

The traces show `setCustomerContactDetails` successfully applying all three declared effects:

```text
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

For example, Run 02 reaches `setCustomerContactDetails` while attempting to establish `customerAddressSet`. After resolving its own `customerProfileCollected` precondition, the capability succeeds and establishes all three contact conditions.

Later traversal recognizes those effects.

The run can execute `verifyCustomerEmail` without executing `setCustomerEmail`, and `verifyCustomerPhoneNumber` without executing `setCustomerPhoneNumber`.

This demonstrates that the additional effects are changes to the shared GRAIL world state and participate normally in subsequent traversal.

## Fine-grained and multi-effect capabilities can coexist

Run 01 demonstrates a different case.

GRAIL first uses the fine-grained `setCustomerPhoneNumber` capability to establish:

```text
customerPhoneNumberSet
```

Later, while resolving `customerEmailSet`, GRAIL selects `setCustomerContactDetails`, which establishes:

```text
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

The `customerPhoneNumberSet` effect is therefore established again.

The traversal continues successfully.

This demonstrates that fine-grained and coarse-grained capabilities can participate in the same traversal, including cases where their effects overlap.

## Multi-effect capabilities can reduce successful executions

Runs 02, 03, and 04 each reach the goal with seven successful capability executions.

In these runs, `setCustomerContactDetails` establishes the three contact conditions before separate fine-grained setters are needed.
Run 01 requires eight successful executions because `setCustomerPhoneNumber` executes before `setCustomerContactDetails`.

Run 05 also requires eight successful executions, but follows another path. It uses the fine-grained `setCustomerPhoneNumber`, `setCustomerEmail`, and `setCustomerAddress` capabilities rather than `setCustomerContactDetails`.

The experiment therefore does not show that a multi-effect capability always produces a shorter traversal.

It shows that a multi-effect capability can reduce the amount of successful work when it is selected at a useful point in the traversal.

## Traversal count and execution count are different

The results expose an important distinction.

Run 05 has 8 successful executions, the same number as Run 01, but requires 17 capability attempts compared with Run 01's 15.

Runs 02 through 04 require only 13 attempts and 7 successful executions.

Traversal length is therefore affected by more than the number of capabilities that eventually succeed.

GRAIL may attempt a capability, discover an unmet precondition, traverse to another capability, establish that condition, and then retry the original capability.

Those BLOCKED attempts are part of traversal even though they do not perform successful work.

This gives us two useful measurements:

```text
Traversal count
    = capability attempts

Execution count
    = successful capability executions
```

Both describe useful properties of an autonomous traversal.

## Different traversals, same result

The five runs demonstrate variation in both unmet-condition selection and capability selection.

Run 01 begins by pursuing `customerPhoneNumberSet`.

Run 02 begins with `customerAddressSet`.

Run 03 begins with `customerTermsAccepted`.

Run 04 begins with `customerPhoneNumberVerified`.

Run 05 begins with `onboardingStarted`, then later pursues `customerPhoneNumberVerified`.

Despite those differences, every run reaches `customerOnboarded`.

This provides a concrete demonstration of the GRAIL proposition:

> **Stochastic Traversal with Deterministic Results.**

## Implications for capability implementations

The experiment also exposes an important implementation issue.

GRAIL can reach the same condition through more than one capability. A capability can also produce an effect that has already been established.

At the simple world-state level:

```text
true → true
```

is harmless.

The implementation behind the capability may perform real work.

Repeating an operation such as sending a message, charging an account, creating a resource, provisioning infrastructure, or initiating an external process could produce unintended consequences.

The GRAIL world model can tolerate redundant effects only if the operational capability handles repeated attempts safely.

This leads to an important principle:

> **Autonomous traversal requires retry-safe capabilities.**

A capability implementation should tolerate repeated or overlapping attempts without creating unintended consequences.

## Idempotency and retry safety

Idempotency is one way to provide retry safety.

Naturally idempotent operations are particularly well suited to autonomous traversal because repeated execution produces the same effective result.

Strict operational idempotency, however, may not be appropriate for every capability.

Retry safety can also be provided through mechanisms such as:

* idempotency keys,
* duplicate detection,
* checking current state before acting,
* recognizing that the requested effect already exists,
* returning SUCCESS when the desired state has already been established.

The stronger GRAIL requirement is therefore retry safety rather than universal implementation-level idempotency.

A useful capability contract is:

> **A capability must provide deterministic success semantics, and repeated attempts must be handled safely.**

## Emerging principles

This experiment provides evidence for several GRAIL design principles.

### Capabilities may operate at different levels of granularity

Fine-grained capabilities and coarse-grained capabilities can coexist in the same environment.

The engine does not need to classify one as the normal operation and another as a shortcut.

### Capabilities may produce multiple effects

A successful capability can establish several facts about the world.

Those effects immediately become available to subsequent traversal.

### Overlapping affordances are valid

More than one capability can establish the same condition.

The capability space describes the available possibilities. Selection determines which eligible capability is attempted during a particular traversal.

### Registry order should not define capability selection

Registry position is an implementation detail and should not accidentally determine traversal semantics.

Random selection provides a simple way to expose alternative valid traversals for this experiment.

### Redundant effects should be safe

A capability may establish an effect that is already true.

The world model should tolerate this, and operational capabilities should account for repeated or overlapping execution.

### Autonomous traversal requires retry-safe capabilities

A dynamically traversed environment cannot assume that an operation will occur only once or in a predetermined sequence.

Retry safety is therefore a property of the capability environment, not merely an implementation convenience.

### Traversal cost and execution cost are different

The number of capability attempts and the number of successful executions measure different things.

A traversal can involve additional BLOCKED attempts without performing additional successful work.

This distinction may become useful when evaluating future GRAIL environments.

### Stochastic traversal can produce deterministic results

The five runs follow different paths, require different numbers of attempts, and execute different combinations of capabilities.

Every run nevertheless reaches:

```text
customerOnboarded
```

The goal remains stable while traversal emerges from the current world state and the capabilities available in the environment.

## Conclusion

This experiment required two substantive changes:

1. Add the multi-effect `setCustomerContactDetails` capability to the registry.
2. Randomize selection when multiple capabilities can satisfy the same unmet condition.

The existing GRAIL model required no changes to its goal representation, world-state representation, effect processing, or basic traversal mechanism.

Across five runs, the environment produced traversal counts ranging from 13 to 17 capability attempts and successful execution counts ranging from 7 to 8.

All five runs reached the same declared goal.

The experiment demonstrates that the baseline GRAIL environment can accommodate multi-effect capabilities, overlapping affordances, redundant effects, alternative capability selection, and variable traversal lengths.

It also exposes an operational requirement that follows directly from autonomous traversal:

> **Autonomous traversal requires retry-safe capabilities.**

And it provides concrete evidence for the broader GRAIL proposition:

> **Stochastic Traversal with Deterministic Results.**

