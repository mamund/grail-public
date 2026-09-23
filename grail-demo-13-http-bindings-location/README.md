# HTTP bindings -- location support

GRAIL capabilities may invoke external HTTP services using a `binding` declared in `registry.json`.

HTTP bindings translate GRAIL capability inputs into HTTP requests. The binding determines where each input appears in the request while keeping HTTP-specific details outside the capability definition.

## Basic binding

A simple HTTP binding looks like this:

```json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/execute"
}
```

When `parameters` is omitted, GRAIL preserves the original binding behavior: declared capability inputs are sent in the request body.

## Parameter locations

A binding may explicitly map capability inputs to HTTP request locations:

```json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/customers/{customerId}",
  "parameters": {
    "customerId": {
      "in": "path"
    },
    "region": {
      "in": "query",
      "name": "lang"
    },
    "termsVersion": {
      "in": "header",
      "name": "X-Test-Token"
    },
    "email": {
      "in": "body",
      "name": "emailAddress"
    }
  }
}
```

The supported locations are:

* `path`
* `query`
* `header`
* `body`

The parameter key identifies the GRAIL input. The optional `name` identifies its HTTP representation.

If `name` is omitted, the GRAIL input name is used.

## Example

Given these resolved inputs:

```json
{
  "customerId": "customer-123",
  "region": "en",
  "termsVersion": "2026-07",
  "email": "jordan@example.com"
}
```

the binding above produces a request equivalent to:

```http
POST /customers/customer-123?lang=en
X-Test-Token: 2026-07
Content-Type: application/json

{
  "emailAddress": "jordan@example.com"
}
```

This allows the GRAIL vocabulary and the external HTTP API vocabulary to differ without changing the capability definition.

## Path parameters

Path parameters replace matching placeholders in the binding URL.

```json
"customerId": {
  "in": "path"
}
```

with:

```text
/customers/{customerId}
```

and `customerId = customer-123` produces:

```text
/customers/customer-123
```

Path values are URL encoded before substitution.

## Query parameters

Query parameters are added to the request URL.

```json
"region": {
  "in": "query",
  "name": "lang"
}
```

with `region = en` produces:

```text
?lang=en
```

Array values are represented as repeated query parameters.

## Header parameters

Header parameters are added to the HTTP request headers.

```json
"termsVersion": {
  "in": "header",
  "name": "X-Test-Token"
}
```

produces:

```http
X-Test-Token: 2026-07
```

## Body parameters

Body parameters become top-level request body properties.

```json
"email": {
  "in": "body",
  "name": "emailAddress"
}
```

produces:

```json
{
  "emailAddress": "jordan@example.com"
}
```

Multiple body parameters are combined into the request body.

The current binding model intentionally supports only top-level body mappings. Nested structures, templates, and general-purpose transformations are outside the current scope.

## Input resolution

HTTP bindings do not define where GRAIL input values originate.

Capability inputs are resolved by the GRAIL runtime. `inputs.json` provides immutable seed values established at the beginning of a run.

The HTTP binding receives resolved input values and determines how those values are represented in the HTTP request.

This keeps two concerns separate:

```text
GRAIL input resolution
        ↓
resolved values
        ↓
HTTP binding
        ↓
HTTP request
```

## Backward compatibility

Existing HTTP bindings that do not declare `parameters` continue to use the original behavior.

For example:

```json
"binding": {
  "protocol": "http",
  "method": "POST",
  "url": "http://localhost:3001/execute"
}
```

continues to send the capability's declared inputs in the request body.

Explicit parameter mappings are therefore opt-in.

## Current scope

The HTTP binding currently supports:

* GET
* POST
* PUT
* PATCH
* DELETE
* path parameters
* query parameters
* header parameters
* top-level body parameters
* HTTP-side parameter renaming
* legacy body behavior when `parameters` is omitted

More sophisticated body transformation may be added when concrete use cases require it.

