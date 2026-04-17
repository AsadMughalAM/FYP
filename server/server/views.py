from django.http import JsonResponse
from django.conf import settings


def healthcheck(request):
    return JsonResponse(
        {
            "status": "ok",
            "service": "vetai-backend",
            "debug": settings.DEBUG,
        }
    )
