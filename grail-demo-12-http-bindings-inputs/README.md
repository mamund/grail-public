# GRAIL HTTP Binding Experiment: Input Representation

## Purpose

This experiment extends the GRAIL HTTP binding to pass capability inputs
to an external HTTP service.

The earlier HTTP binding experiment established that GRAIL could invoke
an external capability implementation while keeping preconditions and
world-state effects inside the GRAIL environment.

This experiment asks the next question:

> How should a GRAIL capability's logical inputs be represented when
> passed through an HTTP binding?

The experiment deliberately focuses on request-body representation.
Input placement in path segments, query arguments, headers, and the body
will be handled separately.

## Starting point

The existing HTTP binding supports external execution using a registry
entry such as:

``` json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/execute"
}
```

A capability already declares the logical inputs it requires:

``` json
"inputs": [
  "email",
  "phoneNumber",
  "streetAddress",
  "locality",
  "region",
  "postalCode",
  "country"
]
```

Before this experiment, GRAIL verified that these inputs were present
but did not send them to the external service.

## Design

The experiment separates two HTTP input-binding concerns:

-   **Placement** determines where an input goes.
-   **Representation** determines how body inputs are encoded.

For this experiment, placement is fixed:

> Capability inputs are placed in the HTTP request body.

The binding's media type determines their representation.

Two media types are supported:

``` text
application/json
application/x-www-form-urlencoded
```

If `contentType` is omitted, GRAIL assumes:

``` text
application/json
```

This keeps existing HTTP binding configurations valid.

## Binding configuration

The default JSON case requires no registry change:

``` json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/execute"
}
```

This is equivalent to:

``` json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/execute",
  "contentType": "application/json"
}
```

FORM encoding is selected explicitly:

``` json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/execute",
  "contentType": "application/x-www-form-urlencoded"
}
```

## Registry schema

The binding schema was extended with an optional `contentType` property:

``` json
"contentType": {
  "type": "string",
  "enum": [
    "application/json",
    "application/x-www-form-urlencoded"
  ]
}
```

`contentType` is intentionally not required.

The current binding schema therefore accepts:

-   no `contentType`, which defaults to JSON;
-   explicit `application/json`;
-   explicit `application/x-www-form-urlencoded`.

Other media types are currently rejected.

## Runtime changes

The HTTP execution code selects only the inputs declared by the
capability:

``` js
const body = Object.fromEntries(
  affordance.inputs.map(name => [name, inputs[name]])
);
```

The binding then determines the media type:

``` js
const contentType =
  affordance.binding.contentType || "application/json";
```

The request body is serialized according to that media type:

``` js
let requestBody;

if (contentType === "application/x-www-form-urlencoded") {
  requestBody = new URLSearchParams(body).toString();
} else {
  requestBody = JSON.stringify(body);
}
```

The resulting request uses the same media type in the HTTP
`Content-Type` header:

``` js
const response = await fetch(affordance.binding.url, {
  method: affordance.binding.method,
  headers: {
    "Content-Type": contentType
  },
  body: requestBody
});
```

No changes were required to the GRAIL client or traversal algorithm.

## JSON test

The first test used the default behavior with no `contentType` in the
registry.

A capability input was serialized as JSON and successfully received by
the external capability stub.

This demonstrated:

``` text
GRAIL runtime inputs
        ↓
capability input selection
        ↓
default application/json
        ↓
HTTP request body
        ↓
external service
```

The existing registry configuration remained unchanged.

## FORM test

The second test explicitly configured:

``` text
application/x-www-form-urlencoded
```

The `setCustomerContactDetails` capability supplied several inputs,
including values containing spaces and characters requiring URL
encoding.

The capability stub observed:

``` text
Content-Type: application/x-www-form-urlencoded
Raw body: email=jordan%40example.com&phoneNumber=%2B1-555-555-0100&streetAddress=123+Main+St.&locality=Periax&region=SX&postalCode=12345&country=US
```

