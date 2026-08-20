-- Optional: create the UniConnect database on the host PostgreSQL (port 5432).
-- Requires a superuser. Example:
--   sudo -u postgres psql -f backend/scripts/create_local_db.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'uniconnect') THEN
    CREATE ROLE uniconnect LOGIN PASSWORD 'uniconnect';
  END IF;
END
$$;

SELECT 'CREATE DATABASE uniconnect OWNER uniconnect'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'uniconnect')\gexec

GRANT ALL PRIVILEGES ON DATABASE uniconnect TO uniconnect;
