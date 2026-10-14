# GRAIL Trust Model

## Introduction

GRAIL is a runtime for autonomously pursuing a declared goal within a deliberately constructed world.

A GRAIL world defines the conditions that matter, the affordances available to change those conditions, the relationships among those affordances, and the bindings used to invoke executable capabilities.

This architecture depends on explicit trust relationships.

GRAIL does not attempt to understand the application domain or independently determine whether a business operation is safe, appropriate, or authorized. Those responsibilities remain with the capabilities that perform the work.

Instead, GRAIL operates within a world that has already been composed and accepted for execution.

The central principle of the GRAIL trust model is:

> **Autonomy operates inside a trusted world.**

This document identifies what GRAIL trusts, where those trust relationships end, and which security responsibilities belong to the runtime, the world definition, and individual capabilities.

---

## 1. Scope

This document describes the architectural trust assumptions of GRAIL.

It is not a complete security architecture or formal threat model. It does not prescribe particular authentication systems, authorization models, credential stores, network controls, or deployment environments.

Its purpose is to establish the boundaries within which those mechanisms operate.

The trust model covers:

- GRAIL world definitions
- the GRAIL runtime
- affordances and their declared effects
- executable capabilities
- bindings
- inputs and outputs
- worldstate
- observations
- design-time tools
- external systems

These relationships provide the foundation for later security controls and threat analysis.

---

## 2. The trusted world

A GRAIL world defines the possibilities available to the runtime.

The world describes:

- the goal to be achieved
- the conditions relevant to that goal
- the affordances available to establish those conditions
- the preconditions governing when affordances are available
- the effects produced by successful affordances
- the inputs required by affordances
- the bindings connecting affordances to executable capabilities

The runtime treats this description as authoritative.

For example, if an affordance declares:

```json
{
  "action": "verifyCustomer",
  "preconditions": [
    "customerLoaded"
  ],
  "effects": [
    "customerVerified"
  ]
}
```

GRAIL assumes that successful execution of the bound capability establishes `customerVerified`.

The runtime does not independently understand what customer verification means.

This produces the first major trust assumption:

> **GRAIL trusts the world definition to accurately describe the relationships between conditions, affordances, capabilities, and effects.**

Errors in the world definition can therefore produce incorrect runtime behavior even when the runtime itself is functioning correctly.

---

## 3. The composer

The person or process composing a GRAIL world occupies an important position in the trust model.

The composer determines which possibilities exist within the world.

The composer may:

- define conditions
- define affordances
- declare preconditions
- declare effects
- connect inputs and outputs
- select executable bindings
- add or remove capabilities
- determine the goal

The composer therefore has considerable authority over runtime behavior.

A world should be considered trusted only when its definition has been accepted for execution by the organization or environment in which GRAIL is operating.

The method by which that trust is established may vary. It could include human review, automated validation, testing, source control, deployment controls, artifact signing, or other mechanisms.

GRAIL does not currently prescribe a particular mechanism.

---

## 4. The GRAIL runtime

The runtime is responsible for the mechanics of goal pursuit.

Its responsibilities include:

- loading and validating the world definition
- evaluating worldstate
- identifying unresolved conditions
- selecting among declared possibilities
- resolving inputs
- invoking bindings
- interpreting execution status
- capturing declared outputs
- applying declared effects
- maintaining observations
- detecting when available capabilities cannot resolve the current state

The runtime is trusted to perform these mechanics according to the GRAIL execution model.

The runtime is not responsible for understanding the business meaning of the operations it invokes.

For example, the runtime may know that:

```text
approveInvoice
    → invoiceApproved
```

It does not need to understand accounting policy, approval authority, vendor relationships, or financial controls.

This separation allows the application domain to remain opaque to the GRAIL runtime.

---

## 5. Capabilities

Capabilities perform domain work.

A capability may:

- call an API
- query a database
- modify a record
- execute a transaction
- send a message
- invoke another service
- perform a calculation
- interact with an external system

Capabilities are trusted to perform the operations represented by their affordances.

Most importantly:

> **Capabilities are responsible for enforcing the security policies governing the actions they perform.**

These policies may include:

- authentication
- authorization
- access control
- business rules
- transaction limits
- data validation
- resource ownership
- regulatory requirements

The fact that GRAIL invokes a capability does not constitute authorization to perform the operation.

A capability must not assume that an invocation is authorized simply because it originated from the GRAIL runtime.

---

## 6. Preconditions are not authorization

GRAIL preconditions determine whether an affordance is currently available within the modeled world.

They are orchestration constraints.

They are not security controls.

For example:

```json
{
  "action": "refundOrder",
  "preconditions": [
    "orderLoaded",
    "refundRequested"
  ]
}
```

may tell GRAIL that `refundOrder` is an available action.

The bound capability must still determine whether the requested refund is authorized.

A world might also contain a condition such as:

```text
refundApproved
```

