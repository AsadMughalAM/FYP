from django.urls import path
from .views import (
    DetectAnimalAPIView,
    DetectionHistoryAPIView,
    DetectionDetailAPIView,
    StatisticsAPIView
)

urlpatterns = [
    path('detect/', DetectAnimalAPIView.as_view(), name='detectanimal'),
    path('history/', DetectionHistoryAPIView.as_view(), name='history'),
    path('detail/<int:detection_id>/', DetectionDetailAPIView.as_view(), name='detail'),
    path('statistics/', StatisticsAPIView.as_view(), name='statistics'),
]
