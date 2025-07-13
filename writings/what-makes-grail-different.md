## What Makes GRAIL Different

GRAIL—**Goal Resolution through Affordance-Informed Logic**—isn't the first system to start with the goal.  
But it might be the first to do it with JSON, HTTP, and a web API that doesn’t know (or care) that the client is a machine.

So what makes GRAIL different?  
Let’s place it in context first.

---

### 🧠 GRAIL Has Historical Precedents

Many established models work backward from the goal:

- **Backward Chaining** – Inference engines like Prolog work from goals to facts.
- **Means-Ends Analysis (MEA)** – Classical AI compares current vs. goal states and selects steps to reduce the gap.
- **Hierarchical Task Networks (HTN)** – Break high-level goals into recursive subtasks.
- **Goal-Oriented Action Planning (GOAP)** – Agents dynamically sequence actions based on conditions and effects.
- **Model Predictive Control** – Control systems optimize inputs by modeling outcomes.
- **Behavior Trees** – Often structured to attempt high-level outcomes, failing gracefully into alternatives.

These systems **plan**, **simulate**, or **reason** toward the goal, often requiring rich world models or custom runtime environments.

---

### 🧬 What GRAIL Does Differently

GRAIL borrows the *goal-first posture*, but applies it to the **wild world of APIs** using real-time affordances.

Here’s what makes GRAIL unique:

---

#### ✅ 1. Affordance-Aware, Not Plan-Aware

GRAIL doesn't build a full plan in advance.

Instead, it attempts the goal action immediately. If it fails, it uses the **affordances returned by the server** (via links, profiles, metadata) to choose the next move.

This is **failure-driven discovery**, not prediction.

---

#### 🌐 2. Runs on Web-Native Infrastructure

Unlike older planning systems, GRAIL is designed to run on top of:

- HTTP methods
- JSON payloads
- ALPS profiles
- RESTful APIs

No semantic reasoners. No ontology engines. Just **affordances encoded in web-native formats**.

---

#### 🔁 3. Uses a Pursuit Stack, Not a Script

When an affordance fails, it's **pushed onto a pursuit stack**.

The client then tries the next suggested affordance. Once that succeeds, it pops the stack and retries the earlier step.

This produces a dynamic, reversible interaction path—**learned through execution**, not defined ahead of time.

---

#### 🧰 4. Built for Real-World API Conditions

APIs in the wild are often messy:

- They change over time.
- They don’t always expose sequences cleanly.
- They weren’t built for autonomous clients.

**GRAIL embraces this.** It’s designed to adapt to services that evolve. Clients don't assume state—they attempt actions, observe feedback, and adjust accordingly.

---

#### 🤝 5. Works with Human-Centered APIs

Many agent systems assume machine-optimized interfaces.

GRAIL works with **existing APIs**, even ones originally designed for humans. If the API returns links, transitions, or even error payloads with affordances, GRAIL can work with it.

It’s not a replacement—it’s a survivor.

---

#### 🧭 6. Composable, Observable, and Reversible

GRAIL fits naturally into modern composable systems:

- Every action is explicit and traceable.
- Each command can be `execute`d, `repeat`ed, or `revert`ed.
- Shared state is external, not hidden inside the client.

This makes it friendly for **auditing, debugging, and retry logic**—things most planning systems treat as afterthoughts.

---

### ✨ In Summary

**GRAIL doesn’t try to outsmart the system. It collaborates with it.**

It’s goal-first like Prolog.  
It’s adaptive like GOAP.  
But it’s web-native, failure-tolerant, affordance-aware—and dead simple to implement.

GRAIL’s innovation is not in the concept of reasoning from the goal.  
It’s in making that concept work **in the real world of APIs**, with **minimal friction and maximum flexibility**.

---

### Further Reading

- [The GRAIL Demo](https://github.com/mamund/grail-demo)
- [Goal-Oriented Action Planning (GOAP)](https://en.wikipedia.org/wiki/Goal-oriented_action_planning)
- [Hierarchical Task Network Planning](https://en.wikipedia.org/wiki/Hierarchical_task_network)
- [Means-Ends Analysis](https://en.wikipedia.org/wiki/Means-ends_analysis)
- [Introduction to ALPS](https://alps.io)
