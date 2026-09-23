# Demo 16: HTTP Output Sources

Demo 16 extends GRAIL's HTTP binding support to capture outputs from multiple parts of an HTTP response.

Earlier demos established HTTP execution, input placement, observations, and output extraction from response bodies. Demo 16 adds output extraction from HTTP response headers and status codes.

The goal is deliberately small:

> Allow an HTTP interaction to expose named outputs from its body, headers, and status.

## What this demo adds

HTTP bindings now support three output sources:

```text
from: body
from: header
from: status
```

Each source has a small, source-specific declaration.

### Body

Body extraction retains the behavior introduced in Demo 14.

```json
{
  "accountId": {
    "from": "body",
    "path": "account.id"
  }
}
```

`path` identifies the value within the response body using simple dot-path traversal.

### Header

A response header can now be exposed as an output.

```json
{
  "etag": {
    "from": "header",
    "name": "ETag"
  }
}
```

`name` identifies the HTTP response header. Header-name matching is case-insensitive.

### Status

The HTTP response status can be exposed directly.

```json
{
  "httpStatus": {
    "from": "status"
  }
}
```

No additional selector is required. The resulting value is the numeric HTTP status code.

## Example

The `lookupCustomer` capability declares three outputs:

```json
{
  "outputs": {
    "accountId": {
      "from": "body",
      "path": "account.id"
    },
    "etag": {
      "from": "header",
      "name": "ETag"
    },
    "httpStatus": {
      "from": "status"
    }
  }
}
```

The capability stub returns a customer representation, an `ETag` header, and HTTP status `200`.

The resulting observation contains:

```json
{
  "outputs": {
    "accountId": "A97",
    "etag": "\"customer-123-v1\"",
    "httpStatus": 200
  }
}
```

## Outputs and observations

Demo 16 does not require an extracted output to be consumed by another affordance.

In this example, `accountId` is subsequently used by `lookupAccount`:

```text
$outputs.lookupCustomer.latest.accountId
```

The `etag` and `httpStatus` outputs are not used by another affordance. They are simply recorded in the observation.

This reinforces an important distinction:

> Observations describe what happened. They are not limited to information required by the current traversal.

An output can therefore be observed and available without being consumed.

## Extraction and consumption remain separate

Demo 16 preserves the separation established in Demo 14:

```text
CAPTURE

HTTP response
    ↓
extract declared outputs
    ↓
observation


CONSUME

capability input
    ↓
$outputs reference
    ↓
observation lookup
    ↓
value
```

Adding header and status extraction does not change `$outputs` resolution.

Once a value has been extracted into `observation.outputs`, GRAIL treats it like any other named output regardless of where it originated in the HTTP response.

## Binding-specific interpretation

The meanings of `body`, `header`, and `status` belong to the HTTP binding.

GRAIL itself does not need to understand HTTP response structure.

Conceptually:

```text
HTTP response
      ↓
HTTP binding interpretation
      ↓
named outputs
      ↓
GRAIL observation
```

This suggests a broader binding rule:

> Bindings interpret their native execution results and expose named outputs to GRAIL.

A future binding does not need to reproduce HTTP concepts. For example, a local Node module binding might expose outputs from a returned result instead.

## Schema rules

The registry schema enforces the shape appropriate to each HTTP output source:

```text
body      requires path
header    requires name
status    requires no additional selector
```

No general-purpose extraction or transformation language is introduced.

The intent is to keep output extraction declarative and deliberately small.

## Result semantics

Output extraction remains independent of the GRAIL execution result.

A successful HTTP response can produce outputs, but a non-successful HTTP response can also contain useful information that may be captured as outputs.

The existing result semantics remain unchanged:

```text
BLOCKED   capability was not executed

SUCCESS   capability executed successfully
          (or an unbound capability passed its environment checks)

FAIL      capability was executed but did not succeed
```

HTTP status therefore contributes to determining the result of the HTTP interaction, but it can also be captured independently as an observed output.

## What changed

Demo 16 makes focused changes to:

```text
registry.schema.json
registry.json
server.js
capability-stub.js
```

The HTTP executor already captured response status, headers, and body, so `httpBinding.js` required no change.

`observationStore.js` also required no change because it operates on named outputs after extraction.

This is significant: the new HTTP-specific behavior remains at the extraction boundary without changing GRAIL's output-resolution mechanism.

## Validation

The environment can be checked using the standalone validator:

```console
$ node grail-validate.js config
```

The Demo 16 configuration validates successfully against the updated registry schema.

## Running the demo

Start the capability stub:

```console
$ node capability-stub.js
```

Then run the GRAIL environment:

```console
$ node run.js
```

After the run, inspect:

```text
observations.json
```

The `lookupCustomer` observation should contain:

```json
{
  "outputs": {
    "accountId": "A97",
    "etag": "\"customer-123-v1\"",
    "httpStatus": 200
  }
}
```

The traversal otherwise behaves as it did in Demo 14.

## What this demo proves

Demo 16 demonstrates that an HTTP interaction can expose information from several native HTTP response locations without changing GRAIL's observation or output-consumption model.

The HTTP binding understands:

```text
body
header
status
```

GRAIL understands:

```text
named outputs
```

That boundary is the important result of the experiment.

## Summary

Demo 14 established that GRAIL could learn information from an HTTP response and use that information during subsequent execution.

Demo 16 broadens what can be learned from that response.

```text
HTTP response
    ↓
body / header / status
    ↓
named outputs
    ↓
observation
```

Those outputs may be consumed later, or they may simply remain part of the evidence describing what happened.

The HTTP binding interprets HTTP.

GRAIL observes the results.

