# Sharing GRAIL Worlds

## Packaging Reusable Environments for Goal-Directed Autonomy

**Status:** Informational architecture paper  
**Context:** GRAIL 0.1.0 beta and demo-25

### Abstract

GRAIL organizes goal-directed automation around an environment of declared affordances rather than a predefined workflow. Its runtime provides generic pursuit mechanics; an environment supplies the conditions, effects, inputs, and executable capabilities through which goals may be achieved. This separation suggests a natural unit of distribution: the **GRAIL world**.

This paper describes a lightweight pattern for sharing reusable GRAIL worlds independently of the runtime. It distinguishes a **world**, which defines possibilities; a **scenario**, which supplies a goal and starting conditions; and **observations**, which record what happened during a pursuit. It also reports evidence from demo-25, where a standalone environment ran successfully against the published GRAIL 0.1.0 beta, including recovery from a failed language-model capability.

The central claim is not merely that a demonstration can be copied to another machine. It is that **one world can support many pursuits**, with different goals and inputs, and can evolve as new affordances become available.

### 1. From Workflows to Worlds

A workflow packages a route: a sequence of activities and transitions chosen in advance. An agent package often bundles decision-making instructions with the tools it can invoke. GRAIL separates these concerns differently. Its runtime pursues a named goal by selecting affordances whose declared effects can establish the required conditions. When an affordance is blocked, pursuit can turn toward an unmet precondition; when an execution fails, an alternative producer may be available.

The registry describes relationships among possible actions, not a prescribed execution order. A capability performs the work behind an affordance. The runtime applies the same pursuit mechanics regardless of whether a capability is implemented as a local module, a process invoked over STDIO, or an HTTP service.

This leads to the guiding proposition:

> **The natural deployment unit for GRAIL is not a workflow, not an agent, but a world.**

A world packages the possibilities available to a pursuit. A scenario chooses what to pursue within those possibilities. The runtime supplies the mechanics that connect them.

The distinction matters for reuse. A portable workflow remains a particular route. A portable GRAIL world can make multiple routes and multiple goals available without enumerating each route in advance.

### 2. Three Concepts: World, Scenario, Observations

**World — what is possible.** A world defines affordances, their preconditions and effects, input requirements, and execution bindings. It also includes the capability implementations or references to services that realize those affordances. A world establishes a vocabulary of conditions and a set of ways to establish them. Its registry is a description of available possibilities, not a checklist of steps.

**Scenario — what we want to accomplish.** A scenario selects a goal effect, provides input values, and establishes an initial world state for a particular pursuit. Many scenarios may refer to the same world. A goal that is not achievable in one version of a world may become achievable when a suitable affordance is added.

**Observations — what actually happened.** A pursuit produces records of attempted affordances and their execution results, including invocation information, responses, outputs, and failures. Observations support inspection and debugging; in the current implementation they also inform per-run avoidance of affordances that have already failed.

These terms are **conceptual boundaries**, not new file-format or directory requirements. In GRAIL 0.1.0, `registry.json`, `worldstate.json`, `inputs.json`, and `goal.json` live together in a configuration directory. That layout can remain unchanged while the architecture distinguishes shared environmental definitions from per-pursuit intent and evidence.

A useful shorthand is:

> **World + Scenario → Pursuit → Observations**

A single world can support many scenarios. The same scenario can be run more than once, potentially producing different observations. Although the world-state *vocabulary* can be shared, actual world-state *values* belong to an execution context; the beta CLI resets state for each run.

### 3. The Packaging Pattern

The smallest useful package is a directory containing the configuration and capability resources needed by a compatible GRAIL runtime. Demo-25 used this arrangement:

```text
customer-classification/
├── README.md
├── config/
│   ├── registry.json
│   ├── worldstate.json
│   ├── inputs.json
│   └── goal.json
└── capabilities/
    ├── classify-message.mjs
    └── classify-rules.mjs
```

The registry declares the available affordances and their bindings. The other configuration files supply the initial scenario. The capabilities directory contains executable implementations. The README explains prerequisites and how to run the package. **No copy of the GRAIL runtime is included.**

Using the installed CLI, a recipient can validate and execute the environment:

```bash
grail validate --config ./config
grail run --config ./config
```

This arrangement is an **observed packaging convention**, not a normative package specification. It is deliberately modest: files already understood by the beta runtime are collected into a directory that can be copied and executed elsewhere, subject to dependency requirements.

The broader idea goes beyond one packaged demonstration. Consider a customer-service world with affordances for classifying messages, looking up customers, opening tickets, and issuing refunds. The same registry and world-state model could support distinct pursuits by supplying different goal effects and inputs. In today's CLI, those variations can be expressed using the existing goal and input overrides, or separate configuration sets where necessary. No new directory layout is required to recognize the underlying reuse pattern.

