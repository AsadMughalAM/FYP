from rest_framework import authentication , permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework import status


class RegisterView(APIView):

    def post(self,request):
        data=request.data
        serializer=UserSerializer(data=data)
        if serializer.is_valid():
            user =serializer.save()
            return Response({
                "message":"User created successfully",
                "status": True
            },status=status.HTTP_201_CREATED )
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

