from django.db import models
from django.contrib.auth import get_user_model
from cards.models import Card
from formats.models import Format

User = get_user_model()

class Deck(models.Model):

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='decks'
    )
    name = models.CharField(max_length=255)
    format = models.ForeignKey(
        Format,
        on_delete=models.CASCADE,
        related_name='format_decks'
    )
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    commander = models.ForeignKey(
        Card,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='commander_decks'
    )

    def __str__(self):
        return f'{self.name} ({self.format}) — {self.owner.username}'


class DeckCard(models.Model):

    class Zone(models.TextChoices):
        MAIN = 'main', 'Main deck'
        SIDEBOARD = 'sideboard', 'Sideboard'


    deck = models.ForeignKey(
        Deck,
        on_delete=models.CASCADE,
        related_name='deck_cards'
    )
    card = models.ForeignKey(Card, on_delete=models.CASCADE)
    quantity = models.PositiveSmallIntegerField(default=1)
    zone = models.CharField(
        max_length=15,
        choices=Zone.choices,
        default='main'
    )


    class Meta:
        unique_together = ('deck', 'card', 'zone')
