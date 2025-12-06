from django.urls import path
from .views import (
    DetectAnimalAPIView,
    DetectionHistoryAPIView,
    DetectionDetailAPIView,
    StatisticsAPIView,
    SymptomsAPIView,
    DiagnoseAPIView,
    DiseaseDetailAPIView,
    SymptomDiagnosisHistoryAPIView,
    SymptomDiagnosisDetailAPIView
)

urlpatterns = [
    path('detect/', DetectAnimalAPIView.as_view(), name='detectanimal'),
    path('history/', DetectionHistoryAPIView.as_view(), name='history'),
    path('detail/<int:detection_id>/', DetectionDetailAPIView.as_view(), name='detail'),
    path('statistics/', StatisticsAPIView.as_view(), name='statistics'),
    path('symptoms/', SymptomsAPIView.as_view(), name='symptoms'),
    path('diagnose/', DiagnoseAPIView.as_view(), name='diagnose'),
    path('diseases/<str:disease_id>/', DiseaseDetailAPIView.as_view(), name='disease-detail'),
    path('symptom-diagnosis/history/', SymptomDiagnosisHistoryAPIView.as_view(), name='symptom-diagnosis-history'),
    path('symptom-diagnosis/<int:diagnosis_id>/', SymptomDiagnosisDetailAPIView.as_view(), name='symptom-diagnosis-detail'),
]
