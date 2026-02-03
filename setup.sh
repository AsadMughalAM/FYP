#!/bin/bash

# ============================================
# VetAI Diagnostics - Linux/Mac Setup Script
# ============================================
# This script sets up the development environment
# Run this script from the project root directory

echo "============================================"
echo "VetAI Diagnostics - Setup Script"
echo "============================================"
echo ""

# Check if Python is installed
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Found: $PYTHON_VERSION"
else
    echo "✗ Python 3 is not installed or not in PATH"
    echo "Please install Python 3.10+ from https://www.python.org/"
    exit 1
fi

# Check if Node.js is installed
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Found: $NODE_VERSION"
else
    echo "✗ Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo ""
echo "============================================"
echo "Setting up Backend (Django)"
echo "============================================"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "env" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv env
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source env/bin/activate

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install backend dependencies
echo "Installing backend dependencies..."
cd server
pip install -r requirements.txt
cd ..

echo "✓ Backend dependencies installed"
echo ""

echo "============================================"
echo "Setting up Frontend (React)"
echo "============================================"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd client
npm install
cd ..

echo "✓ Frontend dependencies installed"
echo ""

echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Configure your database in server/.env"
echo "2. Run migrations: cd server && python manage.py migrate"
echo "3. Create superuser: cd server && python manage.py createsuperuser"
echo "4. Train the model: cd server && python manage.py train_model"
echo "5. Start backend: cd server && python manage.py runserver"
echo "6. Start frontend: cd client && npm run dev"
echo ""
echo "For detailed instructions, see README.md"
echo ""
