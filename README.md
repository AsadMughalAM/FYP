# 🐄 VetAI Diagnostics - Animal Disease Detection System

A professional AI-powered platform for diagnosing animal diseases using deep learning. Detect diseases in livestock with high accuracy using computer vision and machine learning.

## ✨ Features

### 🤖 AI & Machine Learning
- **Deep Learning Model**: MobileNetV2 CNN with transfer learning
- **Real-time Predictions**: Instant disease detection from images
- **Confidence Scoring**: Get prediction confidence percentages
- **Multi-Disease Support**: Detect 5+ different animal diseases

### 💊 Medical Features
- **Detailed Diagnosis**: Symptoms, causes, and severity levels
- **Treatment Plans**: Evidence-based treatment recommendations
- **Antibiotic Suggestions**: Recommended antibiotics for each disease
- **Prevention Tips**: Preventive care guidelines
- **Contagion Alerts**: Automatic warnings for contagious diseases

### 📊 Analytics & Tracking
- **Detection History**: Track all animal health records
- **Statistics Dashboard**: View trends and patterns
- **Disease Distribution**: Analyze disease prevalence
- **Performance Metrics**: Monitor system accuracy

### 🔐 Security & Authentication
- **JWT Tokens**: Secure API authentication
- **User Accounts**: Individual user profiles
- **Data Privacy**: Encrypted data storage
- **Permission Controls**: Role-based access

### 🎨 User Interface
- **Professional Dashboard**: Modern, responsive design
- **Tab-Based Navigation**: Easy feature access
- **Real-time Feedback**: Live upload progress
- **Mobile Responsive**: Works on all devices

---

## 📋 Supported Diseases

| Disease | Severity | Symptoms | Contagious |
|---------|----------|----------|-----------|
| **Foot Rot** | High | Lameness, swelling, foul odor | Yes |
| **Mastitis** | High | Udder swelling, abnormal milk | Yes |
| **Bloat** | Critical | Side swelling, distress | No |
| **Blackleg** | Critical | Sudden lameness, dark discoloration | No |
| **Healthy** | None | Normal appearance | No |

---

## 🏗️ Tech Stack

### Backend
```
Django 5.2.7              - Web framework
Django REST Framework     - REST API
TensorFlow 2.x            - Deep learning
Pillow 12.0.0             - Image processing
MySQL 8.x                 - Database
```

### Frontend
```
React 19.1.1              - UI framework
Vite 7.1.7                - Build tool
Tailwind CSS 4.1.16       - Styling
React Query 5.90.5        - State management
Axios 1.13.1              - HTTP client
```

### ML/AI
```
MobileNetV2               - Pre-trained model
Transfer Learning         - Quick adaptation
Data Augmentation         - Training improvement
Scikit-learn              - Metrics & evaluation
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.x
- 4GB+ RAM
- GPU recommended for ML training

### 1. Clone & Setup Environment

```bash
# Navigate to project
cd FinalFYP

# Create virtual environment (if not exists)
python -m venv env

# Activate virtual environment
# On Windows:
.\env\Scripts\activate

# On macOS/Linux:
source env/bin/activate
```

### 2. Install Backend Dependencies

```bash
cd server

# Install Python packages
pip install -r requirements.txt

# Or install manually
pip install django django-rest-framework djangorestframework-simplejwt
pip install django-cors-headers
pip install pillow mysqlclient python-dotenv
pip install tensorflow opencv-python scikit-learn
```

### 3. Setup Database

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 4. Install Frontend Dependencies

```bash
cd ../client

# Install packages
npm install

# Or use yarn
yarn install
```

### 5. Train Model (Optional)

```bash
# Go back to root
cd ..

# Run training script
python train_model.py

