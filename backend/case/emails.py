from django.core.mail import send_mail
from django.conf import settings


# ==========================================================
# Sent to the client the moment an advocate creates a case
# ==========================================================

def send_case_created_email(case):
    """
    Emails the client with the full case details right after the
    advocate creates the case (e.g. case number, court, hearing date).

    Called from UploadCaseView.post() right after Case.objects.create().
    Any failure here is caught by the caller so it never blocks the
    case-creation response.
    """

    client_email = case.client.email if case.client else None

    if not client_email:
        return False

    hearing_date_str = (
        case.hearing_date.strftime("%d-%m-%Y")
        if case.hearing_date
        else "Not scheduled yet"
    )

    subject = f"Your Case Has Been Filed - {case.case_number}"

    message = (
        f"Dear {case.client.full_name},\n\n"
        f"Your case has been filed successfully by your advocate. "
        f"Here are the details:\n\n"
        f"Case Number   : {case.case_number}\n"
        f"Case Title    : {case.case_title}\n"
        f"Case Type     : {case.case_type}\n"
        f"Court         : {case.court_name}\n"
        f"Judge         : {case.judge_name or 'Not assigned yet'}\n"
        f"Opponent      : {case.opponent_name or 'N/A'}\n"
        f"Hearing Date  : {hearing_date_str}\n"
        f"Priority      : {case.priority}\n"
        f"Status        : {case.status}\n\n"
        f"You will receive a reminder email 1 day before your hearing date.\n\n"
        f"Regards,\n"
        f"{case.advocate.full_name}\n"
        f"Case Analyzer"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [client_email],
        fail_silently=False,
    )

    return True


# ==========================================================
# Sent by the daily "send_hearing_reminders" management command,
# 1 day before the case's hearing_date
# ==========================================================

def send_hearing_reminder_email(case):

    client_email = case.client.email if case.client else None

    if not client_email:
        return False

    subject = f"Reminder: Court Hearing Tomorrow - {case.case_number}"

    message = (
        f"Dear {case.client.full_name},\n\n"
        f"This is a reminder that your case has a court hearing scheduled "
        f"for tomorrow ({case.hearing_date.strftime('%d-%m-%Y')}).\n\n"
        f"Case Number : {case.case_number}\n"
        f"Case Title  : {case.case_title}\n"
        f"Court       : {case.court_name}\n"
        f"Advocate    : {case.advocate.full_name}\n\n"
        f"Please make sure you are prepared and available for the hearing.\n\n"
        f"Regards,\n"
        f"{case.advocate.full_name}\n"
        f"Case Analyzer"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [client_email],
        fail_silently=False,
    )

    return True
