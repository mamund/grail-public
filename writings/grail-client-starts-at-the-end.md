## The API Client That Starts at the End

Most API clients follow instructions.  
**GRAIL clients try the end first.**

It sounds reckless, but it's not. It’s how people solve problems all the time.

You don’t always know the full plan. But you *do* know what you’re trying to accomplish. You try something. If that doesn’t work, you backtrack, try something else. Eventually, you get there.

**GRAIL clients work the same way.**

---

### What is GRAIL?

**GRAIL stands for: Goal Resolution through Affordance-Informed Logic.**

Instead of scripting API steps, a GRAIL client receives a **goal state**—a desired outcome in JSON or some other machine-readable format.

Then it tries to *resolve* that goal by interacting with an API described in terms of **affordances**—available actions, transitions, and constraints.

And it always starts with a bold move: it attempts the *final step first*.

---

### How GRAIL Works

Here’s the basic algorithm:

1. **Start with the goal.**  
   Try the affordance that would directly achieve the desired state.

2. **If it fails, read the response.**  
   The failed attempt usually returns an affordance that *must happen first*.

3. **Push the failed affordance onto the pursuit stack.**  
   This way, you can return to it later.

4. **Attempt the new affordance.**  
   If that fails, push again. Try the next one.

5. **Repeat.**  
   Each attempt either succeeds (and gets popped off) or leads to a new affordance to try.

6. **Eventually, the original goal affordance rises to the top again—this time, with its preconditions met.**  
   Success.

This loop is simple but powerful. It doesn’t require hardcoded paths. It’s driven entirely by the goal and the affordances exposed by the server.

---

### A Real Demo

Let’s say the API exposes the following affordances:

    [
      {
        "id": "assignUser",
        "title": "Assign Record to User",
        "rt": "application/json",
        "input": { "assignedTo": "deena" }
      },
      {
        "id": "signRecord",
        "title": "Sign the Record",
        "rt": "application/json",
        "input": { "signature": true }
      },
      {
        "id": "validateRecord",
        "title": "Validate the Record",
        "rt": "application/json",
        "input": { "recordStatus": "validated" }
      }
    ]

And the GRAIL client is given this goal:

    {
      "validateRecord": true
    }

Here’s how it proceeds:

1. **Attempts `validateRecord`.**  
   Fails. The response includes `signRecord` as a required action. `validateRecord` is pushed onto the pursuit stack.

2. **Attempts `signRecord`.**  
   Fails. The response includes `assignUser`. `signRecord` is pushed onto the stack.

3. **Attempts `assignUser`.**  
   Success. Pops `signRecord` from the stack.

4. **Attempts `signRecord` again.**  
   Now succeeds. Pops `validateRecord`.

5. **Attempts `validateRecord` again.**  
   This time it succeeds. Goal reached.

Each step is informed by the last. No hardcoded flows. No global planning. Just a client moving toward its goal—one affordance at a time.

---

### Why This Is Better

Traditional API clients assume a fixed contract. They expect specific responses, in a specific order, and break easily when things change.

**GRAIL is different.**

Because the client starts with the goal and learns what’s required on the fly:

- It can **safely explore** the service space.  
  Even if it doesn't succeed at first, it learns from each response and adjusts.

- It becomes **resilient to change.**  
  If the service evolves—maybe the order of operations shifts, or new affordances are introduced—the client still works. No version pinning. No brittle assumptions.

- It **decouples the client from the workflow.**  
  Instead of encoding the steps, the client focuses on the outcome and discovers the path through interaction.

It’s not cleverness. It’s strategy.  
And it’s one that works surprisingly well:

---

### Key Takeaway

**Sometimes the fastest way forward is to go backward.**

GRAIL clients pursue their goals by backtracking through failure, stacking up insights, and returning to earlier affordances only when the conditions are right.

It’s not about knowing the path—it’s about clearing it as you go.

---

### Further Reading

- [GRAIL Demo Runner](https://github.com/mamund/grail-demo) – Minimal example with real code and clear logic  
- [What is ALPS?](https://alps.io) – Lightweight affordance profiles used to describe API interactions  
- [REST Isn’t Enough Anymore](https://mamund.substack.com/p/from-hypermedia-to-autonomous-agents) – How we got from hypermedia to goal-seeking agents  
- [A Composable Model for Agentic API Access](https://mamund.substack.com/p/designing-for-goal-seeking-clients) – The broader vision behind GRAIL-style clients  
