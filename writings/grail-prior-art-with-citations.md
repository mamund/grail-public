## Prior Art

The concept of goal-directed behavior in autonomous systems has a long and well-documented history. GRAIL (Goal Resolution through Affordance-Informed Logic) draws inspiration from several foundational models in AI planning, decision-making, and control theory. This section surveys key antecedents and highlights how they inform, but differ from, GRAIL’s operational design in the context of affordance-aware web APIs.

### 1. Backward Chaining

Backward chaining is a form of logical inference widely used in rule-based systems and expert reasoning engines, such as Prolog [@kowalski1974predicate; @clocksin2003programming]. The method begins with a goal (hypothesis) and recursively works backward to verify whether the necessary conditions for that goal can be satisfied. Each step involves selecting applicable rules whose consequences match the goal and then attempting to prove their premises.

**Relevance to GRAIL:** Like backward chaining, GRAIL begins from a known goal and proceeds by testing possible preconditions. However, unlike symbolic logic systems, GRAIL operates over opaque, runtime-visible affordances rather than predefined rules, and learns its options through execution rather than deductive planning.

### 2. Means-Ends Analysis (MEA)

MEA is a heuristic search strategy in classical AI planning that compares the current state with a desired goal state and selects actions that reduce the difference. Originating in the General Problem Solver (GPS) system of Newell and Simon [@newell1972human], MEA requires a model of available operators and their effects to determine which action best closes the gap between state and goal [@ernst1997automatic].

**Relevance to GRAIL:** GRAIL adopts the high-level intuition of MEA—progressively closing the gap toward a goal—but differs by using observed failures to determine available next steps. Rather than evaluating preconditions statically, GRAIL depends on the affordances returned dynamically from failed interactions to guide action selection.

### 3. Goal-Oriented Action Planning (GOAP)

GOAP systems, especially in game AI, dynamically construct plans from atomic actions based on their preconditions and effects. Agents can adapt to environmental changes by selecting different actions at runtime, assembling sequences that move the system toward a declared objective. GOAP provides a robust framework for responsive, modular decision-making [@orkin2006three; @nau2003shop2].

**Relevance to GRAIL:** Both GOAP and GRAIL emphasize runtime planning and responsiveness to environmental cues. However, GOAP typically relies on declarative knowledge bases that describe all available actions up front. GRAIL, by contrast, discovers affordances incrementally through interaction with API surfaces—requiring no a priori map of possible paths.

### 4. Hierarchical Task Networks (HTN)

HTN planning involves decomposing complex goals into subgoals and subtasks recursively, using methods that encode how to refine a high-level task into more primitive operations. HTNs are widely used in industrial planning, workflow systems, and autonomous robotics [@erol1994htn; @nau2004automated].

**Relevance to GRAIL:** GRAIL’s pursuit stack mimics certain elements of HTN decomposition, particularly the idea of refining failed attempts into smaller prerequisite actions. However, GRAIL does not maintain a persistent goal hierarchy. Instead, its stack emerges opportunistically from runtime failure and response metadata.

### 5. Model Predictive Control and Behavior Trees

Model Predictive Control (MPC) and behavior trees both encode outcome-driven behavior in time-evolving systems. MPC relies on optimizing control inputs over a time horizon to reach target states [@rawlings2009model; @camacho2007model], while behavior trees structure alternative actions under conditional logic.

**Relevance to GRAIL:** These models offer valuable strategies for managing fallback behavior and non-determinism. However, they require detailed models of either system dynamics (MPC) or behavioral branches (BT). GRAIL, by contrast, is designed for environments where such models are unavailable or infeasible—relying instead on the semantics of failure and the dynamics of discovered affordances.

---

### Summary

GRAIL inherits a rich lineage of goal-directed methodologies but distinguishes itself in two key ways:

1. **Interaction over inference:** It prioritizes dynamic interaction with live systems over precomputed planning.
2. **Affordance-first reasoning:** It uses observed, runtime-exposed affordances—not static models—as the substrate of its decision logic.

In short, GRAIL is not a planning algorithm in the classical sense. It is a runtime strategy for **goal resolution through live affordance navigation**—particularly suited for open, web-based, machine-to-machine environments.
