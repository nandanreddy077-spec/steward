#!/bin/bash
# Quick script to kill process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null
echo "Port 3001 cleared"

