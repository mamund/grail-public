# Composing GRAIL Scenarios

Programming in GRAIL requires a different set of habits from programming
a workflow.

A workflow programmer describes a process: what should happen, in what
order, and under what branches. A GRAIL composer describes a scenario
containing a goal, relevant conditions, and the capabilities available
to transform those conditions until the goal can succeed.

The fundamental question changes from *what should happen next?* to
*what must be true?*

This paper is a guide to thinking and composing in GRAIL space. It
focuses on the practical decisions involved in constructing a scenario:
identifying the goal, modeling the conditions that matter, composing
capabilities through those conditions, managing data dependencies, and
connecting affordances to executable implementations through bindings.

The overall process begins at the goal and works backward. For each
affordance, determine what must be true for it to succeed. Those
requirements become preconditions. For each unmet condition, identify
one or more affordances capable of establishing it. Continue until the
scenario contains enough capabilities and conditions to make the goal
achievable from its initial worldstate.

As the scenario develops, several design disciplines become important.
Conditions should describe facts rather than execution history.
Capabilities should make no assumptions about traversal order or about
which other capabilities established their preconditions. Inputs and
outputs should make data dependencies explicit. Effects should
accurately describe the changes produced by successful execution.
Bindings should connect affordances to implementations without allowing
implementation details to shape the surrounding composition.

The sections that follow examine each of these practices in more detail.
Together they describe a method for composing GRAIL scenarios in which
the designer defines the environment and its possibilities while leaving
the particular traversal to GRAIL.

## Start at the goal

Every GRAIL scenario begins with a goal: the outcome the scenario is
intended to achieve. In GRAIL, that goal is represented by an
**affordance**.

An affordance is a possibility for action. It describes something that
can potentially be done in the current environment. An affordance such
as `onboardCustomer`, `approveOrder`, or `drinkCoffee` represents an
action that GRAIL may attempt when the conditions required for that
action are satisfied.

Affordances are central to GRAIL because they define the available
possibilities in a scenario. Rather than encoding a sequence of steps,
the composer defines a collection of affordances and the conditions
under which each becomes available for execution. GRAIL uses those
relationships to pursue the goal.

Start by defining the affordance that represents the desired outcome. Do
not begin by designing the steps that lead to it. Instead, ask:

*What must be true for this affordance to succeed?*

The answers become **preconditions**.

A precondition is a condition that must already be true before an
affordance can be executed. For example, an `onboardCustomer` affordance
might require conditions such as:

`customerProfileCollected`

`customerEmailVerified`

`customerTermsAccepted`

These preconditions do more than document expectations. They determine
whether the affordance is currently available for execution. If all of
its preconditions are satisfied, GRAIL can attempt the affordance. If
one or more are not satisfied, the affordance is blocked.

An unmet precondition gives GRAIL another problem to solve. The scenario
can contain other affordances whose successful execution establishes
that condition. If `customerEmailVerified` is false, for example, an
affordance such as `verifyCustomerEmail` might be capable of making it
true.

That affordance may have preconditions of its own. Apply the same
question again:

*What must be true for this affordance to succeed?*

Continue working backward in this way, adding conditions and affordances
until the scenario contains the possibilities needed to reach the goal
from its initial worldstate.

This is the basic method by which a GRAIL scenario grows. The composer
starts with success and progressively describes the conditions and
capabilities that can make success possible. The resulting structure
defines relationships among possibilities without prescribing the path
GRAIL must take through them.

## Think in conditions, not sequences

Once you begin working backward from the goal, the conditions you choose
determine the shape of the scenario.

A good condition describes something that is true or false about the
world without saying anything about how it became true. Prefer:

`customerEmailVerified`

over:

`verifyEmailCompleted`

The first describes the current state of the world. The second records
something about its execution history.

This distinction is fundamental to GRAIL. An affordance that requires
`customerEmailVerified` does not need to know who verified the email,
which capability was used, or when verification occurred. It only needs
the condition to be true.

