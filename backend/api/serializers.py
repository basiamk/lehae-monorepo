from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import Property, FavoriteProperty, ContactMessage, UserProfile, PropertyImage

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['is_landlord', 'is_verified']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'profile']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},
            'email': {'required': False}
        }

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password']
            )
            UserProfile.objects.create(user=user, **profile_data)
            return user
        except ValidationError as e:
            raise serializers.ValidationError({"password": str(e)})
        except Exception as e:
            raise serializers.ValidationError({"detail": f"User creation failed: {str(e)}"})

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        if profile_data:
            profile_serializer = UserProfileSerializer(instance.profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        instance.save()
        return instance

class PropertyImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'image_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def validate_image(self, value):
        valid_formats = ['image/jpeg', 'image/png']
        if value.content_type not in valid_formats:
            raise serializers.ValidationError("Only JPEG and PNG images are supported.")
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("Image size must be less than 5MB.")
        return value

class PropertySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    landlord_username = serializers.CharField(source='landlord.username', read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = ['id', 'landlord', 'landlord_username', 'area', 'district', 'rental_amount', 'deposit', 'viewing_fee', 'status', 'description', 'is_favorited', 'image_url', 'images', 'is_approved']
        read_only_fields = ['landlord', 'image_url', 'images', 'is_approved']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return FavoriteProperty.objects.filter(user=request.user, property=obj).exists()
        return False

    def validate(self, data):
        if 'rental_amount' in data and data['rental_amount'] <= 0:
            raise serializers.ValidationError({"rental_amount": "Rental amount must be greater than 0."})
        if 'deposit' in data and data['deposit'] is not None and data['deposit'] < 0:
            raise serializers.ValidationError({"deposit": "Deposit cannot be negative."})
        if 'viewing_fee' in data and data['viewing_fee'] is not None and data['viewing_fee'] < 0:
            raise serializers.ValidationError({"viewing_fee": "Viewing fee cannot be negative."})
        return data

class FavoritePropertySerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all(), write_only=True)
    property_detail = PropertySerializer(source='property', read_only=True)

    class Meta:
        model = FavoriteProperty
        fields = ['id', 'user', 'property', 'property_detail']
        read_only_fields = ['user', 'property_detail']

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'property', 'tenant_name', 'tenant_email', 'message']