from django.urls import path
from .views import (
    UserRegistrationView, UserLoginView, ProfileView,
    PropertyListView, PropertyDetailView,
    FavoritePropertyView, ContactMessageAPIView,
    DashboardView,
    UserListView, UserDetailView, UserVerificationView,
    ReportView,
    MessageListCreateView, MessageDetailView,
    ConversationsView, MarkConversationReadView, ConversationMessagesView,
    PropertyImageView,
    ViewingRequestListCreateView, ViewingRequestDetailView,
    ReviewListCreateView,
)

urlpatterns = [
    # Auth
    path('register/',                UserRegistrationView.as_view(),   name='register'),
    path('token/',                   UserLoginView.as_view(),           name='token'),
    path('profile/',                 ProfileView.as_view(),             name='profile'),

    # Properties
    path('properties/',              PropertyListView.as_view(),        name='property-list'),
    path('properties/<int:pk>/',     PropertyDetailView.as_view(),      name='property-detail'),

    # Property images
    path('property-images/',         PropertyImageView.as_view(),       name='property-image-list-create'),
    path('property-images/<int:pk>/',PropertyImageView.as_view(),       name='property-image-detail'),

    # Favorites
    path('favorites/',               FavoritePropertyView.as_view(),    name='favorites'),

    # Contact
    path('contact/',                 ContactMessageAPIView.as_view(),   name='contact'),

    # Dashboard
    path('dashboard/',               DashboardView.as_view(),           name='dashboard'),

    # Admin
    path('users/',                   UserListView.as_view(),            name='user-list'),
    path('users/<int:pk>/',          UserDetailView.as_view(),          name='user-detail'),
    path('users/<int:pk>/verify/',   UserVerificationView.as_view(),    name='user-verify'),
    path('reports/',                 ReportView.as_view(),              name='reports'),

    # Messages
    path('messages/',                MessageListCreateView.as_view(),   name='message-list-create'),
    path('messages/<int:pk>/',       MessageDetailView.as_view(),       name='message-detail'),
    path('conversations/',           ConversationsView.as_view(),       name='conversations'),
    path('conversations/mark-read/', MarkConversationReadView.as_view(),name='mark-conversation-read'),
    path('conversations/<int:other_id>/<str:property_id>/messages/', ConversationMessagesView.as_view(), name='conversation-messages'),

    # Viewing requests
    path('viewings/',                ViewingRequestListCreateView.as_view(), name='viewing-list-create'),
    path('viewings/<int:pk>/',       ViewingRequestDetailView.as_view(),     name='viewing-detail'),
    path('properties/<int:property_id>/reviews/', ReviewListCreateView.as_view(), name='property-reviews'),
]

from .views import (
    RentalApplicationListCreateView, RentalApplicationDetailView,
    LandlordVerificationView, LandlordVerificationAdminView,
)

urlpatterns += [
    # Rental applications
    path('applications/',         RentalApplicationListCreateView.as_view(), name='application-list-create'),
    path('applications/<int:pk>/', RentalApplicationDetailView.as_view(),    name='application-detail'),

    # Landlord verification
    path('verification/',                  LandlordVerificationView.as_view(),           name='verification'),
    path('verification/admin/',            LandlordVerificationAdminView.as_view(),       name='verification-admin-list'),
    path('verification/admin/<int:pk>/',   LandlordVerificationAdminView.as_view(),       name='verification-admin-detail'),
]

from .views import SupportMessageView, ContactInboxView

urlpatterns += [
    # Support messages — landlord ↔ admin
    path('support/',                       SupportMessageView.as_view(), name='support-list'),
    path('support/<int:landlord_id>/',     SupportMessageView.as_view(), name='support-thread'),

    # Contact inbox — admin sees all contact form messages
    path('contact-inbox/',                 ContactInboxView.as_view(),   name='contact-inbox'),
]

from .views import AdminUserProfileView

urlpatterns += [
    path('users/<int:pk>/profile/', AdminUserProfileView.as_view(), name='admin-user-profile'),
]

from .views import PasswordResetRequestView, PasswordResetConfirmView

urlpatterns += [
    path('password-reset/',         PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]