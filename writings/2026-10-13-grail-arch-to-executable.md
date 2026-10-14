# From Architectural Intent to Executable Knowledge

*How GRAIL Connects Architects, Engineers, and Autonomous Systems*

## Abstract

Software architecture is typically expressed through documents, diagrams, standards, and design decisions. Engineers translate those descriptions into working software. Although these activities are closely related, the artifacts they produce often remain separate. Over time, implementations evolve, architectural documentation becomes outdated, and valuable institutional knowledge becomes distributed across codebases, documents, and individual experience.

This paper explores an alternative approach in which architectural declarations participate directly in system execution. Using GRAIL, a goal-directed runtime based on affordances, preconditions, and effects, architects can explicitly describe the actions available within an environment and the conditions governing their use. Engineers provide the executable capabilities that realize those actions. The runtime navigates the resulting environment in pursuit of declared goals.

This arrangement creates a shared operational model that connects architectural intent to engineering implementation. It also offers a way to capture, preserve, and reuse institutional knowledge as executable relationships rather than relying exclusively on documentation, procedural workflows, or runtime inference.

## 1. The Distance Between Architecture and Implementation

Software architects and engineers share responsibility for building systems, but they frequently work with different representations of those systems.

Architects describe structures, relationships, constraints, and desired behaviors. Their work often appears in architecture diagrams, interface specifications, policy documents, and design decisions. These artifacts explain how systems should be organized and what properties they should exhibit.

Engineers implement those designs through code, services, databases, integrations, and operational infrastructure. Their work produces the executable systems that deliver value.

The separation is useful. Architectural models allow teams to reason about systems without becoming entangled in implementation details. Engineering implementations allow those models to become operational.

However, the relationship between architectural intent and implementation is often maintained through conventions, reviews, documentation, and human coordination.

An architecture diagram might show that a customer request must be classified before a response can be prepared. An engineer must then ensure that the implementation respects that dependency. If the requirement changes, both the documentation and implementation may need to change.

Over time, these representations can diverge.

The underlying problem is not simply inadequate documentation. It is that architectural knowledge often exists outside the mechanisms that govern execution.

What if some of that knowledge could be expressed in a form that software could use directly?

## 2. Architecture as a World of Possibilities

GRAIL explores this question by representing an operational environment as a collection of affordances.

An affordance describes an action available within the environment. It identifies the conditions that must be satisfied before the action can execute and the effects expected when it succeeds.

A GRAIL environment contains four primary elements:

- **Registry:** The available affordances, their preconditions, effects, and executable bindings.
- **World state:** The conditions currently established within the environment.
- **Inputs:** The data available to capabilities during execution.
- **Goal:** The effect the runtime is asked to establish.

Rather than describing a prescribed sequence of operations, the registry describes relationships among actions and conditions.

For example, an affordance named `assignSupportRep` might require the condition `requestClassified` and produce the effect `supportRepAssigned`.

Another affordance, `queueResponse`, might require `supportRepAssigned` before it can execute.

These declarations express architectural knowledge: assigning a representative depends on classification, and queuing a response depends on an assignment.

They do not prescribe a complete workflow.

The GRAIL runtime uses these relationships to determine which conditions remain unmet and which available affordances can establish them. When an affordance cannot succeed, another affordance capable of producing the same effect may be selected. When no viable producer remains for a required condition, the runtime can recognize that the goal is unresolvable within the declared environment.

This produces a different relationship between architecture and execution.

The architect does not need to specify every possible execution path. Instead, the architect describes the environment in which goal pursuit takes place.

**Define the environment, not the path.**

## 3. Engineers Animate the Architecture

Architectural declarations alone do not accomplish work.

An affordance may declare that a customer can be located, a document can be validated, or a support representative can be assigned. But those declarations must be connected to implementations that perform the corresponding operations.

This is the engineer's contribution.

Engineers provide capabilities: executable components that implement the behavior represented by affordances. A capability might be a local function, an HTTP service, a command-line program, or an operation that uses a large language model.

GRAIL separates the declaration of an affordance from the implementation of its capability.

The architectural model expresses what must be true before an action can occur and what successful execution is expected to establish. The engineering implementation determines how that action is performed.

This separation creates a shared contract between architects and engineers.

