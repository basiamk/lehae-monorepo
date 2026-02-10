from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from api.views import serve_media  # Ensure this import matches your app structure

urlpatterns = [
    path('api/', include('api.urls')),
    path('media/<path:path>', serve_media, name='serve_media'),
]

# Serve media files during development (optional, disabled in production)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)