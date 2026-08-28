"""
Authorization & permission tests.

Covers the mass-assignment fix (tenant cannot self-escalate via PATCH
/api/profile/), object-level ownership checks (landlords can only touch
their own properties), and admin-only endpoint protection.
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Property, UserProfile


def make_user(username, is_landlord=False, is_staff=False, is_verified=False):
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password='pass12345')
    user.is_staff = is_staff
    user.save()
    UserProfile.objects.create(user=user, is_landlord=is_landlord, is_verified=is_verified)
    return user


def auth_header(user):
    token = RefreshToken.for_user(user).access_token
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


class MassAssignmentTests(APITestCase):
    """
    Regression test for the original audit finding: a tenant PATCHing their
    own profile must never be able to set is_landlord or is_verified.
    """
    def setUp(self):
        self.tenant = make_user('mass_assign_tenant', is_landlord=False)

    def test_tenant_cannot_self_escalate_to_landlord(self):
        response = self.client.put('/api/profile/', {
            'is_landlord': True,
        }, format='json', **auth_header(self.tenant))
        self.tenant.profile.refresh_from_db()
        self.assertFalse(
            self.tenant.profile.is_landlord,
            "Tenant was able to self-escalate to landlord via PATCH /api/profile/ — "
            "mass assignment vulnerability has regressed."
        )

    def test_tenant_cannot_self_verify(self):
        response = self.client.put('/api/profile/', {
            'is_verified': True,
        }, format='json', **auth_header(self.tenant))
        self.tenant.profile.refresh_from_db()
        self.assertFalse(self.tenant.profile.is_verified)


class PropertyOwnershipTests(APITestCase):
    def setUp(self):
        self.landlord_a = make_user('landlord_a', is_landlord=True)
        self.landlord_b = make_user('landlord_b', is_landlord=True)
        self.admin       = make_user('admin_user', is_staff=True)
        self.property_a  = Property.objects.create(
            landlord=self.landlord_a, area='Ha Tsolo', district='Maseru',
            rental_amount=2000,
        )

    def test_landlord_cannot_edit_others_property(self):
        response = self.client.patch(
            f'/api/properties/{self.property_a.id}/',
            {'rental_amount': 9999}, format='json',
            **auth_header(self.landlord_b)
        )
        self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN))
        self.property_a.refresh_from_db()
        self.assertEqual(self.property_a.rental_amount, 2000)

    def test_landlord_cannot_delete_others_property(self):
        response = self.client.delete(
            f'/api/properties/{self.property_a.id}/',
            **auth_header(self.landlord_b)
        )
        self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN))
        self.assertTrue(Property.objects.filter(id=self.property_a.id).exists())

    def test_admin_can_delete_any_property(self):
        response = self.client.delete(
            f'/api/properties/{self.property_a.id}/',
            **auth_header(self.admin)
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Property.objects.filter(id=self.property_a.id).exists())

    def test_tenant_cannot_create_property(self):
        tenant = make_user('non_landlord', is_landlord=False)
        response = self.client.post('/api/properties/', {
            'area': 'Test Area', 'district': 'Maseru', 'rental_amount': 1000,
        }, format='json', **auth_header(tenant))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminEndpointTests(APITestCase):
    def setUp(self):
        self.tenant = make_user('regular_tenant', is_landlord=False)
        self.admin  = make_user('the_admin', is_staff=True)

    def test_non_admin_cannot_list_users(self):
        response = self.client.get('/api/users/', **auth_header(self.tenant))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_users(self):
        response = self.client.get('/api/users/', **auth_header(self.admin))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_admin_cannot_access_verification_admin(self):
        response = self.client.get('/api/verification/admin/', **auth_header(self.tenant))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_request_rejected(self):
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)