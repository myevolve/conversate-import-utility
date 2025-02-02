FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port (default 3000)
EXPOSE ${PORT:-3000}

# Start the application
CMD PORT=${PORT:-3000} npm start