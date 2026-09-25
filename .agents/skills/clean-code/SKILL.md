---
name: clean-code
description: Mandatory companion skill for any EigenAPI source-code change. Defines file organization, readability, architectural placement, model/controller boundaries, comments, helpers, SQL formatting, and anti-abstraction rules. Read it together with every feature-specific skill before editing application code.
---

# Clean Code

## This skill is mandatory

Read this skill for every application source-code change, together with every feature-specific skill selected by `AGENTS.md`.

Feature skills define framework contracts. This skill defines how the finished code should be structured and read. A change is not complete merely because it type-checks and passes tests; it should also fit the architecture and be easy to navigate, review, and modify.

## Architectural default

For local EigenAPI application features, prefer the shortest established path:

```text
route
  -> request validation
  -> controller
      -> derived model(s)
          -> database
      -> external/infrastructure service only when required
```

Supporting guards, middleware, events, listeners, jobs, queues, migrations, and seeders remain valid where their own skills apply.

The core placement rules are:

- Routes declare transport structure only.
- Request classes validate and normalize external input.
- Controllers own the local business sequence and HTTP decisions.
- Derived application models own database queries, projections, persistence operations, and entity-focused database behavior.
- Base models own mechanical table mapping.
- Services represent external systems or infrastructure capabilities with a real transport, protocol, connection, or lifecycle boundary.
- Jobs own background execution flow and may coordinate models and external services.
- Do not invent an extra layer simply to move code somewhere else.

## Do not add unnecessary architectural layers

Do not create local layers such as:

```text
repositories/
workflows/
use-cases/
operations/
interactors/
orchestrators/
managers/
application-services/
```

Do not add classes such as `UserRepository`, `CreateOrderWorkflow`, `SubscriptionManager`, or `UpdateProfileOperation` when the behavior fits directly in the established controller/model structure.

A local service is not a substitute for a controller method. A repository is not a substitute for a derived model.

Create a service only when the capability genuinely represents something outside the local model/controller flow, for example Payments, IdP, Mailer, Notifications, HTTP transport, or another resource with its own lifecycle.

## Base models and derived models

Every database-backed application model uses the established two-file structure when a base model exists:

```text
src/models/base/Base<Name>Model.ts
src/models/<Name>Model.ts
```

The **base model** is mechanical schema mapping. It owns:

- hydrated attribute interfaces;
- table name and primary key;
- complete column inventory;
- hidden fields;
- typed getters and setters;
- straightforward relationship declarations.

The **derived model** is the application persistence API for that entity or entity-centered projection. It may own:

- named finders and ownership-safe lookups;
- raw parameterized SQL;
- focused joins centered on the model's entity;
- typed row and projection interfaces;
- filtered list and pagination queries;
- aggregates, counts, and existence checks;
- transaction-aware create/update/archive/state operations;
- entity-specific constants and narrow unions;
- row-to-projection mapping and normalization;
- model-specific query-building helpers;
- entity state predicates and small state helpers.

A query does not need to move to a repository merely because it joins several tables or returns a projection rather than a raw table row. Keep it in the derived model when the result is clearly centered on that model's entity or persistence responsibility.

Do not put HTTP request/response concepts or external-provider calls in models.

## Controllers own business sequencing

Controllers are HTTP and local application entry points. Keep SQL out of them, but do not make them artificially empty.

A controller may:

- read validated request values and authenticated context;
- make feature-level business decisions;
- coordinate several model methods;
- open a transaction when it owns the complete local operation;
- call an external/infrastructure service when the operation genuinely requires one;
- map known outcomes to stable HTTP errors;
- return the final typed response.

A controller should not:

- contain SQL;
- manually parse input already handled by a request class;
- duplicate reusable database queries;
- construct provider transports or read provider credentials;
- become a grab bag for unrelated resources.

When a controller action becomes long, first extract meaningful private controller methods or local helpers that describe phases of the same operation. Do not create a workflow/service/repository solely to reduce line count.

## File organization

Follow nearby source style first. For substantial files, use section headers when they improve navigation:

```ts
// -------
// Imports
// -------

// -----
// Types
// -----

// ---------
// Constants
// ---------

// ----------
// Controller
// ----------

// --------------
// Public methods
// --------------

// ---------------
// Private methods
// ---------------

// -------
// Helpers
// -------
```

For models, use the same idea with `Model` instead of `Controller`.

Do not add section banners to tiny files where they create more noise than navigation.

Recommended declaration order:

1. imports;
2. exported types;
3. internal types;
4. constants;
5. primary class or exported functions;
6. private methods;
7. local helpers and mapping/validation functions.

## Readability and spacing

Prefer code that scans in logical phases.

Use blank lines between meaningful phases, not between every statement and not nowhere at all.

Keep short expressions on one line when readable. Wrap code when grouping makes the intent clearer. Do not compress complete workflows or substantial model methods into one-line blocks merely to reduce vertical space.

Extract a helper because it names a meaningful operation or removes real duplication, not because a method crossed an arbitrary line count.

Prefer business names over vague names such as `data`, `thing`, `processData`, `handleStuff`, `Common`, `Helper`, or `Manager` when a more precise name exists.

## Types

Prefer explicit interfaces and narrow unions for stable inputs, database rows, projections, provider payloads, and returned contracts.

Use `readonly` where mutation is not expected. Use `unknown` at untrusted boundaries and parse it. Avoid passing broad `Record<string, unknown>` objects across multiple layers when the structure is actually known.

Keep model-specific row/projection types close to the derived model that owns the query unless they are intentionally shared public contracts.

## SQL and database work

All application SQL belongs in the relevant derived model, migration, seeder, or database-core implementation. Do not put SQL in controllers, routes, request classes, guards, middleware, jobs, provider services, or miscellaneous utility files.

Always parameterize values. Dynamic identifiers, operators, or sort directions must come from closed allowlists.

Use one-line SQL when it remains easy to read. Use multiline SQL for non-trivial joins, projections, conditions, CTEs, and grouped clauses. Never flatten substantial SQL into an unreadable line.

Use explicit selected columns for stable/public projections. Convert database-specific values deliberately at the model boundary when necessary.

## Comments

Use comments for intent, constraints, and non-obvious decisions. Do not narrate obvious syntax.

Good reasons to comment include:

- why a lock is required;
- why an operation cannot safely retry;
- why a compatibility branch exists;
- why a query deliberately avoids a count or chooses a specific ordering;
- why a provider status maps to a local state;
- why a route or guard has an unusual policy.

Section headers are navigation aids, not explanatory comments.

## Transactions

Use one transaction when several local writes form one atomic operation. Pass the executor through every participating model call.

The controller or job handler may own the transaction when it owns the business sequence. A derived model may own a transaction when the operation is entirely an entity-focused persistence operation and exposing the internal steps would only leak persistence mechanics.

Do not create a repository/workflow merely to own a transaction.

Avoid long database locks around remote network calls unless the design has a reviewed reason.

## Review checklist

Before considering source work complete, verify:

- Is the responsibility in the narrowest established layer?
- Is SQL inside derived models rather than controllers or invented repositories?
- Does the controller express the business sequence clearly without persistence details?
- Are services limited to genuine external/infrastructure boundaries?
- Are base and derived model responsibilities separated correctly?
- Are substantial files easy to navigate by ordering and, where useful, section headers?
- Are types specific enough to communicate the contract?
- Are helpers named for meaning rather than line-count reduction?
- Are comments explaining intent instead of repeating syntax?
- Is the code formatted for humans rather than mechanically compressed?
- Did the change avoid unnecessary new abstractions?
- Do tests prove behavior and important invariants?