A world is therefore not synonymous with a single scenario. **The world is the reusable asset; a scenario is a particular use of that asset.**

### 4. Reuse, Growth, and Evolution

World packaging changes the economics of automation composition. Instead of creating a new workflow for every desired outcome, a composer can extend a shared environment of capabilities and relationships.

Suppose a world already knows how to locate a customer and create a support ticket. A new refund capability can be added with its own preconditions and effects. If the required conditions can be established using existing affordances, the new capability may make a refund goal reachable without introducing a separate orchestrated procedure. Similarly, a second producer for an existing effect can provide an alternative implementation or a recovery option.

This does **not** mean that every registry change is automatically compatible. New affordances may require additional inputs, new dependencies, or revised conditions. They may also change which producer a selection policy chooses, so observed execution paths can change even when goals remain the same. Reuse depends on stable, intelligible contracts among effects, preconditions, inputs, and capabilities.

Still, the design allows three useful forms of independence:

- **Runtime independence:** the generic pursuit engine need not be repackaged for each environment.
- **Scenario independence:** different goals and input sets can be pursued within a shared world.
- **Capability evolution:** implementations can be added, replaced, disabled, or retired while preserving the declared relationships where compatibility permits.

This points toward a larger deployment model: an organization maintains a world of available capabilities, gradually expanding the space of goals it can pursue. The world becomes a shared operational resource rather than a collection of separately scripted routes.

The current beta demonstrates this model in a single-agent, non-shared execution environment. Shared multi-user state, concurrent pursuits, governance, and deployment at enterprise scale remain future design questions—not properties established by the packaging experiment.

### 5. Evidence from Demo-25

Demo-25 explored heterogeneous producers of a single effect, `customerMessageClassified`. One STDIO-bound capability called a locally hosted Qwen model through Ollama. Another STDIO-bound capability used deterministic classification rules. Both were registered as affordances able to establish the same effect.

The experiment was extracted from the experimental repository into a standalone scenario directory, without its experimental runtime, and run using the published `@mamund/grail` 0.1.0 beta.

Three cases were observed:

1. The rules-based affordance was selected and completed the goal.
2. The language-model affordance was selected and completed the goal.
3. With Ollama unavailable, the language-model invocation failed; GRAIL then selected the rules-based alternative and completed the goal.

These results support a limited but important conclusion: **the environment and its capability implementations could be distributed separately from the development runtime, and the installed beta retained the intended pursuit and failure-recovery behavior.** The experiment did not measure general portability across operating systems, semantic classification accuracy, compatibility across runtime versions, or multi-scenario deployment at scale.

The most consequential result may be architectural rather than operational. The packaged environment remained meaningful outside the experimental codebase because its affordances, effects, and bindings—not a hardcoded procedure—described the available behavior.

### 6. Practical Boundaries and Open Questions

A world package is not automatically self-contained. Local capabilities may require a particular language runtime; remote bindings may depend on services, credentials, and network access. Demo-25, for example, could run its rules-based capability without Ollama, but its model-backed capability required Ollama and the local model to be available.

Several concerns warrant future conventions or specifications: dependency declaration, runtime-version compatibility, relative path handling, capability security and permissions, credential management, package integrity, composition of multiple worlds, and the handling of observations as potentially sensitive execution records.

Observations deserve special treatment. They are valuable evidence of a pursuit, but they are not necessarily part of a reusable world distribution. They may contain inputs, outputs, errors, or service responses that should remain local to an execution. The distinction between world, scenario, and observations helps avoid confusing the reusable environment with a particular run's data.

None of these open questions requires an immediate change to the beta's file layout. The first step is to document and use the conceptual separation consistently, then let additional experiments reveal which packaging conventions need to become formal contracts.

### 7. Conclusion

The demo-25 extraction showed that a GRAIL environment could be separated from its experimental runtime, packaged with its capabilities, and executed using an independently installed beta. That validates a practical starting point for sharing GRAIL worlds.

The more important implication is that **sharing a world is not the same as sharing a scenario**. A world defines a reusable environment of possibilities. Different scenarios supply different goals and initial conditions. Each pursuit produces observations that show how the runtime navigated that environment.

As the world evolves, its achievable goal space may expand without requiring a new workflow for every outcome. This is the promise of environmental composition: the composer defines what can be done and under what conditions; the runtime determines how to pursue a requested effect within those bounds.

**Define the environment, not the path. Package the world, not the workflow. Pursue different goals within the same world.**

Or, more compactly:

> **Package the possibilities. Install the mechanics. Pursue the goal.**
