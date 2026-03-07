# ADR 001: Monorepo Structure

## Status

Accepted

## Context

We need a scalable structure that supports shared code and unified tooling.

## Decision

Adopt a monorepo with:

- apps/web (React)
- apps/api (Express)
- packages/shared (schemas/constants)

## Consequences

- Shared validation schemas across API and web
- Single CI pipeline
- Easier dependency management
