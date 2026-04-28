from django.contrib.admin import  register, ModelAdmin
from .models import Card


@register(Card)
class CardAdmin(ModelAdmin):
    list_display = ('name','cmc','type_line','color_identity',
                    'rarity','image_uri')
    list_filter = ('rarity','cmc','set_name')
    search_fields = ('name',)
    ordering = ('name',)
