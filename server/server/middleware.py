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
        
        # STRICTLY allow all origins and hosts - bypass Django's host check
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
        response['Access-Control-Allow-Headers'] = '*'
        response['Access-Control-Max-Age'] = '3600'
        response['Access-Control-Expose-Headers'] = '*'
        
        return response