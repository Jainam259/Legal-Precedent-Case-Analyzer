from django.db import models


# ==========================================================
# Advocate
# ==========================================================

class Advocate(models.Model):

    full_name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)

    phone = models.CharField(max_length=15)

    bar_number = models.CharField(max_length=50, unique=True)

    password = models.CharField(max_length=255)

    # ------------------------------------------------------
    # Professional details shown on the advocate's profile
    # page and to clients browsing the "All Advocates" list.
    # ------------------------------------------------------

    experience_years = models.PositiveIntegerField(
        default=0,
        help_text="Years of practice/experience",
    )

    cases_won = models.PositiveIntegerField(
        default=0,
        help_text="Number of cases won",
    )

    case_fees = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="e.g. '₹5,000 / hearing' or 'Starting at ₹10,000'",
    )

    specialization = models.CharField(
        max_length=150,
        blank=True,
        default="",
        help_text="e.g. 'Criminal Law, Family Law'",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "advocate"

    def __str__(self):
        return self.full_name


# ==========================================================
# Client
# ==========================================================

class Client(models.Model):

    full_name = models.CharField(max_length=200)

    mobile = models.CharField(max_length=20)

    email = models.EmailField(unique=True)

    address = models.TextField()

    password = models.CharField(max_length=255)

    # True once the client has set their own password via signup/claim.
    # False for placeholder accounts auto-created when an advocate
    # uploads a case for a client email that doesn't exist yet.
    is_claimed = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "client"

    def __str__(self):
        return self.full_name

# ==========================================================
# Case
# ==========================================================
# ==========================================================
# Case
# ==========================================================

class Case(models.Model):

    CASE_TYPES = [
        ("Civil", "Civil"),
        ("Criminal", "Criminal"),
        ("Family", "Family"),
        ("Property", "Property"),
        ("Consumer", "Consumer"),
        ("Labour", "Labour"),
    ]

    PRIORITY = [
        ("High", "High"),
        ("Medium", "Medium"),
        ("Low", "Low"),
    ]

    # Advocate who created this case
    advocate = models.ForeignKey(
        Advocate,
        on_delete=models.CASCADE,
        related_name="cases"
    )

    # Client
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="cases"
    )

    # NOTE: case_number is only guaranteed unique *per advocate* (see
    # Meta.unique_together below), not globally. Two different advocates
    # are allowed to use the same case number (e.g. both filing a
    # "Case No. 1"), the same way two different law firms can each have
    # their own "Case No. 1".
    case_number = models.CharField(
        max_length=100
    )

    case_title = models.CharField(
        max_length=300
    )

    case_type = models.CharField(
        max_length=50,
        choices=CASE_TYPES
    )

    court_name = models.CharField(
        max_length=250
    )

    judge_name = models.CharField(
        max_length=250,
        blank=True,
        null=True
    )

    opponent_name = models.CharField(
        max_length=250,
        blank=True,
        null=True
    )

    hearing_date = models.DateField(
        blank=True,
        null=True
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY,
        default="Medium"
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=50,
        default="Pending"
    )

    # Set to True once the "1 day before hearing" reminder email has
    # been sent for this case, so the daily reminder job never emails
    # the same hearing date twice.
    reminder_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "case"
        # A case number only needs to be unique within a given advocate's
        # own caseload, not across every advocate on the platform.
        constraints = [
            models.UniqueConstraint(
                fields=["advocate", "case_number"],
                name="unique_case_number_per_advocate"
            )
        ]

    def __str__(self):
        return self.case_number
# ==========================================================
# Case Documents
# ==========================================================

class CaseDocument(models.Model):

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    pdf = models.FileField(
        upload_to="case_pdfs/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "case_document"

    def __str__(self):
        return self.case.case_number


# ==========================================================
# AI Analysis
# ==========================================================

class AIAnalysis(models.Model):

    case = models.OneToOneField(
        Case,
        on_delete=models.CASCADE,
        related_name="analysis"
    )

    summary = models.TextField(
        blank=True,
        null=True
    )

    case_story = models.TextField(
        blank=True,
        null=True
    )

    important_dates = models.JSONField(
        default=list,
        blank=True
    )

    parties = models.JSONField(
        default=dict,
        blank=True
    )

    acts = models.JSONField(
        default=list,
        blank=True
    )

    sections = models.JSONField(
        default=list,
        blank=True
    )

    timeline = models.JSONField(
        default=list,
        blank=True
    )

    evidence = models.JSONField(
        default=list,
        blank=True
    )

    missing_documents = models.JSONField(
        default=list,
        blank=True
    )

    ai_confidence = models.IntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "ai_analysis"

    def __str__(self):
        return f"AI Analysis - {self.case.case_number}"


# ==========================================================
# Case Updates (log of notes added after the case was filed)
# ==========================================================

class CaseUpdate(models.Model):

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name="updates"
    )

    note = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "case_update"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Update on {self.case.case_number}"


# ==========================================================
# PDF Library (advocate's personal PDF documents, not tied
# to any specific case)
# ==========================================================

class PdfLibraryDocument(models.Model):

    advocate = models.ForeignKey(
        Advocate,
        on_delete=models.CASCADE,
        related_name="pdf_library"
    )

    title = models.CharField(
        max_length=255,
        blank=True
    )

    pdf = models.FileField(
        upload_to="pdf_library/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "pdf_library_document"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title or self.pdf.name