-- Rollback Strategy for Slice 2.1A (Authorization Models)
-- Execute this to completely drop the Phase 2 authorization models and enum

DROP TABLE IF EXISTS "FeatureFlag" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Policy" CASCADE;
DROP TABLE IF EXISTS "UserPermission" CASCADE;
DROP TABLE IF EXISTS "UserRole" CASCADE;
DROP TABLE IF EXISTS "RolePermission" CASCADE;
DROP TABLE IF EXISTS "Permission" CASCADE;
DROP TABLE IF EXISTS "AuthRole" CASCADE;

DROP TYPE IF EXISTS "PermissionEffect" CASCADE;
