# ADR 0003 — MongoDB

**Status:** Accepted

## Context
Conversation history and user context have a flexible, evolving schema that is hard to normalise upfront.

## Decision
Use MongoDB (via Mongoose) as the primary datastore.

## Consequences
Flexible schema evolution. Requires careful indexing. No joins — relationships are handled at the application layer.
