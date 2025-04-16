#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
USE_DOCKER=false
SERVICES_TO_START="all"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --docker) USE_DOCKER=true ;;
        --services=*) SERVICES_TO_START="${1#*=}" ;;
        -h|--help) 
            echo "Usage: ./start-dev.sh [options]"
            echo "Options:"
            echo "  --docker             Start services using Docker"
            echo "  --services=<list>    Comma-separated list of services to start (default: all)"
            echo "                       Available services: api-gateway,user,team,trading,community,rewards,frontend"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to start services with Docker
start_with_docker() {
    echo -e "${BLUE}Starting services with Docker...${NC}"
    
    # Make sure postgres is started first and healthy before starting other services
    docker-compose up -d postgres
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    docker-compose exec postgres pg_isready -U postgres -d sportsvest -t 30
    
    if [ "$SERVICES_TO_START" = "all" ]; then
        docker-compose up -d
    else
        # Convert comma-separated list to space-separated for docker-compose
        SERVICES=$(echo $SERVICES_TO_START | sed 's/,/ /g')
        # Replace service names to match docker-compose service names
        SERVICES=$(echo $SERVICES | sed 's/user/user-service/g' | sed 's/team/team-service/g' | sed 's/trading/trading-service/g' | sed 's/community/community-service/g' | sed 's/rewards/rewards-service/g')
        
        docker-compose up -d $SERVICES
    fi
    
    echo -e "${GREEN}Services started successfully with Docker!${NC}"
    echo -e "${YELLOW}API Gateway: http://localhost:5000${NC}"
    echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
}

# Function to start services locally
start_locally() {
    echo -e "${BLUE}Starting services locally...${NC}"
    
    # Create a directory for logs
    mkdir -p logs
    
    # Start services based on the specified list
    if [ "$SERVICES_TO_START" = "all" ] || [[ "$SERVICES_TO_START" =~ "user" ]]; then
        echo -e "${YELLOW}Starting User Service...${NC}"
        cd services/user-service && npm start > ../../logs/user-service.log 2>&1 &
        cd ../..
    fi
    
    if [ "$SERVICES_TO_START" = "all" ] || [[ "$SERVICES_TO_START" =~ "team" ]]; then
        echo -e "${YELLOW}Starting Team Service...${NC}"
        cd services/team-service && npm start > ../../logs/team-service.log 2>&1 &
        cd ../..
    fi
    
    if [ "$SERVICES_TO_START" = "all" ] || [[ "$SERVICES_TO_START" =~ "trading" ]]; then
        echo -e "${YELLOW}Starting Trading Service...${NC}"
        cd services/trading-service && npm start > ../../logs/trading-service.log 2>&1 &
        cd ../..
    fi
    
    if [ "$SERVICES_TO_START" = "all" ] || [[ "$SERVICES_TO_START" =~ "community" ]]; then
        echo -e "${YELLOW}Starting Community Service...${NC}"
        cd services/community-service && npm start > ../../logs/community-service.log 2>&1 &
        cd ../..
    fi
    
    if [ "$SERVICES_TO_START" = "all" ] || [[ "$SERVICES_TO_START" =~ "rewards" ]]; then
        echo -e "${YELLOW}Starting Rewards Service...${NC}"
        cd services/rewards-service && npm start > ../../logs/rewards-service.log 2>&1 &
        cd ../..
    fi
    
    if [ "$SERVICES_TO_START" = "all" ] || [[ "$SERVICES_TO_START" =~ "api-gateway" ]]; then
        echo -e "${YELLOW}Starting API Gateway...${NC}"
        cd api-gateway && npm start > ../logs/api-gateway.log 2>&1 &
        cd ..
    fi
    
    if [ "$SERVICES_TO_START" = "all" ] || [[ "$SERVICES_TO_START" =~ "frontend" ]]; then
        echo -e "${YELLOW}Starting Frontend...${NC}"
        cd frontend && npm run dev > ../logs/frontend.log 2>&1 &
        cd ..
    fi
    
    echo -e "${GREEN}Services started successfully!${NC}"
    echo -e "${YELLOW}Check the logs directory for service logs.${NC}"
    echo -e "${YELLOW}API Gateway: http://localhost:5000${NC}"
    echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
}

# Check if Docker is available if --docker flag is used
if [ "$USE_DOCKER" = true ]; then
    if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker and/or docker-compose are not installed. Please install them or run without the --docker flag.${NC}"
        exit 1
    fi
    start_with_docker
else
    start_locally
fi

echo -e "${BLUE}To stop the services:${NC}"
if [ "$USE_DOCKER" = true ]; then
    echo -e "${YELLOW}Run: docker-compose down${NC}"
else
    echo -e "${YELLOW}Run: pkill -f 'node.*service|node.*gateway|next'${NC}"
fi 