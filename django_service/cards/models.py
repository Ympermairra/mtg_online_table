from django.db import models
from django.contrib.postgres.fields import ArrayField


class Card(models.Model):
    # --- Идентификация ---
    scryfall_id = models.UUIDField(unique=True)
    oracle_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=255, db_index=True)

    # --- Игровые характеристики ---
    mana_cost = models.CharField(max_length=100, blank=True)
    cmc = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    type_line = models.CharField(max_length=255)
    oracle_text = models.TextField(blank=True)
    power = models.CharField(max_length=10, blank=True)
    toughness = models.CharField(max_length=10, blank=True)
    loyalty = models.CharField(max_length=10, blank=True)
    defense = models.CharField(max_length=10, blank=True)

    # --- Цвета ---
    colors = ArrayField(models.CharField(max_length=1), default=list)
    color_identity = ArrayField(models.CharField(max_length=1), default=list)

    # --- Принтинг ---
    set_code = models.CharField(max_length=10)
    set_name = models.CharField(max_length=255)
    rarity = models.CharField(
        max_length=20, choices=[
            ('common', 'Common'), ('uncommon', 'Uncommon'),
            ('rare', 'Rare'), ('mythic', 'Mythic'),
        ]
    )
    collector_number = models.CharField(max_length=10)
    lang = models.CharField(max_length=10, default='en')

    # --- Легальность ---
    legal_standard = models.BooleanField(default=False)
    legal_pioneer = models.BooleanField(default=False)
    legal_modern = models.BooleanField(default=False)
    legal_legacy = models.BooleanField(default=False)
    legal_vintage = models.BooleanField(default=False)
    legal_commander = models.BooleanField(default=False)
    legal_pauper = models.BooleanField(default=False)

    # --- Картинка ---
    image_uri = models.URLField(blank=True)

    # --- Layout ---
    layout = models.CharField(max_length=50)

    class Meta:
        unique_together = ('scryfall_id', 'lang')
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['oracle_id']),
            models.Index(fields=['set_code']),
        ]

    def __str__(self):
        return f"{self.name} ({self.set_code.upper()})"


# Для двусторонних карт
class CardFace(models.Model):
    card = models.ForeignKey(
        Card, on_delete=models.CASCADE, related_name='faces'
    )
    face_index = models.PositiveSmallIntegerField()  # 0 = front, 1 = back
    name = models.CharField(max_length=255)
    mana_cost = models.CharField(max_length=100, blank=True)
    type_line = models.CharField(max_length=255, blank=True)
    oracle_text = models.TextField(blank=True)
    power = models.CharField(max_length=10, blank=True)
    toughness = models.CharField(max_length=10, blank=True)
    loyalty = models.CharField(max_length=10, blank=True)
    image_uri = models.URLField(blank=True)

    class Meta:
        unique_together = ('card', 'face_index')
        ordering = ['face_index']
