# ADR 0001 — Feature-Based Architecture

**Status:** Accepted

## Context
A flat file structure makes it hard to reason about ownership as the codebase grows.

## Decision
Organise the backend by feature module, not by technical layer.

## Consequences
Each module owns its routes, controllers, services, and repositories. Cross-module imports go through public index.js files only.
