# Prisma Schema Modularization

This directory contains the database schema definitions structured to reflect the exact boundaries of the domain-driven design established in Phases 1-4.

## Structure
- `schema.prisma`: The central compilation target.
- `models/*.prisma`: Domain-specific entity models.
- `enums/*.prisma`: Domain-specific enums ensuring deterministic serialization strings.
- `validators/`: Utilities to assert that schemas match the required constraints (e.g., uniqueness, non-negative quantities).

## Compilation
In standard Prisma setups, these files would be unified using the `prismaFormat` preview feature or a custom build step before running `prisma generate`.
