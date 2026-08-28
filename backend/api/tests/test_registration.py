"""
Registration & auth tests.

These specifically guard against the is_landlord bug we shipped and had to
fix twice: UserProfileSerializer marks is_landlord read_only (correctly, to
stop PATCH-based self-escalation), but UserSerializer.create() must still
read is_landlord from the raw registration payload, not the validated
(stripped) data. If this regresses, every new landlord signup silently
becomes a tenant.
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status


class RegistrationTests(APITestCase):
    def _register(self, username, is_landlord):
        return self.client.post('/api/register/', {
            'username': username,
            'email': f'{username}@example.com',
            'password': 'StrongPass123!',
            'profile': {'is_landlord': is_landlord, 'is_verified': False},
        }, format='json')

    def test_register_as_tenant(self):
        response = self._register('tenant_user', is_landlord=False)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='tenant_user')
        self.assertFalse(user.profile.is_landlord)

    def test_register_as_landlord_sets_is_landlord_true(self):
        """
        Regression test: is_landlord=True at signup must actually persist.
        This is the exact bug that broke property creation for every new
        landlord account until it was diagnosed and fixed.
        """
        response = self._register('landlord_user', is_landlord=True)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='landlord_user')
        self.assertTrue(
            user.profile.is_landlord,
            "is_landlord was not saved at registration — this is the "
            "read-only-stripping regression. Check UserSerializer.create() "
            "reads from self.initial_data, not validated_data."
        )

    def test_registration_never_sets_is_verified_true(self):
        """
        is_verified must NEVER be settable at signup, even if a malicious
        payload includes is_verified: true. Verification always requires
        admin approval.
        """
        response = self.client.post('/api/register/', {
            'username': 'sneaky_user',
            'email': 'sneaky@example.com',
            'password': 'StrongPass123!',
            'profile': {'is_landlord': True, 'is_verified': True},
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='sneaky_user')
        self.assertFalse(
            user.profile.is_verified,
            "is_verified was set to True at registration — this must "
            "never be possible without admin approval."
        )

    def test_login_returns_correct_is_landlord(self):
        """The full round trip: register as landlord, log in, profile reflects it."""
        self._register('roundtrip_landlord', is_landlord=True)
        response = self.client.post('/api/token/', {
            'username': 'roundtrip_landlord',
            'password': 'StrongPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['user']['is_landlord'])

    def test_duplicate_username_rejected(self):
        self._register('dupe_user', is_landlord=False)
        response = self._register('dupe_user', is_landlord=False)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)