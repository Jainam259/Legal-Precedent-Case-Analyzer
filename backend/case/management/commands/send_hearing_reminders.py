import datetime

from django.core.management.base import BaseCommand

from case.models import Case
from case.emails import send_hearing_reminder_email


class Command(BaseCommand):
    """
    Sends a reminder email to the client for every case whose
    hearing_date is exactly 1 day from today.

    Example: if a case's hearing_date is 13-09-2026, running this
    command on 12-09-2026 will email that case's client.

    Run manually:
        python manage.py send_hearing_reminders

    Run automatically every day (recommended), see the README note
    printed at the bottom of this file / the chat message for how
    to schedule it with cron (Linux/Mac) or Task Scheduler (Windows).
    """

    help = "Emails clients whose case hearing_date is tomorrow."

    def handle(self, *args, **options):

        tomorrow = datetime.date.today() + datetime.timedelta(days=1)

        cases = Case.objects.filter(
            hearing_date=tomorrow,
            reminder_sent=False,
        ).select_related("client", "advocate")

        if not cases.exists():
            self.stdout.write(
                self.style.WARNING(
                    f"No hearings found for {tomorrow}. Nothing to send."
                )
            )
            return

        sent_count = 0

        for case in cases:

            client_email = case.client.email if case.client else None

            if not client_email:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping case {case.case_number}: no client email on file."
                    )
                )
                continue

            try:
                send_hearing_reminder_email(case)

                case.reminder_sent = True
                case.save(update_fields=["reminder_sent"])

                sent_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Reminder sent to {client_email} for case {case.case_number}"
                    )
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to send reminder for case {case.case_number}: {e}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f"Done. {sent_count} reminder email(s) sent.")
        )