An architect can introduce a new condition or dependency without prescribing the internal implementation of every affected capability. An engineer can improve or replace a capability without necessarily changing the relationships represented in the registry.

The two roles are not isolated. Engineers contribute architectural insights, and architects participate in implementation decisions. But both work against a common operational representation.

There is also an important trust boundary.

When a capability reports `SUCCESS`, GRAIL accepts the effects declared for its affordance and updates its world state accordingly. This does not independently prove that an external database, service, or physical system has changed.

The relationship is similar to conventional function invocation. When a database update function returns success, its caller generally relies on the function's contract rather than independently reproducing the operation.

If stronger verification is required, engineers can implement that verification within the capability or architects can model additional verification affordances.

GRAIL makes the expected effects explicit. The correctness of the underlying operation remains an engineering responsibility.

In this sense, engineers do more than implement architectural designs.

**They animate the architecture, making its declared possibilities operational.**

## 4. A Shared Repository of Institutional Knowledge

Organizations accumulate knowledge about how work should be performed.

Some of that knowledge appears in formal policies and architectural standards. Some exists in application code. Some is preserved in operational procedures, and some remains in the experience of employees.

Much of this knowledge describes relationships:

- Which actions are possible?
- What conditions must hold before those actions can occur?
- What outcomes can those actions establish?
- Which capabilities can substitute for one another?
- What must happen before a particular goal becomes achievable?

GRAIL provides a structured way to express a subset of these relationships.

The registry is more than a catalog of executable operations. It is a machine-readable representation of how capabilities relate to organizational outcomes.

This has several implications.

First, the knowledge is durable. It can be stored in ordinary files, reviewed, versioned, and maintained alongside implementation code.

Second, the knowledge is inspectable. Architects and engineers can examine declared dependencies and effects without reconstructing them from execution histories or reading every capability implementation.

Third, the knowledge is reusable. An affordance that establishes a particular condition may contribute to multiple goals. Its relationships do not need to be recreated for each new application or workflow.

Fourth, the knowledge is operational. The runtime uses these declarations when pursuing goals. The architectural model participates directly in execution.

This is an important distinction from conventional documentation.

A document may describe the conditions required to assign a support representative. A GRAIL registry can express those conditions in a form the runtime uses to decide whether the assignment affordance is eligible for execution.

The knowledge is not merely stored. It is applied.

GRAIL does not capture all institutional knowledge. Human judgment, organizational culture, tacit expertise, and many forms of policy cannot be reduced to Boolean conditions and affordance declarations.

Nevertheless, the operational knowledge it does capture becomes a durable architectural asset.

**Institutional knowledge need not be repeatedly reconstructed during execution when it can be explicitly represented in the environment.**

## 5. An Example: The Customer Support World

A recent GRAIL experiment illustrates how architects and engineers can extend an operational environment together.

The initial environment supported a goal named `customerResponseQueued`.

Its capabilities included customer lookup, request classification, information retrieval, response drafting, validation, and message queuing. Some capabilities used an LLM to interpret requests or generate responses. Others relied on conventional deterministic code.

The runtime navigated the relationships among these capabilities without requiring LLM inference for affordance selection or dependency resolution.

After the environment was working, a new requirement emerged: every queued customer response should have an assigned support representative.

An architect could express this requirement by introducing a new condition, `supportRepAssigned`, and making it a precondition of `queueResponse`.

An engineer could then implement `assignSupportRep`, a capability that selected a representative according to the request classification.

The registry connected the new affordance to the existing environment:

- `assignSupportRep` requires `requestClassified`.
- Successful execution establishes `supportRepAssigned`.
- `queueResponse` requires `supportRepAssigned`.

No predefined execution sequence needed to be rewritten.

The runtime incorporated the new dependency into subsequent goal pursuits. In the observed experiment, the representative assignment was performed after other response-processing operations, illustrating that GRAIL's declarations constrain what must be true without prescribing a single order of execution.

The environment was enriched rather than reconstructed.

The experiment also included alternative classification capabilities. An LLM-backed classifier and a deterministic rules-based classifier could both establish `requestClassified`.

When the LLM-backed classifier failed, the runtime could attempt the rules-based alternative. When another required LLM capability failed without a viable substitute, the runtime recognized that the goal could not be completed.

These behaviors emerged from the declared relationships and the runtime's selection mechanism, not from a manually authored workflow.

