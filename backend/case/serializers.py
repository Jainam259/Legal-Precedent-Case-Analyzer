from rest_framework import serializers

from .models import (
    Advocate,
    Client,
    Case,
    CaseDocument,
    AIAnalysis,
    CaseUpdate,
    PdfLibraryDocument,
)


# ==========================================================
# Advocate Serializer
# ==========================================================

class AdvocateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Advocate
        fields = "__all__"
        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }


# ==========================================================
# Client Serializer
# ==========================================================

class ClientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = "__all__"
        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }


# ==========================================================
# Case Document Serializer
# ==========================================================

class CaseDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = CaseDocument
        fields = "__all__"


# ==========================================================
# PDF Library Document Serializer
# ==========================================================

class PdfLibraryDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = PdfLibraryDocument
        fields = ["id", "advocate", "title", "pdf", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


# ==========================================================
# AI Analysis Serializer
# ==========================================================

class AIAnalysisSerializer(serializers.ModelSerializer):

    class Meta:
        model = AIAnalysis
        fields = "__all__"


# ==========================================================
# Case Update Serializer
# ==========================================================

class CaseUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CaseUpdate
        fields = "__all__"


# ==========================================================
# Case Serializer
# ==========================================================

class CaseSerializer(serializers.ModelSerializer):

    client = ClientSerializer(read_only=True)
    documents = CaseDocumentSerializer(
        many=True,
        read_only=True
    )
    analysis = AIAnalysisSerializer(read_only=True)
    updates = CaseUpdateSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Case
        fields = "__all__"


# ==========================================================
# Upload Case Serializer
# ==========================================================

class CaseUploadSerializer(serializers.Serializer):

    # -------------------------
    # Client Information
    # -------------------------

    clientName = serializers.CharField(
        max_length=200
    )

    mobile = serializers.CharField(
        max_length=20
    )

    email = serializers.EmailField()

    address = serializers.CharField(
        required=False,
        allow_blank=True
    )

    # -------------------------
    # Case Information
    # -------------------------

    caseNumber = serializers.CharField(
        max_length=100
    )

    caseTitle = serializers.CharField(
        max_length=300
    )

    caseType = serializers.ChoiceField(
        choices=[
            "Civil",
            "Criminal",
            "Family",
            "Property",
            "Consumer",
            "Labour",
        ]
    )

    court = serializers.CharField(
        max_length=250
    )

    judge = serializers.CharField(
        required=False,
        allow_blank=True
    )

    opponent = serializers.CharField(
        required=False,
        allow_blank=True
    )

    hearingDate = serializers.DateField(
        required=False,
        allow_null=True
    )

    priority = serializers.ChoiceField(
        choices=[
            "High",
            "Medium",
            "Low",
        ]
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True
    )

    # -------------------------
    # PDF Upload
    # -------------------------

    pdf = serializers.FileField()

    # -------------------------
    # Validation
    # -------------------------

    def validate_pdf(self, value):

        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError(
                "Only PDF files are allowed."
            )

        if value.size > 20 * 1024 * 1024:
            raise serializers.ValidationError(
                "PDF size must be less than 20 MB."
            )

        return value

    def validate_caseNumber(self, value):

        # Case numbers only need to be unique *per advocate*. Different
        # advocates are allowed to reuse the same case number (e.g. both
        # having a "Case No. 1"), so this check must be scoped to the
        # advocate making the request, not run against every case in the
        # system.
        advocate_id = self.initial_data.get("advocate_id")

        if advocate_id and Case.objects.filter(
            advocate_id=advocate_id,
            case_number=value
        ).exists():
            raise serializers.ValidationError(
                "You already have a case with this Case Number."
            )

        return value

    def validate_mobile(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "Mobile number must contain only digits."
            )

        if len(value) < 10:
            raise serializers.ValidationError(
                "Enter a valid mobile number."
            )

        return value