That separation allows the scenario to grow. Another affordance might
provide a different way to establish `customerEmailVerified`. The
condition might already be true when the scenario begins. A broader
capability might establish it along with several other conditions. None
of these changes should matter to an affordance that simply requires
`customerEmailVerified`.

This also provides an important test when defining preconditions:

*Must this condition actually be true for the affordance to succeed?*

Do not add a precondition simply because some action normally occurs
earlier in a familiar process. Doing so turns an observed sequence into
a required dependency and unnecessarily restricts the ways the scenario
can succeed.

The composer describes necessary relationships among states rather than
prescribing execution order. As those states change, different
affordances become available, allowing execution order to emerge from
the scenario itself.

## Allow alternative ways to satisfy conditions

A condition does not belong to the affordance that establishes it.

Once a condition such as `customerEmailVerified` is part of the world
model, any suitable affordance may be capable of making it true.

A scenario might initially contain:

`verifyEmailByLink → customerEmailVerified`

Later, another affordance might be added:

`verifyEmailByCode → customerEmailVerified`

Both are valid ways of producing the same state. An affordance requiring
`customerEmailVerified` does not need to change because it depends on
the condition rather than on either producer.

Alternatives can also exist at different levels of granularity. A
focused affordance might establish one condition, while a broader
affordance establishes that condition along with several others.

This is a useful property of a GRAIL scenario. Adding another producer
expands the possibilities available to GRAIL without requiring existing
consumers of the condition to be rewritten.

When composing a scenario, therefore, avoid treating the first producer
of a condition as the permanent owner of that condition. Other ways of
establishing the same state may appear as the scenario evolves.

A useful test is:

**If I add another valid way to establish this condition, what breaks?**

Ideally, very little. If unrelated affordances or capabilities must
change, the composition may contain hidden assumptions about execution
order, traversal history, or the identity of a particular producer.

## Model only the world you need

Once conditions are treated as facts about the world, another question
arises: which facts belong in the scenario?

The composer determines the fidelity of the GRAIL world. A scenario does
not need to represent everything that is true about its domain. It needs
to represent the distinctions that matter to the goal and the
capabilities available to pursue it.

Consider a simple goal:

`drinkCoffee`

At the lowest possible fidelity, `drinkCoffee` could have no
preconditions at all. GRAIL could simply attempt the affordance.

Our knowledge of the domain suggests reasons that might be insufficient.
The coffee may need to be brewed. It may need to be in a cup. The beans
may need to be ground. The machine may need to be ready.

Each of these observations could become a condition:

`coffeeBrewed`

`coffeeInCup`

`beansGround`

`machineReady`

Adding one of these conditions makes a new distinction visible to GRAIL.
If `coffeeBrewed` becomes a precondition of `drinkCoffee`, the scenario
must now account for whether coffee has been brewed and provide some way
to establish that condition when it is false.

This means that every condition carries a modeling cost. A more detailed
world can represent more constraints, alternatives, and intermediate
states, but those distinctions should serve a purpose.

A useful approach is to begin with the simplest scenario that can
express the goal and then increase its fidelity deliberately. When a
capability genuinely requires another fact to be true, represent it.
When a distinction matters to whether an operation can safely execute,
represent it. When two situations need to produce different
possibilities, the world model may need enough fidelity to distinguish
between them.

Avoid adding conditions simply because they exist in the real domain.
GRAIL does not need a complete description of reality. It needs a model
detailed enough to support the decisions required by the scenario.

The resulting world model should therefore grow from demonstrated
requirements rather than anticipated complexity. Start with the goal,
discover the conditions that matter, and add fidelity as the composition
demands it.

## Compose capabilities through conditions

So far, we have focused on describing the GRAIL scenario: defining
affordances, identifying their preconditions, and choosing the
conditions that matter to the world model. Eventually those affordances
must be connected to code that performs the actual work.

That code is the **capability** behind the affordance.

