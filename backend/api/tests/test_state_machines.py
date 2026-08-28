"""
State machine tests for RentalApplication and ViewingRequest.

Regression guard for the audit finding: a cancelled application could
previously be re-approved because there was no validation of the current
status before writing a new one. VALID_TRANSITIONS + can_transition_to()
must reject any transition not explicitly listed.
"""
from datetime import date, time
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Property, UserProfile, RentalApplication, ViewingRequest


def make_user(username, is_landlord=False, is_staff=False):
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password='pass12345')
    user.is_staff = is_staff
    user.save()
    UserProfile.objects.create(user=user, is_landlord=is_landlord)
    return user


def auth_header(user):
    token = RefreshToken.for_user(user).access_token
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


class RentalApplicationStateMachineTests(APITestCase):
    def setUp(self):
        self.landlord = make_user('sm_landlord', is_landlord=True)
        self.tenant   = make_user('sm_tenant', is_landlord=False)
        self.property = Property.objects.create(
            landlord=self.landlord, area='Ha Tsolo', district='Maseru', rental_amount=2000,
        )
        self.application = RentalApplication.objects.create(
            property=self.property, applicant=self.tenant,
            full_name='Test Tenant', email='tenant@example.com', phone='12345678',
            employment_status='employed', move_in_date=date.today(),
        )

    def test_pending_can_transition_to_reviewing(self):
        self.assertTrue(self.application.can_transition_to('reviewing'))

    def test_pending_can_transition_to_approved(self):
        self.assertTrue(self.application.can_transition_to('approved'))

    def test_cancelled_cannot_transition_to_approved(self):
        """The exact regression this state machine exists to prevent."""
        self.application.status = 'cancelled'
        self.application.save()
        self.assertFalse(self.application.can_transition_to('approved'))

    def test_approved_cannot_transition_anywhere(self):
        self.application.status = 'approved'
        self.application.save()
        self.assertFalse(self.application.can_transition_to('declined'))
        self.assertFalse(self.application.can_transition_to('pending'))

    def test_api_rejects_invalid_transition(self):
        self.application.status = 'cancelled'
        self.application.save()
        response = self.client.patch(
            f'/api/applications/{self.application.id}/',
            {'status': 'approved'}, format='json',
            **auth_header(self.landlord)
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'cancelled')

    def test_api_allows_valid_transition(self):
        response = self.client.patch(
            f'/api/applications/{self.application.id}/',
            {'status': 'approved'}, format='json',
            **auth_header(self.landlord)
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'approved')

    def test_tenant_can_cancel_own_application(self):
        response = self.client.patch(
            f'/api/applications/{self.application.id}/',
            {'status': 'cancelled'}, format='json',
            **auth_header(self.tenant)
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_duplicate_application_rejected(self):
        """Regression test for the race-condition/duplicate-application audit finding."""
        response = self.client.post('/api/applications/', {
            'property': self.property.id,
            'full_name': 'Test Tenant', 'email': 'tenant@example.com', 'phone': '12345678',
            'employment_status': 'employed', 'move_in_date': str(date.today()),
        }, format='json', **auth_header(self.tenant))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ViewingRequestStateMachineTests(APITestCase):
    def setUp(self):
        self.landlord = make_user('vr_landlord', is_landlord=True)
        self.tenant   = make_user('vr_tenant', is_landlord=False)
        self.property = Property.objects.create(
            landlord=self.landlord, area='Masowe', district='Maseru', rental_amount=1500,
        )
        self.viewing = ViewingRequest.objects.create(
            property=self.property, tenant=self.tenant,
            proposed_date=date.today(), proposed_time=time(10, 0),
        )

    def test_pending_can_be_accepted(self):
        self.assertTrue(self.viewing.can_transition_to('accepted'))

    def test_declined_cannot_be_accepted(self):
        self.viewing.status = 'declined'
        self.viewing.save()
        self.assertFalse(self.viewing.can_transition_to('accepted'))

    def test_api_rejects_double_accept_after_decline(self):
        self.client.patch(
            f'/api/viewings/{self.viewing.id}/',
            {'status': 'declined'}, format='json',
            **auth_header(self.landlord)
        )
        response = self.client.patch(
            f'/api/viewings/{self.viewing.id}/',
            {'status': 'accepted'}, format='json',
            **auth_header(self.landlord)
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)