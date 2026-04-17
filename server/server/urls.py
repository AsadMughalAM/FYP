from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from animal.views import SymptomsAPIView, DiagnoseAPIView, DiseaseDetailAPIView
from .views import healthcheck

urlpatterns = [
    path('health/', healthcheck, name='healthcheck'),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/animal/', include('animal.urls')),
    path('api/symptoms/', SymptomsAPIView.as_view(), name='symptoms-root'),
    path('api/diagnose/', DiagnoseAPIView.as_view(), name='diagnose-root'),
    path('api/diseases/<str:disease_id>/', DiseaseDetailAPIView.as_view(), name='disease-detail-root'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


