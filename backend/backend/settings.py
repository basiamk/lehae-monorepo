"""
Django settings for backend project — production-hardened.
"""

from pathlib import Path
import os
from datetime import timedelta
from decouple import config
import dj_database_url
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY',
    config('SECRET_KEY', default='django-insecure-0b1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3'))

# FIX: DEBUG defaults to False — fail closed, not open
DEBUG = os.environ.get('PRODUCTION', '') not in ('1', 'true', 'yes') and \
        config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'lehae-monorepo-production.up.railway.app',
    'lehae-monorepo.onrender.com',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ── Database ───────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get('DATABASE_URL', '')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ── Media storage ────────────────────────────────────────────────────────────
# Default: local disk (used automatically if R2 env vars aren't set — keeps
# local dev / `python manage.py runserver` working without R2 configured)
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── DRF ────────────────────────────────────────────────────────────────────────
PRODUCTION = os.environ.get('PRODUCTION', '') in ('1', 'true', 'yes')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon':           '200/day',
        'user':           '2000/day',
        'login':          '5/min',
        'contact':        '10/hour',
        'password_reset': '3/hour',
    },
}

# ── JWT ────────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':            timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME':           timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':            True,
    'BLACKLIST_AFTER_ROTATION':         True,
    'UPDATE_LAST_LOGIN':                True,
    'ALGORITHM':                        'HS256',
    'AUTH_HEADER_TYPES':                ('Bearer',),
}

if 'rest_framework_simplejwt.token_blacklist' not in INSTALLED_APPS:
    INSTALLED_APPS.append('rest_framework_simplejwt.token_blacklist')

# ── Cloudflare R2 media storage ────────────────────────────────────────────────
# FIX: this block was missing entirely in the previous deploy — packages were
# installed but Django was never told to use them. Activates automatically
# when R2_ACCESS_KEY_ID is present in the environment; falls back to the local
# MEDIA_ROOT/MEDIA_URL above otherwise.
USE_R2_STORAGE = bool(os.environ.get('R2_ACCESS_KEY_ID'))

if USE_R2_STORAGE:
    INSTALLED_APPS.append('storages')

    AWS_ACCESS_KEY_ID       = os.environ.get('R2_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY   = os.environ.get('R2_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'lehae-media')
    AWS_S3_ENDPOINT_URL     = os.environ.get('R2_ENDPOINT_URL')
    AWS_S3_CUSTOM_DOMAIN    = os.environ.get('R2_PUBLIC_URL', '').replace('https://', '').replace('http://', '')
    AWS_DEFAULT_ACL         = None
    AWS_S3_FILE_OVERWRITE   = False
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_S3_ADDRESSING_STYLE  = 'virtual'

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3.S3Storage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }

    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'

# ── CORS ───────────────────────────────────────────────────────────────────────
if PRODUCTION:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        'https://lehae-monorepo.vercel.app',
        'https://lehae-monorepo-git-main-basiamks-projects.vercel.app',
        'https://lehae-monorepo-9asvcznc6-basiamks-projects.vercel.app',
    ]
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r'^https://lehae-monorepo-.*\.vercel\.app$',
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS     = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS     = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]
CORS_URLS_REGEX = r'^.*$'

# ── Email ──────────────────────────────────────────────────────────────────────
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = 'smtp.gmail.com'
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = os.environ.get('EMAIL_HOST_USER',     config('EMAIL_HOST_USER',     default=''))
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', config('EMAIL_HOST_PASSWORD', default=''))
DEFAULT_FROM_EMAIL  = EMAIL_HOST_USER
ADMIN_EMAIL         = EMAIL_HOST_USER

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# ── Auth backends ──────────────────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    'api.auth.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# ── Logging ────────────────────────────────────────────────────────────────────
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'django.log')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} [{asctime}] {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level':     'WARNING',
            'class':     'logging.FileHandler',
            'filename':  LOG_FILE,
            'formatter': 'verbose',
        },
        'console': {
            'level':     'DEBUG',
            'class':     'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers':  ['file', 'console'],
            'level':     'INFO',
            'propagate': True,
        },
        'api': {
            'handlers':  ['file', 'console'],
            'level':     'DEBUG',
            'propagate': False,
        },
    },
}

# ── Security headers ───────────────────────────────────────────────────────────
if PRODUCTION:
    SECURE_PROXY_SSL_HEADER        = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT            = False
    SESSION_COOKIE_SECURE          = True
    CSRF_COOKIE_SECURE             = True
    SECURE_HSTS_SECONDS            = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD            = True
    SECURE_CONTENT_TYPE_NOSNIFF    = True
    X_FRAME_OPTIONS                = 'DENY'
else:
    SECURE_SSL_REDIRECT            = False
    SESSION_COOKIE_SECURE          = False
    CSRF_COOKIE_SECURE             = False
    SECURE_HSTS_SECONDS            = 0
    SECURE_CONTENT_TYPE_NOSNIFF    = True
    X_FRAME_OPTIONS                = 'DENY'