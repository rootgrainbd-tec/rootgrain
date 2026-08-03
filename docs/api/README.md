# Phase 5.3: OpenAPI & API Documentation Layer

This directory maps the fully approved REST API onto an OpenAPI 3.1 specification.

## Structure
- `openapi/`: Raw YAML files mapping paths, schemas, and security.
- `validators/`: Ensures the API docs remain synchronized with the underlying source DTOs and middlewares.
- `generators/`: Stubs for converting the OpenAPI spec into Client SDKs and developer portal documentation.

## Constraint
This layer only describes the application. It contains ZERO runtime logic.
