from django.db import models


class Format(models.Model):

    class Formats(models.TextChoices):
        STANDARD = 'standard', 'Standard'
        PIONER = 'pioneer', 'Pioneer'
        MODERN = 'modern', 'Modern'
        LEGACY = 'legacy', 'Legacy'
        VINTAGE = 'vintage', 'Vintage'
        COMANDER = 'commander', 'Commander'
        PAUPER = 'pauper', 'Pauper'
    # name = models.CharField(max_length=64, unique=True)  # standard, modern, commander...
    name = models.CharField(
        max_length=20,
        choices=Formats.choices,
        unique=True,
    )
    description = models.TextField(blank=True)
    deck_min_size = models.IntegerField(default=60)
    deck_max_size = models.IntegerField(null=True, blank=True)
    sideboard_size = models.IntegerField(default=15)

    def __str__(self):
        return self.name
