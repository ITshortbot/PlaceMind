-- Read-only schema audit for PlaceMind's PostgreSQL database.
-- Run manually against the intended database; this script performs no DDL or DML.

-- 1. Required extensions and installed versions.
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector')
ORDER BY extname;

-- 2. Presence of all ORM tables.
WITH expected(table_name) AS (
    VALUES
        ('users'),
        ('resumes'),
        ('resume_sections'),
        ('job_descriptions'),
        ('job_requirements'),
        ('ats_match_scores'),
        ('interview_sessions'),
        ('interview_turns')
)
SELECT
    expected.table_name,
    to_regclass(format('%I.%I', current_schema(), expected.table_name)) IS NOT NULL AS exists
FROM expected
ORDER BY expected.table_name;

-- 3. Actual columns, types, nullability, defaults, and dimensions for those tables.
SELECT
    table_name,
    column_name,
    data_type,
    udt_name,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    datetime_precision,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name IN (
      'users',
      'resumes',
      'resume_sections',
      'job_descriptions',
      'job_requirements',
      'ats_match_scores',
      'interview_sessions',
      'interview_turns'
  )
ORDER BY table_name, ordinal_position;

-- 4. PK, unique, check, and foreign-key definitions, including ON DELETE actions.
SELECT
    relation.relname AS table_name,
    constraint_info.conname AS constraint_name,
    constraint_info.contype AS constraint_type,
    pg_get_constraintdef(constraint_info.oid) AS definition
FROM pg_constraint AS constraint_info
JOIN pg_class AS relation ON relation.oid = constraint_info.conrelid
JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
WHERE namespace.nspname = current_schema()
  AND relation.relname IN (
      'users',
      'resumes',
      'resume_sections',
      'job_descriptions',
      'job_requirements',
      'ats_match_scores',
      'interview_sessions',
      'interview_turns'
  )
ORDER BY relation.relname, constraint_info.conname;

-- 5. Index definitions and storage options (including vector operator classes).
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = current_schema()
  AND tablename IN (
      'users',
      'resumes',
      'resume_sections',
      'job_descriptions',
      'job_requirements',
      'ats_match_scores',
      'interview_sessions',
      'interview_turns'
  )
ORDER BY tablename, indexname;

-- 6. Guest migration preflight/postflight. Expected preflight is exactly:
--    email_exists=true, email_not_null=true, is_guest_exists=false, and
--    guest_check_name_exists=false.
--    Expected postflight is email_nullable=true, is_guest_exists=true with
--    boolean/NOT NULL/false default, and guest_check_ready=true.
SELECT
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'email'
    ) AS email_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'email'
          AND is_nullable = 'NO'
    ) AS email_not_null,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'email'
          AND is_nullable = 'YES'
    ) AS email_nullable,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'is_guest'
    ) AS is_guest_exists,
    EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'users'))
          AND conname = 'ck_users_guest_email'
    ) AS guest_check_name_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'is_guest'
          AND data_type = 'boolean'
          AND is_nullable = 'NO'
          AND column_default IN ('false', 'false::boolean')
    ) AS is_guest_ready,
    EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = to_regclass(format('%I.%I', current_schema(), 'users'))
          AND conname = 'ck_users_guest_email'
          AND contype = 'c'
          AND regexp_replace(
                lower(pg_get_constraintdef(oid)),
                '[^a-z0-9_]',
                '',
                'g'
              ) = 'checkis_guesttrueandemailisnulloris_guestfalseandemailisnotnull'
    ) AS guest_check_exists;
