from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .serializers import UserSerializer, PropertySerializer, FavoritePropertySerializer, ContactMessageSerializer, PropertyImageSerializer
from .models import Property, FavoriteProperty, ContactMessage, UserProfile, PropertyImage
from django.core.mail import send_mail
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.shortcuts import get_object_or_404
import logging

# Add media serving view
from django.views.static import serve

logger = logging.getLogger(__name__)

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        logger.error(f"Registration error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': _('Please provide both username and password')},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)
        if user:
            UserProfile.objects.get_or_create(user=user, defaults={'is_landlord': False})
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_landlord': user.profile.is_landlord
                }
            }, status=status.HTTP_200_OK)
        return Response(
            {'error': _('Invalid username or password')},
            status=status.HTTP_401_UNAUTHORIZED
        )

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_landlord': user.profile.is_landlord
        })

class PropertyListView(generics.ListCreateAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        queryset = Property.objects.all()
        status = self.request.query_params.get('status')
        district = self.request.query_params.get('district')
        area = self.request.query_params.get('area')
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        landlord = self.request.query_params.get('landlord')
        is_approved = self.request.query_params.get('is_approved')
        limit = self.request.query_params.get('limit')
        ordering = self.request.query_params.get('ordering', 'created_at')

        if status and status != 'all':
            queryset = queryset.filter(status=status)
        if district:
            queryset = queryset.filter(district__icontains=district)
        if area:
            queryset = queryset.filter(area__icontains=area)
        if min_amount:
            queryset = queryset.filter(rental_amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(rental_amount__lte=max_amount)
        if landlord == 'self' and self.request.user.is_authenticated:
            logger.info(f"Filtering properties for user: {self.request.user.username}")
            queryset = queryset.filter(landlord=self.request.user)
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved.lower() == 'true')
        if ordering:
            queryset = queryset.order_by(ordering)
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                logger.error(f"Invalid limit parameter: {limit}")
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.profile.is_landlord:
            logger.error(f"Non-landlord {self.request.user.username} attempted to create property")
            raise serializers.ValidationError(_('Only landlords can create properties'))
        serializer.save(landlord=self.request.user)

class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_update(self, serializer):
        if self.request.user != serializer.instance.landlord:
            logger.error(f"User {self.request.user.username} attempted unauthorized update")
            raise serializers.ValidationError(_('You do not have permission to update this property'))
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.landlord:
            logger.error(f"User {self.request.user.username} attempted unauthorized delete")
            raise serializers.ValidationError(_('You do not have permission to delete this property'))
        instance.delete()

class PropertyImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        property_id = request.data.get('property_id')
        if not property_id:
            logger.error(f"Missing property_id for image upload by user {request.user.username}")
            return Response({"error": "Property ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            property = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            logger.error(f"Property {property_id} not found for image upload")
            return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)
        if property.landlord != request.user:
            logger.error(f"User {request.user.username} attempted unauthorized image upload")
            return Response({"error": "You do not have permission to add images to this property"}, status=status.HTTP_403_FORBIDDEN)
        if property.images.count() >= 3:
            logger.error(f"Maximum images reached for property {property_id}")
            return Response({"error": "Maximum 3 images allowed per property"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = PropertyImageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(property=property)
            logger.info(f"Image uploaded for property {property_id} by {request.user.username}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Image upload error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            image = PropertyImage.objects.get(id=pk)
        except PropertyImage.DoesNotExist:
            logger.error(f"Image {pk} not found for deletion")
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
        if image.property.landlord != request.user:
            logger.error(f"User {request.user.username} attempted unauthorized image deletion")
            return Response({"error": "You do not have permission to delete this image"}, status=status.HTTP_403_FORBIDDEN)
        image.delete()
        logger.info(f"Image {pk} deleted by {request.user.username}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class TenantListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(profile__is_landlord=False)

class TenantDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(profile__is_landlord=False)

class FavoritePropertyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = FavoriteProperty.objects.filter(user=request.user)
        serializer = FavoritePropertySerializer(favorites, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        property_id = request.data.get('property')
        if not property_id:
            logger.error(f"Missing property_id for user {request.user.username}")
            return Response({'error': 'Property ID required'}, status=status.HTTP_400_BAD_REQUEST)
        if FavoriteProperty.objects.filter(user=request.user, property_id=property_id).exists():
            logger.info(f"Property {property_id} already favorited by {request.user.username}")
            return Response({'message': 'Already favorited'}, status=status.HTTP_200_OK)
        data = {'property': property_id}
        serializer = FavoritePropertySerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            logger.info(f"Favorite added by {request.user.username} for property {property_id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Favorite creation error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        property_id = request.data.get('property')
        if not property_id:
            logger.error(f"Missing property_id for delete by user {request.user.username}")
            return Response({'error': 'Property ID required'}, status=status.HTTP_400_BAD_REQUEST)
        favorite = FavoriteProperty.objects.filter(user=request.user, property_id=property_id).first()
        if favorite:
            favorite.delete()
            logger.info(f"Favorite removed by {request.user.username} for property {property_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        logger.error(f"Favorite not found for user {request.user.username}, property {property_id}")
        return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)

class ContactMessageAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            contact_message = serializer.save()
            subject = _('New Contact Message')
            message = f"""
            From: {contact_message.tenant_name} ({contact_message.tenant_email})
            Property ID: {contact_message.property.id}
            Message: {contact_message.message}
            """
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                ['info@lehae.com'],
                fail_silently=True
            )
            logger.info(f"Contact message sent by {contact_message.tenant_name}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Contact message error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            UserProfile.objects.get_or_create(user=user, defaults={'is_landlord': False})
            stats = []
            if user.profile.is_landlord:
                properties = Property.objects.filter(landlord=user)
                stats.append({
                    'id': 'properties',
                    'label': 'Total Properties',
                    'value': properties.count(),
                    'trend': '0',
                    'iconBg': 'bg-blue-100',
                    'icon': 'house'
                })
                stats.append({
                    'id': 'vacant',
                    'label': 'Vacant Properties',
                    'value': properties.filter(status='vacant').count(),
                    'trend': '0',
                    'iconBg': 'bg-green-100',
                    'icon': 'house-vacant'
                })
            else:
                favorites = FavoriteProperty.objects.filter(user=request.user)
                stats.append({
                    'id': 'favorites',
                    'label': 'Favorite Properties',
                    'value': favorites.count(),
                    'trend': '0',
                    'iconBg': 'bg-red-100',
                    'icon': 'heart'
                })
            recent_activity = ContactMessage.objects.filter(property__landlord=user) if user.profile.is_landlord else ContactMessage.objects.filter(tenant_email=user.email)
            recent_activity_data = [
                {
                    'id': msg.id,
                    'title': f"Message from {msg.tenant_name}",
                    'description': msg.message[:50] + ('...' if len(msg.message) > 50 else ''),
                    'time': msg.created_at.strftime('%Y-%m-%d %H:%M'),
                    'iconBg': 'bg-purple-100',
                    'icon': 'envelope'
                } for msg in recent_activity[:5]
            ]
            return Response({
                'stats': stats,
                'recentActivity': recent_activity_data,
                'upcomingTasks': []
            })
        except Exception as e:
            logger.error(f"Dashboard error for user {request.user.username}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        serializer.save()
        logger.info(f"User {self.get_object().username} updated by admin {self.request.user.username}")

    def perform_destroy(self, instance):
        logger.info(f"User {instance.username} deleted by admin {self.request.user.username}")
        instance.delete()

class UserVerificationView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        user = get_object_or_404(User, id=pk)
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"User {user.username} verified by admin {request.user.username}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"User verification error for user {pk}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        properties = Property.objects.all()
        most_viewed = properties.order_by('-updated_at')[:10]  # Placeholder: add 'views' field later
        data = {
            'most_viewed': PropertySerializer(most_viewed, many=True, context={'request': request}).data,
            'total_properties': properties.count(),
            'total_users': User.objects.count(),
        }
        return Response(data)

# Media serving view
def serve_media(request, path):
    return serve(request, path, document_root=settings.MEDIA_ROOT)