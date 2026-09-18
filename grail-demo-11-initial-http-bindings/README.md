# External HTTP Capability Bindings

This experiment moves GRAIL capability execution across an HTTP boundary while preserving the existing GRAIL behavioral model.

The goal was deliberately small: prove that a capability described in the GRAIL registry can be executed by an external HTTP service, return a result, and allow GRAIL to continue operating on its own declared preconditions and effects.

The experiment succeeded.

## Purpose

Until this experiment, capability execution happened inside the GRAIL process. That was useful while developing the traversal algorithm because it avoided introducing network and protocol concerns.

The next step was to separate capability semantics from capability execution.

The experiment asked:

> Can GRAIL invoke an external capability over HTTP without requiring the external service to understand GRAIL?

For this first test, the external service was intentionally trivial. It exposed one endpoint and returned `200 OK`.

## Starting point

A GRAIL capability already describes the behavioral information the engine needs:

```json
{
  "id": "aff-c1",
  "action": "startCustomerOnboarding",
  "type": "task",
  "preconditions": [],
  "inputs": [],
  "effects": ["onboardingStarted"]
}
```

The registry tells GRAIL what the capability means. The missing piece was a way to describe how the capability is executed.

## Adding a binding

An optional `binding` property was added to the registry schema and runtime affordance model:

```json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/execute"
}
```

The binding is optional. Existing locally executed capabilities can continue to operate while externally bound capabilities are introduced incrementally.

The existing `execute` property remains in the schema for now, but `binding` is intended to replace the earlier local-execution assumption.

## The capability stub

The external service was deliberately generic. It exposes:

```text
POST /execute
```

and responds with `200 OK` and:

```json
{
  "status": "SUCCESS"
}
```

The stub does not know which GRAIL capability invoked it. It does not know the capability's preconditions or effects. It simply performs the external execution role and reports success.

The service says, "I completed successfully." The registry says what that success means. GRAIL uses the declared effects to update its world state and continue traversal.

## Runtime changes

The existing execution path required only a small change:

```text
check preconditions
        ↓
check inputs
        ↓
binding present?
   ↓            ↓
  no           yes
   ↓             ↓
local path     HTTP request
                 ↓
              success
   ↓             ↓
   └──────┬──────┘
          ↓
     apply effects
          ↓
       SUCCESS
```

`Server.attempt()` became asynchronous so it could invoke the external HTTP service. `Client.pursue()` became asynchronous and waits for `Server.attempt()`. The top-level runner waits for `Client.pursue()`.

The traversal algorithm itself did not otherwise change.

## Keeping GRAIL in GRAIL

For this experiment, GRAIL remains responsible for determining whether a capability is executable:

```text
GRAIL selects capability
        ↓
GRAIL checks preconditions
        ↓
GRAIL checks required inputs
        ↓
external service executes
        ↓
external service reports success
        ↓
GRAIL applies declared effects
        ↓
traversal continues
```

For now:

- preconditions are evaluated by GRAIL
- inputs are known by GRAIL
- execution may occur externally
- effects are declared and applied by GRAIL
- `BLOCKED` is determined by GRAIL

The external service does not need to understand GRAIL preconditions, world state, traversal, or goals.

## Successful HTTP execution

A working binding produced:

```text
[SERVER] Attempting affordance: onboardCustomer
[SERVER] Executing binding: POST http://localhost:3001/execute
[SERVER] Binding succeeded: HTTP 200
[SERVER] Success: applying effects - customerOnboarded
[CLIENT] Affordance succeeded: onboardCustomer
```

The capability stub independently confirmed the request:

```text
[CAPABILITY-STUB] Received: POST /execute
[CAPABILITY-STUB] Responded: 200 OK
```

This demonstrated that capability execution had crossed the process boundary. GRAIL received the successful execution result and applied the capability's declared effects as before.

## Testing failure

The next test deliberately broke the binding:

```json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/broken"
}
```

The stub returned `404`.

GRAIL reported:

```text
[SERVER] Attempting affordance: onboardCustomer
[SERVER] Executing binding: POST http://localhost:3001/broken
[SERVER] Binding failed: HTTP 404
[CLIENT] Cannot proceed: no offered affordances
```

The important result was that the capability's effects were not applied.

The initial external execution semantics are therefore:

```text
HTTP 200 → SUCCESS → apply effects → continue traversal
HTTP failure → FAIL → do not apply effects
```

