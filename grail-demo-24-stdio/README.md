# Demo 24: Adding a stdio binding

This demo extends Demo 23 by adding a third binding protocol to GRAIL:
`stdio`.

Demo 23 established that affordance failure does not necessarily end a
pursuit. The goal persists independently, failed affordances can be
excluded from later selection, and GRAIL can continue when another
viable producer remains.

Demo 24 asks a different question:

> **Can GRAIL invoke a local capability implemented outside Node.js
> without changing the pursuit machinery?**

The answer is yes.

A stdio binding allows GRAIL to launch a local process, send the
resolved affordance inputs as JSON on standard input, and receive the
capability result as JSON on standard output.

The central result is:

> **GRAIL can invoke language-independent local capabilities through a
> small process contract without changing how goals, conditions,
> affordances, effects, or pursuit operate.**

## What this demo proves

Demo 24 demonstrates that GRAIL can:

-   execute a local process through a `stdio` binding
-   pass resolved affordance inputs to the process as JSON on stdin
-   accept a JSON object from stdout
-   extract declared outputs from the returned JSON
-   treat a zero exit code plus valid JSON stdout as successful
    execution
-   treat a non-zero exit code as failure
-   treat malformed stdout as a binding failure even when the process
    exits with code 0
-   preserve exit code, stdout, stderr, and binding errors in
    observations
-   allow a successful capability to omit a declared output without
    GRAIL inferring domain failure
-   apply effects only when the binding reports success
-   use the existing pursuit machinery without protocol-specific changes

The stdio binding joins the existing Node and HTTP bindings:

``` text
Node    → local JavaScript capability
HTTP    → network-accessible capability
stdio   → local process capability
```

The runtime does not need to know what language or technology implements
the stdio capability.

## Application

This demo uses a deliberately small greeting capability so the binding
behavior can be tested independently of application complexity.

The capability is implemented in Python:

``` python
#!/usr/bin/env python3

import sys
import json

try:
    inputs = json.load(sys.stdin)

    name = inputs.get("name", "world")

    result = {
        "message": f"Hello, {name}!"
    }

    json.dump(result, sys.stdout)
    sys.exit(0)

except Exception as error:
    print(str(error), file=sys.stderr)
    sys.exit(1)
```

The capability can be exercised directly:

``` bash
echo '{"name":"Mike"}' | python3 greet.py
```

and returns:

``` json
{"message": "Hello, Mike!"}
```

The same program can then be invoked by GRAIL through the stdio binding.

## Goal

The demo goal is:

``` json
{
  "goal": "greetingCreated"
}
```

The world initially contains:

``` text
greetingCreated = false
```

The `greet` affordance can establish:

``` text
greetingCreated
```

Conceptually:

``` text
goal: greetingCreated
        ↓
select greet
        ↓
execute stdio binding
        ↓
SUCCESS
        ↓
greetingCreated = true
```

## Registry binding

The affordance uses the new `stdio` protocol:

``` json
{
  "greet": {
    "id": "aff-greet",
    "action": "greet",
    "type": "task",
    "preconditions": [],
    "inputs": {
      "name": "$inputs.name"
    },
    "effects": [
      "greetingCreated"
    ],
    "binding": {
      "protocol": "stdio",
      "command": "python3",
      "args": [
        "../stdio-greet/capabilities/greet.py"
      ],
      "outputs": {
        "message": {
          "from": "stdout",
          "path": "message"
        }
      }
    }
  }
}
```

The logical input remains part of the affordance:

``` text
name = $inputs.name
```

The binding determines how the resolved input reaches the
implementation.

For stdio, all resolved inputs are serialized as a single JSON object
and written to stdin.

## The stdio contract

The initial stdio contract is deliberately small.

``` text
command
    ↓
optional args
    ↓
spawn process
    ↓
write resolved inputs as JSON to stdin
    ↓
read stdout
    ↓
interpret execution result
```

A successful stdio interaction requires:

``` text
process exits with code 0
        +
stdout contains valid JSON
        =
binding SUCCESS
```

Anything else is a binding failure.

stderr is retained as diagnostic information.

Declared outputs are extracted from the parsed stdout object.

No timeout, working-directory option, environment configuration,
configurable success codes, or general CLI parsing semantics are
introduced in this experiment.

## Successful execution

The happy-path execution produced:

``` text
[CLIENT] Starting pursuit: greetingCreated
[CLIENT] Pushing goal affordance: greet

[SERVER] Attempting affordance: greet
[SERVER] Executing binding: python3 ../stdio-greet/capabilities/greet.py
[SERVER] Binding succeeded: python3 ../stdio-greet/capabilities/greet.py
[SERVER] Success: applying effects - greetingCreated
[CLIENT] Affordance succeeded: greet
[CLIENT] Goal reached: greetingCreated
```

