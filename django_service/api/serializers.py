from rest_framework import serializers
from decks.models import Deck, DeckCard
from cards.models import Card


class DeckCardSerializer(serializers.ModelSerializer):
    card_name  = serializers.CharField(source='card.name', read_only=True)
    image_uri  = serializers.CharField(source='card.image_uri', read_only=True)
    type_line  = serializers.CharField(source='card.type_line', read_only=True)
    mana_cost  = serializers.CharField(source='card.mana_cost', read_only=True)

    class Meta:
        model  = DeckCard
        fields = [
            'id',
            'card',
            'card_name',
            'image_uri',
            'type_line',
            'mana_cost',
            'quantity',
            'zone'
        ]


class DeckSerializer(serializers.ModelSerializer):
    deck_cards = DeckCardSerializer(many=True, read_only=True)
    card_count = serializers.SerializerMethodField()

    class Meta:
        model  = Deck
        fields = [
            'id',
            'name',
            'format',
            'description',
            'is_public',
            'commander',
            'deck_cards',
            'card_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['owner']

    def get_card_count(self, obj):
        return sum(dc.quantity for dc in obj.deck_cards.filter(zone='main'))

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Card
        fields = [
            'id',
            'name',
            'mana_cost',
            'cmc',
            'type_line',
            'oracle_text',
            'power',
            'toughness',
            'loyalty',
            'colors',
            'color_identity',
            'set_code',
            'rarity',
            'image_uri',
            'layout',
        ]