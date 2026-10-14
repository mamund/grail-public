# Demo 25: LLM-backed capabilities with Ollama and Qwen

Demo 25 extends the stdio binding introduced in Demo 24 and the failure-recovery behavior established in Demo 23. It tests whether an LLM-backed capability can participate in a GRAIL environment alongside a deterministic alternative, without changing the pursuit machinery.

> **GRAIL can invoke a local LLM as an ordinary capability and recover from its failure by selecting another affordance that establishes the same effect.**

## What this demo demonstrates

- Local Qwen inference through Ollama's HTTP API, called from a Node.js stdio capability.
- A shared input and output contract across an LLM-backed and a rules-based classifier.
- Runtime selection between two affordances that produce the same goal effect.
- A failed Ollama invocation recorded as FAIL, without applying the effect.
- Recovery through an alternative producer, without a declared fallback sequence.
- Observation capture of process results and extracted classification outputs.

No changes to GRAIL's generic pursuit or binding machinery were required.

## Application and environment

The goal is to classify a customer message into `billing`, `support`, or `sales`.

`config/goal.json` declares `customerMessageClassified`. The initial `config/worldstate.json` sets that condition to `false`. `config/inputs.json` supplies:

```json
{
  "message": "I was charged twice for my order."
}
```

Two affordances in `config/registry.json` can establish the same effect:

| Affordance | Capability | Implementation |
| --- | --- | --- |
| `classifyCustomerMessage` | `capabilities/classify-message.mjs` | Calls Ollama with `qwen2.5:3b` |
| `classifyWithRules` | `capabilities/classify-rules.mjs` | Local keyword matching |

Both have no preconditions, resolve `message` from `$inputs.message`, use `stdio` with the `node` command, and extract `category` from JSON stdout.

Conceptually:

```text
goal: customerMessageClassified
             |
     select viable producer
          /              Qwen       rules
          \       /
          SUCCESS
             |
customerMessageClassified = true
```

Selection is not a fixed priority order. The current selection policy may choose either affordance first.

## Requirements

- Node.js 22+ and the dependencies declared in `package.json`.
- Ollama running locally at `http://localhost:11434` for the Qwen path.
- Ollama model `qwen2.5:3b` installed.

On a system with Ollama installed:

```bash
ollama pull qwen2.5:3b
ollama list
```

The rules-based capability runs without Ollama. From this demo directory, install Node dependencies if necessary:

```bash
npm install
```

## Run the experiment

First, test the two capabilities independently:

```bash
echo '{"message":"I was charged twice for my order."}' | node capabilities/classify-message.mjs
echo '{"message":"I was charged twice for my order."}' | node capabilities/classify-rules.mjs
```

With Ollama available, each should return:

```json
{"category":"billing"}
```

Validate the environment and pursue the goal from this directory:

```bash
node grail-validate.js config
node run.js
```

The selected affordance may vary. A successful run applies `customerMessageClassified` and reports that the goal was reached. Inspect `config/observations.json` for the selected affordance, process exit code, parsed stdout, extracted `category`, and result.

## Failure and recovery test

On a Linux installation managed by systemd, stop Ollama:

```bash
sudo systemctl stop ollama
```

Run the pursuit again:

```bash
node run.js
```

When `classifyCustomerMessage` is selected first, the Ollama request fails. GRAIL excludes that failed affordance for the current pursuit, selects `classifyWithRules`, and reaches the goal if the rules-based classifier succeeds.

An observed recovery trace was:

```text
[CLIENT] Pushing goal affordance: classifyCustomerMessage
[SERVER] Binding failed: fetch failed
[CLIENT] Affordance failed: classifyCustomerMessage
[CLIENT] Pushing goal affordance: classifyWithRules
[SERVER] Binding succeeded: node ./capabilities/classify-rules.mjs
[SERVER] Success: applying effects - customerMessageClassified
[CLIENT] Goal reached: customerMessageClassified
```

If the rules-based classifier is selected first, the run can succeed without invoking Qwen. Repeat the run to observe the recovery sequence; there is no fixed first-choice ordering.

Restart Ollama afterward:

```bash
sudo systemctl start ollama
```

If Ollama was launched manually with `ollama serve`, stop and restart that process instead.

## Execution contract and observations

Both capabilities read a JSON object from stdin and write a JSON object containing `category` to stdout. Diagnostic errors go to stderr and set a nonzero process exit status. GRAIL interprets a zero exit code with valid JSON stdout as SUCCESS; a nonzero exit or invalid JSON stdout as FAIL.

The Qwen capability constructs a prompt with explicit category definitions, calls `/api/generate` with `format: "json"` and `stream: false`, and checks that the returned category belongs to the allowed set. It sets temperature to zero, which reduces variation but does not guarantee identical or correct answers.

The rules-based capability checks keyword lists in `billing`, `support`, `sales` order and returns the first match. It fails if no keyword matches. Its vocabulary and substring matching are deliberately limited.

GRAIL observations capture the STDIO result and extracted output. They do not automatically capture the complete Ollama prompt, inference parameters, or raw HTTP response inside the capability.

## Findings and boundaries

Demo 25 confirms that LLM-backed and deterministic implementations can coexist as producers of the same effect. The runtime handles execution and failure through its existing binding and pursuit contracts, independent of the model used by a capability.

**A successful classification invocation does not establish semantic accuracy.** Both implementations can produce a structurally valid category while disagreeing about its meaning. The current environment does not model classifier quality, cost, confidence, or preference between producers.

The experiment reinforces the principle established in Demo 23: a failed affordance does not necessarily terminate a pursuit when another viable producer remains.
