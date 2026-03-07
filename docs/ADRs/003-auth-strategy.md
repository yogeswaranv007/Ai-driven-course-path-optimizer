# ADR 003: Auth Strategy

## Status

Accepted

## Decision

Use JWT stored in httpOnly cookies with Google OAuth support.

## Rationale

- Safer than localStorage
- Compatible with OAuth flows
- Works well in MERN apps
