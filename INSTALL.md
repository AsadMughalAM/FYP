# 🚀 Installation Guide

This guide will help you set up the VetAI Diagnostics project on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **MySQL 8.x** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download Git](https://git-scm.com/downloads)

## Quick Setup (Automated)

### Windows
```powershell
# Run the setup script
.\setup.ps1
```

### Linux/Mac
```bash
# Make script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

## Manual Setup

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd FinalFYP
```

### Step 2: Backend Setup

#### Create Virtual Environment
```bash
# Windows
python -m venv env
.\env\Scripts\activate

# Linux/Mac
python3 -m venv env
source env/bin/activate
```

#### Install Dependencies
```bash
cd server
pip install -r requirements.txt
cd ..
```

### Step 3: Frontend Setup
```bash
cd client
npm install
cd ..
```

### Step 4: Database Configuration

1. Create MySQL database:
```sql
CREATE DATABASE animaldiseasedetection;
```

2. Create `.env` file in `server/` directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=animaldiseasedetection
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest
```

### Step 5: Run Migrations
```bash
cd server
python manage.py makemigrations
python manage.py migrate
```

### Step 6: Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### Step 7: Train Model (Required for Detection)
```bash
python manage.py train_model --epochs 50 --batch-size 32
```

## Running the Application

### Start Backend Server
```bash
cd server
python manage.py runserver 8000
```

### Start Frontend Server (New Terminal)
```bash
cd client
npm run dev
```

### Access Application
Open your browser and navigate to: `http://localhost:5173`

## Troubleshooting

### Virtual Environment Issues
If you encounter activation issues:
- **Windows**: Use `.\env\Scripts\Activate.ps1` (PowerShell) or `.\env\Scripts\activate.bat` (CMD)
- **Linux/Mac**: Ensure script is executable: `chmod +x env/bin/activate`

### Database Connection Issues
- Verify MySQL service is running
- Check database credentials in `.env` file
- Ensure database exists: `SHOW DATABASES;`

### Package Installation Issues
- Upgrade pip: `python -m pip install --upgrade pip`
- Clear pip cache: `pip cache purge`
- Use virtual environment: Ensure `env` is activated

### Model Training Issues
- Ensure dataset exists in `server/Cows datasets/`
- Check GPU availability (optional but recommended)
- Reduce batch size if memory issues: `--batch-size 16`

## Dependencies

### Backend Dependencies
All backend dependencies are listed in `server/requirements.txt`:
- Django 5.2.4
- Django REST Framework 3.16.0
- TensorFlow 2.13.0
- And more...

### Frontend Dependencies
All frontend dependencies are listed in `client/package.json`:
- React 19.1.1
- Vite 7.1.7
- Tailwind CSS 4.1.16
- And more...

## Next Steps

After installation:
1. ✅ Configure environment variables
2. ✅ Set up database
3. ✅ Train the ML model
4. ✅ Start both servers
5. ✅ Access the application

For more details, see:
- [README.md](README.md) - Project overview
- [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) - Complete project documentation

## Support

If you encounter any issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages in console
3. Check GitHub issues (if applicable)
4. Refer to project documentation

---

**Happy Coding! 🎉**
