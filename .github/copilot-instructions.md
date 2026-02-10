# Copilot Instructions for Lehae

This file gives targeted, actionable guidance for AI coding agents working in this repository.

Overview
- **Backend:** Django 4.2 REST API in `backend/` using DRF and `djangorestframework-simplejwt` for JWT auth. Key files: [backend/backend/settings.py](backend/backend/settings.py), [backend/api/views.py](backend/api/views.py), [backend/api/serializers.py](backend/api/serializers.py), [backend/api/models.py](backend/api/models.py).
- **Frontend:** React + Vite app in `frontend/`. Key files: [frontend/src/utils/axios.js](frontend/src/utils/axios.js) (baseURL + token refresh), [frontend/src/lib/api.js](frontend/src/lib/api.js) (client wrappers).

What to know first (big picture)
- The frontend talks to the backend at `/api/...` endpoints. Backend base URL is configured in `frontend/src/utils/axios.js` (currently `https://lehae-backend.onrender.com`).
- Authentication: JWT access/refresh tokens. Frontend stores `access_token` and `refresh_token` in `localStorage` and the axios interceptor attempts refresh on 401 via `/api/token/refresh/`.
- Permissions: many endpoints are `AllowAny` for reads and `IsAuthenticated` for writes; admin-only actions use `IsAdminUser` (see `api/urls.py` and views).
- Data flow: models -> serializers -> views (DRF generics + APIView). Follow existing serializer patterns for validation, nested `UserProfile` handling and `PropertyImage` handling.

Developer workflows & commands
- Backend setup (development):
  - create virtualenv and install: `pip install -r backend/requirements.txt`
  - set env vars: at minimum `SECRET_KEY`, `DEBUG`, `DATABASE_URL` (optional; defaults to sqlite `db.sqlite3`), email settings if testing mail.
  - run migrations: `python backend/manage.py migrate`
  - run dev server: `python backend/manage.py runserver 0.0.0.0:8000`
  - tests: `python backend/manage.py test` (Django test runner).
- Production: Procfile uses gunicorn: `gunicorn backend.wsgi:application --log-file -`. Static files served with WhiteNoise; run `collectstatic` before deploying.
- Frontend: `cd frontend && npm install && npm run dev` (Vite dev server on port 5173). Build with `npm run build`.

Project-specific conventions & patterns
- JWT lifetime set in `SIMPLE_JWT` (7 days). When adding auth-dependent endpoints, ensure frontend token flows match `axios.js` behavior.
- File uploads: `PropertyImageSerializer.validate_image` enforces MIME types (JPEG/PNG) and <= 5MB — new image handling should follow this.
- Property image limit: backend enforces max 3 images per property in `PropertyImageView.post`.
- Logging: each view uses `logger = logging.getLogger(__name__)`. Use `logger.info/error/debug` instead of print statements for server code.
- Internationalization: uses `gettext_lazy` (`_`) for user-facing strings — preserve i18n when editing messages.
- UserProfile lifecycle: `UserProfile` objects are created on login if missing. When changing user creation, update `UserSerializer.create` and ensure `UserProfile` creation remains consistent.

Integration points & external dependencies
- Email: SMTP configured through env vars (`EMAIL_HOST`, `EMAIL_HOST_USER`, etc.) in `settings.py`.
- Database: `dj_database_url` allows switching from sqlite to Postgres via `DATABASE_URL`.
- Deployment: `Procfile` + `gunicorn`, WhiteNoise for static files. Frontend expects backend at the Render URL in `axios.js`.

Editing guidance & quick examples
- If you add a new API field: update `backend/api/serializers.py`, migrate if it requires DB changes, then update `frontend/src/lib/api.js` client wrappers and any components that render that field.
- Filtering example: properties support query params: `?district=...&min_amount=...&status=vacant&limit=10`. See `PropertyListView.get_queryset` and `frontend/src/lib/api.js` for how filters are built.
- Image upload example: POST `multipart/form-data` to `/api/property-images/` with `property_id` and `image`. Enforced rules: owner-only, max 3 images, JPEG/PNG, <=5MB.

When unsure
- Prefer small, focused changes; run backend tests and a local frontend dev server to validate end-to-end behavior.
- Check `logs/django.log` for server-side errors; enable `DEBUG=True` locally if reproducing issues.

Files to reference while working
- [backend/backend/settings.py](backend/backend/settings.py)
- [backend/api/views.py](backend/api/views.py)
- [backend/api/serializers.py](backend/api/serializers.py)
- [backend/api/models.py](backend/api/models.py)
- [frontend/src/utils/axios.js](frontend/src/utils/axios.js)
- [frontend/src/lib/api.js](frontend/src/lib/api.js)

If anything here is unclear or you need more examples (end-to-end requests, common test data, or CI/deploy notes), tell me which area to expand.
