# Symptom Diagnosis Database Integration - Migration Instructions

## Overview
A new model `SymptomDiagnosis` has been created to store symptom-based disease diagnosis results in the database, similar to how `AnimalDetection` stores image-based results.

## Steps to Apply Database Changes

### 1. Create Migration
Run the following command in your terminal from the `server/` directory:

```bash
cd server
python manage.py makemigrations animal
```

This will create a migration file in `server/animal/migrations/` with a name like `0007_symptomdiagnosis.py`.

### 2. Apply Migration
Run the migration to create the database table:

```bash
python manage.py migrate animal
```

### 3. Verify Migration
You can verify the migration was successful by checking:
- The database table `animal_symptomdiagnosis` was created
- You can see the model in Django admin at `/admin/animal/symptomdiagnosis/`

## New Database Model: SymptomDiagnosis

The model stores:
- User information (linked to User model)
- Animal details (name, age)
- Input symptoms (JSON array)
- Disease information (name, ID, confidence, match rate, severity)
- Matched symptoms (JSON array)
- Treatment, prevention, and medicines (JSON arrays)
- Contagious status
- All diagnosis results (top 5 matches)
- Notes and status
- Timestamps (created_at, updated_at)

## New API Endpoints

### 1. POST /api/diagnose/
- **Enhanced**: Now automatically saves diagnosis results to database
- **Response**: Includes `saved`, `diagnosis_id`, and `saved_diagnosis` fields

### 2. GET /api/animal/symptom-diagnosis/history/
- **Purpose**: Fetch all symptom diagnoses for the authenticated user
- **Response**: List of all symptom diagnoses with full details

### 3. GET /api/animal/symptom-diagnosis/<id>/
- **Purpose**: Get specific symptom diagnosis details
- **Response**: Single diagnosis object with all details

### 4. PATCH /api/animal/symptom-diagnosis/<id>/
- **Purpose**: Update diagnosis status, notes, animal name, or age
- **Body**: `{ "status": "treated", "notes": "...", "animal_name": "...", "animal_age": 12 }`

## Frontend Integration

The React `SymptomDiagnosis` component has been updated to:
- Send animal_name, animal_age, and notes in the request
- Display a success message when diagnosis is saved
- Use saved diagnosis data when available
- Show diagnosis ID in success message

## Testing

1. **Test Diagnosis Saving**:
   - Submit symptoms through the UI
   - Check browser console for "Diagnosis saved to history" message
   - Verify in Django admin that a new record was created

2. **Test History Fetching**:
   - Make a GET request to `/api/animal/symptom-diagnosis/history/`
   - Should return all diagnoses for the authenticated user

3. **Test Detail View**:
   - Use a diagnosis ID from history
   - Make a GET request to `/api/animal/symptom-diagnosis/<id>/`
   - Should return full diagnosis details

## Database Schema

```sql
CREATE TABLE animal_symptomdiagnosis (
    id BIGINT PRIMARY KEY,
    user_id INT REFERENCES auth_user(id),
    animal_name VARCHAR(100),
    animal_age INT,
    input_symptoms JSON,
    disease_name VARCHAR(100),
    disease_id VARCHAR(100),
    confidence_score FLOAT,
    match_rate FLOAT,
    severity VARCHAR(20),
    matched_symptoms JSON,
    treatment JSON,
    prevention JSON,
    medicines JSON,
    contagious BOOLEAN,
    all_results JSON,
    notes TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Notes

- All JSON fields store arrays or objects as JSON
- The model uses the same severity choices as AnimalDetection
- Indexes are created on user, created_at, disease_name, and status for performance
- The model is registered in Django admin for easy management

