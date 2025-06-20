# Multi-stage build for Yellow Claude Orchestra
FROM node:18-alpine AS web-builder

# Install dependencies for web dashboard
WORKDIR /app/web-dashboard
COPY web-dashboard/package*.json ./
RUN npm ci --only=production

# Copy web dashboard source and build
COPY web-dashboard/ ./
RUN npm run build

# Python runtime stage
FROM python:3.11-slim as python-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    procps \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI (manual installation)
RUN mkdir -p /root/.local/bin && \
    curl -L -o /root/.local/bin/claude https://github.com/anthropics/claude-code/releases/latest/download/claude-linux-arm64 && \
    chmod +x /root/.local/bin/claude && \
    echo 'export PATH="/root/.local/bin:$PATH"' >> /root/.bashrc

# Install Python dependencies
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python-base

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PATH="/root/.local/bin:$PATH"

# Install Node.js in final stage
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Copy built web dashboard
COPY --from=web-builder /app/web-dashboard/.next /app/web-dashboard/.next
COPY --from=web-builder /app/web-dashboard/public /app/web-dashboard/public
COPY --from=web-builder /app/web-dashboard/package*.json /app/web-dashboard/
COPY --from=web-builder /app/web-dashboard/node_modules /app/web-dashboard/node_modules

# Copy Python application
COPY src/ /app/src/
COPY communication/ /app/communication/
COPY data/ /app/data/

# Copy web dashboard source files (for API routes)
COPY web-dashboard/src/ /app/web-dashboard/src/
COPY web-dashboard/tailwind.config.js /app/web-dashboard/
COPY web-dashboard/next.config.js /app/web-dashboard/
COPY web-dashboard/postcss.config.js /app/web-dashboard/
COPY web-dashboard/tsconfig.json /app/web-dashboard/

# Create necessary directories
RUN mkdir -p /app/communication/messages \
    && mkdir -p /app/communication/logs \
    && mkdir -p /app/data \
    && mkdir -p /app/workspace

# Expose ports
EXPOSE 3000 8765

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Ensure Claude CLI is in PATH\n\
export PATH="/root/.local/bin:$PATH"\n\
\n\
# Start web dashboard in background\n\
cd /app/web-dashboard && npm start &\n\
WEB_PID=$!\n\
\n\
# Start task processor in background\n\
cd /app && python -m src.task_processor &\n\
TASK_PID=$!\n\
\n\
# Start websocket bridge in background\n\
cd /app && python -m communication.websocket_bridge &\n\
BRIDGE_PID=$!\n\
\n\
# Function to handle shutdown\n\
cleanup() {\n\
    echo "Shutting down services..."\n\
    kill $WEB_PID $TASK_PID $BRIDGE_PID 2>/dev/null || true\n\
    wait\n\
    exit 0\n\
}\n\
\n\
# Trap signals\n\
trap cleanup SIGTERM SIGINT\n\
\n\
# Wait for any process to exit\n\
wait -n\n\
\n\
# Exit with status of process that exited first\n\
exit $?' > /app/start.sh \
    && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["/app/start.sh"]