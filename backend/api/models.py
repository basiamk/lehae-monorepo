from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_landlord = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('User Profile')
        verbose_name_plural = _('Users Profiles')

    def __str__(self):
        return self.user.username

class Property(models.Model):
    STATUS_CHOICES = (
        ('inactive', _('Inactive')),
        ('vacant', _('Vacant')),
        ('occupied', _('Occupied')),
    )
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    area = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    rental_amount = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    viewing_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='vacant')
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='property_images/', null=True, blank=True)  # Primary image
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('Property')
        verbose_name_plural = 'Properties'

    def __str__(self):
        return f"{self.area}, {self.district}"

    def get_image_url(self):
        return self.image.url if self.image else ''

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='property_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Property Image')
        verbose_name_plural = _('Property Images')

    def __str__(self):
        return f"Image for {self.property.area}"

class FavoriteProperty(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'property')
        verbose_name = _('Favorite Property')
        verbose_name_plural = _('Favorite Properties')

    def __str__(self):
        return f"{self.user.username} - {self.property.area}"

class ContactMessage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    tenant_name = models.CharField(max_length=100)
    tenant_email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Contact Message')
        verbose_name_plural = _('Contact Messages')

    def __str__(self):
        return f"Message from {self.tenant_name} for {self.property.area}"