The example illustrates a collaborative development pattern:

An architect identifies a meaningful new condition. An engineer supplies the capability to establish it. The shared environment incorporates the relationship, and the runtime uses it during future pursuits.

The architectural knowledge and executable capability become part of the same evolving system.

## 6. From Operational Models to Living Documentation

Once architectural relationships are represented explicitly, they can support purposes beyond runtime execution.

A GRAIL registry can serve as a source for generated documentation, including capability catalogs, dependency maps, supported-goal descriptions, and integration inventories.

For example, a documentation view could answer questions such as:

- Which affordances can establish `requestClassified`?
- Which other affordances depend on that condition?
- What alternatives exist if a capability fails?
- Which declared effects contribute to a particular goal?
- Which bindings implement the available affordances?

These are architectural questions, but their answers can be derived from the same declarations the runtime uses.

Execution observations add another perspective.

The registry describes what is possible within the declared environment. Observations record what happened during individual pursuits, including invoked capabilities, reported outcomes, and failures.

Together, these artifacts could support documentation that distinguishes architectural intent from observed execution.

Such documentation would not automatically establish that every capability behaves correctly or that every external effect occurred. It would, however, reduce the distance between the architecture used by the runtime and the architecture presented to human readers.

This suggests an opportunity for a shared workbench in which architects and engineers can explore the same environment through different views: architectural relationships, capability implementations, observed pursuits, and generated documentation.

The documentation would not need to be maintained as an entirely separate representation.

Much of it could emerge from the act of defining the operational environment.

## 7. Human Knowledge and Machine Inference

The growing use of large language models introduces another dimension to this discussion.

Many LLM-driven agent architectures use inference throughout the execution lifecycle: interpreting goals, selecting tools, planning operations, interpreting results, and deciding what to do next.

These approaches can be flexible and effective, particularly when tasks are ambiguous or the environment is not fully known.

But inference is not the only way to organize autonomous behavior.

GRAIL places knowledge about available actions, dependencies, and effects in an explicit environment. Its current runtime navigates that environment without requiring LLM inference.

Inference remains available as an implementation choice for individual capabilities.

This creates a useful division of responsibility.

Architects and engineers retain control over the operational model. The runtime applies that model during goal pursuit. LLMs can contribute where language understanding, extraction, generation, or other probabilistic capabilities are valuable.

This does not make GRAIL inherently more knowledgeable than an LLM-based system. Nor does it eliminate the need for human judgment or guarantee correct execution.

It does mean that organizations can preserve important operational relationships independently of a particular model or inference process.

The distinction has both economic and organizational consequences.

Inference consumes computational resources and, when accessed through token-priced services, incurs token costs. By keeping harness, plumbing, and current selection logic free of LLM inference, GRAIL allows organizations to decide where those costs are justified.

More importantly, architectural knowledge remains under the control of the people responsible for designing and maintaining the system.

**Inference becomes a capability rather than a prerequisite for autonomy.**

## 8. Toward Executable Institutional Knowledge

GRAIL suggests a different way to connect architecture, engineering, and autonomous execution.

Architects describe an environment in terms of actions, conditions, and expected effects. Engineers implement the capabilities that make those actions real. The runtime navigates the declared relationships in pursuit of goals.

As the environment evolves, its registry accumulates knowledge about what the organization can accomplish and how its capabilities relate.

That knowledge can be inspected, reviewed, reused, documented, and applied during execution.

There are limits to this approach. The registry captures only the relationships its designers choose to express. Incorrect declarations can lead to incorrect runtime decisions. Capability success reports are not independent proof of external effects. And the collaborative authoring and governance tools needed for large organizational environments remain an area for further development.

Nevertheless, the underlying model offers a useful possibility.

Instead of treating software architecture solely as a description that engineers must translate into executable systems, we can make selected architectural declarations part of the operational system itself.

Instead of repeatedly asking an inference engine to rediscover known relationships, we can preserve those relationships in a durable environment.

And instead of separating institutional knowledge from system execution, we can make some of that knowledge directly actionable.

**Architects define the possibilities. Engineers make those possibilities executable. GRAIL navigates the resulting world.**

The result is not simply another approach to automation. It is an opportunity to turn architectural intent into shared, executable institutional knowledge.
