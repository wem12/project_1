# SportsVest Setup Guide

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v14+)
- Docker (optional, for containerized setup)

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/sportsvest.git
   cd sportsvest
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local` in the frontend directory
   - Copy `.env.example` to `.env` in the api-gateway and each service directory
   - Update the values as needed

3. Database Setup:
   ```bash
   # Create the database
   createdb sportsvest

   # Run migrations
   cd database
   psql -d sportsvest -f schema.sql
   psql -d sportsvest -f seeds/dev_seed.sql
   ```

## Running the Application

### Development Mode

1. Start the API Gateway and Services:
   ```bash
   # In the root directory
   npm run dev:services
   ```

2. Start the Frontend:
   ```bash
   # In the frontend directory
   cd frontend
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

### Production Mode

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start all services:
   ```bash
   # In the root directory
   npm run start
   ```

## Docker Setup

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:5000 