from django.http import HttpResponse


class ForceCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # BYPASS Django's host validation entirely
        # Get host before Django rejects it
        host = request.get_host() if request.get_host() else ''
        
        try:
            if request.method == 'OPTIONS':
                response = HttpResponse(status=200)
                
                # Add CORS headers
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Credentials'] = 'true'
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
                response['Access-Control-Allow-Headers'] = '*'
                response['Access-Control-Max-Age'] = '3600'
                return response
            else:
                response = self.get_response(request)
        except Exception as e:
            # If it's a DisallowedHost error, still return the response with CORS
            if 'DisallowedHost' in str(e) or 'Invalid HTTP_HOST' in str(e):
                response = HttpResponse(status=400)
            else:
                raise
        
        # Add CORS headers to ALL responses
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
        response['Access-Control-Allow-Headers'] = '*'
        response['Access-Control-Max-Age'] = '3600'
        
        return response