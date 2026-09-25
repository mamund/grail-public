# GRAIL `enabled` Feature Implementation Plan

## Purpose

Add an optional `enabled` property to both affordances and bindings in
the GRAIL registry.

The feature must be fully backward compatible. Existing registry files
that do not contain `enabled` must continue to behave exactly as they do
today.

## Semantics

### Affordance

``` json
{
  "enabled": true
}
```

-   `affordance.enabled === true` --- the affordance is available and
    visible in the environment.
-   `affordance.enabled === false` --- the affordance is unavailable and
    invisible.
-   `affordance.enabled` missing --- same behavior as `true`.

A disabled affordance must not participate in discovery, selection,
offered affordances, or execution.

### Binding

``` json
{
  "binding": {
    "enabled": true,
    "protocol": "node"
  }
}
```

-   `binding.enabled === true` --- the binding is active and may be
    executed.
-   `binding.enabled === false` --- the binding is inactive and must not
    be executed.
-   `binding.enabled` missing --- same behavior as `true`.

When a binding is disabled, the affordance behaves like an affordance
with no executable binding. Once its preconditions are satisfied, the
result is `SUCCESS` and its declared effects are applied.

This is consistent with current GRAIL behavior for unbound affordances.

## Strict boolean handling

The runtime must not use truthiness to interpret `enabled`.

Only the literal boolean value `false` disables an affordance or
binding.

Runtime checks should use explicit comparisons:

``` js
if (affordance.enabled === false) {
  // affordance is unavailable
}
```

``` js
if (binding.enabled === false) {
  // binding is inactive
}
```

The registry schema should require `enabled`, when present, to be a
boolean:

``` json
{
  "enabled": {
    "type": "boolean"
  }
}
```

Values such as `"false"`, `0`, `""`, or other non-boolean values should
fail registry validation rather than acquire runtime semantics.

## Backward compatibility

The feature preserves existing behavior:

-   Existing affordances without `enabled` remain available.
-   Existing bindings without `enabled` remain active.
-   Existing affordances without bindings continue to return `SUCCESS`
    when their preconditions are satisfied.

Existing registries therefore require no migration.

## Implementation plan

### 1. Update the registry schema

Add the optional boolean `enabled` property in exactly two places:

1.  affordance declarations
2.  binding declarations

Do not add a schema default. Absence remains absence. Runtime semantics
treat absence as enabled.

### 2. Add affordance filtering

Update affordance discovery so an affordance for which:

``` js
affordance.enabled === false
```

is excluded from the available environment.

Filtering should happen early enough that a disabled affordance does not
appear as:

-   a provider for a condition
-   an offered affordance
-   a selection candidate
-   an executable affordance

> A disabled affordance is not available in the environment.

### 3. Add binding bypass

At the execution boundary, determine whether an executable binding
exists.

Conceptually, change:

``` text
binding exists?
    yes -> execute binding
    no  -> SUCCESS
```

to:

``` text
binding exists AND binding.enabled !== false?
    yes -> execute binding
    no  -> SUCCESS
```

Implementation should use explicit boolean checking rather than general
truthiness.

A disabled binding should reuse the existing unbound-affordance success
path. It should not introduce a second or special kind of synthetic
success.

> A disabled binding makes the affordance behave as an unbound
> affordance.

### 4. Add focused feature tests

Create a small fixture that isolates the new behavior.

  -----------------------------------------------------------------------
  Affordance              Binding                 Expected behavior
  ----------------------- ----------------------- -----------------------
  enabled                 enabled                 visible; binding
                                                  executes

  enabled missing         enabled missing         visible; binding
                                                  executes

  enabled                 disabled                visible; binding does
                                                  not execute; `SUCCESS`;
                                                  effects applied

  disabled                enabled                 invisible; binding
                                                  never executes

  disabled                disabled                invisible; binding
                                                  never executes
  -----------------------------------------------------------------------

Also verify that malformed `enabled` values such as `"false"`, `0`, and
`""` fail registry validation.

### 5. Regression-test existing demonstrations

Run existing binding demonstrations without modifying their registry
files.

At minimum:

``` text
Demo 17   Node binding
Demo 18   Customer onboarding, all Node
```

Both should behave exactly as before.

Where practical, also run the existing HTTP binding demonstrations. This
provides explicit proof of backward compatibility.

### 6. Add a dedicated demonstration

Do not modify Demo 18 to demonstrate the feature.

Create a small focused demonstration showing:

``` text
affordance.enabled: false
    -> affordance disappears from the available environment

binding.enabled: false
    -> affordance remains available
    -> binding is not executed
    -> normal unbound SUCCESS behavior applies
```

If this becomes the next numbered experiment:

``` text
Demo 19   Enabled affordances and bindings
Demo 20   Customer onboarding, all HTTP
Demo 21   Customer onboarding, mixed Node + HTTP
Demo 22   Multi-affordance + multi-effect resolution
```

The numbering can be finalized when the experiment is created.

### 7. Update documentation

Document:

``` text
affordance.enabled
    false           -> unavailable/invisible
    missing or true -> available

binding.enabled
    false           -> binding inactive; normal unbound SUCCESS behavior
    missing or true -> binding active
```

Explicitly state:

> Only the boolean value `false` disables an affordance or binding.

Also record that the feature is backward compatible and existing
registry files do not need to change.

## Implementation order

``` text
schema
  ->
affordance discovery
  ->
binding execution
  ->
focused feature tests
  ->
existing-demo regression tests
  ->
dedicated demo
  ->
documentation
```

## Architectural boundary

This should remain a small runtime extension.

`affordance.enabled` affects whether a possibility participates in the
declared environment.

`binding.enabled` affects whether the declared realization of that
possibility is executed.

> Affordance `enabled` controls availability in the environment. Binding
> `enabled` controls availability of the realization.

The feature should not introduce new workflow semantics, selection
semantics, or protocol-specific behavior.

If implementation requires widespread changes to GRAIL mechanics, that
should be treated as a signal to reconsider where the checks are being
applied.
