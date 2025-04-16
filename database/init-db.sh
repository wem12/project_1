#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create schema
    $(cat /docker-entrypoint-initdb.d/01-schema.sql)
    
    -- Apply migrations
    $(cat /docker-entrypoint-initdb.d/02-migrations-001.sql)
    $(cat /docker-entrypoint-initdb.d/03-migrations-002.sql)
    
    -- Seed data
    $(cat /docker-entrypoint-initdb.d/04-seed.sql)
EOSQL 