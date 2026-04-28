from django.contrib.auth.models import AbstractUser
from django.db import models



class User(AbstractUser):
    """
    Кастомный пользак
    """
    class Roles(models.TextChoices):
        ADMIN = 'admin', 'администратор'
        USER = 'user', 'пользователь'

    username = models.CharField(
        verbose_name='Логин',
        max_length=255,
        unique=True,
        help_text=(
            'Обязательное. 255 символов или меньше.'
            'Только цифры,знаки и @/./+/-/_'
        ),
        error_messages={
            'unique': 'Пользователь с таким именем уже существует.',
        },
    )
    email = models.EmailField(
        verbose_name='Почта',
        max_length=255,
        unique=True,
        error_messages={
            'unique': 'Пользователь с такой почтой уже существует.',
        }
    )
    avatar = models.ImageField(
        verbose_name='Аватар',
        upload_to='users/images/',
        default=None,
    )
    role = models.CharField(
        verbose_name='РОль',
        choices=Roles.choices,
        default=Roles.USER,

    )
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    class Meta:
        ordering = ('username',)
        default_related_name = 'user'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'


    @property
    def is_admin(self):
        return (
            self.role == self.Roles.ADMIN
            or self.is_superuser
            or self.is_staff
        )