The observation records the complete process interaction:

``` json
[
  {
    "invocation": {
      "id": "inv-001",
      "affordance": "greet",
      "command": "python3",
      "args": [
        "../stdio-greet/capabilities/greet.py"
      ],
      "inputs": {
        "name": "Mike"
      }
    },
    "response": {
      "exitCode": 0,
      "stdout": {
        "message": "Hello, Mike!"
      },
      "stderr": ""
    },
    "outputs": {
      "message": "Hello, Mike!"
    },
    "result": "SUCCESS"
  }
]
```

The `message` value is captured from stdout according to the binding's
output declaration.

The successful affordance then establishes:

``` text
greetingCreated = true
```

## Failure observations

Initial testing exposed an observability issue.

The first stdio implementation rejected immediately when a process
returned a non-zero exit code or invalid JSON. The GRAIL result was
correctly recorded as `FAIL`, but useful process information such as
exit code, stdout, and stderr was lost before the observation was
created.

The binding was changed so that a process which actually runs returns
its complete interaction to the binding adapter.

This keeps two concerns separate:

``` text
observation
    detailed evidence about what happened

GRAIL result
    SUCCESS | FAIL
```

The observation can therefore retain transport and process details
without adding new execution states to GRAIL.

## Experiment 1: successful execution

The normal greeting capability:

``` text
exit code: 0
stdout: valid JSON
declared output: present
```

produced:

``` text
result: SUCCESS
outputs.message: "Hello, Mike!"
effect applied: greetingCreated
```

Result:

``` text
PASS
```

## Experiment 2: non-zero exit

A test capability deliberately wrote an error to stderr and exited with
code 1.

The observation retained:

``` json
{
  "response": {
    "exitCode": 1,
    "stdout": "",
    "stderr": "Intentional capability failure\n",
    "error": "Intentional capability failure"
  },
  "outputs": {},
  "result": "FAIL"
}
```

The capability failed.

No effects were applied.

Result:

``` text
PASS
```

## Experiment 3: process-level failure

A registry typo referenced a Python file that did not exist.

Python itself launched successfully but returned exit code 2.

The observation retained the complete interaction:

``` json
{
  "response": {
    "exitCode": 2,
    "stdout": "",
    "stderr": "python3: can't open file '...': [Errno 2] No such file or directory\n",
    "error": "python3: can't open file '...': [Errno 2] No such file or directory"
  },
  "outputs": {},
  "result": "FAIL"
}
```

GRAIL does not need a special process-error result.

The detailed evidence is retained in the observation while the execution
contract remains:

``` text
FAIL
```

Result:

``` text
PASS
```

## Experiment 4: invalid stdout

Another capability exited successfully but wrote plain text instead of
JSON:

``` text
Hello, Mike!
```

The process itself returned:

``` text
exit code 0
```

but the stdio binding contract was not satisfied.

The observation recorded:

``` json
{
  "response": {
    "exitCode": 0,
    "stdout": "Hello, Mike!\n",
    "stderr": "",
    "error": "Invalid JSON on stdout: ..."
  },
  "outputs": {},
  "result": "FAIL"
}
```

This exposes a useful distinction:

``` text
process execution        succeeded
binding contract         failed
GRAIL result             FAIL
```

GRAIL does not need to model these as separate result types.

Result:

``` text
PASS
```

## Experiment 5: missing declared output

The final test returned valid JSON but omitted the output declared in
the registry.

The capability returned:

``` json
{
  "somethingElse": "Hello, Mike!"
}
```

The process exited with code 0 and stdout contained valid JSON.

The resulting observation was:

``` json
{
  "response": {
    "exitCode": 0,
    "stdout": {
      "somethingElse": "Hello, Mike!"
    },
    "stderr": ""
  },
  "outputs": {},
  "result": "SUCCESS"
}
```

This behavior is intentional.

The binding successfully executed the capability and the capability
reported success.

GRAIL attempted to extract the declared `message` output, did not find
it, and therefore captured no output.

It did not reinterpret the missing value as domain failure.

This preserves an important boundary:

> **Outputs are captured data, not postconditions.**

If producing a particular value is required for a capability to consider
its work successful, that requirement belongs to the capability.

GRAIL does not infer domain semantics from the returned object.

## A diagnostic consequence

The missing-output experiment exposes a possible diagnostic challenge
for larger scenarios.

Suppose affordance A succeeds and establishes an effect, but fails to
return an output that a later affordance B expects:

``` text
A
    ↓
SUCCESS
    ↓
effect X established

later...

B
    ↓
requires input from A
    ↓
input cannot be resolved
```

The failure may become visible later during input resolution rather than
when A executes.

This experiment does not attempt to change that behavior.

