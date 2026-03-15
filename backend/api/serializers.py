from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import Property, FavoriteProperty, ContactMessage, UserProfile, PropertyImage, Message, ViewingRequest, Review, RentalApplication, LandlordVerification


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['is_landlord', 'is_verified', 'full_name', 'phone', 'bio']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'password', 'profile']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},
            'email':    {'required': False},
        }

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
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
            ps = UserProfileSerializer(instance.profile, data=profile_data, partial=True)
            if ps.is_valid():
                ps.save()
        instance.username = validated_data.get('username', instance.username)
        instance.email    = validated_data.get('email', instance.email)
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        instance.save()
        return instance


class PropertyImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = PropertyImage
        fields = ['id', 'image', 'image_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'image_url']

    def get_landlord_is_verified(self, obj):
        profile = getattr(obj.landlord, 'profile', None)
        return profile.is_verified if profile else False

    def get_landlord_response_rate(self, obj):
        from django.db.models import Count, Q
        from .models import Message
        # Messages received by this landlord about their properties
        total = Message.objects.filter(receiver=obj.landlord, is_support=False).count()
        if total == 0:
            return None  # not enough data
        replied = Message.objects.filter(
            sender=obj.landlord, is_support=False
        ).values('receiver').distinct().count()
        # Simple: % of unique senders the landlord has replied to
        unique_senders = Message.objects.filter(
            receiver=obj.landlord, is_support=False
        ).values('sender').distinct().count()
        if unique_senders == 0:
            return None
        rate = min(100, round((replied / unique_senders) * 100))
        return rate

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def validate_image(self, value):
        if value.content_type not in ['image/jpeg', 'image/png']:
            raise serializers.ValidationError("Only JPEG and PNG images are supported.")
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be less than 5MB.")
        return value


class PropertySerializer(serializers.ModelSerializer):
    image_url          = serializers.SerializerMethodField()
    is_favorited       = serializers.SerializerMethodField()
    landlord_username    = serializers.CharField(source='landlord.username', read_only=True)
    landlord_is_verified   = serializers.SerializerMethodField()
    landlord_response_rate = serializers.SerializerMethodField()
    images             = PropertyImageSerializer(many=True, read_only=True)
    completeness_score = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Property
        fields = [
            'id', 'landlord', 'landlord_username',
            'area', 'district',
            'rental_amount', 'deposit', 'viewing_fee',
            'status', 'description',
            'is_favorited', 'image_url', 'images', 'is_approved',
            'created_at',
            'property_type', 'bedrooms', 'bathrooms',
            'furnished', 'parking', 'pet_friendly', 'security',
            'water_supply', 'electricity',
            'available_from', 'whatsapp_number',
            'completeness_score',
            'landlord_is_verified',
            'landlord_response_rate',
        ]
        read_only_fields = ['landlord', 'image_url', 'images', 'completeness_score']

    def get_landlord_is_verified(self, obj):
        profile = getattr(obj.landlord, 'profile', None)
        return profile.is_verified if profile else False

    def get_landlord_response_rate(self, obj):
        from django.db.models import Count, Q
        from .models import Message
        # Messages received by this landlord about their properties
        total = Message.objects.filter(receiver=obj.landlord, is_support=False).count()
        if total == 0:
            return None  # not enough data
        replied = Message.objects.filter(
            sender=obj.landlord, is_support=False
        ).values('receiver').distinct().count()
        # Simple: % of unique senders the landlord has replied to
        unique_senders = Message.objects.filter(
            receiver=obj.landlord, is_support=False
        ).values('sender').distinct().count()
        if unique_senders == 0:
            return None
        rate = min(100, round((replied / unique_senders) * 100))
        return rate

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
    property        = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all(), write_only=True)
    property_detail = PropertySerializer(source='property', read_only=True)

    class Meta:
        model  = FavoriteProperty
        fields = ['id', 'user', 'property', 'property_detail']
        read_only_fields = ['user', 'property_detail']


class ContactMessageSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = ContactMessage
        fields = ['id', 'property', 'tenant_name', 'tenant_email', 'message']


class MessageSerializer(serializers.ModelSerializer):
    sender_username   = serializers.CharField(source='sender.username',   read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    property_title    = serializers.CharField(source='property.area',     read_only=True, allow_null=True)

    class Meta:
        model  = Message
        fields = [
            'id', 'sender', 'sender_username',
            'receiver', 'receiver_username',
            'property', 'property_title',
            'content', 'created_at', 'is_read', 'is_support',
        ]
        read_only_fields = ['sender', 'created_at']


class ViewingRequestSerializer(serializers.ModelSerializer):
    tenant_username  = serializers.CharField(source='tenant.username',             read_only=True)
    property_title   = serializers.SerializerMethodField()
    landlord_id      = serializers.IntegerField(source='property.landlord.id',     read_only=True)

    class Meta:
        model  = ViewingRequest
        fields = [
            'id', 'property', 'property_title',
            'tenant', 'tenant_username',
            'landlord_id',
            'proposed_date', 'proposed_time',
            'message', 'status', 'landlord_note',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['tenant', 'status', 'landlord_note', 'created_at', 'updated_at', 'landlord_id']

    def get_property_title(self, obj):
        return f"{obj.property.area}, {obj.property.district}"


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)

    class Meta:
        model  = Review
        fields = ['id', 'property', 'reviewer', 'reviewer_username', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'created_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class RentalApplicationSerializer(serializers.ModelSerializer):
    applicant_username = serializers.CharField(source='applicant.username', read_only=True)
    property_title     = serializers.SerializerMethodField()

    class Meta:
        model  = RentalApplication
        fields = [
            'id', 'property', 'property_title',
            'applicant', 'applicant_username',
            'full_name', 'email', 'phone',
            'employment_status', 'employer_name', 'monthly_income',
            'num_occupants', 'has_pets', 'move_in_date',
            'references', 'additional_notes',
            'status', 'landlord_note', 'created_at', 'updated_at',
        ]
        read_only_fields = ['applicant', 'status', 'landlord_note', 'created_at', 'updated_at']

    def get_property_title(self, obj):
        return f"{obj.property.area}, {obj.property.district}"


class LandlordVerificationSerializer(serializers.ModelSerializer):
    landlord_username    = serializers.CharField(source='landlord.username', read_only=True)
    id_document_url      = serializers.SerializerMethodField()
    proof_of_ownership_url = serializers.SerializerMethodField()

    class Meta:
        model  = LandlordVerification
        fields = [
            'id', 'landlord', 'landlord_username',
            'national_id_number', 'id_document', 'id_document_url',
            'proof_of_ownership', 'proof_of_ownership_url',
            'phone_number', 'status', 'admin_note',
            'submitted_at', 'reviewed_at',
        ]
        read_only_fields = ['landlord', 'status', 'admin_note', 'submitted_at', 'reviewed_at']

    def get_id_document_url(self, obj):
        request = self.context.get('request')
        if obj.id_document and request:
            return request.build_absolute_uri(obj.id_document.url)
        return None

    def get_proof_of_ownership_url(self, obj):
        request = self.context.get('request')
        if obj.proof_of_ownership and request:
            return request.build_absolute_uri(obj.proof_of_ownership.url)
        return None