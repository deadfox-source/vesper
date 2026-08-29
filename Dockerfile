# Use standard Node.js LTS alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the production client bundle
RUN npm run build

# Expose the port (Express listens dynamically on process.env.PORT)
EXPOSE 8080

# Start the Express server
CMD ["node", "server.js"]