A future diagnostic improvement could explain the provenance of an
unresolved input, including the output expression and the earlier
invocation from which the value was expected.

That would improve diagnostics without requiring GRAIL to decide whether
the missing output represented domain failure.

## Execution result remains simple

Demo 24 does not introduce additional execution result types.

An invoked affordance still produces:

``` text
SUCCESS
```

or:

``` text
FAIL
```

The observation may contain much richer evidence:

``` text
exitCode
stdout
stderr
error
outputs
```

but those details do not expand the GRAIL execution contract.

This preserves the distinction between:

``` text
what happened
    ↓
observation

what GRAIL needs to know
    ↓
SUCCESS | FAIL
```

## Domain opacity

The stdio experiments reinforce a broader GRAIL principle.

The runtime understands the declared mechanics of the world:

``` text
goals
conditions
preconditions
effects
inputs
bindings
outputs
```

It does not need to understand the application domain implemented by a
capability.

For example, GRAIL does not inspect:

``` json
{
  "somethingElse": "Hello, Mike!"
}
```

and attempt to decide whether a greeting was really created.

The capability owns that judgment.

If the capability reports success according to the binding contract,
GRAIL applies the affordance's declared effects.

This keeps application-domain semantics outside the GRAIL runtime.

## Binding architecture

Demo 24 adds stdio without changing the pursuit algorithm.

The three current binding styles can be viewed as:

``` text
                    affordance
                        ↓
                  resolved inputs
                        ↓
                binding dispatcher
                  ↙     ↓      ↘
               Node    HTTP    stdio
                ↓       ↓        ↓
             module   service   process
```

Each binding adapts an implementation-specific interaction to the same
normalized runtime contract.

The pursuit machinery does not need to know which protocol executed the
capability.

This is an important result of the experiment.

The binding abstraction can expand the kinds of capabilities available
in a GRAIL world without expanding the responsibilities of the pursuit
engine.

## Language-independent local capabilities

The Node binding provides a direct local integration for JavaScript
modules.

The stdio binding provides a more general local process boundary.

Any implementation capable of:

``` text
read JSON from stdin
execute capability
write JSON to stdout
set process exit code
```

can participate.

That can include programs implemented in:

``` text
Python
Go
Rust
Java
Ruby
compiled executables
shell-launched applications
```

The implementation language remains opaque to GRAIL.

## Relationship to protocol-based tool systems

The stdio binding also creates a capability boundary similar in spirit
to richer tool protocols.

GRAIL can invoke an independently implemented capability through a
stable process contract without embedding that implementation in the
runtime.

The stdio contract is intentionally much smaller than a full tool
protocol:

``` text
JSON inputs
    ↓
process
    ↓
JSON result
```

GRAIL then supplies the surrounding autonomous-world semantics:

``` text
preconditions
effects
world state
goal
selection
pursuit
```

This means a capability can remain independently implemented while still
participating in a GRAIL world.

## Result

The experiment demonstrated:

``` text
stdio binding added                               PASS
resolved inputs serialized to stdin               PASS
Python capability executed                        PASS
valid JSON stdout parsed                           PASS
declared stdout output extracted                   PASS
successful execution applies effects               PASS
non-zero exit produces FAIL                        PASS
process diagnostics retained on failure            PASS
exit 0 with invalid JSON produces FAIL              PASS
raw invalid stdout retained in observation          PASS
missing declared output does not imply FAIL         PASS
missing output produces empty captured outputs      PASS
SUCCESS / FAIL execution contract preserved         PASS
pursuit machinery unchanged                         PASS
language-independent local capability boundary      PASS
```

No new pursuit states were added.

No domain-specific output validation was added.

No protocol-specific behavior was added to the pursuit algorithm.

The stdio binding remains an adapter between a GRAIL affordance and a
local process.

## Architectural note

Demo 24 also helped clarify a broader principle behind GRAIL:

> **What is not in the agent must be in the environment.**

See [What Is Not in the Agent Must Be in the Environment](./ENVIRONMENT.md)
for a discussion of how explicitly designed environments can support
bounded autonomy without requiring an LLM.

## Status

``` text
Demo 24: PASS
```

Demo 24 adds a third execution boundary to GRAIL:

``` text
Node
HTTP
stdio
```

The experiment demonstrates that GRAIL can expand the set of available
implementation technologies without changing its model of autonomous
pursuit.

The stdio binding accepts resolved inputs, invokes an independent local
process, captures the process interaction, extracts available outputs,
and reduces the result to the same execution contract used elsewhere:

``` text
SUCCESS | FAIL
```

Detailed execution evidence remains available in observations.

Domain meaning remains inside the capability.

The result is a small, language-independent local capability boundary
that considerably expands what can participate in a GRAIL world.
