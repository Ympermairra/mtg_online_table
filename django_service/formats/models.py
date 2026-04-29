from django.db import models


class Format(models.Model):
    name = models.CharField(max_length=64, unique=True)  # standard, modern, commander...
    description = models.TextField(blank=True)
    deck_min_size = models.IntegerField(default=60)
    deck_max_size = models.IntegerField(null=True, blank=True)
    sideboard_size = models.IntegerField(default=15)

    def __str__(self):
        return self.name
