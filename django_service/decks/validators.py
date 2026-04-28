FORMAT_RULES = {
    'standard':  {'min': 60, 'max_sideboard': 15, 'max_copies': 4,  'legal_field': 'legal_standard'},
    'pioneer':   {'min': 60, 'max_sideboard': 15, 'max_copies': 4,  'legal_field': 'legal_pioneer'},
    'modern':    {'min': 60, 'max_sideboard': 15, 'max_copies': 4,  'legal_field': 'legal_modern'},
    'legacy':    {'min': 60, 'max_sideboard': 15, 'max_copies': 4,  'legal_field': 'legal_legacy'},
    'vintage':   {'min': 60, 'max_sideboard': 15, 'max_copies': 4,  'legal_field': 'legal_vintage'},
    'commander': {'min': 100,'max_sideboard': 0,  'max_copies': 1,  'legal_field': 'legal_commander'},
    'pauper':    {'min': 60, 'max_sideboard': 15, 'max_copies': 4,  'legal_field': 'legal_pauper'},
}

BASIC_LANDS = {
    'Plains', 'Island', 'Swamp', 'Mountain', 'Forest',
    'Wastes', 'Snow-Covered Plains', 'Snow-Covered Island',
    'Snow-Covered Swamp', 'Snow-Covered Mountain', 'Snow-Covered Forest',
}


class DeckValidator:
    def __init__(self, deck):
        self.deck = deck
        self.errors = []

    def validate(self):
        rules = FORMAT_RULES.get(self.deck.format)

        main = self.deck.deck_cards.filter(
            zone='main'
        ).select_related('card')
        sideboard = self.deck.deck_cards.filter(
            zone='sideboard'
        ).select_related('card')

        main_count = sum(dc.quantity for dc in main)
        side_count = sum(dc.quantity for dc in sideboard)

        if main_count < rules['min']:
            self.errors.append(
                f'Мало карт в основной колоде: {main_count}'
                f' (минимум {rules["min"]})'
            )

        if side_count > rules['max_sideboard']:
            self.errors.append(
                f'Слишком много карт в сайдборде: {side_count} '
                f'(максимум {rules["max_sideboard"]})'
            )

        if self.deck.format == 'commander' and main_count != 100:
            self.errors.append(
                f'В Commander должно быть ровно 100 карт, '
                f'сейчас {main_count}'
            )

        for dc in main:
            if not getattr(dc.card, rules['legal_field'], False):
                self.errors.append(
                    f'{dc.card.name} '
                    f'не легальна в {self.deck.format}'
                )

            is_basic = dc.card.name in BASIC_LANDS
            if not is_basic and dc.quantity > rules['max_copies']:
                self.errors.append(
                    f'{dc.card.name}: {dc.quantity} копий '
                    f'(максимум {rules["max_copies"]})'
                )

        return self.errors

    def is_valid(self):
        return len(self.validate()) == 0
