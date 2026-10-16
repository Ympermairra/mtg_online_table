from django.db import migrations


# Значения совпадают с FORMAT_RULES в decks/validators.py
FORMATS = [
    # name, description, deck_min_size, deck_max_size, sideboard_size
    ('standard', 'Карты из последних выпусков', 60, None, 15),
    ('pioneer', 'Карты начиная с Return to Ravnica', 60, None, 15),
    ('modern', 'Карты начиная с Eighth Edition', 60, None, 15),
    ('legacy', 'Почти все карты, есть бан-лист', 60, None, 15),
    ('vintage', 'Все карты, мощные ограничены одной копией', 60, None, 15),
    ('commander', 'Синглтон-колода из 100 карт с командиром', 100, 100, 0),
    ('pauper', 'Только карты с редкостью common', 60, None, 15),
]


def create_formats(apps, schema_editor):
    Format = apps.get_model('formats', 'Format')
    for name, description, min_size, max_size, sideboard in FORMATS:
        Format.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'deck_min_size': min_size,
                'deck_max_size': max_size,
                'sideboard_size': sideboard,
            },
        )


def delete_formats(apps, schema_editor):
    Format = apps.get_model('formats', 'Format')
    Format.objects.filter(name__in=[f[0] for f in FORMATS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('formats', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_formats, delete_formats),
    ]
