# Stage 1: Build
FROM public.ecr.aws/docker/library/node:22-slim as builder

WORKDIR /app

# Copy necessary files and install dependencies
COPY package.json package-lock.json tsconfig.json .npmrc ./
RUN npm ci --production

# Copy the source files and build the application
COPY ./src ./src
RUN npm run build

# Stage 2: Runtime
FROM public.ecr.aws/docker/library/node:22-slim as runtime

WORKDIR /app

# Copy built files and dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .

# Expose the application ports
EXPOSE 8080 8081

# Specify the command to run the application
CMD ["node", "dist/main.js"]