# Follow prompts to select dataset and training parameters
```

### 6. Start Servers

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

### 7. Access Application

Open browser and navigate to:
```
http://localhost:5173
```

---

## 📖 Usage

### 1. Register Account
- Click "Sign Up"
- Enter username, email, password
- Click "Create Account"

### 2. Login
- Click "Sign In"
- Enter credentials
- Click "Login"

### 3. Detect Disease
- Go to "Upload & Detect" tab
- Upload animal image
- Click "Detect Disease"
- View results instantly

### 4. View Results
- Diagnosis with confidence score
- Severity level
- Symptoms list
- Treatment options
- Prevention tips
- Recommended antibiotics

### 5. Track History
- Go to "History" tab
- View all previous detections
- Click "View" to see detailed results
- Filter by disease or date

### 6. Analytics
- Go to "Statistics" tab
- View disease distribution
- Monitor confidence scores
- Track detection trends

---

## 🔧 API Reference

### Authentication

#### Register
```http
POST /api/accounts/register/
Content-Type: application/json

{
  "username": "farmer_john",
  "email": "john@farm.com",
  "password": "secure_password"
}
```

### Disease Detection

#### Detect Disease
```http
POST /api/animal/detect/
Authorization: Bearer {token}
Content-Type: multipart/form-data

File: image.jpg
```

Response:
```json
{
  "success": true,
  "message": "Disease detected successfully",
  "data": {
    "id": 1,
    "disease_name": "Foot Rot",
    "confidence_score": 0.94,
    "severity": "High",
    "symptoms": ["Lameness", "Swelling"],
    "treatment": ["Trim hooves", "Apply antibiotics"],
    "prevention": ["Keep dry", "Regular trimming"],
    "antibiotics": ["Oxytetracycline"],
    "contagious": true,
    "all_predictions": {...}
  }
}
```

#### Get Detection History
```http
GET /api/animal/history/
Authorization: Bearer {token}
```

#### Get Detection Details
```http
GET /api/animal/detail/{id}/
Authorization: Bearer {token}
```

#### Update Detection
```http
PATCH /api/animal/detail/{id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "treated",
  "notes": "Animal responded well to treatment"
}
```

#### Get Statistics
```http
GET /api/animal/statistics/
Authorization: Bearer {token}
```

---

## 📂 Project Structure

```
FinalFYP/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload/      # Image upload
│   │   │   ├── DiseaseResults/  # Results display
│   │   │   ├── DetectionHistory/# Historical records
│   │   │   ├── Statistics/      # Analytics dashboard
│   │   │   ├── LogOut/
│   │   │   └── ProtectedRoute/
│   │   ├── pages/
│   │   │   └── Home.jsx         # Main interface
│   │   ├── auth/
│   │   │   ├── SignUp/
│   │   │   └── SignIn/
│   │   └── api/
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Django Backend
│   ├── animal/                  # Disease detection app
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── migrations/
│   ├── accounts/                # User authentication
│   ├── ml_model/                # Machine learning
│   │   ├── disease_detector.py  # Training code
│   │   ├── disease_info.json    # Disease database
│   │   └── trained_models/      # Saved models
│   ├── server/                  # Django config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── asgi.py
│   ├── manage.py
│   └── media/
│       └── uploads/             # User images
│
├── env/                         # Virtual environment
├── train_model.py               # Model training script
├── SETUP_GUIDE.md               # Setup instructions
├── PROJECT_ANALYSIS.md          # Project overview
└── README.md                    # This file
```

---

## 🎯 Training Your Own Model

### Dataset Requirements
1. **Structure**: Organized by disease class
2. **Quantity**: Minimum 100 images per disease
3. **Quality**: Clear, well-lit images
4. **Format**: JPG, PNG, or GIF

### Dataset Example
```
dataset/
├── foot_rot/
│   ├── 001.jpg
│   ├── 002.jpg
│   └── ... (100+ images)
├── mastitis/
│   ├── 001.jpg
│   └── ... (100+ images)
└── healthy/
    ├── 001.jpg
    └── ... (100+ images)
```

### Training Process
```bash
# Run training script
python train_model.py

