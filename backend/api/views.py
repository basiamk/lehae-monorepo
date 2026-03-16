from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q, Avg
from django.core.mail import send_mail
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.shortcuts import get_object_or_404
from django.views.static import serve
from .serializers import (
    RentalApplicationSerializer, LandlordVerificationSerializer,
    ReviewSerializer,
    UserSerializer, PropertySerializer, FavoritePropertySerializer,
    ContactMessageSerializer, PropertyImageSerializer, MessageSerializer,
    ViewingRequestSerializer,
)
from .models import Property, FavoriteProperty, ContactMessage, UserProfile, PropertyImage, Message, ViewingRequest, Review, RentalApplication, LandlordVerification
import logging

logger = logging.getLogger(__name__)


# ── helpers ───────────────────────────────────────────────────────────────────

def send_notification(subject, body, recipient_email):
    """
    Send email notification.
    - Never crashes a request (all exceptions caught)
    - Enforces a 5-second socket timeout so a dead SMTP server
      cannot hang a gunicorn worker and cause a WORKER TIMEOUT crash
    """
    import socket
    if not recipient_email:
        return
    old_timeout = socket.getdefaulttimeout()
    try:
        socket.setdefaulttimeout(5)
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=True,
        )
    except Exception as e:
        logger.warning(f"Email notification failed: {e}")
    finally:
        socket.setdefaulttimeout(old_timeout)


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            send_notification(
                subject="Welcome to Lehae!",
                body=(
                    f"Hi {user.username},\n\n"
                    "Welcome to Lehae — Lesotho's rental platform.\n\n"
                    "You can now browse properties, save favorites, and contact landlords directly.\n\n"
                    "The Lehae Team"
                ),
                recipient_email=user.email,
            )
            return Response({'refresh': str(refresh), 'access': str(refresh.access_token)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': _('Please provide both username and password')}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=username, password=password)
        if user:
            UserProfile.objects.get_or_create(user=user, defaults={'is_landlord': False})
            refresh = RefreshToken.for_user(user)
            profile = getattr(user, 'profile', None)
            return Response({
                'refresh': str(refresh),
                'access':  str(refresh.access_token),
                'user': {
                    'id':          user.id,
                    'username':    user.username,
                    'email':       user.email,
                    'is_landlord': profile.is_landlord if profile else False,
                    'is_staff':    user.is_staff,
                },
            })
        return Response({'error': _('Invalid username or password')}, status=status.HTTP_401_UNAUTHORIZED)


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        profile, _ = UserProfile.objects.get_or_create(user=u, defaults={'is_landlord': False})
        return Response({
            'id':          u.id,
            'username':    u.username,
            'email':       u.email,
            'is_landlord': profile.is_landlord,
            'is_verified': profile.is_verified,
            'is_staff':    u.is_staff,
            'full_name':   getattr(profile, 'full_name', ''),
            'phone':       getattr(profile, 'phone', ''),
            'bio':         getattr(profile, 'bio', ''),
        })

    def put(self, request):
        u = request.user
        profile, _ = UserProfile.objects.get_or_create(user=u, defaults={'is_landlord': False})
        if 'email' in request.data:
            u.email = request.data['email']
            u.save()
        needs_save = False
        for field in ('full_name', 'phone', 'bio'):
            if field in request.data and hasattr(profile, field):
                setattr(profile, field, request.data[field])
                needs_save = True
        if needs_save:
            profile.save()
        return Response({
            'id':          u.id,
            'username':    u.username,
            'email':       u.email,
            'is_landlord': profile.is_landlord,
            'is_verified': profile.is_verified,
            'is_staff':    u.is_staff,
            'full_name':   getattr(profile, 'full_name', ''),
            'phone':       getattr(profile, 'phone', ''),
            'bio':         getattr(profile, 'bio', ''),
        })


# ── Properties ────────────────────────────────────────────────────────────────

class PropertyListView(generics.ListCreateAPIView):
    queryset           = Property.objects.all()
    serializer_class   = PropertySerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        queryset = Property.objects.all()
        p = self.request.query_params

        status_p      = p.get('status')
        district      = p.get('district')
        area          = p.get('area')
        min_price     = p.get('minPrice') or p.get('min_amount')
        max_price     = p.get('maxPrice') or p.get('max_amount')
        landlord      = p.get('landlord')
        is_approved   = p.get('is_approved')
        limit         = p.get('limit')
        ordering      = p.get('ordering', '-created_at')
        property_type = p.get('property_type')
        bedrooms      = p.get('bedrooms')
        furnished     = p.get('furnished')
        parking       = p.get('parking')
        pet_friendly  = p.get('pet_friendly')

        if status_p and status_p != 'all':
            queryset = queryset.filter(status=status_p)
        if district:
            queryset = queryset.filter(district__icontains=district)
        if area:
            queryset = queryset.filter(area__icontains=area)
        if min_price:
            queryset = queryset.filter(rental_amount__gte=min_price)
        if max_price:
            queryset = queryset.filter(rental_amount__lte=max_price)
        if landlord == 'self' and self.request.user.is_authenticated:
            queryset = queryset.filter(landlord=self.request.user)
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved.lower() == 'true')
        if property_type:
            queryset = queryset.filter(property_type=property_type)
        if bedrooms:
            try:
                queryset = queryset.filter(bedrooms=int(bedrooms))
            except ValueError:
                pass
        if furnished not in (None, ''):
            queryset = queryset.filter(furnished=furnished.lower() == 'true')
        if parking not in (None, ''):
            queryset = queryset.filter(parking=parking.lower() == 'true')
        if pet_friendly not in (None, ''):
            queryset = queryset.filter(pet_friendly=pet_friendly.lower() == 'true')
        if ordering:
            queryset = queryset.order_by(ordering)
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
        return queryset

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        if not self.request.user.is_staff and not (profile and profile.is_landlord):
            raise serializers.ValidationError(_('Only landlords can create properties'))
        prop = serializer.save(landlord=self.request.user)
        for image in self.request.FILES.getlist('images'):
            PropertyImage.objects.create(property=prop, image=image)
        logger.info(f"Property {prop.id} created by {self.request.user.username}")


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Property.objects.all()
    serializer_class   = PropertySerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_update(self, serializer):
        user = self.request.user
        if not user.is_staff and user != serializer.instance.landlord:
            raise serializers.ValidationError(_('You do not have permission to update this property'))
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff and self.request.user != instance.landlord:
            raise serializers.ValidationError(_('You do not have permission to delete this property'))
        instance.delete()


# ── Property images ───────────────────────────────────────────────────────────

class PropertyImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        property_id = request.data.get('property_id')
        if not property_id:
            return Response({"error": "Property ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)
        if prop.landlord != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        if prop.images.count() >= 10:
            return Response({"error": "Maximum 10 images allowed"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = PropertyImageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(property=prop)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            image = PropertyImage.objects.get(id=pk)
        except PropertyImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
        if image.property.landlord != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Favorites ─────────────────────────────────────────────────────────────────

class FavoritePropertyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites  = FavoriteProperty.objects.filter(user=request.user)
        serializer = FavoritePropertySerializer(favorites, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        property_id = request.data.get('property')
        if not property_id:
            return Response({'error': 'Property ID required'}, status=status.HTTP_400_BAD_REQUEST)
        if FavoriteProperty.objects.filter(user=request.user, property_id=property_id).exists():
            return Response({'message': 'Already favorited'}, status=status.HTTP_200_OK)
        serializer = FavoritePropertySerializer(data={'property': property_id}, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        property_id = request.data.get('property')
        if not property_id:
            return Response({'error': 'Property ID required'}, status=status.HTTP_400_BAD_REQUEST)
        favorite = FavoriteProperty.objects.filter(user=request.user, property_id=property_id).first()
        if favorite:
            favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)


# ── Contact ───────────────────────────────────────────────────────────────────

class ContactMessageAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        if not data.get('property') or str(data.get('property')).strip() == '':
            data['property'] = None
        serializer = ContactMessageSerializer(data=data)
        if serializer.is_valid():
            msg = serializer.save()
            if msg.property:
                recipient = msg.property.landlord.email
                subject   = f"New enquiry for {msg.property.area}, {msg.property.district}"
                body      = (
                    f"Hi {msg.property.landlord.username},\n\n"
                    f"You have a new enquiry on Lehae.\n\n"
                    f"From: {msg.tenant_name} ({msg.tenant_email})\n"
                    f"Property: {msg.property.area}, {msg.property.district}\n\n"
                    f"Message:\n{msg.message}\n\nLog in to Lehae to reply."
                )
            else:
                recipient = getattr(settings, 'ADMIN_EMAIL', settings.DEFAULT_FROM_EMAIL)
                subject   = "New general enquiry via Lehae contact form"
                body      = f"From: {msg.tenant_name} ({msg.tenant_email})\n\nMessage:\n{msg.message}"
            send_notification(subject=subject, body=body, recipient_email=recipient)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            UserProfile.objects.get_or_create(user=user, defaults={'is_landlord': False})
            profile = getattr(user, 'profile', None)
            is_landlord = user.is_staff or (profile and profile.is_landlord)
            stats = []

            if is_landlord:
                props = Property.objects.filter(landlord=user)
                stats.append({'id': 'properties',  'label': 'Total Properties', 'value': props.count(),                        'trend': '', 'iconBg': 'bg-blue-100'})
                stats.append({'id': 'vacant',       'label': 'Vacant',           'value': props.filter(status='vacant').count(), 'trend': '', 'iconBg': 'bg-green-100'})
                stats.append({'id': 'applications', 'label': 'New Applications', 'value': RentalApplication.objects.filter(property__landlord=user, status='pending').count(), 'trend': '', 'iconBg': 'bg-orange-100'})
                stats.append({'id': 'messages',     'label': 'Unread Messages',  'value': Message.objects.filter(receiver=user, is_read=False).count(), 'trend': '', 'iconBg': 'bg-purple-100'})
            else:
                stats.append({'id': 'favorites',    'label': 'Saved Properties', 'value': FavoriteProperty.objects.filter(user=user).count(),                             'trend': '', 'iconBg': 'bg-red-100'})
                stats.append({'id': 'applications', 'label': 'My Applications',  'value': RentalApplication.objects.filter(applicant=user).count(),                      'trend': '', 'iconBg': 'bg-orange-100'})
                stats.append({'id': 'viewings',     'label': 'My Viewings',      'value': ViewingRequest.objects.filter(tenant=user).exclude(status='cancelled').count(), 'trend': '', 'iconBg': 'bg-yellow-100'})
                stats.append({'id': 'messages',     'label': 'Unread Messages',  'value': Message.objects.filter(receiver=user, is_read=False).count(),                   'trend': '', 'iconBg': 'bg-purple-100'})

            recent_applications = []
            if is_landlord:
                apps = RentalApplication.objects.filter(property__landlord=user).order_by('-created_at')[:5]
                recent_applications = [
                    {
                        'id':          a.id,
                        'title':       f"Application from {a.full_name}",
                        'description': f"{a.property.area}, {a.property.district} · {a.employment_status} · Move-in {a.move_in_date}",
                        'status':      a.status,
                        'time':        a.created_at.strftime('%Y-%m-%d %H:%M'),
                    }
                    for a in apps
                ]

            recent_activity = (
                ContactMessage.objects.filter(property__landlord=user)
                if is_landlord
                else ContactMessage.objects.filter(tenant_email=user.email)
            )
            activity_data = [
                {
                    'id':          m.id,
                    'title':       f"Message from {m.tenant_name}",
                    'description': m.message[:50] + ('...' if len(m.message) > 50 else ''),
                    'time':        m.created_at.strftime('%Y-%m-%d %H:%M'),
                    'iconBg':      'bg-purple-100',
                    'icon':        'envelope',
                }
                for m in recent_activity[:5]
            ]

            return Response({
                'stats':              stats,
                'recentActivity':     activity_data,
                'recentApplications': recent_applications,
                'upcomingTasks':      [],
            })
        except Exception as e:
            logger.error(f"Dashboard error: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── Admin ─────────────────────────────────────────────────────────────────────

class UserListView(generics.ListCreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = UserSerializer
    permission_classes = [IsAdminUser]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = User.objects.all()
    serializer_class   = UserSerializer
    permission_classes = [IsAdminUser]


class UserVerificationView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        user = get_object_or_404(User, id=pk)
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        props = Property.objects.all()
        return Response({
            'most_viewed':      PropertySerializer(props.order_by('-updated_at')[:10], many=True, context={'request': request}).data,
            'total_properties': props.count(),
            'total_users':      User.objects.count(),
        })


# ── Messages ──────────────────────────────────────────────────────────────────

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        return Message.objects.filter(Q(sender=u) | Q(receiver=u)).order_by('-created_at')

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        send_notification(
            subject=f"New message on Lehae from {msg.sender.username}",
            body=(
                f"Hi {msg.receiver.username},\n\n"
                f"You have a new message from {msg.sender.username}"
                + (f" about {msg.property.area}, {msg.property.district}" if msg.property else "")
                + f":\n\n\"{msg.content}\"\n\nLog in to Lehae to reply."
            ),
            recipient_email=msg.receiver.email,
        )


class MessageDetailView(generics.RetrieveUpdateAPIView):
    queryset           = Message.objects.all()
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        return Message.objects.filter(Q(sender=u) | Q(receiver=u))


class ConversationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user     = request.user
        messages = Message.objects.filter(Q(sender=user) | Q(receiver=user))
        threads  = {}
        for msg in messages:
            other      = msg.sender if msg.receiver == user else msg.receiver
            prop       = msg.property
            thread_key = (other.id, prop.id if prop else None)
            if thread_key not in threads:
                threads[thread_key] = {
                    'other':    {'id': other.id, 'username': other.username},
                    'property': {'id': prop.id, 'area': prop.area, 'district': prop.district} if prop else None,
                    'messages': [], 'unread_count': 0,
                    'last_message_time': None, 'last_message_preview': '',
                }
            threads[thread_key]['messages'].append(msg)
            if not threads[thread_key]['last_message_time'] or msg.created_at > threads[thread_key]['last_message_time']:
                threads[thread_key]['last_message_time']    = msg.created_at
                threads[thread_key]['last_message_preview'] = msg.content[:60] + ('...' if len(msg.content) > 60 else '')
            if msg.receiver == user and not msg.is_read:
                threads[thread_key]['unread_count'] += 1

        sorted_threads = sorted(threads.values(), key=lambda t: t['last_message_time'] or t['messages'][0].created_at, reverse=True)
        return Response([{
            'other': t['other'], 'property': t['property'],
            'unread_count': t['unread_count'],
            'last_message_preview': t['last_message_preview'],
            'last_message_time': t['last_message_time'].isoformat() if t['last_message_time'] else None,
            'message_count': len(t['messages']),
        } for t in sorted_threads])


class MarkConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_id    = request.data.get('other_id')
        property_id = request.data.get('property_id')
        if not other_id:
            return Response({'error': 'other_id required'}, status=status.HTTP_400_BAD_REQUEST)
        q = Q(receiver=request.user, sender_id=other_id, is_read=False)
        q &= Q(property_id=property_id) if property_id else Q(property__isnull=True)
        updated = Message.objects.filter(q).update(is_read=True)
        return Response({'status': 'read', 'updated_count': updated})


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, other_id, property_id=None):
        user = request.user
        q    = Q(sender=user, receiver_id=other_id) | Q(sender_id=other_id, receiver=user)
        q   &= Q(property_id=property_id) if (property_id and property_id != 'none') else Q(property__isnull=True)
        messages   = Message.objects.filter(q).order_by('created_at')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)


# ── Viewing Requests ──────────────────────────────────────────────────────────

class ViewingRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user    = request.user
        profile = getattr(user, 'profile', None)
        if user.is_staff or (profile and profile.is_landlord):
            qs = ViewingRequest.objects.filter(property__landlord=user)
        else:
            qs = ViewingRequest.objects.filter(tenant=user)
        return Response(ViewingRequestSerializer(qs, many=True).data)

    def post(self, request):
        serializer = ViewingRequestSerializer(data=request.data)
        if serializer.is_valid():
            viewing = serializer.save(tenant=request.user)
            send_notification(
                subject=f"Viewing request for {viewing.property.area}, {viewing.property.district}",
                body=(
                    f"Hi {viewing.property.landlord.username},\n\n"
                    f"{viewing.tenant.username} has requested a viewing of your property "
                    f"at {viewing.property.area}, {viewing.property.district}.\n\n"
                    f"Proposed date: {viewing.proposed_date}\n"
                    f"Proposed time: {viewing.proposed_time}\n"
                    + (f"Note: {viewing.message}\n" if viewing.message else "")
                    + f"\nLog in to Lehae to accept or decline."
                ),
                recipient_email=viewing.property.landlord.email,
            )
            return Response(ViewingRequestSerializer(viewing).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ViewingRequestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_viewing(self, pk, user):
        viewing = get_object_or_404(ViewingRequest, pk=pk)
        if viewing.tenant != user and viewing.property.landlord != user:
            return None, Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return viewing, None

    def patch(self, request, pk):
        viewing, err = self._get_viewing(pk, request.user)
        if err:
            return err
        new_status    = request.data.get('status')
        landlord_note = request.data.get('landlord_note', '')
        if new_status == 'cancelled' and viewing.tenant == request.user:
            viewing.status = 'cancelled'
            viewing.save()
            return Response(ViewingRequestSerializer(viewing).data)
        if new_status in ('accepted', 'declined') and viewing.property.landlord == request.user:
            viewing.status = new_status
            if landlord_note:
                viewing.landlord_note = landlord_note
            viewing.save()
            send_notification(
                subject=f"Your viewing request has been {new_status}",
                body=(
                    f"Hi {viewing.tenant.username},\n\n"
                    f"Your viewing request for {viewing.property.area}, {viewing.property.district} "
                    f"on {viewing.proposed_date} at {viewing.proposed_time} has been {new_status}.\n"
                    + (f"\nLandlord note: {landlord_note}\n" if landlord_note else "")
                    + f"\nLog in to Lehae for details."
                ),
                recipient_email=viewing.tenant.email,
            )
            return Response(ViewingRequestSerializer(viewing).data)
        return Response({'error': 'Invalid status update'}, status=status.HTTP_400_BAD_REQUEST)


def serve_media(request, path):
    return serve(request, path, document_root=settings.MEDIA_ROOT)


# ── Reviews ───────────────────────────────────────────────────────────────────

class ReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, property_id):
        reviews    = Review.objects.filter(property_id=property_id)
        serializer = ReviewSerializer(reviews, many=True)
        avg = reviews.aggregate(avg=Avg('rating'))['avg']
        return Response({'reviews': serializer.data, 'average': round(avg, 1) if avg else None, 'count': reviews.count()})

    def post(self, request, property_id):
        if Review.objects.filter(property_id=property_id, reviewer=request.user).exists():
            return Response({'error': 'You have already reviewed this property.'}, status=status.HTTP_400_BAD_REQUEST)
        data = {**request.data, 'property': property_id}
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            review = serializer.save(reviewer=request.user)
            prop   = get_object_or_404(Property, pk=property_id)
            send_notification(
                subject=f"New {review.rating}★ review for {prop.area}, {prop.district}",
                body=(f"Hi {prop.landlord.username},\n\n{review.reviewer.username} left a {review.rating}★ review"
                      + (f":\n\n\"{review.comment}\"" if review.comment else ".") + "\n\nLog in to Lehae to see it."),
                recipient_email=prop.landlord.email,
            )
            return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Rental Applications ───────────────────────────────────────────────────────

class RentalApplicationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user    = request.user
        profile = getattr(user, 'profile', None)
        if user.is_staff:
            qs = RentalApplication.objects.all()
        elif profile and profile.is_landlord:
            qs = RentalApplication.objects.filter(property__landlord=user)
        else:
            qs = RentalApplication.objects.filter(applicant=user)
        return Response(RentalApplicationSerializer(qs, many=True).data)

    def post(self, request):
        UserProfile.objects.get_or_create(user=request.user, defaults={'is_landlord': False})
        if RentalApplication.objects.filter(
            property_id=request.data.get('property'),
            applicant=request.user
        ).exists():
            return Response(
                {'error': 'You have already applied for this property.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = RentalApplicationSerializer(data=request.data)
        if serializer.is_valid():
            app = serializer.save(applicant=request.user)
            send_notification(
                subject=f"New rental application for {app.property.area}, {app.property.district}",
                body=(
                    f"Hi {app.property.landlord.username},\n\n"
                    f"{app.full_name} has submitted a rental application for "
                    f"{app.property.area}, {app.property.district}.\n\n"
                    f"Employment: {app.employment_status}\n"
                    f"Move-in date: {app.move_in_date}\n"
                    f"Occupants: {app.num_occupants}\n\n"
                    f"Log in to Lehae to review and respond."
                ),
                recipient_email=app.property.landlord.email,
            )
            return Response(RentalApplicationSerializer(app).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RentalApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_app(self, pk, user):
        app = get_object_or_404(RentalApplication, pk=pk)
        if app.applicant != user and app.property.landlord != user and not user.is_staff:
            return None, Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return app, None

    def patch(self, request, pk):
        app, err = self._get_app(pk, request.user)
        if err:
            return err
        new_status    = request.data.get('status')
        landlord_note = request.data.get('landlord_note', '')
        if new_status == 'cancelled' and app.applicant == request.user:
            app.status = 'cancelled'
            app.save()
            return Response(RentalApplicationSerializer(app).data)
        if new_status in ('reviewing', 'approved', 'declined') and (
            app.property.landlord == request.user or request.user.is_staff
        ):
            app.status = new_status
            if landlord_note:
                app.landlord_note = landlord_note
            app.save()
            send_notification(
                subject=f"Your application for {app.property.area} has been {new_status}",
                body=(
                    f"Hi {app.applicant.username},\n\n"
                    f"Your rental application for {app.property.area}, {app.property.district} "
                    f"has been updated to: {new_status}.\n"
                    + (f"\nLandlord note: {landlord_note}\n" if landlord_note else "")
                    + "\nLog in to Lehae for details."
                ),
                recipient_email=app.applicant.email,
            )
            return Response(RentalApplicationSerializer(app).data)
        return Response({'error': 'Invalid status update'}, status=status.HTTP_400_BAD_REQUEST)


# ── Landlord Verification ─────────────────────────────────────────────────────

class LandlordVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            v = LandlordVerification.objects.get(landlord=request.user)
            return Response(LandlordVerificationSerializer(v, context={'request': request}).data)
        except LandlordVerification.DoesNotExist:
            return Response({'status': 'not_submitted'})

    def post(self, request):
        UserProfile.objects.get_or_create(user=request.user, defaults={'is_landlord': True})
        existing = LandlordVerification.objects.filter(landlord=request.user).first()
        if existing and existing.status == 'approved':
            return Response({'error': 'Already verified.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = LandlordVerificationSerializer(
            existing, data=request.data, partial=True
        ) if existing else LandlordVerificationSerializer(data=request.data)
        if serializer.is_valid():
            v = serializer.save(landlord=request.user)
            send_notification(
                subject=f"Verification request from landlord {request.user.username}",
                body=(
                    f"Landlord {request.user.username} ({request.user.email}) "
                    f"has submitted a verification request.\n\n"
                    f"ID Number: {v.national_id_number}\n"
                    f"Phone: {v.phone_number}\n\n"
                    f"Log in to the admin panel to review."
                ),
                recipient_email=getattr(settings, 'ADMIN_EMAIL', settings.DEFAULT_FROM_EMAIL),
            )
            return Response(LandlordVerificationSerializer(v, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LandlordVerificationAdminView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = LandlordVerification.objects.all().order_by('-submitted_at')
        return Response(LandlordVerificationSerializer(qs, many=True, context={'request': request}).data)

    def patch(self, request, pk):
        from django.utils import timezone
        v          = get_object_or_404(LandlordVerification, pk=pk)
        new_status = request.data.get('status')
        admin_note = request.data.get('admin_note', '')
        if new_status not in ('approved', 'rejected'):
            return Response({'error': 'Status must be approved or rejected'}, status=status.HTTP_400_BAD_REQUEST)
        v.status      = new_status
        v.admin_note  = admin_note
        v.reviewed_at = timezone.now()
        v.save()
        if new_status == 'approved':
            profile, _ = UserProfile.objects.get_or_create(user=v.landlord, defaults={'is_landlord': True})
            profile.is_verified = True
            profile.save()
        send_notification(
            subject=f"Your Lehae verification has been {new_status}",
            body=(
                f"Hi {v.landlord.username},\n\n"
                f"Your landlord verification request has been {new_status}.\n"
                + (f"\nNote: {admin_note}\n" if admin_note else "")
                + "\nLog in to Lehae for details."
            ),
            recipient_email=v.landlord.email,
        )
        return Response(LandlordVerificationSerializer(v, context={'request': request}).data)


# ── Support Messages (landlord ↔ admin) ───────────────────────────────────────

class SupportMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_admin(self):
        return User.objects.filter(is_staff=True).first()

    def get(self, request, landlord_id=None):
        user = request.user
        if user.is_staff:
            if landlord_id:
                msgs = Message.objects.filter(
                    is_support=True
                ).filter(
                    Q(sender_id=landlord_id) | Q(receiver_id=landlord_id)
                ).order_by('created_at')
                msgs.filter(receiver=user, is_read=False).update(is_read=True)
                return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)
            else:
                msgs = Message.objects.filter(is_support=True).order_by('-created_at')
                seen = {}
                for m in msgs:
                    landlord = m.sender if not m.sender.is_staff else m.receiver
                    if landlord.id not in seen:
                        seen[landlord.id] = {
                            'landlord_id':       landlord.id,
                            'landlord_username': landlord.username,
                            'last_message':      m.content[:60],
                            'last_time':         m.created_at.isoformat(),
                            'unread_count':      Message.objects.filter(
                                is_support=True,
                                receiver=user,
                                sender=landlord,
                                is_read=False
                            ).count(),
                        }
                return Response(list(seen.values()))
        else:
            admin = self._get_admin()
            if not admin:
                return Response({'error': 'Support not available yet.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            msgs = Message.objects.filter(
                is_support=True
            ).filter(
                Q(sender=user, receiver=admin) | Q(sender=admin, receiver=user)
            ).order_by('created_at')
            msgs.filter(receiver=user, is_read=False).update(is_read=True)
            return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)

    def post(self, request, landlord_id=None):
        user    = request.user
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_staff:
            if not landlord_id:
                return Response({'error': 'landlord_id required.'}, status=status.HTTP_400_BAD_REQUEST)
            receiver = get_object_or_404(User, pk=landlord_id)
        else:
            receiver = User.objects.filter(is_staff=True).first()
            if not receiver:
                return Response({'error': 'Support not available.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        msg = Message.objects.create(
            sender=user,
            receiver=receiver,
            content=content,
            is_support=True,
        )
        send_notification(
            subject=f"{'Support reply from Lehae' if user.is_staff else 'New support message from ' + user.username}",
            body=(
                f"Hi {receiver.username},\n\n"
                f"{'Lehae Admin' if user.is_staff else user.username} sent you a message:\n\n"
                f"\"{content}\"\n\nLog in to Lehae to view and reply."
            ),
            recipient_email=receiver.email,
        )
        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


# ── Contact Inbox ─────────────────────────────────────────────────────────────

class ContactInboxView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .models import ContactMessage
        msgs = ContactMessage.objects.all().order_by('-created_at')
        data = [
            {
                'id':           m.id,
                'tenant_name':  m.tenant_name,
                'tenant_email': m.tenant_email,
                'message':      m.message,
                'property':     {
                    'id':       m.property.id,
                    'area':     m.property.area,
                    'district': m.property.district,
                } if m.property else None,
                'created_at':   m.created_at.isoformat(),
            }
            for m in msgs
        ]
        return Response(data)


# ── Admin: full user profile view ─────────────────────────────────────────────

class AdminUserProfileView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        u = get_object_or_404(User, pk=pk)
        profile, _ = UserProfile.objects.get_or_create(user=u, defaults={'is_landlord': False})

        properties = []
        if profile.is_landlord:
            props = Property.objects.filter(landlord=u).values(
                'id', 'area', 'district', 'rental_amount', 'status', 'is_approved', 'created_at'
            )
            properties = list(props)

        verification = None
        try:
            v = u.verification
            verification = {
                'status':             v.status,
                'national_id_number': v.national_id_number,
                'phone_number':       v.phone_number,
                'submitted_at':       v.submitted_at.isoformat() if v.submitted_at else None,
                'reviewed_at':        v.reviewed_at.isoformat() if v.reviewed_at else None,
                'id_document_url':    request.build_absolute_uri(v.id_document.url) if v.id_document else None,
                'admin_note':         v.admin_note,
            }
        except LandlordVerification.DoesNotExist:
            pass

        applications_count = RentalApplication.objects.filter(applicant=u).count()

        return Response({
            'id':                  u.id,
            'username':            u.username,
            'email':               u.email,
            'is_staff':            u.is_staff,
            'is_landlord':         profile.is_landlord,
            'is_verified':         profile.is_verified,
            'full_name':           getattr(profile, 'full_name', ''),
            'phone':               getattr(profile, 'phone', ''),
            'bio':                 getattr(profile, 'bio', ''),
            'date_joined':         u.date_joined.isoformat(),
            'properties':          properties,
            'verification':        verification,
            'applications_count':  applications_count,
        })


# ── Password Reset ────────────────────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid       = urlsafe_base64_encode(force_bytes(user.pk))
            token     = default_token_generator.make_token(user)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}/"
            send_notification(
                subject="Reset your Lehae password",
                body=(
                    f"Hi {user.username},\n\n"
                    f"We received a request to reset your password.\n\n"
                    f"Click the link below (valid for 24 hours):\n\n"
                    f"{reset_url}\n\n"
                    f"If you didn't request this, ignore this email.\n\n"
                    f"The Lehae Team"
                ),
                recipient_email=user.email,
            )
        return Response({'message': 'If that email is registered, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        uid      = request.data.get('uid', '')
        token    = request.data.get('token', '')
        password = request.data.get('password', '')

        if not uid or not token or not password:
            return Response({'error': 'uid, token and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pk   = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Reset link has expired or already been used.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()
        return Response({'message': 'Password reset successfully. You can now log in.'})