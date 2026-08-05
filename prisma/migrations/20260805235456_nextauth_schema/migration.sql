-- Truncate ephemeral tables
TRUNCATE TABLE "Session";
TRUNCATE TABLE "VerificationToken";

-- User: Safe emailVerified cast
ALTER TABLE "User" ALTER COLUMN "emailVerified" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "emailVerified" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "emailVerified" TYPE timestamp(3) USING (CASE WHEN "emailVerified" = true THEN CURRENT_TIMESTAMP ELSE NULL END);
ALTER TABLE "User" ADD COLUMN "image" text;

-- Account: Convert provider enum values
ALTER TABLE "Account" ALTER COLUMN "provider" TYPE text USING (CASE WHEN "provider" = 'GOOGLE' THEN 'google' WHEN "provider" = 'CREDENTIALS' THEN 'credentials' ELSE "provider"::text END);
ALTER TABLE "LoginAuditLog" ALTER COLUMN "authMethod" TYPE text USING (CASE WHEN "authMethod" = 'GOOGLE' THEN 'google' WHEN "authMethod" = 'CREDENTIALS' THEN 'credentials' ELSE "authMethod"::text END);
DROP TYPE "AuthProvider";

-- Account model NextAuth fields
ALTER TABLE "Account" ADD COLUMN "type" text NOT NULL DEFAULT 'oauth';
ALTER TABLE "Account" ADD COLUMN "access_token" text;
ALTER TABLE "Account" ADD COLUMN "refresh_token" text;
ALTER TABLE "Account" ADD COLUMN "id_token" text;
ALTER TABLE "Account" ADD COLUMN "token_type" text;
ALTER TABLE "Account" ADD COLUMN "scope" text;
ALTER TABLE "Account" ADD COLUMN "session_state" text;
ALTER TABLE "Account" ADD COLUMN "expires_at" integer;
ALTER TABLE "Account" ALTER COLUMN "type" DROP DEFAULT;

-- Session model updates
DROP INDEX IF EXISTS "Session_expiresAt_idx";
ALTER TABLE "Session" DROP COLUMN "expiresAt";
ALTER TABLE "Session" ADD COLUMN "sessionToken" text NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "Session" ADD COLUMN "expires" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session" ALTER COLUMN "sessionToken" DROP DEFAULT;
ALTER TABLE "Session" ALTER COLUMN "expires" DROP DEFAULT;
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- VerificationToken model updates
ALTER TABLE "VerificationToken" DROP CONSTRAINT IF EXISTS "VerificationToken_pkey";
DROP INDEX IF EXISTS "VerificationToken_userId_key";
ALTER TABLE "VerificationToken" DROP COLUMN "userId";
ALTER TABLE "VerificationToken" DROP COLUMN "id";
ALTER TABLE "VerificationToken" DROP COLUMN "expiresAt";
ALTER TABLE "VerificationToken" ADD COLUMN "identifier" text NOT NULL DEFAULT 'temp';
ALTER TABLE "VerificationToken" ADD COLUMN "expires" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "VerificationToken" ALTER COLUMN "identifier" DROP DEFAULT;
ALTER TABLE "VerificationToken" ALTER COLUMN "expires" DROP DEFAULT;
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
