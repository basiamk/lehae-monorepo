from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _


class UserProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_landlord = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    # Extended profile fields
    full_name   = models.CharField(max_length=150, blank=True)
    phone       = models.CharField(max_length=30, blank=True)
    bio         = models.TextField(blank=True)

    class Meta:
        verbose_name = _('User Profile')
        verbose_name_plural = _('Users Profiles')

    def __str__(self):
        return self.user.username


class Property(models.Model):
    STATUS_CHOICES = (
        ('inactive', _('Inactive')),
        ('vacant',   _('Vacant')),
        ('occupied', _('Occupied')),
    )
    PROPERTY_TYPE_CHOICES = (
        ('house',     _('House')),
        ('apartment', _('Apartment')),
        ('room',      _('Room')),
        ('cottage',   _('Cottage')),
        ('studio',    _('Studio')),
        ('townhouse', _('Townhouse')),
    )
    WATER_CHOICES = (
        ('constant',     _('Constant supply')),
        ('intermittent', _('Intermittent supply')),
        ('borehole',     _('Borehole')),
        ('none',         _('No water')),
    )
    ELECTRICITY_CHOICES = (
        ('prepaid',   _('Prepaid meter')),
        ('municipal', _('Municipal billing')),
        ('none',      _('No electricity')),
    )

    # Core fields
    landlord      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    area          = models.CharField(max_length=100)
    district      = models.CharField(max_length=100)
    rental_amount = models.DecimalField(max_digits=10, decimal_places=2)
    deposit       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    viewing_fee   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='vacant')
    description   = models.TextField(blank=True)
    image         = models.ImageField(upload_to='property_images/', null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
    is_approved   = models.BooleanField(default=False)

    # Amenity fields
    property_type   = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES, default='house', blank=True)
    bedrooms        = models.PositiveIntegerField(null=True, blank=True)
    bathrooms       = models.PositiveIntegerField(null=True, blank=True)
    furnished       = models.BooleanField(default=False)
    parking         = models.BooleanField(default=False)
    pet_friendly    = models.BooleanField(default=False)
    security        = models.BooleanField(default=False)
    water_supply    = models.CharField(max_length=20, choices=WATER_CHOICES, default='constant', blank=True)
    electricity     = models.CharField(max_length=20, choices=ELECTRICITY_CHOICES, default='prepaid', blank=True)
    available_from  = models.DateField(null=True, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = _('Property')
        verbose_name_plural = 'Properties'

    def __str__(self):
        return f"{self.area}, {self.district}"

    def get_image_url(self):
        return self.image.url if self.image else ''

    @property
    def completeness_score(self):
        score = 0
        if self.area:                                        score += 10
        if self.district:                                    score += 10
        if self.description and len(self.description) > 50: score += 15
        if self.images.count() >= 3:                        score += 20
        if self.bedrooms:                                    score += 10
        if self.bathrooms:                                   score += 5
        if self.property_type:                               score += 5
        if self.water_supply:                                score += 5
        if self.electricity:                                 score += 5
        if self.whatsapp_number:                             score += 10
        if self.available_from:                              score += 5
        return min(score, 100)


class PropertyImage(models.Model):
    property    = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image       = models.ImageField(upload_to='property_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Property Image')
        verbose_name_plural = _('Property Images')

    def __str__(self):
        return f"Image for {self.property.area}"


class FavoriteProperty(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    property   = models.ForeignKey(Property, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'property')
        verbose_name = _('Favorite Property')
        verbose_name_plural = _('Favorite Properties')

    def __str__(self):
        return f"{self.user.username} - {self.property.area}"


class ContactMessage(models.Model):
    property     = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True)
    tenant_name  = models.CharField(max_length=100)
    tenant_email = models.EmailField()
    message      = models.TextField()
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Contact Message')
        verbose_name_plural = _('Contact Messages')

    def __str__(self):
        return f"Message from {self.tenant_name}" + (f" for {self.property.area}" if self.property else "")


class Message(models.Model):
    sender     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    property   = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True)
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read    = models.BooleanField(default=False)
    is_support = models.BooleanField(default=False)  # landlord ↔ admin support thread

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}: {self.content[:30]}..."


class ViewingRequest(models.Model):
    STATUS_CHOICES = (
        ('pending',   _('Pending')),
        ('accepted',  _('Accepted')),
        ('declined',  _('Declined')),
        ('cancelled', _('Cancelled')),
    )

    property      = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='viewing_requests')
    tenant        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='viewing_requests_sent')
    proposed_date = models.DateField()
    proposed_time = models.TimeField()
    message       = models.TextField(blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    landlord_note = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Viewing Request')
        verbose_name_plural = _('Viewing Requests')

    def __str__(self):
        return f"{self.tenant.username} -> {self.property.area} on {self.proposed_date}"


class Review(models.Model):
    """Tenant reviews a landlord after a viewing or tenancy."""
    property  = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reviews')
    reviewer  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    rating    = models.PositiveSmallIntegerField()   # 1–5
    comment   = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('property', 'reviewer')   # one review per tenant per property
        ordering = ['-created_at']
        verbose_name = _('Review')
        verbose_name_plural = _('Reviews')

    def __str__(self):
        return f"{self.reviewer.username} → {self.property.area} ({self.rating}★)"


class RentalApplication(models.Model):
    """Formal rental application submitted by a tenant for a property."""
    STATUS_CHOICES = (
        ('pending',   _('Pending')),
        ('reviewing', _('Reviewing')),
        ('approved',  _('Approved')),
        ('declined',  _('Declined')),
    )
    EMPLOYMENT_CHOICES = (
        ('employed',   _('Employed')),
        ('self_employed', _('Self-employed')),
        ('student',    _('Student')),
        ('unemployed', _('Unemployed')),
        ('retired',    _('Retired')),
    )

    property         = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='applications')
    applicant        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    full_name        = models.CharField(max_length=150)
    email            = models.EmailField()
    phone            = models.CharField(max_length=20)
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES)
    employer_name    = models.CharField(max_length=150, blank=True)
    monthly_income   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    num_occupants    = models.PositiveIntegerField(default=1)
    has_pets         = models.BooleanField(default=False)
    move_in_date     = models.DateField()
    references       = models.TextField(blank=True, help_text="Character references or previous landlord contact")
    additional_notes = models.TextField(blank=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    landlord_note    = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('property', 'applicant')
        ordering = ['-created_at']
        verbose_name = _('Rental Application')
        verbose_name_plural = _('Rental Applications')

    def __str__(self):
        return f"{self.applicant.username} → {self.property.area} ({self.status})"


class LandlordVerification(models.Model):
    """Landlord submits verification documents; admin approves."""
    STATUS_CHOICES = (
        ('pending',  _('Pending Review')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
    )

    landlord         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification')
    national_id_number = models.CharField(max_length=50, blank=True)
    id_document      = models.FileField(upload_to='verification_docs/', null=True, blank=True)
    proof_of_ownership = models.FileField(upload_to='verification_docs/', null=True, blank=True)
    phone_number     = models.CharField(max_length=20, blank=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note       = models.TextField(blank=True)
    submitted_at     = models.DateTimeField(auto_now_add=True)
    reviewed_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('Landlord Verification')
        verbose_name_plural = _('Landlord Verifications')

    def __str__(self):
        return f"{self.landlord.username} — {self.status}"