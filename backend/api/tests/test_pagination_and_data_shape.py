"""
Pagination contract tests.

These document the shape frontend code must handle. We spent an entire
session chasing down four separate frontend crash sites (Dashboard,
AdminDashboard, Navbar, UnreadContext) caused by list endpoints silently
switching from a plain array to {count, next, previous, results} when
PAGE_SIZE was added. These tests won't catch a frontend regression, but
they pin down exactly which backend endpoints are paginated so nobody
has to rediscover that the hard way again.
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Property, UserProfile


def make_user(username, is_landlord=False, is_staff=False):
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password='pass12345')
    user.is_staff = is_staff
    user.save()
    UserProfile.objects.create(user=user, is_landlord=is_landlord)
    return user


def auth_header(user):
    token = RefreshToken.for_user(user).access_token
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


class PaginatedEndpointShapeTests(APITestCase):
    """
    These three endpoints are genuinely paginated (ListAPIView/ListCreateAPIView).
    Any frontend code calling them MUST unwrap response.data.results, not use
    response.data directly as an array.
    """
    def setUp(self):
        self.landlord = make_user('shape_landlord', is_landlord=True)
        self.admin     = make_user('shape_admin', is_staff=True)
        Property.objects.create(landlord=self.landlord, area='A', district='Maseru', rental_amount=1000)

    def test_properties_list_is_paginated(self):
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_users_list_is_paginated(self):
        response = self.client.get('/api/users/', **auth_header(self.admin))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_messages_list_is_paginated(self):
        response = self.client.get('/api/messages/', **auth_header(self.landlord))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)


class NonPaginatedEndpointShapeTests(APITestCase):
    """
    These endpoints are custom APIViews that return a plain array or a plain
    object — never paginated, regardless of the global PAGE_SIZE setting.
    Documented here so nobody "fixes" them into unwrapping .results and
    breaks them the other way.
    """
    def setUp(self):
        self.tenant = make_user('nonpag_tenant', is_landlord=False)
        # FIX: SupportMessageView requires at least one staff user to exist
        # (it routes tenant messages to "the admin" — first staff user found).
        # Without one, the endpoint correctly returns 503 "Support not
        # available yet." — that's the app behaving correctly, the test was
        # just missing this fixture.
        self.admin = make_user('nonpag_admin', is_staff=True)

    def test_conversations_returns_plain_list(self):
        response = self.client.get('/api/conversations/', **auth_header(self.tenant))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_support_returns_plain_list(self):
        response = self.client.get('/api/support/', **auth_header(self.tenant))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_support_returns_503_when_no_admin_exists(self):
        """The other side of the fix above — confirm the 503 path itself works."""
        User.objects.filter(is_staff=True).delete()
        response = self.client.get('/api/support/', **auth_header(self.tenant))
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)