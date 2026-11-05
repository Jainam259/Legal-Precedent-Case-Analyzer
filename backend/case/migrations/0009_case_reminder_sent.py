from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("case", "0008_pdflibrarydocument"),
    ]

    operations = [
        migrations.AddField(
            model_name="case",
            name="reminder_sent",
            field=models.BooleanField(default=False),
        ),
    ]
