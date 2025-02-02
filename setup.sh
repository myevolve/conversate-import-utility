#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print step information
print_step() {
    echo -e "\n${YELLOW}Step: $1${NC}"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to check if a port is available
is_port_available() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 1
    else
        return 0
    fi
}

# Function to find next available port
find_next_available_port() {
    local port=$1
    while ! is_port_available $port; do
        echo -e "${YELLOW}Port $port is in use, trying next port...${NC}"
        port=$((port + 1))
    done
    echo $port
}

print_step "Checking system requirements..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker installed successfully"
else
    print_success "Docker is already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose is already installed"
fi

print_step "Setting up environment..."

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -p|--port|--port=*|-port=*)
            if [[ "$1" =~ ^-.*=.* ]]; then
                PORT="${1#*=}"
            else
                PORT="$2"
                shift
            fi
            ;;
        *)
            print_error "Unknown parameter: $1"
            echo "Usage: $0 [-p|--port PORT]"
            exit 1
            ;;
    esac
    shift
done

# Set default port if not provided
if [ -z "$PORT" ]; then
    DEFAULT_PORT=3000
    PORT=$(find_next_available_port $DEFAULT_PORT)
else
    # Validate provided port
    if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
        print_error "Invalid port number: $PORT"
        exit 1
    fi
    if ! is_port_available $PORT; then
        print_error "Port $PORT is already in use"
        PORT=$(find_next_available_port $PORT)
        echo -e "${YELLOW}Using port $PORT instead${NC}"
    fi
fi

# Create .env file
echo "Creating .env file..."
cat > .env << EOL
PORT=$PORT
NEXT_PUBLIC_API_URL=https://app.conversate.us
EOL
print_success "Environment file created with PORT=$PORT"

print_step "Building and starting containers..."

# Stop any existing containers
if [ "$(docker ps -q -f name=conversate-import-utility)" ]; then
    echo "Stopping existing containers..."
    docker-compose down
fi

# Build and start the containers
echo "Building new containers..."
docker-compose up -d --build

# Function to check application health
check_app_health() {
    local max_attempts=30
    local attempt=1
    local wait_time=2

    echo "Checking application health..."
    while [ $attempt -le $max_attempts ]; do
        echo -n "Attempt $attempt of $max_attempts: "
        if curl -s http://localhost:$PORT/api/health > /dev/null; then
            print_success "Application is healthy!"
            return 0
        else
            echo "Waiting..."
            sleep $wait_time
            attempt=$((attempt + 1))
        fi
    done
    return 1
}

# Check application health
if check_app_health; then
    echo -e "\n${GREEN}=== Setup Complete! ===${NC}"
    echo -e "Your application is running at: ${GREEN}http://localhost:$PORT${NC}"
    echo -e "\nTo stop the application, run: ${YELLOW}docker-compose down${NC}"
    echo -e "To view logs, run: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "To restart, run: ${YELLOW}docker-compose restart${NC}"
else
    print_error "Application failed to start properly"
    echo -e "\nTroubleshooting steps:"
    echo -e "1. Check logs with: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "2. Ensure port $PORT is not blocked by firewall"
    echo -e "3. Try stopping and starting with: ${YELLOW}docker-compose down && docker-compose up -d${NC}"
    exit 1
fi