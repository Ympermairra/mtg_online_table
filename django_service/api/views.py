from rest_framework import viewsets, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model

from decks.models import Deck, DeckCard
from .serializers import DeckSerializer, DeckCardSerializer, CardSerializer, FormatSerializer
from decks.validators import DeckValidator
from cards.models import Card
from formats.models import Format

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        'id':       request.user.id,
        'username': request.user.username,
        'email':    request.user.email,
    })


class DeckViewSet(viewsets.ModelViewSet):
    serializer_class = DeckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Deck.objects.filter(
            owner=self.request.user
        ).prefetch_related('deck_cards__card')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


    # POST /api/decks/{id}/validate/
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        deck = self.get_object()
        validator = DeckValidator(deck)
        errors = validator.validate()
        return Response({
            'valid':  len(errors) == 0,
            'errors': errors,
        })

    # POST /api/decks/{id}/cards/
    @action(detail=True, methods=['post'], url_path='cards')
    def add_card(self, request, pk=None):
        deck = self.get_object()
        card_id = request.data.get('card')
        quantity = int(request.data.get('quantity', 1))
        zone = request.data.get('zone', 'main')

        try:
            card = Card.objects.get(id=card_id)
        except Card.DoesNotExist:
            return Response({'error': 'Карта не найдена'}, status=404)

        deck_card, _ = DeckCard.objects.update_or_create(
            deck=deck,
            card=card,
            zone=zone,
            defaults={'quantity': quantity}
        )
        return Response(DeckCardSerializer(deck_card).data, status=201)

    # DELETE /api/decks/{id}/cards/{card_id}/
    @action(
        detail=True,
        methods=['delete'],
        url_path='cards/(?P<card_id>[^/.]+)'
    )
    def remove_card(self, request, pk=None, card_id=None):
        deck = self.get_object()
        DeckCard.objects.filter(deck=deck, card_id=card_id).delete()
        return Response(status=204)

    # POST /api/decks/{id}/import/
    @action(detail=True, methods=['post'], url_path='import')
    def import_decklist(self, request, pk=None):
        deck = self.get_object()
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'Текст не передан'}, status=400)

        imported = 0
        not_found = []
        zone = 'main'

        for line in text.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            if line.lower() == 'sideboard':
                zone = 'sideboard'
                continue

            parts = line.split(' ', 1)
            if len(parts) != 2 or not parts[0].isdigit():
                continue

            quantity, name = int(parts[0]), parts[1].strip()
            card = Card.objects.filter(name__iexact=name).first()
            if card:
                DeckCard.objects.update_or_create(
                    deck=deck, card=card, zone=zone,
                    defaults={'quantity': quantity}
                )
                imported += 1
            else:
                not_found.append(name)

        return Response({'imported': imported, 'not_found': not_found})


@api_view(['GET'])
@permission_classes([AllowAny])
def formats_list(request):
    formats = Format.objects.all()
    return Response(FormatSerializer(formats, many=True).data)


class CardViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return Card.objects.all()