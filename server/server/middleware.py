from django.http import HttpResponse


class ForceCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle preflight OPTIONS request before reaching views
        if request.method == 'OPTIONS':
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)
        
        # Get origin from request, fallback to wildcard
        origin = request.headers.get('Origin', '*')
        
        # Always add CORS headers to ALL responses
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
        response['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRFToken, enctype, multipart/form-data, application/json'
        response['Access-Control-Max-Age'] = '3600'
        response['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        
        return response