## Testing an intermediate capability

The failure experiment was then moved from the goal capability to the intermediate `setCustomerContactDetails` capability.

This capability can establish several effects:

```text
customerEmailSet
customerPhoneNumberSet
customerAddressSet
```

With a broken HTTP binding, the trace showed:

```text
[SERVER] Attempting affordance: setCustomerContactDetails
[SERVER] Executing binding: POST http://localhost:3001/broken
[SERVER] Binding failed: HTTP 404
[CLIENT] Cannot proceed: no offered affordances
```

Again, no effects were applied.

The environment also contains fine-grained capabilities capable of establishing the same conditions individually. For example:

```text
setCustomerEmail → customerEmailSet
```

A failure of `setCustomerContactDetails` therefore does not necessarily mean the goal is unreachable.

> **A capability can fail without the goal failing.**

The current GRAIL engine does not yet exploit that distinction. A failed capability with no offered affordances currently terminates traversal.

## Milestone

This experiment establishes that:

1. GRAIL can invoke capability implementations outside the GRAIL process.
2. HTTP can serve as a capability binding mechanism.
3. External services do not need to understand GRAIL semantics.
4. GRAIL can retain responsibility for preconditions and world-state effects.
5. A successful external invocation can produce the same behavioral result as local execution.
6. A failed external invocation does not falsely apply declared effects.
7. The existing traversal algorithm required little modification to cross the process boundary.

The architectural separation is becoming clearer:

> **GRAIL describes what a capability means.  
> The binding describes how to invoke it.  
> The service performs the work.**

## What we learned

Moving execution out of process did not require moving the GRAIL behavioral model with it.

The registry remains the declared environment. It describes capabilities, preconditions, inputs, and effects. The binding connects those declared capabilities to implementations. The external service can remain an ordinary service.

This gives us a path toward environments in which capabilities may be implemented by HTTP services, other protocols, or eventually discovered dynamically without forcing those services to implement the GRAIL model themselves.

## Next experiments

Two areas now deserve focused experiments.

### Capability service request and response

The current stub proves the HTTP boundary, but it does not yet exercise real capability inputs or service responses.

The next version should determine the smallest useful contract for invoking ordinary services while keeping GRAIL-specific concepts out of those services.

Questions include:

- How are GRAIL inputs mapped to HTTP requests?
- How are HTTP responses interpreted as successful capability execution?
- How much result interpretation belongs in the binding?
- Can an existing non-GRAIL service be used without modification?

The working assumption is that the binding adapts between GRAIL semantics and the service's native HTTP interface.

### Alternate resolution after FAIL

The current engine treats capability failure as terminal when no affordance is returned. That is too strong for an environment containing alternative capabilities.

When a capability fails, GRAIL should be able to ask whether another capability can establish the condition that led to the failed attempt:

```text
condition needed
      ↓
capability A
      ↓
     FAIL
      ↓
another producer?
   ↓          ↓
  yes         no
   ↓           ↓
try B      propagate failure
```

This will require GRAIL to retain enough resolution context to know why a capability was attempted and which candidates have already failed during that resolution.

Goal failure should represent exhaustion of viable solutions, rather than failure of the first selected capability.

## Other issues to revisit

Several related concerns are now visible but do not need to be solved yet.

**Failure classification.** A network failure, HTTP failure, and capability-level failure may eventually need different semantics.

**Retry safety.** External execution introduces uncertainty about whether an operation ran before a failure was observed. Autonomous traversal will require retry-safe capability behavior.

**Result interpretation.** `200 = SUCCESS` is sufficient for this experiment. Real services may require richer success rules.

**Other protocols.** HTTP proves the binding concept. MQTT, CSP, discovery, and other mechanisms can wait until the binding model requires them.

The goal remains to add complexity only when an experiment demonstrates the need for it.

## Conclusion

The first external capability-binding experiment is complete.

GRAIL can now cross an HTTP boundary, invoke an external capability service, observe success or failure, and preserve its own behavioral semantics.

The experiment also exposed the next algorithmic challenge: external capability failure should not automatically imply goal failure when the environment contains other ways to satisfy the same condition.

The next work can therefore proceed on two fronts:

```text
GRAIL ↔ binding ↔ ordinary capability service
```

and:

```text
FAIL ↔ alternate capability resolution
```

The execution boundary now works. The next task is to make that boundary useful with real services while preserving the open capability environment that makes GRAIL interesting.
