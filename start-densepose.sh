#!/bin/bash

# Start DensePose service and Next.js application
echo "Starting DensePose service and Next.js application..."

# Navigate to the script's directory
cd "$(dirname "$0")"

# Get the current directory
APP_DIR="$(pwd)"

# Function to cleanup processes when script is terminated
cleanup() {
  echo "Stopping all services..."
  
  # Kill processes by PIDs (if they exist)
  if [ ! -z "$DENSEPOSE_PID" ]; then
    echo "Stopping DensePose service (PID: $DENSEPOSE_PID)..."
    kill $DENSEPOSE_PID 2>/dev/null || true
  fi
  
  if [ ! -z "$PROXY_PID" ]; then
    echo "Stopping API proxy (PID: $PROXY_PID)..."
    kill $PROXY_PID 2>/dev/null || true
  fi
  
  if [ ! -z "$NEXTJS_PID" ]; then
    echo "Stopping Next.js app (PID: $NEXTJS_PID)..."
    kill $NEXTJS_PID 2>/dev/null || true
  fi
  
  echo "All services stopped."
  exit 0
}

# Register cleanup function for SIGINT and SIGTERM
trap cleanup INT TERM

# Start DensePose service in virtual environment
echo "Starting DensePose service..."
if [ -d ".venv" ]; then
  source .venv/bin/activate
  cd server
  python densepose-service.py --port 5000 --debug &
  DENSEPOSE_PID=$!
  cd ..
  echo "DensePose service started with PID: $DENSEPOSE_PID"
else
  echo "Error: .venv directory not found. Please create a virtual environment first."
  exit 1
fi

# Wait for the service to initialize
sleep 3

# Start API proxy
echo "Starting API proxy server..."
npm run proxy &
PROXY_PID=$!
echo "API proxy started with PID: $PROXY_PID"

# Wait for the proxy to initialize
sleep 2

# Start Next.js application
echo "Starting Next.js application..."
npm run dev &
NEXTJS_PID=$!
echo "Next.js application started with PID: $NEXTJS_PID"

# Display access information
echo "=========================="
echo "All services started!"
echo "=========================="
echo "Next.js app: http://localhost:3000"
echo "API proxy: http://localhost:3334"
echo "DensePose: http://localhost:5000"
echo "=========================="
echo "Press Ctrl+C to stop all services"

# Keep script running
wait 