That condition may legitimately participate in orchestration. It should not replace authorization checks performed at the capability boundary.

Worldstate can be incorrect because of configuration errors, bugs, stale information, incorrect effects, or malicious modification.

Therefore:

> **GRAIL preconditions describe when an action is possible within the modeled world. Capabilities determine whether the requested action is permitted.**

---

## 7. Effects and SUCCESS

Effects are one of the most important trust relationships in GRAIL.

Consider:

```text
verifyCustomer
    SUCCESS
        ↓
customerVerified = true
```

When an affordance returns SUCCESS, GRAIL applies its declared effects.

The runtime generally cannot independently determine whether the domain meaning represented by those effects has actually been established.

GRAIL therefore assumes:

> **A successful capability invocation has established the effects declared for its affordance.**

This makes the relationship between capability behavior and declared effects part of the trusted world.

Incorrect effects can corrupt the runtime's understanding of the world.

Capability testing should therefore verify both operational behavior and the accuracy of the effects associated with successful execution.

---

## 8. Bindings

Bindings connect affordances to executable implementations.

Examples include:

```text
affordance
    │
    ├── Node module
    ├── HTTP endpoint
    ├── stdio process
    ├── CLI command
    └── other binding mechanisms
```

Bindings cross an important trust boundary.

A binding may cause the runtime to:

- load executable code
- start a process
- transmit data
- access the network
- communicate with external systems
- expose credentials
- receive untrusted data

A GRAIL world containing executable bindings should therefore be treated as executable configuration.

The runtime trusts the world definition to identify approved bindings.

Deployments may impose additional restrictions on which binding types, modules, executables, hosts, or services are permitted.

Future GRAIL implementations may support mechanisms such as binding allowlists, sandboxing, execution policies, or signed world definitions.

---

## 9. Inputs

Inputs provide data required by capabilities.

Inputs may originate from:

- scenario configuration
- previous capability outputs
- environment configuration
- users
- external systems
- other runtime sources

Inputs do not establish authorization.

The runtime may validate structural properties of inputs, such as presence, type, or resolvability. Domain validation remains the responsibility of the capability receiving the input.

A capability should treat externally derived input according to the security requirements of its domain.

---

## 10. Outputs

Capabilities may return outputs that become available to subsequent affordances.

For example:

```text
createCustomer
      │
      ▼
customerId
      │
      ▼
lookupAccount
```

GRAIL may validate mechanical properties of these outputs.

The runtime can determine whether:

- an expected output exists
- a value can be extracted
- a resolver succeeds
- a response is structurally valid

The runtime generally cannot determine whether the value is semantically valid for the application domain.

That responsibility remains with the capability or external system that consumes the value.

Outputs also do not directly modify worldstate. Worldstate changes occur through the declared effects of successful affordances.

This separation helps preserve the distinction between data and conditions.

---

## 11. Worldstate

Worldstate represents the conditions currently believed to hold within the GRAIL world.

The runtime uses worldstate to determine which affordances are available and which conditions still need to be established.

Worldstate is therefore operationally significant.

Unauthorized or incorrect modification of worldstate could change the runtime's decisions.

Worldstate should be modified through the mechanisms defined by the GRAIL execution model rather than arbitrary capability behavior.

A capability reports execution results. The runtime applies the corresponding declared effects.

This preserves the runtime as the authority over its own model of the world.

---

## 12. Observations

GRAIL observations provide a record of execution.

Depending on the binding and configuration, observations may contain:

- affordance identifiers
- invocation metadata
- input values
- HTTP requests
- HTTP responses
- headers
- process results
- capability outputs
- errors
- timestamps

Observations can therefore contain sensitive information.

A production GRAIL deployment should consider:

- credential redaction
- sensitive-data filtering
- access control
- retention
- storage protection
- audit requirements

Observations should be treated as operational records rather than an automatically safe debugging artifact.

The observation store records what GRAIL observed. It does not independently establish domain truth.

---

## 13. External systems

Capabilities frequently interact with systems outside the GRAIL trust boundary.

These may include:

- APIs
- SaaS platforms
- databases
- command-line tools
- local processes
- remote services
- other autonomous systems

External systems may fail, return unexpected information, reject requests, or behave maliciously.

Bindings and capabilities should therefore treat external interactions as trust-boundary crossings.

GRAIL can handle mechanical failures such as unavailable bindings, malformed results, or execution failures.

The interpretation of domain-specific responses remains the responsibility of the capability.

---

## 14. Design-time AI

Large language models and other AI systems can assist in composing GRAIL worlds.

They may help:

- identify conditions
- propose affordances
- identify existing capabilities
- generate capability implementations
- create bindings
- define preconditions and effects
- generate schemas and configuration
- construct tests
- inspect worlds for inconsistencies

AI-generated artifacts should not automatically become trusted runtime artifacts.

They should pass through the same validation and acceptance process as artifacts created by humans.

A useful distinction is:

