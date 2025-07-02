-- Rename firebaseUid column to cognitoUid
ALTER TABLE "users" RENAME COLUMN "firebaseUid" TO "cognitoUid";