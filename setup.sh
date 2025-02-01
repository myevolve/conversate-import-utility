#!/bin/bash

# Exit on error
set -e

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
PORT=3000
NEXT_PUBLIC_API_URL=http://your-api-url
EOL
    echo "Please edit .env file with your configuration"
fi

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d --build

# Check if the application is running
echo "Checking if the application is running..."
sleep 10
if curl -s http://localhost:${PORT:-3000} > /dev/null; then
    echo "Application is running successfully!"
    echo "You can access it at http://localhost:${PORT:-3000}"
else
    echo "Application failed to start. Please check the logs with: docker-compose logs"
fi