After decoding, the service received:

``` text
email: jordan@example.com
phoneNumber: +1-555-555-0100
streetAddress: 123 Main St.
locality: Periax
region: SX
postalCode: 12345
country: US
```

This confirmed that the same logical capability inputs can be
transmitted using a different HTTP representation without changing the
capability definition.

## Empty-input test

A subsequent bound capability declared no inputs.

The request correctly used the default JSON representation and sent:

``` json
{}
```

This confirmed both behaviors:

-   missing `contentType` defaults to JSON;
-   a capability with no declared inputs produces an empty JSON object.

## Result

HTTP input representation v1 is working.

The current model is:

``` text
capability.inputs
        ↓
logical input values
        ↓
HTTP request body
        ↓
binding.contentType
        ↓
JSON or FORM representation
        ↓
external service
```

The experiment supports the following rule:

> **The capability declares what inputs it needs. The binding determines
> where they go. The media type determines how they are represented.**

For the current implementation, body placement is implicit.

## Architectural implications

This experiment reinforces the separation established in the earlier
HTTP binding work:

> **Capabilities define behavior. Bindings define execution.**

The media type adds another independent concern:

> **Media types define representation.**

The capability remains independent of HTTP details. It declares logical
inputs. The HTTP binding is responsible for translating those inputs
into a representation understood by the external service.

No GRAIL-specific request envelope is required.

## Deferred: input placement

Input placement is intentionally outside this experiment.

A later HTTP binding experiment will consider four placements:

``` text
path
query
header
body
```

Body will remain the default so existing bindings continue to work.

Conceptually:

``` text
input           placement
-------------   ---------
customerId      path
notify          query
authorization   header
email           body
phoneNumber     body
```

Body inputs will continue to use `contentType` to determine their
representation.

This creates two independent facets of HTTP input binding:

``` text
Placement
  path
  query
  header
  body

Representation
  application/json
  application/x-www-form-urlencoded
```

Mapping, renaming, templates, transformations, and more complex request
construction are deferred until a concrete need appears.

## Deferred: response handling

Response handling is also a separate concern.

The current implementation uses HTTP protocol status as the execution
result:

``` text
HTTP 2xx     → SUCCESS
HTTP non-2xx → FAIL
```

The current code uses the HTTP client's successful-status test, so all
2xx responses count as success.

Future response work may include:

-   response body values;
-   response header values;
-   values returned for use by later capabilities;
-   richer interpretation of native service responses;
-   capability responses that normalize to `SUCCESS`, `FAIL`, or
    `BLOCKED`.

In particular, a future capability may discover at execution time that
it is blocked and return a condition that GRAIL can attempt to
establish.

That work belongs to the response side of the HTTP binding and is
deliberately deferred.

## Lessons

The experiment produced several useful observations.

1.  Existing capability input declarations are sufficient for simple
    HTTP body transmission.
2.  Existing bindings require no configuration change for the default
    JSON case.
3.  Media types provide a standard way to represent inputs without
    introducing a GRAIL-specific serialization format.
4.  JSON and FORM encoding can share the same logical capability inputs.
5.  Input placement and input representation are separate binding
    concerns.
6.  Response interpretation is independent of request input binding.
7.  The binding can grow incrementally without changing the behavioral
    capability model.

## Next experiments

The next likely HTTP binding experiment is **input placement**.

The initial placement model will support:

``` text
path
query
header
body
```

Body will remain the default.

A separate later experiment will address richer HTTP response handling.

## Conclusion

This experiment moves GRAIL's HTTP binding from simple external
invocation to useful input transmission.

A capability continues to describe the behavior it requires in logical
terms. The HTTP binding translates those inputs into the representation
expected by the external service.

The result preserves a central GRAIL separation:

> **Capabilities define behavior. Bindings define execution.**

And adds a complementary HTTP rule:

> **Placement determines where inputs go. Media type determines how body
> inputs are represented.**
