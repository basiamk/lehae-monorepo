"""
File upload validation tests.

Covers the image magic-byte check (validate_image) that replaced the
deprecated imghdr module — content-type header spoofing must still be
rejected by checking actual file bytes.
"""
from io import BytesIO
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from PIL import Image

from api.models import Property, UserProfile


def make_user(username, is_landlord=True):
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password='pass12345')
    UserProfile.objects.create(user=user, is_landlord=is_landlord)
    return user


def auth_header(user):
    token = RefreshToken.for_user(user).access_token
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


def make_real_png(size=(10, 10), color='red'):
    """
    Generate a genuinely valid, Pillow-decodable PNG at test time — rather
    than hardcoding raw bytes, which are fragile and can fail Pillow's own
    internal validation (DRF's ImageField re-decodes the file after our
    magic-byte check passes) even when the magic bytes themselves are correct.
    """
    buf = BytesIO()
    Image.new('RGB', size, color=color).save(buf, format='PNG')
    buf.seek(0)
    return buf.read()


class ImageUploadValidationTests(APITestCase):
    def setUp(self):
        self.landlord = make_user('upload_landlord')
        self.property = Property.objects.create(
            landlord=self.landlord, area='Test', district='Maseru', rental_amount=1000,
        )

    def test_valid_png_is_accepted(self):
        image = SimpleUploadedFile('test.png', make_real_png(), content_type='image/png')
        response = self.client.post('/api/property-images/', {
            'property_id': self.property.id, 'image': image,
        }, format='multipart', **auth_header(self.landlord))
        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED,
            f"Valid PNG upload was rejected: {response.data}"
        )

    def test_fake_image_with_spoofed_content_type_rejected(self):
        """
        A .txt file renamed with an image/png content-type header must still
        be rejected — the magic-byte check reads actual file bytes, not the
        client-supplied Content-Type.
        """
        fake_image = SimpleUploadedFile(
            'fake.png', b'this is not actually a png file', content_type='image/png'
        )
        response = self.client.post('/api/property-images/', {
            'property_id': self.property.id, 'image': fake_image,
        }, format='multipart', **auth_header(self.landlord))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oversized_image_rejected(self):
        # Real PNG header/structure, padded past the 5MB limit
        big_bytes = make_real_png(size=(10, 10)) + b'0' * (5 * 1024 * 1024 + 1)
        big_image = SimpleUploadedFile('big.png', big_bytes, content_type='image/png')
        response = self.client.post('/api/property-images/', {
            'property_id': self.property.id, 'image': big_image,
        }, format='multipart', **auth_header(self.landlord))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_owner_cannot_upload_image_to_property(self):
        other_landlord = make_user('other_upload_landlord')
        image = SimpleUploadedFile('test.png', make_real_png(), content_type='image/png')
        response = self.client.post('/api/property-images/', {
            'property_id': self.property.id, 'image': image,
        }, format='multipart', **auth_header(other_landlord))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)