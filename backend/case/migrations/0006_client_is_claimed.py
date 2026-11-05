# Generated manually on 2026-07-30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('case', '0005_alter_case_advocate'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='is_claimed',
            field=models.BooleanField(default=True),
        ),
    ]
