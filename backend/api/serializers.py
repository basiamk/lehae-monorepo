from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import (
    Property, FavoriteProperty, ContactMessage, UserProfile,
    PropertyImage, Message, ViewingRequest, Review,
    RentalApplication, LandlordVerification,
)


# Used for reads and for editing an existing profile via PATCH/PUT.
# is_landlord / is_verified stay read-only here — this is what prevents a
# tenant from PATCHing their own profile to become a landlord or get verified.
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['is_landlord', 'is_verified', 'full_name', 'phone', 'bio']
        read_only_fields = ['is_landlord', 'is_verified']


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
        # FIX: UserProfileSerializer marks is_landlord as read_only (to stop
        # PATCH-based self-escalation on profile edits). But because 'profile'
        # is a nested UserProfileSerializer field, DRF runs that same
        # read-only stripping during input validation for registration too —
        # so by the time validated_data reaches here, is_landlord is already
        # gone. Read it from the raw request payload instead. This path only
        # ever runs at signup, never at profile edit, so it can't be used to
        # self-escalate an existing account.
        raw_profile = self.initial_data.get('profile', {})
        is_landlord_at_signup = bool(raw_profile.get('is_landlord', False))

        validated_data.pop('profile', None)
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
            )
            UserProfile.objects.create(user=user, is_landlord=is_landlord_at_signup)
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

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def validate_image(self, value):
        ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
        MAX_SIZE_BYTES        = 5 * 1024 * 1024  # 5 MB

        if value.content_type not in ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError("Only JPEG, PNG, and WebP images are supported.")

        if value.size > MAX_SIZE_BYTES:
            raise serializers.ValidationError("Image size must be less than 5 MB.")

        header = value.read(12)
        value.seek(0)

        is_jpeg = header[:3] == b'\xff\xd8\xff'
        is_png  = header[:8] == b'\x89PNG\r\n\x1a\n'
        is_webp = header[:4] == b'RIFF' and header[8:12] == b'WEBP'

        if not (is_jpeg or is_png or is_webp):
            raise serializers.ValidationError(
                "File content does not match a valid image format. "
                "Rename tricks and spoofed content-types are not accepted."
            )

        return value


class PropertySerializer(serializers.ModelSerializer):
    image_url               = serializers.SerializerMethodField()
    is_favorited             = serializers.SerializerMethodField()
    landlord_username        = serializers.CharField(source='landlord.username', read_only=True)
    landlord_is_verified     = serializers.SerializerMethodField()
    landlord_response_rate   = serializers.SerializerMethodField()
    images                   = PropertyImageSerializer(many=True, read_only=True)
    completeness_score       = serializers.IntegerField(read_only=True)

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
        from .models import Message
        unique_senders = Message.objects.filter(
            receiver=obj.landlord, is_support=False
        ).values('sender').distinct().count()
        if unique_senders == 0:
            return None
        replied = Message.objects.filter(
            sender=obj.landlord, is_support=False
        ).values('receiver').distinct().count()
        return min(100, round((replied / unique_senders) * 100))

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
        queryset=Property.objects.all(), required=False, allow_null=True,
    )

    class Meta:
        model  = ContactMessage
        fields = ['id', 'property', 'tenant_name', 'tenant_email', 'message']


class MessageSerializer(serializers.ModelSerializer):
    sender_username    = serializers.CharField(source='sender.username',   read_only=True)
    receiver_username  = serializers.CharField(source='receiver.username', read_only=True)
    property_title      = serializers.CharField(source='property.area',    read_only=True, allow_null=True)

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
    tenant_username = serializers.CharField(source='tenant.username',         read_only=True)
    property_title  = serializers.SerializerMethodField()
    landlord_id     = serializers.IntegerField(source='property.landlord.id', read_only=True)

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
    property_title       = serializers.SerializerMethodField()

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
    landlord_username       = serializers.CharField(source='landlord.username', read_only=True)
    id_document_url          = serializers.SerializerMethodField()
    proof_of_ownership_url   = serializers.SerializerMethodField()

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