# Enter dataset path when prompted
# Select number of epochs and batch size
# Wait for training to complete
# Model will be saved automatically
```

### Model Files Generated
```
server/ml_model/trained_models/
├── cow_disease_detector.h5              # Trained weights
└── cow_disease_detector_classes.pkl     # Class labels
```

---

## 🔍 Troubleshooting

### Database Connection Error
```
Error: (2002, "Can't connect to server")
```
**Solution**: 
- Ensure MySQL service is running
- Check credentials in `server/.env`
- Verify database exists: `animaldiseasedetection`

### Model Not Found
```
Warning: Model files not found. Using mock predictions.
```
**Solution**:
- Run `python train_model.py` to train model
- Place dataset in proper folder structure
- Ensure training completes without errors

### CORS Error
```
Access to XMLHttpRequest blocked by CORS
```
**Solution**:
- Check CORS settings in `server/settings.py`
- Ensure `ALLOWED_HOSTS` includes your domain
- Restart Django server

### Upload File Error
```
File size exceeds 10MB limit
```
**Solution**:
- Use images smaller than 10MB
- Compress images before uploading
- JPG format recommended

---

## 🔒 Security

### Best Practices Implemented
✅ JWT token authentication  
✅ CORS protection  
✅ File size validation  
✅ File type validation  
✅ SQL injection prevention  
✅ Password hashing  

### Recommendations for Production
- [ ] Use HTTPS/SSL certificates
- [ ] Set `DEBUG = False`
- [ ] Use environment variables for secrets
- [ ] Set up regular backups
- [ ] Implement rate limiting
- [ ] Use stronger SECRET_KEY
- [ ] Set up monitoring & logging
- [ ] Implement input sanitization

---

## 📊 Performance

### Expected Metrics
- **Detection Time**: ~2-5 seconds per image
- **Accuracy**: 85-95% (depends on training data)
- **Confidence Score**: 0.75-0.99
- **Database Queries**: < 50ms
- **Image Processing**: < 1 second

### Optimization Tips
1. Use GPU for faster predictions
2. Compress images before upload
3. Cache frequent queries
4. Use CDN for static files
5. Implement lazy loading

---

## 📄 License & Credits

### Built With
- Django & DRF
- TensorFlow & Keras
- React & Vite
- Tailwind CSS
- MobileNetV2 (Google)

### Contributors
- Your Name - Project Lead
- Team Members - Development

---

## 📞 Support & Contact

### Getting Help
1. Check `SETUP_GUIDE.md` for detailed setup
2. Review `PROJECT_ANALYSIS.md` for architecture
3. Check API documentation in this README
4. Review error messages and logs

### Common Issues
- **Training taking too long**: Reduce epochs or batch size
- **Low accuracy**: Add more training data
- **Memory issues**: Reduce batch size or image resolution
- **Slow predictions**: Enable GPU acceleration

---

## 🚀 Future Roadmap

### Phase 2
- [ ] Multiple animal species support
- [ ] Real-time video diagnosis
- [ ] Mobile app (iOS/Android)
- [ ] Veterinarian consultation integration
- [ ] SMS notifications
- [ ] Treatment progress tracking

### Phase 3
- [ ] Advanced analytics
- [ ] Predictive maintenance
- [ ] IoT sensor integration
- [ ] Cloud deployment
- [ ] Multi-language support

### Phase 4
- [ ] AI-powered recommendations
- [ ] Blockchain for records
- [ ] Export to PDF reports
- [ ] Integration with veterinary clinics
- [ ] Mobile laboratory support

---

## ✅ Checklist

Before deploying to production:

- [ ] Train model on your dataset
- [ ] Test all API endpoints
- [ ] Configure database backups
- [ ] Set up SSL/HTTPS
- [ ] Create admin account
- [ ] Test user registration & login
- [ ] Verify file upload works
- [ ] Test all disease categories
- [ ] Check error handling
- [ ] Set up monitoring & logging
- [ ] Document custom changes
- [ ] Plan backup strategy

---

## 📝 Notes

- All disease information is based on veterinary best practices
- System provides diagnostic suggestions, not medical diagnoses
- Always consult with a veterinarian for serious conditions
- Database should be backed up regularly
- Model accuracy depends on training data quality

---

## 🎉 Happy Farming!

Your AI veterinary assistant is ready. Start detecting diseases and improving animal health today!

For questions or support, refer to the setup guide or documentation files.

**Last Updated**: November 28, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
