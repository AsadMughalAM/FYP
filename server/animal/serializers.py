from rest_framework import serializers
from .models import AnimalDetection
from django.conf import settings

class AnimalDetectionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = AnimalDetection
        fields = [
            'id', 'user', 'user_email', 'image', 'animal_name', 'disease_name',
            'confidence_score', 'severity', 'symptoms', 'treatment', 'prevention',
            'antibiotics', 'contagious', 'all_predictions', 'notes', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'confidence_score', 'severity', 'symptoms', 
                           'treatment', 'prevention', 'antibiotics',
                           'contagious', 'all_predictions', 'created_at', 'updated_at']
    
    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.MEDIA_URL}{obj.image.name}"
        return None
