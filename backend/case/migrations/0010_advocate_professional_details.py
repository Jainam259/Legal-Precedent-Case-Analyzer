from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("case", "0009_case_reminder_sent"),
    ]

    operations = [
        migrations.AddField(
            model_name="advocate",
            name="experience_years",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Years of practice/experience",
            ),
        ),
        migrations.AddField(
            model_name="advocate",
            name="cases_won",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Number of cases won",
            ),
        ),
        migrations.AddField(
            model_name="advocate",
            name="case_fees",
            field=models.CharField(
                blank=True,
                default="",
                help_text="e.g. '\u20b95,000 / hearing' or 'Starting at \u20b910,000'",
                max_length=100,
            ),
        ),
        migrations.AddField(
            model_name="advocate",
            name="specialization",
            field=models.CharField(
                blank=True,
                default="",
                help_text="e.g. 'Criminal Law, Family Law'",
                max_length=150,
            ),
        ),
    ]
