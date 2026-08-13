FROM node:20-alpine

# Set working directory for the final execution
WORKDIR /app

# Copy the main app static files to public_html
RUN mkdir public_html
COPY index.html app.js 404.html public_html/
COPY models/ public_html/models/
COPY controllers/ public_html/controllers/
COPY views/ public_html/views/
COPY public/ public_html/public/

# Copy ai-studio-app source
WORKDIR /app/ai-studio-app
# Only copy package.json (skip package-lock.json to force platform-specific esbuild bindings on Alpine Linux)
COPY ai-studio-app/package.json ./
# Install dependencies
RUN npm install
# Copy the rest of ai-studio-app
COPY ai-studio-app/ ./
# Build the React app and the server.cjs
RUN npm run build

# Expose port 8080 (Cloud Run default requirement)
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start Node.js server (this runs dist/server.cjs)
CMD ["npm", "start"]
