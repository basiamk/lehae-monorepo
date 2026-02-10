from django.contrib import admin
from .models import Property, ContactMessage, UserProfile, FavoriteProperty  # Add VacancyHistory if defined

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['area', 'district', 'rental_amount', 'status', 'landlord']  # Changed 'owner' to 'landlord'
    list_filter = ['status', 'landlord']  # Changed 'owner' to 'landlord'
    search_fields = ['area', 'district']

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['tenant_name', 'tenant_email', 'property', 'created_at']  # Changed 'name' to 'tenant_name', 'email' to 'tenant_email'
    list_filter = ['created_at']
    search_fields = ['tenant_name', 'tenant_email']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_landlord']
    list_filter = ['is_landlord']
    search_fields = ['user__username']

@admin.register(FavoriteProperty)
class FavoritePropertyAdmin(admin.ModelAdmin):
    list_display = ['user', 'property']
    list_filter = ['user']
    search_fields = ['user__username']

# Comment out VacancyHistoryAdmin if model is undefined
# @admin.register(VacancyHistory)
# class VacancyHistoryAdmin(admin.ModelAdmin):
#     list_display = ['property', 'status', 'changed_at']
#     list_filter = ['status', 'changed_at']
#     search_fields = ['property__area']