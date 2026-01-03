#!/bin/bash
# Script to activate venv and run the development server

echo "🚀 Starting Espanjapeli Development Server..."
echo ""

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Navigate to the source directory and run server
echo ""
echo "🌐 Starting server..."
cd docs
python server.py