```text
AI-generated world
        │
        ▼
review / validation / testing
        │
        ▼
trusted GRAIL world
        │
        ▼
runtime autonomy
```

The use of AI at design time does not change the runtime trust model.

---

## 15. Runtime AI

GRAIL does not require an LLM to autonomously pursue a goal.

Future implementations may use LLMs or other decision mechanisms at runtime for tasks such as selecting among multiple conditions or multiple affordances capable of producing the same effect.

Such components should operate within the possibilities declared by the GRAIL world.

Introducing an LLM as a selection mechanism does not grant that model additional authority over capabilities, bindings, effects, or worldstate.

The trusted world remains the boundary within which runtime decisions occur.

---

## 16. Responsibility summary

| Component | Trusted responsibility |
|---|---|
| Composer | Accurately model the intended world |
| World definition | Describe approved possibilities |
| Registry | Declare affordances, relationships, effects, and bindings |
| Runtime | Correctly enforce GRAIL execution mechanics |
| Capability | Correctly perform its domain operation |
| Capability | Enforce domain security and authorization |
| Binding | Invoke the intended implementation |
| Inputs | Supply data, subject to validation |
| Outputs | Supply declared data values |
| Worldstate | Represent conditions currently believed to hold |
| Observations | Record execution evidence |
| External systems | Provide services according to their own contracts |

No single component establishes the security of the entire system.

Security emerges from the correct enforcement of responsibilities at each trust boundary.

---

## 17. Primary trust boundaries

The major GRAIL trust boundaries can be summarized as:

```text
COMPOSITION
    │
    ▼
┌─────────────────────────┐
│   Trusted GRAIL World   │
│                         │
│ goal                    │
│ worldstate              │
│ registry                │
│ bindings                │
└────────────┬────────────┘
             │
             ▼
      ┌─────────────┐
      │ GRAIL       │
      │ Runtime     │
      └──────┬──────┘
             │
       binding boundary
             │
     ┌───────┼────────┐
     ▼       ▼        ▼
   Node     HTTP     stdio
     │       │        │
     ▼       ▼        ▼
        CAPABILITIES
             │
             │ domain/security boundary
             ▼
       EXTERNAL SYSTEMS
```

The world defines what GRAIL may attempt.

The runtime determines what currently needs to happen.

Bindings connect declared possibilities to executable implementations.

Capabilities determine whether requested domain actions are valid and authorized.

---

## 18. Threats outside the current model

The initial GRAIL trust model assumes a trusted execution environment.

A more complete security architecture may eventually address threats including:

- malicious or modified registries
- unauthorized worldstate modification
- malicious capability implementations
- compromised external services
- unsafe executable bindings
- credential leakage
- sensitive observation data
- dependency or supply-chain attacks
- denial of service
- capability impersonation
- tampering with capability results
- untrusted scenario packages
- compromised design-time generation tools

These concerns should inform future security work without requiring the runtime to understand application-domain policy.

---

## 19. Future controls

Possible future controls include:

- registry and scenario signing
- trusted scenario packages
- binding allowlists
- executable/module restrictions
- network destination restrictions
- capability identity
- capability integrity verification
- credential isolation
- process sandboxing
- execution quotas and timeouts
- observation redaction
- observation retention policies
- provenance metadata
- policy-controlled runtime environments

These mechanisms can strengthen the trusted-world boundary while preserving domain opacity in the GRAIL runtime.

They should be introduced in response to concrete deployment requirements rather than embedded prematurely into the core execution model.

---

## 20. Core principles

The GRAIL trust model can be summarized by several principles.

**Autonomy operates inside a trusted world.**

The runtime assumes that the world definition accurately describes the possibilities available to it.

**The application domain remains opaque to GRAIL.**

Domain policy and domain security belong with the capabilities that understand them.

**Preconditions are orchestration constraints, not authorization controls.**

A capability must enforce the security requirements governing the operation it performs.

**SUCCESS is a contract.**

When a capability reports success, GRAIL trusts that the effects declared for its affordance have been established.

**Bindings are execution boundaries.**

A registry containing bindings should be treated as executable configuration.

**World integrity matters.**

Changes to affordances, effects, bindings, or worldstate can change the behavior of the autonomous system.

**Design-time generation does not imply runtime trust.**

Human- or AI-generated worlds become trusted through validation, testing, review, and deployment controls appropriate to the environment.

---

## Conclusion

GRAIL deliberately places substantial knowledge in the environment rather than in the autonomous runtime.

That design makes the world definition a significant source of authority.

The runtime trusts the world to describe valid possibilities. It trusts capabilities to perform their declared operations and to enforce domain security. It trusts successful execution to establish declared effects. It protects the mechanics through which those declarations become runtime behavior.

These boundaries allow GRAIL to remain small and domain-independent while supporting autonomous execution across many application domains.

The resulting security model follows directly from the architecture:

> **Define a trusted world, constrain autonomy to that world, and require each capability to protect the actions it performs.**
