from django.contrib import admin
from django.contrib.admin import register

from .models import Deck, DeckCard

@register(Deck)
class DeckAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'format',
        'description',
        'is_public',
        'created_at',
        'updated_at',
        'commander',
    )
    search_fields = ('name', 'format',)
    list_filter = ('format', 'is_public',)
    ordering = ('name', 'format', 'created_at')


@register(DeckCard)
class DeckCardAdmin(admin.ModelAdmin):
    list_display = (
        'deck',
        'card',
        'quantity',
        'zone'
    )