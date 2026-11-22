#!/bin/sh
cd "$(dirname "$0")/frontend" && exec bunx vite dev --port 8080 --host 0.0.0.0