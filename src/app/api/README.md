# REST Endpoint Layer

This directory maps the stateless Phase 5.0 API framework into specific REST endpoints for each core domain.

## Structure
- `middleware/`: Standardizes request/response interception, logging, and error catching.
- `[domain]/route.ts`: Immutable route declarations.
- `[domain]/controller.ts`: Pure orchestration of request parsing, validation, execution (stubbed), and response formatting.
- `[domain]/validator.ts`: Enforces exact schema rules per endpoint.
- `[domain]/transformer.ts`: Transforms internal payloads outward using the Phase 5.0 serializers.

## Constraints
No business logic, state mutation, or database connections exist here. This layer only routes bytes into validated structures and back out again.
