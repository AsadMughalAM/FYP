# 🐄 VetAI Diagnostics - Complete Project Analysis

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Frontend Architecture](#frontend-architecture)
9. [Machine Learning Model](#machine-learning-model)
10. [Gemini AI Integration](#gemini-ai-integration)
11. [Setup & Installation](#setup--installation)
12. [Configuration](#configuration)
13. [Usage Guide](#usage-guide)
14. [Testing](#testing)
15. [Deployment](#deployment)
16. [Security](#security)
17. [Performance](#performance)
18. [Troubleshooting](#troubleshooting)
19. [Future Enhancements](#future-enhancements)
20. [Contributors & Credits](#contributors--credits)

---

## 🎯 Project Overview

**VetAI Diagnostics** is a comprehensive AI-powered animal disease detection system designed for livestock health management. The platform combines deep learning computer vision with symptom-based diagnosis to provide accurate, real-time disease detection and treatment recommendations for cattle.

### Key Objectives
- **Automated Disease Detection**: Use computer vision to detect diseases from animal images
- **Symptom-Based Diagnosis**: Provide alternative diagnosis method based on symptom matching
- **Real-Time Information**: Integrate with Gemini AI for up-to-date disease information
- **Health Records Management**: Track and manage animal health history
- **Treatment Recommendations**: Provide evidence-based treatment and prevention guidelines

### Supported Diseases
- **Foot-and-Mouth Disease**: Highly contagious viral disease
- **Lumpy Skin Disease**: Viral disease affecting cattle
- **Healthy**: Normal, disease-free animals

---

## 🏗️ System Architecture

### Architecture Pattern
The project follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  React + Vite + Tailwind CSS (Client-Side Application)  │
└────────────────────┬──────────────────────────────────────┘
                     │ HTTP/REST API
                     │ JWT Authentication
┌────────────────────▼──────────────────────────────────────┐
│                   Backend Layer                           │
│  Django REST Framework (API Server)                       │
│  ├── Authentication & Authorization                       │
│  ├── Image Processing & ML Inference                      │
│  ├── Symptom-Based Diagnosis                              │
│  └── Data Management                                      │
└────────────────────┬──────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────┐
│                   Data Layer                              │
│  ├── MySQL Database (User Data, Detection History)       │
│  ├── TensorFlow Model (Disease Detection)                 │
│  ├── CSV Dataset (Symptom-Disease Mapping)                │
│  └── Media Storage (Uploaded Images)                      │
└───────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

#### Image-Based Detection Flow
```
User Uploads Image
    ↓
Frontend (FileUpload Component)
    ↓
POST /api/animal/detect/
    ↓
Django Backend (DetectAnimalAPIView)
    ↓
TensorFlow Model Prediction
    ↓
Gemini API (Disease Information)
    ↓
Save to Database (AnimalDetection Model)
    ↓
Return Results to Frontend
```

#### Symptom-Based Diagnosis Flow
```
User Selects Symptoms
    ↓
Frontend (SymptomDiagnosis Component)
    ↓
POST /api/diagnose/
    ↓
Django Backend (DiagnoseAPIView)
    ↓
DatasetProcessor (Symptom Matching)
    ↓
Gemini API (Disease Information)
    ↓
Save to Database (SymptomDiagnosis Model)
    ↓
Return Results to Frontend
```

---

## 💻 Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.10+ | Programming Language |
| **Django** | 5.2.7 | Web Framework |
| **Django REST Framework** | 3.16.1 | REST API Framework |
| **djangorestframework-simplejwt** | 5.5.1 | JWT Authentication |
| **django-cors-headers** | 4.9.0 | CORS Handling |
| **TensorFlow** | 2.13.0 | Deep Learning Framework |
| **Keras** | (included) | High-level Neural Network API |
| **Pillow** | 12.0.0 | Image Processing |
| **OpenCV** | 4.10.1.26 | Computer Vision |
| **scikit-learn** | 1.5.0 | Machine Learning Utilities |
| **pandas** | 2.2.0 | Data Processing |
| **numpy** | 1.26.0 | Numerical Computing |
| **mysqlclient** | 2.2.7 | MySQL Database Driver |
| **python-dotenv** | 1.0.1 | Environment Variables |
| **requests** | 2.31.0 | HTTP Client (Gemini API) |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI Framework |
| **Vite** | 7.1.7 | Build Tool & Dev Server |
| **Tailwind CSS** | 4.1.16 | Utility-First CSS Framework |
| **React Router** | 7.9.5 | Client-Side Routing |
| **React Query** | 5.90.5 | Data Fetching & State Management |
| **Axios** | 1.13.1 | HTTP Client |
| **React Hook Form** | 7.65.0 | Form Management |
| **jwt-decode** | 4.0.0 | JWT Token Decoding |
| **Recharts** | 3.5.1 | Data Visualization |
| **Lucide React** | 0.548.0 | Icon Library |
| **@react-oauth/google** | 0.12.2 | Google OAuth Integration |

### Database
- **MySQL** 8.x - Primary database for user data and detection history

### AI/ML Services
- **Google Gemini API** - Real-time disease information retrieval
- **MobileNetV2** - Pre-trained CNN model for transfer learning

---

## ✨ Features

### 1. Image-Based Disease Detection
- **Upload animal images** (JPG, PNG, GIF)
- **Real-time prediction** using trained CNN model
- **Confidence scoring** for each prediction
- **Multiple disease support** (Foot-and-Mouth, Lumpy Skin Disease, Healthy)
- **Visual results display** with detailed information

### 2. Symptom-Based Diagnosis
- **Interactive symptom selection** from comprehensive database
- **Intelligent matching algorithm** to find matching diseases
- **Top 5 disease suggestions** with confidence scores
- **Match rate calculation** showing symptom overlap percentage
- **Real-time disease information** from Gemini AI

### 3. Disease Information System
- **Real-time data** from Google Gemini API
- **Comprehensive details**:
  - Disease name and severity
  - Symptoms list
  - Treatment recommendations
  - Prevention methods
  - Recommended antibiotics
  - Contagion status
- **Fallback mechanism** to JSON database if API fails

### 4. Health Records Management
- **Detection history** for all image-based diagnoses
- **Symptom diagnosis history** for symptom-based diagnoses
- **Status tracking** (Diagnosed, Treated, Recovered, Pending)
- **Notes and annotations** for each record
- **Filtering and search** capabilities

### 5. Analytics & Statistics
- **Dashboard overview** with key metrics
- **Disease distribution** charts
- **Confidence score trends**
- **Detection frequency** analysis
- **Status distribution** visualization

### 6. User Authentication
- **JWT-based authentication** for secure API access
- **User registration** and login
- **Google OAuth integration** (optional)
- **Protected routes** in frontend
- **Token refresh** mechanism

### 7. Veterinary Chat (VetChat)
- **AI-powered chat interface** for veterinary consultations
- **Real-time responses** to health-related queries
- **Context-aware suggestions**

---

## 📂 Project Structure

```
FinalFYP/
├── client/                          # React Frontend Application
│   ├── public/                      # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── api/                     # API configuration
│   │   │   └── api.js
│   │   ├── auth/                    # Authentication components
│   │   │   ├── SignUp/
│   │   │   │   └── SignUp.jsx
│   │   │   └── SignIn/
│   │   │       └── SignIn.jsx
│   │   ├── components/              # React components
│   │   │   ├── Dashboard/           # Analytics dashboard
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── CustomTooltip.jsx
│   │   │   ├── DetectionHistory/    # Detection history view
│   │   │   │   └── DetectionHistory.jsx
│   │   │   ├── DiseaseResults/      # Results display
│   │   │   │   └── DiseaseResults.jsx
│   │   │   ├── FileUpload/          # Image upload component
│   │   │   │   └── FileUpload.jsx
│   │   │   ├── ImageDiagnosis/      # Image diagnosis interface
│   │   │   │   └── ImageDiagnosis.jsx
│   │   │   ├── LogOut/              # Logout component
│   │   │   │   └── LogOut.jsx
│   │   │   ├── ProtectedRoute/      # Route protection
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── Statistics/          # Statistics view
│   │   │   │   └── Statistics.jsx
│   │   │   ├── SymptomDiagnosis/    # Symptom-based diagnosis
│   │   │   │   └── SymptomDiagnosis.jsx
│   │   │   └── VetChat/             # Veterinary chat
│   │   │       └── VetChat.jsx
│   │   ├── config/                  # Configuration files
│   │   │   └── api.js               # API base URL and headers
│   │   ├── pages/                   # Page components
│   │   │   └── Home.jsx             # Main application page
│   │   ├── App.jsx                  # Root component
│   │   ├── App.css                  # Global styles
│   │   ├── index.css                # Base styles
│   │   └── main.jsx                 # Application entry point
│   ├── index.html                   # HTML template
│   ├── package.json                 # Dependencies
│   ├── vite.config.js               # Vite configuration
│   └── eslint.config.js             # ESLint configuration
│
├── server/                          # Django Backend Application
│   ├── accounts/                    # User authentication app
│   │   ├── models.py               # User models (extends Django User)
│   │   ├── views.py                # Registration view
│   │   ├── serializers.py          # User serializers
│   │   ├── urls.py                 # Account URLs
│   │   └── migrations/             # Database migrations
│   │
│   ├── animal/                      # Disease detection app
│   │   ├── models.py               # AnimalDetection, SymptomDiagnosis models
│   │   ├── views.py                # API views (detect, history, statistics)
│   │   ├── serializers.py          # Data serializers
│   │   ├── urls.py                 # Animal API URLs
│   │   ├── dataset_processor.py    # Symptom-disease matching logic
│   │   ├── gemini_service.py       # Gemini API integration
│   │   ├── gemini_json_fix.py      # JSON parsing utilities
│   │   └── migrations/             # Database migrations
│   │
│   ├── ml_model/                    # Machine learning app
│   │   ├── disease_detector.py     # Model training and prediction
│   │   ├── disease_info.json       # Fallback disease database
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── train_model.py  # Django management command
│   │   ├── trained_models/         # Saved model files
│   │   │   ├── cow_disease_detector.h5
│   │   │   ├── cow_disease_detector_classes.pkl
│   │   │   └── cow_disease_detector_classes.json
│   │   └── TRAINING_GUIDE.md       # Training instructions
│   │
│   ├── server/                      # Django project settings
│   │   ├── settings.py             # Django configuration
│   │   ├── urls.py                 # Root URL configuration
│   │   ├── wsgi.py                 # WSGI configuration
│   │   └── asgi.py                 # ASGI configuration
│   │
│   ├── Dataset/                     # Symptom-disease dataset
│   │   ├── Training.csv            # Training data
│   │   ├── Testing.csv             # Testing data
│   │   └── README.md               # Dataset documentation
│   │
│   ├── Cows datasets/              # Image dataset for training
│   │   ├── foot-and-mouth/         # Foot-and-mouth disease images
│   │   ├── healthy/                # Healthy animal images
│   │   └── lumpy/                   # Lumpy skin disease images
│   │
│   ├── media/                      # User-uploaded images
│   │   └── uploads/                # Detection images
│   │
│   ├── manage.py                   # Django management script
│   ├── requirements.txt            # Python dependencies
│   └── MIGRATION_INSTRUCTIONS.md   # Migration guide
│
├── env/                            # Python virtual environment
│   ├── Scripts/                   # Windows activation scripts
│   ├── Lib/                        # Installed packages
│   └── pyvenv.cfg                  # Virtual environment config
│
├── README.md                       # Main project documentation
└── PROJECT_ANALYSIS.md            # This file
```

---

## 🗄️ Database Schema

### User Model (Django Built-in)
- `id`: Primary key
- `username`: Unique username
- `email`: User email
- `password`: Hashed password
- `date_joined`: Account creation date

### AnimalDetection Model
Stores image-based disease detection results.

| Field | Type | Description |
|-------|------|-------------|
| `id` | BigAutoField | Primary key |
| `user` | ForeignKey(User) | User who made detection |
| `image` | ImageField | Uploaded animal image |
| `animal_name` | CharField(100) | Name of animal (optional) |
| `disease_name` | CharField(100) | Detected disease name |
| `confidence_score` | FloatField | Prediction confidence (0-1) |
| `severity` | CharField(20) | Disease severity (None/Low/Medium/High/Critical) |
| `symptoms` | JSONField | List of symptoms |
| `treatment` | JSONField | Treatment recommendations |
| `prevention` | JSONField | Prevention methods |
| `antibiotics` | JSONField | Recommended antibiotics |
| `contagious` | BooleanField | Whether disease is contagious |
| `all_predictions` | JSONField | All model predictions with confidence |
| `notes` | TextField | User notes |
| `status` | CharField(20) | Status (diagnosed/treated/recovered/pending) |
| `created_at` | DateTimeField | Detection timestamp |
| `updated_at` | DateTimeField | Last update timestamp |

**Indexes:**
- `(user, -created_at)` - Fast user history queries
- `(disease_name)` - Fast disease filtering

### SymptomDiagnosis Model
Stores symptom-based disease diagnosis results.

| Field | Type | Description |
|-------|------|-------------|
| `id` | BigAutoField | Primary key |
| `user` | ForeignKey(User) | User who made diagnosis |
| `animal_name` | CharField(100) | Name of animal (optional) |
| `animal_age` | IntegerField | Age of animal (optional) |
| `input_symptoms` | JSONField | Symptoms selected by user |
| `disease_name` | CharField(100) | Diagnosed disease name |
| `disease_id` | CharField(100) | Disease identifier from dataset |
| `confidence_score` | FloatField | Diagnosis confidence (0-1) |
| `match_rate` | FloatField | Percentage of symptoms matched |
| `severity` | CharField(20) | Disease severity |
| `matched_symptoms` | JSONField | Symptoms that matched disease |
| `treatment` | JSONField | Treatment recommendations |
| `prevention` | JSONField | Prevention methods |
| `medicines` | JSONField | Recommended medicines/antibiotics |
| `contagious` | BooleanField | Whether disease is contagious |
| `all_results` | JSONField | Top 5 diagnosis results |
| `notes` | TextField | User notes |
| `status` | CharField(20) | Status (diagnosed/treated/recovered/pending) |
| `created_at` | DateTimeField | Diagnosis timestamp |
| `updated_at` | DateTimeField | Last update timestamp |

**Indexes:**
- `(user, -created_at)` - Fast user history queries
- `(disease_name)` - Fast disease filtering
- `(status)` - Fast status filtering

---

## 🔌 API Documentation

### Base URL
```
http://127.0.0.1:8000/api
```

### Authentication
All protected endpoints require JWT authentication:
```
Authorization: Bearer <access_token>
```

### Endpoints

#### Authentication

##### 1. Register User
```http
POST /api/accounts/register/
Content-Type: application/json

{
  "username": "farmer_john",
  "email": "john@farm.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "status": true
}
```

##### 2. Login / Get Token
```http
POST /api/token/
Content-Type: application/json

{
  "username": "farmer_john",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

##### 3. Refresh Token
```http
POST /api/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Image-Based Detection

##### 4. Detect Disease from Image
```http
POST /api/animal/detect/
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "Disease detected successfully",
  "data": {
    "id": 1,
    "disease_name": "Foot and Mouth Disease",
    "confidence_score": 0.94,
    "severity": "High",
    "symptoms": ["Lameness", "Swelling", "Fever"],
    "treatment": ["Isolate animal", "Apply antibiotics", "Monitor closely"],
    "prevention": ["Vaccination", "Hygiene", "Quarantine"],
    "antibiotics": ["Oxytetracycline"],
    "contagious": true,
    "all_predictions": {
      "Foot And Mouth": 0.94,
      "Lumpy": 0.05,
      "Healthy": 0.01
    },
    "image": "http://127.0.0.1:8000/media/uploads/image.jpg",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "data_source": "gemini_api_realtime",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

##### 5. Get Detection History
```http
GET /api/animal/history/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "disease_name": "Foot and Mouth Disease",
      "confidence_score": 0.94,
      "severity": "High",
      "created_at": "2025-01-15T10:30:00Z",
      ...
    }
  ]
}
```

##### 6. Get Detection Details
```http
GET /api/animal/detail/<detection_id>/
Authorization: Bearer <token>
```

##### 7. Update Detection
```http
PATCH /api/animal/detail/<detection_id>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "treated",
  "notes": "Animal responded well to treatment"
}
```

#### Symptom-Based Diagnosis

##### 8. Get All Symptoms
```http
GET /api/symptoms/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 132,
  "symptoms": [
    "itching",
    "skin_rash",
    "nodal_skin_eruptions",
    ...
  ]
}
```

##### 9. Diagnose from Symptoms
```http
POST /api/diagnose/
Authorization: Bearer <token>
Content-Type: application/json

{
  "symptoms": ["fever", "lameness", "loss_of_appetite"],
  "animal_name": "Cow-001",
  "animal_age": 3,
  "notes": "Animal showing signs of distress"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Found 3 possible disease(s)",
  "results": [
    {
      "disease_id": "foot-and-mouth",
      "disease_name": "Foot and Mouth Disease",
      "confidence": 0.85,
      "match_rate": 75.0,
      "matched_symptoms": ["fever", "lameness"],
      "severity": "High",
      "treatment": ["Isolate", "Antibiotics", "Supportive care"],
      "prevention": ["Vaccination", "Hygiene"],
      "medicines": ["Oxytetracycline"],
      "contagious": true
    },
    ...
  ],
  "input_symptoms": ["fever", "lameness", "loss_of_appetite"],
  "diagnosis_id": 5,
  "saved": true,
  "gemini_enhanced": true
}
```

##### 10. Get Symptom Diagnosis History
```http
GET /api/animal/symptom-diagnosis/history/
Authorization: Bearer <token>
```

##### 11. Get Symptom Diagnosis Details
```http
GET /api/animal/symptom-diagnosis/<diagnosis_id>/
Authorization: Bearer <token>
```

##### 12. Update Symptom Diagnosis
```http
PATCH /api/animal/symptom-diagnosis/<diagnosis_id>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "treated",
  "notes": "Treatment started",
  "animal_name": "Cow-001",
  "animal_age": 3
}
```

#### Disease Information

##### 13. Get Disease Details
```http
GET /api/diseases/<disease_id>/
Authorization: Bearer <token>
```

**Example:**
```http
GET /api/diseases/foot-and-mouth/
```

#### Statistics

##### 14. Get Statistics
```http
GET /api/animal/statistics/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_detections": 25,
  "disease_distribution": {
    "Foot and Mouth Disease": 10,
    "Lumpy Skin Disease": 8,
    "Healthy": 7
  },
  "status_distribution": {
    "diagnosed": 15,
    "treated": 8,
    "recovered": 2
  },
  "average_confidence": 0.87,
  "latest_detection": "2025-01-15T10:30:00Z"
}
```

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
├── Router
    ├── SignUp (Public Route)
    ├── SignIn (Public Route)
    └── ProtectedRoute
        └── Home
            ├── Header (with LogOut)
            ├── Sidebar Navigation
            └── Main Content Area
                ├── Dashboard
                ├── ImageDiagnosis
                │   └── FileUpload
                ├── SymptomDiagnosis
                ├── DiseaseResults
                ├── DetectionHistory
                ├── Statistics
                └── VetChat
```

### State Management
- **React Query**: Server state management, caching, and synchronization
- **React Hooks**: Local component state
- **LocalStorage**: JWT token storage

### Routing
- **React Router v7**: Client-side routing
- **Protected Routes**: Authentication-based access control

### Key Components

#### 1. Dashboard
- Overview statistics
- Disease distribution charts
- Recent detections
- Quick actions

#### 2. ImageDiagnosis
- File upload interface
- Image preview
- Detection trigger
- Progress indicators

#### 3. SymptomDiagnosis
- Symptom selection (multi-select)
- Search and filter symptoms
- Diagnosis submission
- Results display

#### 4. DiseaseResults
- Detailed disease information
- Confidence visualization
- Treatment recommendations
- Prevention tips
- Status update interface

#### 5. DetectionHistory
- List of all detections
- Filtering options
- Detailed view
- Status management

#### 6. Statistics
- Charts and graphs
- Disease trends
- Confidence analysis
- Export capabilities

#### 7. VetChat
- AI-powered chat interface
- Veterinary consultation
- Context-aware responses

---

## 🤖 Machine Learning Model

### Model Architecture

**Base Model**: MobileNetV2 (Transfer Learning)
- Pre-trained on ImageNet
- Input size: 224x224x3
- Transfer learning approach for faster training

**Custom Layers**:
```
Input (224, 224, 3)
    ↓
Rescaling (1./255)
    ↓
MobileNetV2 (frozen)
    ↓
GlobalAveragePooling2D
    ↓
Dense(256, ReLU) + Dropout(0.5)
    ↓
Dense(128, ReLU) + Dropout(0.3)
    ↓
Dense(num_classes, Softmax)
```

### Training Process

1. **Data Preparation**
   - Dataset structure: `dataset/disease_name/images/`
   - Image augmentation (rotation, shift, flip, zoom)
   - Train/validation split (80/20)

2. **Training Configuration**
   - Optimizer: Adam (learning_rate=0.001)
   - Loss: Categorical Crossentropy
   - Metrics: Accuracy
   - Callbacks:
     - EarlyStopping (patience=10)
     - ReduceLROnPlateau (patience=5)
     - ModelCheckpoint (save best model)

3. **Class Weights**
   - Automatic computation for imbalanced datasets
   - Balanced class distribution

### Model Files
- `cow_disease_detector.h5`: Trained model weights
- `cow_disease_detector_classes.pkl`: Class indices mapping
- `cow_disease_detector_classes.json`: Human-readable class mapping

### Training Command
```bash
cd server
python manage.py train_model --epochs 50 --batch-size 32 --dataset-path "path/to/dataset"
```

### Prediction Process
1. Load image (224x224x3)
2. Preprocess (no normalization - handled by Rescaling layer)
3. Model inference
4. Get top predictions with confidence scores
5. Return formatted results

---

## 🌐 Gemini AI Integration

### Purpose
Fetch real-time, up-to-date disease information including:
- Symptoms
- Treatment recommendations
- Prevention methods
- Antibiotic suggestions
- Severity assessment
- Contagion status

### Configuration
- **API Key**: Set via `GEMINI_API_KEY` environment variable
- **Model**: `gemini-flash-latest` (configurable)
- **API Version**: v1beta (with v1 fallback)

### Implementation Details

#### API Call Flow
```
1. Normalize disease name
2. Check cache (if enabled)
3. Call Gemini API with structured prompt
4. Parse JSON response
5. Validate and clean data
6. Cache result (optional)
7. Return disease information
```

#### Error Handling
- **API Failure**: Falls back to JSON database
- **JSON Parse Error**: Uses repair utilities
- **Timeout**: Retries once with delay
- **Rate Limiting**: Automatic retry with backoff

#### Response Format
```json
{
  "name": "Foot and Mouth Disease",
  "severity": "High",
  "symptoms": ["Lameness", "Swelling", "Fever"],
  "treatment": ["Isolate animal", "Apply antibiotics"],
  "prevention": ["Vaccination", "Hygiene"],
  "contagious": true,
  "antibiotics": ["Oxytetracycline"],
  "_source": "gemini_api"
}
```

### Caching
- In-memory cache (24-hour expiration)
- Cache key: normalized disease name
- Force refresh option available

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.x
- 4GB+ RAM
- GPU recommended for training

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
```

#### Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE animaldiseasedetection;

# Configure database in .env file
# DB_NAME=animaldiseasedetection
# DB_USER=root
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=3306
```

#### Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

#### Train Model (Required for Detection)
```bash
python manage.py train_model --epochs 50 --batch-size 32
```

### Step 3: Frontend Setup

```bash
cd ../client
npm install
```

### Step 4: Environment Configuration

#### Backend (.env file in server/)
```env
SECRET_KEY=your-secret-key
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

#### Frontend (.env file in client/)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### Step 5: Start Servers

#### Terminal 1: Backend
```bash
cd server
python manage.py runserver 8000
```

#### Terminal 2: Frontend
```bash
cd client
npm run dev
```

### Step 6: Access Application
Open browser: `http://localhost:5173`

---

## ⚙️ Configuration

### Django Settings (server/server/settings.py)

#### Database
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'animaldiseasedetection'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '12345'),
    }
}
```

#### JWT Configuration
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

#### CORS Configuration
```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True  # Development only
```

#### Media Files
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### Frontend Configuration (client/src/config/api.js)

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
```

---

## 📖 Usage Guide

### For End Users

#### 1. Registration
- Navigate to Sign Up page
- Enter username, email, and password
- Click "Create Account"

#### 2. Login
- Enter credentials on Sign In page
- Or use Google OAuth (if configured)

#### 3. Image-Based Detection
1. Go to "Image Diagnosis" tab
2. Click "Choose File" and select animal image
3. Click "Detect Disease"
4. View results with:
   - Disease name and confidence
   - Severity level
   - Symptoms
   - Treatment recommendations
   - Prevention tips

#### 4. Symptom-Based Diagnosis
1. Go to "Symptom Diagnosis" tab
2. Search and select symptoms
3. Enter animal details (optional)
4. Click "Diagnose"
5. Review top 5 disease matches
6. View detailed information

#### 5. View History
- Go to "History" tab
- View all previous detections
- Filter by disease or date
- Update status and notes

#### 6. Analytics
- Go to "Dashboard" or "Statistics" tab
- View disease distribution
- Monitor confidence trends
- Analyze detection patterns

### For Administrators

#### Model Training
```bash
cd server
python manage.py train_model \
    --epochs 50 \
    --batch-size 32 \
    --dataset-path "Cows datasets"
```

#### Database Management
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Access admin panel
# http://localhost:8000/admin
```

---

## 🧪 Testing

### Backend Testing
```bash
cd server
python manage.py test
```

### Frontend Testing
```bash
cd client
npm test
```

### Manual Testing Checklist

#### Authentication
- [ ] User registration
- [ ] User login
- [ ] Token refresh
- [ ] Protected route access

#### Image Detection
- [ ] Image upload
- [ ] Disease detection
- [ ] Results display
- [ ] History saving

#### Symptom Diagnosis
- [ ] Symptom selection
- [ ] Diagnosis submission
- [ ] Results display
- [ ] History saving

#### API Endpoints
- [ ] All endpoints accessible
- [ ] Authentication required
- [ ] Error handling
- [ ] Response format

---

## 🚢 Deployment

### Production Checklist

#### Backend
- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use production database
- [ ] Set secure `SECRET_KEY`
- [ ] Configure static files
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up logging
- [ ] Configure media file storage (S3/CDN)

#### Frontend
- [ ] Set production API URL
- [ ] Build production bundle: `npm run build`
- [ ] Configure hosting (Vercel, Netlify, etc.)
- [ ] Set up environment variables

#### Database
- [ ] Backup strategy
- [ ] Migration plan
- [ ] Performance optimization
- [ ] Index verification

#### Security
- [ ] HTTPS/SSL certificates
- [ ] Strong passwords
- [ ] API rate limiting
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection

### Deployment Options

#### Backend
- **Django on VPS**: DigitalOcean, AWS EC2
- **Docker**: Containerized deployment
- **Platform as a Service**: Heroku, Railway, Render

#### Frontend
- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **CDN**: Cloudflare, AWS CloudFront

---

## 🔒 Security

### Implemented Security Measures

1. **JWT Authentication**
   - Secure token-based authentication
   - Token expiration and refresh
   - Protected API endpoints

2. **Password Hashing**
   - Django's PBKDF2 hashing
   - No plaintext passwords

3. **CORS Protection**
   - Configurable allowed origins
   - Credential support

4. **Input Validation**
   - File type validation
   - File size limits (10MB)
   - SQL injection prevention (Django ORM)

5. **File Upload Security**
   - Allowed formats only
   - Size restrictions
   - Secure file storage

### Security Recommendations

1. **Production Settings**
   - Use environment variables for secrets
   - Enable HTTPS only
   - Set secure cookie flags
   - Implement rate limiting

2. **API Security**
   - API key rotation
   - Request throttling
   - IP whitelisting (optional)

3. **Data Protection**
   - Encrypt sensitive data
   - Regular backups
   - Access logging

---

## ⚡ Performance

### Optimization Strategies

1. **Model Optimization**
   - Use GPU for inference
   - Model quantization (optional)
   - Batch processing

2. **Database Optimization**
   - Indexed fields
   - Query optimization
   - Connection pooling

3. **Frontend Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching strategies

4. **API Optimization**
   - Response caching
   - Pagination
   - Compression

### Expected Performance Metrics

- **Detection Time**: 2-5 seconds per image
- **Model Accuracy**: 85-95% (depends on training data)
- **API Response Time**: < 200ms (without ML inference)
- **Database Queries**: < 50ms
- **Image Processing**: < 1 second

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Model Not Found
**Error**: `Model file not found`
**Solution**:
- Train model: `python manage.py train_model`
- Verify model files exist in `server/ml_model/trained_models/`

#### 2. Database Connection Error
**Error**: `Can't connect to MySQL server`
**Solution**:
- Verify MySQL service is running
- Check database credentials in `.env`
- Ensure database exists

#### 3. CORS Error
**Error**: `Access to XMLHttpRequest blocked by CORS`
**Solution**:
- Check `CORS_ALLOWED_ORIGINS` in settings
- Verify frontend URL is allowed
- Restart Django server

#### 4. Gemini API Error
**Error**: `Gemini API failed`
**Solution**:
- Verify `GEMINI_API_KEY` is set
- Check API key validity
- Verify internet connection
- Check API quota/limits

#### 5. File Upload Error
**Error**: `File size exceeds limit`
**Solution**:
- Use images < 10MB
- Compress images before upload
- Use JPG format

#### 6. Low Model Confidence
**Warning**: `Low confidence prediction`
**Solution**:
- Retrain model with more data
- Verify image quality
- Check if disease is in training set

---

## 🚀 Future Enhancements

### Phase 2 Features
- [ ] Multiple animal species support
- [ ] Real-time video diagnosis
- [ ] Mobile app (iOS/Android)
- [ ] Veterinarian consultation integration
- [ ] SMS/Email notifications
- [ ] Treatment progress tracking

### Phase 3 Features
- [ ] Advanced analytics dashboard
- [ ] Predictive maintenance
- [ ] IoT sensor integration
- [ ] Cloud deployment (AWS/GCP)
- [ ] Multi-language support
- [ ] Export to PDF reports

### Phase 4 Features
- [ ] AI-powered recommendations
- [ ] Blockchain for health records
- [ ] Integration with veterinary clinics
- [ ] Mobile laboratory support
- [ ] Telemedicine features

### Technical Improvements
- [ ] Model versioning system
- [ ] A/B testing framework
- [ ] Automated testing suite
- [ ] CI/CD pipeline
- [ ] Monitoring and alerting
- [ ] Performance profiling

---

## 👥 Contributors & Credits

### Technologies Used
- **Django & DRF**: Web framework and API
- **TensorFlow & Keras**: Deep learning
- **React & Vite**: Frontend framework
- **Tailwind CSS**: Styling
- **MobileNetV2**: Pre-trained model (Google)
- **Google Gemini API**: AI-powered disease information

### Dataset Sources
- Custom cow disease image dataset
- Symptom-disease mapping dataset (CSV)

### Acknowledgments
- Veterinary experts for disease information validation
- Open-source community for tools and libraries

---

## 📝 License & Notes

### Important Notes
- All disease information is based on veterinary best practices
- System provides diagnostic suggestions, not medical diagnoses
- Always consult with a veterinarian for serious conditions
- Database should be backed up regularly
- Model accuracy depends on training data quality

### Disclaimer
This system is designed to assist in disease detection and should not replace professional veterinary consultation. Always verify critical diagnoses with qualified veterinarians.

---

## 📞 Support

### Getting Help
1. Check `README.md` for setup instructions
2. Review `MIGRATION_INSTRUCTIONS.md` for database setup
3. Check API documentation in this file
4. Review error messages and logs
5. Check GitHub issues (if applicable)

### Common Questions

**Q: How do I train the model?**
A: Run `python manage.py train_model --epochs 50` from the server directory.

**Q: Where do I put my dataset?**
A: Place images in `server/Cows datasets/` organized by disease folders.

**Q: How do I get a Gemini API key?**
A: Visit Google AI Studio (https://makersuite.google.com/app/apikey) to generate an API key.

**Q: Can I add more diseases?**
A: Yes, add more disease folders to your dataset and retrain the model.

---

## 📅 Version History

- **v1.0.0** (Current)
  - Initial release
  - Image-based detection
  - Symptom-based diagnosis
  - Gemini AI integration
  - Health records management
  - Analytics dashboard

---

**Last Updated**: January 2025  
**Project Status**: ✅ Production Ready  
**Maintained By**: Development Team

---

*This document provides a comprehensive overview of the VetAI Diagnostics project. For specific implementation details, refer to the source code and inline documentation.*
