BEGIN;

ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
    ADD COLUMN is_guest BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD CONSTRAINT ck_users_guest_email CHECK (
        (is_guest = TRUE AND email IS NULL) OR (is_guest = FALSE AND email IS NOT NULL)
    );

COMMIT;
