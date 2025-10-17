-- Initialize the custodian database
CREATE DATABASE custodian_db;

-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'custodian_user') THEN
        CREATE ROLE custodian_user LOGIN PASSWORD 'custodian_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE custodian_db TO custodian_user;