An affordance describes a possibility for action within the GRAIL world.
A capability implements that action in the application domain. For
example, the scenario might contain a `grindCoffee` affordance backed by
code that operates a coffee grinder, or a `verifyCustomerEmail`
affordance backed by code that performs the actual verification.

The same independence we applied while composing the world should carry
into the capabilities themselves.

Capabilities should not depend directly on other capabilities.

Suppose the scenario says that `grindCoffee` establishes:

`coffeeGround`

and `brewCoffee` requires:

`coffeeGround`

The capability behind `brewCoffee` should operate on the assumption that
its declared preconditions have been satisfied. It should not depend on
the `grindCoffee` capability having executed first.

The important relationship is the condition:

`grindCoffee → coffeeGround → brewCoffee`

not a direct dependency:

`grindCoffee → brewCoffee`

The capability does not need to know how the world reached its current
state. It needs the inputs required to perform its operation and the
state represented by the affordance's preconditions.

This is one of the central disciplines of GRAIL capability design:
**program capabilities against the conditions of the world rather than
against an expected sequence of other capabilities.**

Doing so preserves in the implementation the same independence
established in the scenario model.

## Depend on state, not traversal history

Writing capabilities against conditions has an important consequence for
the code itself: a capability should make no assumptions about the path
that led to its execution.

When a capability is invoked, it can rely on the conditions declared by
its affordance as preconditions. It should not assume which affordance
ran previously, which capability established those conditions, or which
affordance will run next.

Consider a scenario with several fine-grained affordances:

`grindCoffee → coffeeGround`

`prepareMachine → machineReady`

`heatWater → waterHeated`

A `brewCoffee` affordance might require all three conditions.

It would be tempting for the capability behind `brewCoffee` to assume
that `grindCoffee`, `prepareMachine`, and `heatWater` have already
executed. That assumption happens to match one possible traversal, but
it is stronger than the contract expressed by the scenario.

Later, we might introduce a broader affordance:

`prepareCoffee → coffeeGround, machineReady, waterHeated`

Now the same preconditions can be satisfied without any of the three
fine-grained affordances executing.

The `brewCoffee` capability should require no changes. Its world looks
exactly the same: the conditions it depends upon are true.

A useful programming rule follows:

**Capabilities may depend on conditions. They should not depend on the
path by which those conditions were established.**

This means avoiding code that reconstructs or relies on traversal
history merely to determine whether an operation is appropriate. That
decision has already been expressed through the affordance's
preconditions.

Program the capability for the state in which it can validly operate.
Let the GRAIL composition determine how that state is reached.

## Choose capability boundaries deliberately

Capability independence does not require every capability to operate at
the same level of granularity.

A capability might perform a focused operation such as `grindCoffee`,
while another performs the broader operation `prepareCoffee`. The first
might establish a single condition:

`grindCoffee → coffeeGround`

while the second might establish several:

`prepareCoffee → coffeeGround, machineReady, waterHeated`

Both are valid capabilities. GRAIL does not prescribe how much work a
capability should perform.

The appropriate boundary comes from the application domain and the
operation being implemented. Consider whether the work forms a coherent
unit, whether it has a meaningful success or failure outcome, whether it
can be independently implemented or replaced, and whether exposing it
separately provides useful control or observation.

Avoid dividing an operation simply to create more steps for GRAIL to
traverse. Likewise, avoid combining operations merely to reduce the
number of affordances in a scenario. Capability boundaries should
reflect meaningful units of domain behavior.

Independence remains the important constraint. A capability should be
able to perform its operation without knowledge of the traversal
surrounding it. A coarse-grained capability should not require the
fine-grained versions to have executed, and fine-grained capabilities
should not need to know that a broader alternative exists.

This allows coarse- and fine-grained capabilities to coexist safely as
different ways of transforming the same world.

## Declare the real effects

Once a capability boundary has been chosen, the affordance should
accurately describe what successful execution of that capability makes
true.

These changes are declared as the affordance's **effects**.

