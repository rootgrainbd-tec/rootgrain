# Production Infrastructure Layer

This layer acts as the absolute boundary between the core application abstractions and production provider implementations (Redis, SMTP, Prisma, OTel).

**Crucial Rules:**
1. All integrations must remain behind the Infrastructure Adapter Layer.
2. Configuration must fail closed on startup if secrets or env variables are missing.
3. The Provider Factory handles Dependency Injection exclusively through Category lookup, never by direct instantiation.
