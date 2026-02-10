from django.urls import path
from .views import (
    UserRegistrationView,
    UserLoginView,
    PropertyListView,
    PropertyDetailView,
    TenantListView,
    TenantDetailView,
    FavoritePropertyView,
    ContactMessageAPIView,
    DashboardView,
    ProfileView,
    PropertyImageView,
    UserListView,
    UserDetailView,
    UserVerificationView,
    ReportView
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('token/', UserLoginView.as_view(), name='token'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('properties/', PropertyListView.as_view(), name='property-list'),
    path('properties/<int:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('tenants/', TenantListView.as_view(), name='tenant-list'),
    path('tenants/<int:pk>/', TenantDetailView.as_view(), name='tenant-detail'),
    path('favorites/', FavoritePropertyView.as_view(), name='favorites'),
    path('contact/', ContactMessageAPIView.as_view(), name='contact'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('property-images/', PropertyImageView.as_view(), name='property-image-list'),
    path('property-images/<int:pk>/', PropertyImageView.as_view(), name='image-detail'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/verify/', UserVerificationView.as_view(), name='user-verify'),
    path('reports/', ReportView.as_view(), name='reports'),
]