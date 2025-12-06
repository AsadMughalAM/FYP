from django.contrib import admin
from .models import AnimalDetection, SymptomDiagnosis

@admin.register(AnimalDetection)
class AnimalDetectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'animal_name', 'disease_name', 'confidence_score', 'severity', 'status', 'created_at']
    list_filter = ['severity', 'status', 'contagious', 'created_at']
    search_fields = ['animal_name', 'disease_name', 'user__email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(SymptomDiagnosis)
class SymptomDiagnosisAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'animal_name', 'disease_name', 'confidence_score', 'match_rate', 'severity', 'status', 'created_at']
    list_filter = ['severity', 'status', 'contagious', 'created_at']
    search_fields = ['animal_name', 'disease_name', 'user__email', 'disease_id']
    readonly_fields = ['created_at', 'updated_at']