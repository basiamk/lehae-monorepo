from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, Http404
import os

def serve_media_with_cors(request, path):
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    if not os.path.exists(file_path):
        raise Http404
    response = FileResponse(open(file_path, 'rb'))
    response['Access-Control-Allow-Origin'] = '*'
    response['Cross-Origin-Resource-Policy'] = 'cross-origin'
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('media/<path:path>', serve_media_with_cors),
]