A focused capability may produce a single effect:

`grindCoffee → coffeeGround`

A broader capability may legitimately produce several:

`prepareCoffee → coffeeGround, machineReady, coffeeBrewed`

Declare all of the conditions that become meaningfully true as a result
of the operation. There is no requirement that an affordance have only
one effect, and restricting it to one can produce an inaccurate model of
what the capability actually accomplished.

Multiple effects are especially important when capabilities operate at
different levels of granularity. A broad capability can accurately
report all of the conditions it establishes while focused capabilities
may establish those same conditions individually.

Effects therefore describe the consequences of successful execution, not
the intended next step in a process. Their purpose is to update GRAIL's
understanding of the world so that other affordances can become
available when their preconditions are satisfied.

Accurately declaring effects allows capabilities of different
granularity to coexist while preserving the independence of the
affordances that consume the conditions they establish.

## Separate conditions from data

So far, we have focused primarily on conditions: facts about the world
that determine whether an affordance is available for execution.
Capabilities usually need something else as well: data.

Conditions and data serve different purposes in a GRAIL scenario.

A condition represents a fact that is relevant to execution:

`customerKnown`

`emailVerified`

`accountLoaded`

These conditions are part of worldstate. They are true or false, and
affordances use them as preconditions and effects.

Data carries the values capabilities need to perform their operations:

`customerId`

`emailAddress`

`accountId`

Knowing that `customerKnown` is true tells GRAIL that an affordance
requiring a known customer may be attempted. The capability behind that
affordance may still need the actual `customerId` in order to do its
work.

This distinction keeps the world model focused on the facts that govern
possibilities while allowing data to flow between capabilities without
turning every value into worldstate.

When composing a scenario, ask two different questions:

*What must be true before this affordance can be attempted?*

and:

*What information does the capability need in order to perform the
operation?*

The first question identifies preconditions. The second identifies
inputs.

Avoid creating conditions merely because a capability needs a value.
Likewise, do not use the presence or absence of some hidden value as a
substitute for a meaningful condition in the world model.

A GRAIL scenario can depend on both state and data. Keeping them
distinct makes each dependency explicit and gives each one a clear
purpose.

## Make data dependencies visible

Once a capability's required data has been identified, declare that data
as inputs to the affordance.

A capability should receive the information it needs to perform its
operation without having to know how the surrounding scenario obtained
it.

Suppose `lookupCustomer` produces a `customerId`, and a later
`lookupAccount` capability needs that identifier:

`lookupCustomer → customerId`

`customerId → lookupAccount`

The `lookupAccount` capability should accept `customerId` as an input.
It should not need to know that `lookupCustomer` executed earlier,
inspect traversal history to find it, or otherwise reconstruct how the
value became available.

GRAIL can resolve an affordance input from available scenario data,
including outputs captured from previously executed affordances. The
binding then maps that input into the form expected by the underlying
implementation.

This preserves the same independence we established for conditions. A
capability depends on the data it requires rather than on the particular
capability that happened to produce that data.

The distinction is subtle but important. A condition such as
`customerKnown` establishes that the world is in an appropriate state
for an operation. An input such as `customerId` supplies the concrete
information needed to perform that operation. A capability may require
both.

Program capabilities to accept the information they need. Let the
composition determine where that information comes from.

## Bind affordances to implementations

A GRAIL scenario describes affordances, conditions, inputs, and effects
without requiring those descriptions to contain the details of how the
underlying operations are executed.

The **binding** provides that connection.

A binding associates an affordance with an executable capability and
describes how GRAIL interacts with it. An affordance such as
`lookupCustomer`, for example, might be bound to a local Node function,
an HTTP endpoint, a command-line program, or another supported execution
mechanism.

This separation allows the affordance to retain the same meaning
regardless of how its capability is implemented.

Consider:

`lookupCustomer`

The affordance might require `customerId` as an input and establish
`customerLoaded` when it succeeds. Those properties describe the role of
`lookupCustomer` within the scenario.

