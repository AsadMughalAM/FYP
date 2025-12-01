from django.db import models
from django.contrib.auth.models import User

class AnimalDetection(models.Model):
    SEVERITY_CHOICES = [
        ('None', 'None'),
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    image = models.ImageField(upload_to='uploads/')
    animal_name = models.CharField(max_length=100, blank=True, null=True)
    disease_name = models.CharField(max_length=100, blank=True, null=True)
    confidence_score = models.FloatField(default=0.0)  # 0-1 confidence
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='Low')
    symptoms = models.JSONField(default=list)  # JSON list of symptoms
    treatment = models.JSONField(default=list)  # JSON list of treatment steps
    prevention = models.JSONField(default=list)  # JSON list of prevention steps
    antibiotics = models.JSONField(default=list)  # JSON list of antibiotics
    contagious = models.BooleanField(default=False)
    all_predictions = models.JSONField(default=dict)  # All model predictions with confidence
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('diagnosed', 'Diagnosed'),
            ('treated', 'Treated'),
            ('recovered', 'Recovered'),
            ('pending', 'Pending')
        ],
        default='diagnosed'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['disease_name']),
        ]

    def __str__(self):
        return f"{self.animal_name or 'Unknown'} - {self.disease_name or 'N/A'} ({self.confidence_score*100:.1f}%)"
