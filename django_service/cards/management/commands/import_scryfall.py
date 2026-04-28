"""
Django management command: import Scryfall oracle-cards JSON into the database.

Usage:
    python manage.py import_scryfall /path/to/oracle-cards.json

Options:
    --batch-size N    Кол-во карт в одном bulk_create (default: 500)
    --skip-existing   Пропускать карты, которые уже есть в БД (по scryfall_id+lang)
"""

import json
import sys
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

# Поправь импорт под свою структуру приложения
from cards.models import Card, CardFace   # <-- замени 'cards' на имя своего app


LEGAL_STATUSES = {"legal", "restricted"}

RARITY_MAP = {
    "common": "common",
    "uncommon": "uncommon",
    "rare": "rare",
    "mythic": "mythic",
    # иногда бывает "special", "bonus" — кладём в rare как fallback
}

# Layouts у которых есть card_faces в JSON
FACED_LAYOUTS = {
    "transform", "modal_dfc", "double_faced_token",
    "art_series", "reversible_card", "adventure",
    "split", "flip",
}


def is_legal(legalities: dict, format_name: str) -> bool:
    return legalities.get(format_name) in LEGAL_STATUSES


def build_card(raw: dict) -> Card:
    legalities = raw.get("legalities", {})

    # image_uri: берём "normal" из image_uris, если есть
    image_uri = ""
    if "image_uris" in raw:
        image_uri = raw["image_uris"].get("normal", "")

    rarity_raw = raw.get("rarity", "common")
    rarity = RARITY_MAP.get(rarity_raw, "rare")

    return Card(
        scryfall_id=raw["id"],
        oracle_id=raw["oracle_id"],
        name=raw["name"],
        mana_cost=raw.get("mana_cost", ""),
        cmc=min(float(raw.get("cmc") or 0), 9999.9),
        type_line=raw.get("type_line", ""),
        oracle_text=raw.get("oracle_text", ""),
        power=raw.get("power", ""),
        toughness=raw.get("toughness", ""),
        loyalty=raw.get("loyalty", ""),
        defense=raw.get("defense", ""),
        colors=raw.get("colors", []),
        color_identity=raw.get("color_identity", []),
        set_code=raw.get("set", ""),
        set_name=raw.get("set_name", ""),
        rarity=rarity,
        collector_number=raw.get("collector_number", ""),
        lang=raw.get("lang", "en"),
        legal_standard=is_legal(legalities, "standard"),
        legal_pioneer=is_legal(legalities, "pioneer"),
        legal_modern=is_legal(legalities, "modern"),
        legal_legacy=is_legal(legalities, "legacy"),
        legal_vintage=is_legal(legalities, "vintage"),
        legal_commander=is_legal(legalities, "commander"),
        legal_pauper=is_legal(legalities, "pauper"),
        image_uri=image_uri,
        layout=raw.get("layout", "normal"),
    )


def build_faces(card_obj: Card, raw: dict) -> list[CardFace]:
    faces = []
    for i, face in enumerate(raw.get("card_faces", [])):
        image_uri = ""
        if "image_uris" in face:
            image_uri = face["image_uris"].get("normal", "")
        faces.append(CardFace(
            card=card_obj,
            face_index=i,
            name=face.get("name", ""),
            mana_cost=face.get("mana_cost", ""),
            type_line=face.get("type_line", ""),
            oracle_text=face.get("oracle_text", ""),
            power=face.get("power", ""),
            toughness=face.get("toughness", ""),
            loyalty=face.get("loyalty", ""),
            image_uri=image_uri,
        ))
    return faces