Its binding describes how that operation is actually invoked.

For an HTTP implementation, the binding might specify a request path,
method, headers, query parameters, or body. For a Node implementation,
it might identify a module and function. Other binding types can provide
their own invocation details.

Bindings also form the boundary between GRAIL's abstract data
dependencies and the concrete interface of an implementation. An
affordance may declare that it requires `customerId`; the binding
determines where that value belongs when invoking the capability.
Likewise, the binding can identify values returned by the implementation
that should become available as outputs to the scenario.

Keep these implementation details in the binding rather than allowing
them to shape the surrounding composition.

Ideally, changing:

`Node → HTTP`

or replacing one implementation with another should not require changes
to the affordance's role in the scenario. Its preconditions, effects,
and relationships with other affordances can remain intact while the
implementation beneath it changes.

This provides a useful test of the composition:

*Could I replace this implementation, perhaps using an entirely
different binding protocol, without redesigning the surrounding
scenario?*

If changing the binding requires unrelated affordances or conditions to
change, examine the composition for implementation details that have
leaked across the binding boundary.

## The craft of composition

Composing a GRAIL scenario involves several related kinds of work.

**World modeling** identifies the facts that matter and represents them
as conditions.

**Capability engineering** creates independent operations that can act
within that world.

**Composition** connects affordances through preconditions and effects
while making required data explicit through inputs and outputs.

**Binding** connects those affordances to executable implementations
without embedding implementation details into the surrounding scenario.

These concerns work together, but keeping their responsibilities
distinct is an important part of the craft.

The resulting programming style contains much less prescribed control
flow than a conventional workflow. If one affordance establishes a
condition another requires, there is no need to encode an instruction
saying that the first must be followed by the second. If several
affordances can establish the same condition, consumers of that
condition do not need to know which one GRAIL used.

The composer therefore spends less effort describing execution paths and
more effort describing the environment in which execution takes place:
what is possible, what must be true, what each operation makes true, and
what information each operation needs.

This is the central discipline of GRAIL composition:

**GRAIL programming is the practice of composing independent
capabilities through declared conditions, allowing valid execution to
emerge from the scenario that composition creates.**

## Putting it together

The method begins where the scenario should end: with the goal.

From that goal, work backward by asking what must be true. Represent
those requirements as conditions. Add affordances capable of
establishing unmet conditions, and continue until the scenario contains
the possibilities needed to make the goal achievable.

As the scenario grows, preserve the independence of its parts. Describe
state rather than execution history. Allow multiple affordances to
establish the same conditions. Program capabilities against the state
and data they require rather than against an expected traversal. Declare
the actual effects of successful execution. Use bindings to keep
implementation choices separate from the composition itself.

The result is a scenario that describes the conditions for success
without prescribing a single route to it.

That is the shift in thinking at the center of GRAIL: **define the
environment, not the path.**

## Glossary

**Affordance** --- A possibility for action within a GRAIL scenario. An
affordance declares the conditions required for execution, the effects
of successful execution, and any required inputs.

**Binding** --- The connection between an affordance and an executable
capability. A binding describes how GRAIL invokes the capability and
maps inputs and outputs to its concrete interface.

**Capability** --- Code or another executable implementation that
performs the operation represented by an affordance.

**Condition** --- A true-or-false fact about the GRAIL world. Conditions
are used as preconditions and effects.

**Effect** --- A condition that becomes true when an affordance executes
successfully.

**Goal** --- The affordance representing the outcome a GRAIL scenario is
pursuing.

**Input** --- Data required by an affordance's capability to perform its
operation.

**Output** --- Data produced by execution that can be made available to
other affordances.

**Precondition** --- A condition that must be true before an affordance
is available for execution.

**Scenario** --- A composition of a goal, conditions, affordances, data,
and bindings that defines the possibilities available to GRAIL.

**Worldstate** --- The current truth values of the conditions
represented in a GRAIL scenario.
