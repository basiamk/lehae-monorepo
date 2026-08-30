"""
Custom password validators for backend/api/validators.py

Add this file at: backend/api/validators.py

Then wire it into settings.py's AUTH_PASSWORD_VALIDATORS (instructions below).
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class UppercaseValidator:
    """Require at least one uppercase letter."""
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter."),
                code='password_no_upper',
            )

    def get_help_text(self):
        return _("Your password must contain at least one uppercase letter.")


class LowercaseValidator:
    """Require at least one lowercase letter."""
    def validate(self, password, user=None):
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Password must contain at least one lowercase letter."),
                code='password_no_lower',
            )

    def get_help_text(self):
        return _("Your password must contain at least one lowercase letter.")


class DigitValidator:
    """Require at least one digit."""
    def validate(self, password, user=None):
        if not re.search(r'\d', password):
            raise ValidationError(
                _("Password must contain at least one number."),
                code='password_no_digit',
            )

    def get_help_text(self):
        return _("Your password must contain at least one number.")