class Command(BaseCommand):
    help = "Импортирует карты из Scryfall oracle-cards JSON в базу данных"

    def add_arguments(self, parser):
        parser.add_argument("json_file", type=str, help="Путь к JSON-файлу")
        parser.add_argument(
            "--batch-size", type=int, default=500,
            help="Размер пачки для bulk_create (default: 500)"
        )
        parser.add_argument(
            "--skip-existing", action="store_true",
            help="Пропускать карты, уже существующие в БД"
        )

    def handle(self, *args, **options):
        json_path = Path(options["json_file"])
        if not json_path.exists():
            raise CommandError(f"Файл не найден: {json_path}")

        batch_size = options["batch_size"]
        skip_existing = options["skip_existing"]

        self.stdout.write(f"Читаем {json_path} …")
        with open(json_path, encoding="utf-8") as f:
            all_cards = json.load(f)

        self.stdout.write(f"Загружено {len(all_cards):,} записей из JSON")

        # Если нужно пропускать существующие — собираем ключи из БД
        existing_keys: set[tuple] = set()
        if skip_existing:
            self.stdout.write("Загружаем существующие ключи из БД …")
            existing_keys = set(
                Card.objects.values_list("scryfall_id", "lang")
            )
            self.stdout.write(f"  В БД уже {len(existing_keys):,} карт")

        cards_to_create: list[Card] = []
        faces_pending: list[dict] = []   # {"raw": ..., "card": card_obj}

        created_count = 0
        skipped_count = 0
        error_count = 0

        def flush_batch():
            nonlocal created_count
            if not cards_to_create:
                return

            with transaction.atomic():
                Card.objects.bulk_create(
                    cards_to_create,
                    update_conflicts=not skip_existing,
                    update_fields=[
                        "oracle_id", "name", "mana_cost", "cmc", "type_line",
                        "oracle_text", "power", "toughness", "loyalty",
                        "defense", "colors", "color_identity", "set_code",
                        "set_name", "rarity", "collector_number",
                        "legal_standard", "legal_pioneer", "legal_modern",
                        "legal_legacy", "legal_vintage", "legal_commander",
                        "legal_pauper", "image_uri", "layout",
                    ],
                    unique_fields=["scryfall_id", "lang"],
                )
                created_count += len(cards_to_create)

                # Загружаем только что сохранённые объекты, чтобы получить pk
                scryfall_ids = [c.scryfall_id for c in cards_to_create]
                card_map = {
                    str(c.scryfall_id): c
                    for c in Card.objects.filter(scryfall_id__in=scryfall_ids)
                }

                all_faces: list[CardFace] = []
                for entry in faces_pending:
                    card_obj = card_map.get(entry["scryfall_id"])
                    if card_obj:
                        all_faces.extend(build_faces(card_obj, entry["raw"]))

                if all_faces:
                    # Удаляем старые faces перед вставкой новых
                    card_ids = {f.card_id for f in all_faces}
                    CardFace.objects.filter(card_id__in=card_ids).delete()
                    CardFace.objects.bulk_create(all_faces)

            cards_to_create.clear()
            faces_pending.clear()

        for i, raw in enumerate(all_cards):
            try:
                key = (raw["id"], raw.get("lang", "en"))

                if skip_existing and key in existing_keys:
                    skipped_count += 1
                    continue

                card = build_card(raw)
                cards_to_create.append(card)

                if raw.get("layout") in FACED_LAYOUTS and "card_faces" in raw:
                    faces_pending.append({
                        "scryfall_id": raw["id"],
                        "raw": raw,
                    })

                if len(cards_to_create) >= batch_size:
                    flush_batch()
                    self.stdout.write(
                        f"  … обработано {i + 1:,} / {len(all_cards):,}"
                    )

            except Exception as exc:
                error_count += 1
                self.stderr.write(
                    f"  [ОШИБКА] карта #{i} id={raw.get('id')}: {exc}"
                )

        # Финальная пачка
        flush_batch()

        self.stdout.write(self.style.SUCCESS(
            f"\nГотово!\n"
            f"  Записано:  {created_count:,}\n"
            f"  Пропущено: {skipped_count:,}\n"
            f"  Ошибок:    {error_count:,}"
        ))