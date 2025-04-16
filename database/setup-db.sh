#!/bin/bash

# Database configuration
DB_NAME="sportsvest"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Load environment variables if .env exists
if [ -f ../.env ]; then
  echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
  export $(grep -v '^#' ../.env | xargs)
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL and try again.${NC}"
  exit 1
fi

echo -e "${YELLOW}Setting up SportsVest database...${NC}"

# Check if database exists
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  read -p "Database '$DB_NAME' already exists. Do you want to drop and recreate it? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Dropping existing database...${NC}"
    dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
  else
    echo -e "${YELLOW}Using existing database. This may cause conflicts if schema has changed.${NC}"
    echo -e "${YELLOW}Proceeding with caution...${NC}"
  fi
fi

# Create database if it doesn't exist
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create database. Please check your PostgreSQL installation and permissions.${NC}"
    exit 1
  fi
fi

# Apply schema
echo -e "${YELLOW}Applying database schema...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f schema.sql
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to apply schema. Please check the schema.sql file.${NC}"
  exit 1
fi

# Apply migrations
echo -e "${YELLOW}Applying migrations...${NC}"
for migration in migrations/*.sql; do
  echo -e "${YELLOW}Applying migration: $migration${NC}"
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migration
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to apply migration: $migration${NC}"
    exit 1
  fi
done

# Seed development data
if [ "$NODE_ENV" != "production" ]; then
  echo -e "${YELLOW}Seeding development data...${NC}"
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seeds/dev_seed.sql
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to seed development data. Please check the dev_seed.sql file.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Database setup completed successfully!${NC}" 