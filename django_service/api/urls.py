from django.urls import include, path
from rest_framework import routers
from .views import DeckViewSet, CardViewSet, me, formats_list


v1_router = routers.DefaultRouter()
v1_router.register('decks', DeckViewSet, basename='deck')
v1_router.register('cards', CardViewSet, basename='card')

urlpatterns = [
    path('', include(v1_router.urls)),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    path('users/me', me),
    path('formats/', formats_list),
]