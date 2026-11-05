from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Count
from django.db.models.functions import TruncMonth, TruncWeek

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

import traceback

from .emails import send_case_created_email

from .models import (
    Advocate,   
    Client,
    Case,
    CaseDocument,
    AIAnalysis,
    CaseUpdate,
    PdfLibraryDocument,
)

from .serializers import (
    AdvocateSerializer,
    ClientSerializer,
    CaseSerializer,
    CaseUploadSerializer,
    CaseUpdateSerializer,
    CaseDocumentSerializer,
    PdfLibraryDocumentSerializer,
)

from .ai_service import analyze_case


# ==========================================================
# ADVOCATE REGISTER
# ==========================================================

@api_view(["POST"])
def register(request):

    data = request.data.copy()

    if Advocate.objects.filter(email=data.get("email")).exists():
        return Response(
            {
                "success": False,
                "message": "Email already exists",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Advocate.objects.filter(bar_number=data.get("bar_number")).exists():
        return Response(
            {
                "success": False,
                "message": "Bar Number already exists",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    data["password"] = make_password(data["password"])

    serializer = AdvocateSerializer(data=data)

    if serializer.is_valid():
        advocate = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Registration Successful",

                "advocate": {
                    "id": advocate.id,
                    "full_name": advocate.full_name,
                    "email": advocate.email,
                    "phone": advocate.phone,
                    "bar_number": advocate.bar_number,
                }
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# ==========================================================
# ADVOCATE LOGIN
# ==========================================================

@api_view(["POST"])
def login(request):

    email = request.data.get("email")
    password = request.data.get("password")

    try:

        advocate = Advocate.objects.get(email=email)

        if not check_password(password, advocate.password):

            return Response(
                {
                    "success": False,
                    "message": "Invalid Password",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Login Successful",

                "advocate": {
                    "id": advocate.id,
                    "full_name": advocate.full_name,
                    "email": advocate.email,
                    "phone": advocate.phone,
                    "bar_number": advocate.bar_number,
                }
            }
        )

    except Advocate.DoesNotExist:

        return Response(
            {
                "success": False,
                "message": "Email not found",
            },
            status=status.HTTP_404_NOT_FOUND,
        )


# ==========================================================
# CLIENT REGISTER
# ==========================================================

@api_view(["POST"])
def client_register(request):

    data = request.data.copy()

    email = data.get("email")

    existing = Client.objects.filter(email=email).first()

    if existing:

        if existing.is_claimed:

            # A real account already exists on this email.
            return Response(
                {
                    "success": False,
                    "message": "Email already exists",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ==========================================
        # CLAIM PLACEHOLDER ACCOUNT
        # ==========================================
        # This email was auto-created when an advocate uploaded a case
        # for this client, so no real account exists yet. Let the
        # client set their own details/password on that same record
        # instead of rejecting the signup.

        existing.full_name = data.get("full_name", existing.full_name)
        existing.mobile = data.get("mobile", existing.mobile)
        existing.address = data.get("address", existing.address)
        existing.password = make_password(data["password"])
        existing.is_claimed = True
        existing.save()

        return Response(
            {
                "success": True,
                "message": "Account claimed successfully. You can now log in.",

                "client": {
                    "id": existing.id,
                    "full_name": existing.full_name,
                    "email": existing.email,
                    "mobile": existing.mobile,
                    "address": existing.address,
                }
            },
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # BRAND NEW CLIENT
    # ==========================================

    data["password"] = make_password(data["password"])

    serializer = ClientSerializer(data=data)

    if serializer.is_valid():

        client = serializer.save()

        client.is_claimed = True
        client.save()

        return Response(
            {
                "success": True,
                "message": "Client Registered Successfully",

                "client": {
                    "id": client.id,
                    "full_name": client.full_name,
                    "email": client.email,
                    "mobile": client.mobile,
                    "address": client.address,
                }
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


# ==========================================================
# CLIENT LOGIN
# ==========================================================

@api_view(["POST"])
def client_login(request):

    email = request.data.get("email")
    password = request.data.get("password")

    try:

        client = Client.objects.get(email=email)

        if not check_password(password, client.password):

            return Response(
                {
                    "success": False,
                    "message": "Invalid Password",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Login Successful",

                "client": {
                    "id": client.id,
                    "full_name": client.full_name,
                    "email": client.email,
                    "mobile": client.mobile,
                    "address": client.address,
                }
            }
        )

    except Client.DoesNotExist:

        return Response(
            {
                "success": False,
                "message": "Email not found",
            },
            status=status.HTTP_404_NOT_FOUND,
        )


# ==========================================================
# GET ALL ADVOCATES
# ==========================================================

@api_view(["GET"])
def get_advocates(request):

    advocates = Advocate.objects.all().order_by("full_name")

    serializer = AdvocateSerializer(
        advocates,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )
# ==========================================================
# UPLOAD NEW CASE
# ==========================================================

class UploadCaseView(APIView):

    def post(self, request):

        serializer = CaseUploadSerializer(data=request.data)

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:

            # ==========================================
            # GET ADVOCATE
            # ==========================================

            advocate = Advocate.objects.get(
                id=request.data.get("advocate_id")
            )

            # ==========================================
            # CREATE / UPDATE CLIENT
            # ==========================================

            client, created = Client.objects.get_or_create(

                email=data["email"],

                defaults={
                    "full_name": data["clientName"],
                    "mobile": data["mobile"],
                    "address": data.get("address", ""),
                    "password": make_password("client123"),
                    # This is a placeholder account created by the advocate,
                    # not a real client signup. The client has not chosen
                    # this password and doesn't know it yet.
                    "is_claimed": False,
                },
            )

            if not created:

                client.full_name = data["clientName"]
                client.mobile = data["mobile"]
                client.address = data.get("address", "")
                client.save()

            # ==========================================
            # CREATE CASE
            # ==========================================

            case = Case.objects.create(

                advocate=advocate,

                client=client,

                case_number=data["caseNumber"],

                case_title=data["caseTitle"],

                case_type=data["caseType"],

                court_name=data["court"],

                judge_name=data.get("judge", ""),

                opponent_name=data.get("opponent", ""),

                hearing_date=data.get("hearingDate"),

                priority=data["priority"],

                description=data.get("description", ""),

                status="Pending",
            )

            # ==========================================
            # EMAIL CLIENT - CASE CREATED
            # ==========================================
            # Sent right away so the client knows their case was filed
            # and can see the hearing date. A separate reminder email
            # is sent automatically 1 day before the hearing by the
            # send_hearing_reminders management command.
            #
            # email_status is returned in the API response below so the
            # frontend/Postman/whoever called this endpoint can see
            # whether it actually went out, without digging through logs.

            email_status = "sent"

            try:
                send_case_created_email(case)

                print(
                    f"[EMAIL OK] Case-created email sent to "
                    f"{case.client.email} for case {case.case_number}"
                )

            except Exception as e:
                # Don't fail case creation just because the email
                # couldn't be sent (e.g. SMTP misconfigured/offline).
                email_status = "failed"

                print(
                    f"[EMAIL FAILED] Could not send case-created email to "
                    f"{case.client.email} for case {case.case_number}: {e}"
                )

                traceback.print_exc()

            # ==========================================
            # SAVE PDF
            # ==========================================

            document = CaseDocument.objects.create(

                case=case,

                pdf=data["pdf"]
            )

            # ==========================================
            # AI ANALYSIS
            # ==========================================

            result = analyze_case(document.pdf.path)

            analysis = AIAnalysis.objects.create(

                case=case,

                summary=result.get("executive_summary", ""),

                case_story=result.get("case_story", ""),

                important_dates=result.get("important_dates", []),

                parties=result.get("parties", []),

                acts=result.get("acts", []),

                sections=result.get("sections", []),

                timeline=result.get("timeline", []),

                evidence=result.get("evidence", []),

                missing_documents=result.get("missing_documents", []),

                ai_confidence=result.get("confidence", 0),
            )

            return Response(

                {

                    "success": True,

                    "message": "Case Uploaded Successfully",

                    "email_status": email_status,

                    "summary": {

                        "summary": analysis.summary,

                        "case_story": analysis.case_story,

                        "important_dates": analysis.important_dates,

                        "parties": analysis.parties,

                        "acts": analysis.acts,

                        "sections": analysis.sections,

                        "timeline": analysis.timeline,

                        "evidence": analysis.evidence,

                        "missing_documents": analysis.missing_documents,

                        "confidence": analysis.ai_confidence,
                    },

                    "case": CaseSerializer(case).data,
                },

                status=status.HTTP_201_CREATED,
            )

        except Advocate.DoesNotExist:

            return Response(

                {
                    "success": False,
                    "message": "Advocate not found"
                },

                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:

            traceback.print_exc()

            return Response(

                {
                    "success": False,
                    "message": str(e)
                },

                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
# ==========================================================
# ALL CASES (ADVOCATE WISE)
# ==========================================================

class CaseListView(APIView):

    def get(self, request):

        advocate_id = request.query_params.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            cases = (
                Case.objects
                .filter(advocate_id=advocate_id)
                .select_related(
                    "client",
                    "advocate",
                )
                .prefetch_related(
                    "documents",
                )
                .order_by("-created_at")
            )

            serializer = CaseSerializer(
                cases,
                many=True
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================================
# SINGLE CASE DETAILS
# ==========================================================

class CaseDetailView(APIView):

    def get(self, request, pk):

        advocate_id = request.query_params.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            case = (
                Case.objects
                .select_related(
                    "client",
                    "advocate",
                )
                .prefetch_related(
                    "documents",
                )
                .get(
                    id=pk,
                    advocate_id=advocate_id
                )
            )

            serializer = CaseSerializer(case)

            return Response(
                {
                    "success": True,
                    "case": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Case.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Case not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================================
# DELETE CASE
# ==========================================================

class DeleteCaseView(APIView):

    def delete(self, request, pk):

        advocate_id = request.query_params.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            case = Case.objects.get(
                id=pk,
                advocate_id=advocate_id
            )

            # Delete uploaded PDFs
            for document in case.documents.all():

                if document.pdf:
                    document.pdf.delete(save=False)

                document.delete()

            # Delete AI Analysis
            if hasattr(case, "analysis"):
                case.analysis.delete()

            # Delete Case
            case.delete()

            return Response(
                {
                    "success": True,
                    "message": "Case Deleted Successfully"
                },
                status=status.HTTP_200_OK
            )

        except Case.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Case not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# ==========================================================
# CASE ANALYTICS (ADVOCATE WISE)
# ==========================================================

class CaseAnalyticsView(APIView):

    def get(self, request):

        advocate_id = request.query_params.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            cases = Case.objects.filter(advocate_id=advocate_id)

            # Count of cases per case_type
            by_type = list(
                cases.values("case_type")
                .annotate(count=Count("id"))
                .order_by("-count")
            )

            # Count of cases per case_type, per calendar month
            by_month = list(
                cases.annotate(period=TruncMonth("created_at"))
                .values("period", "case_type")
                .annotate(count=Count("id"))
                .order_by("period")
            )

            # Count of cases per case_type, per calendar week
            by_week = list(
                cases.annotate(period=TruncWeek("created_at"))
                .values("period", "case_type")
                .annotate(count=Count("id"))
                .order_by("period")
            )

            return Response(
                {
                    "success": True,
                    "by_type": by_type,
                    "by_month": by_month,
                    "by_week": by_week,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================================
# ADD CASE UPDATE (log entry on an existing case)
# ==========================================================

class AddCaseUpdateView(APIView):

    def post(self, request, pk):

        advocate_id = request.query_params.get("advocate_id") or request.data.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        note = (request.data.get("note") or "").strip()

        if not note:

            return Response(
                {
                    "success": False,
                    "message": "Note cannot be empty"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            case = Case.objects.get(id=pk, advocate_id=advocate_id)

            update = CaseUpdate.objects.create(case=case, note=note)

            return Response(
                {
                    "success": True,
                    "message": "Update added",
                    "update": CaseUpdateSerializer(update).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Case.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Case not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================================
# EDIT CASE (mutable fields only)
# ==========================================================

class EditCaseView(APIView):

    EDITABLE_FIELDS = [
        "court_name",
        "judge_name",
        "opponent_name",
        "hearing_date",
        "priority",
        "status",
        "description",
    ]

    def put(self, request, pk):

        advocate_id = request.query_params.get("advocate_id") or request.data.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            case = Case.objects.get(id=pk, advocate_id=advocate_id)

            for field in self.EDITABLE_FIELDS:
                if field in request.data:

                    new_value = request.data[field] or None

                    # If the hearing date is changed, allow the reminder
                    # to be sent again for the new date.
                    if field == "hearing_date" and new_value != str(case.hearing_date):
                        case.reminder_sent = False

                    setattr(case, field, new_value)

            case.save()

            return Response(
                {
                    "success": True,
                    "message": "Case updated",
                    "case": CaseSerializer(case).data,
                },
                status=status.HTTP_200_OK,
            )

        except Case.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Case not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================================
# ADD DOCUMENT TO EXISTING CASE
# ==========================================================

class AddCaseDocumentView(APIView):

    def post(self, request, pk):

        advocate_id = request.query_params.get("advocate_id") or request.data.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        pdf = request.FILES.get("pdf")

        if not pdf:

            return Response(
                {
                    "success": False,
                    "message": "PDF file is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            case = Case.objects.get(id=pk, advocate_id=advocate_id)

            document = CaseDocument.objects.create(case=case, pdf=pdf)

            return Response(
                {
                    "success": True,
                    "message": "Document added",
                    "document": CaseDocumentSerializer(document).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Case.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Case not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# --------------------------------------------------------------
# profile

# -------------------------------------------------------------
@api_view(["GET"])
def advocate_profile(request, id):
    try:
        advocate = Advocate.objects.get(id=id)

        return Response({
            "success": True,
            "advocate": {
                "id": advocate.id,
                "full_name": advocate.full_name,
                "email": advocate.email,
                "phone": advocate.phone,
                "bar_number": advocate.bar_number,
                "created_at": advocate.created_at,
                "experience_years": advocate.experience_years,
                "cases_won": advocate.cases_won,
                "case_fees": advocate.case_fees,
                "specialization": advocate.specialization,
            }
        })

    except Advocate.DoesNotExist:
        return Response({
            "success": False,
            "message": "Advocate not found"
        }, status=404)

@api_view(["PUT"])
def update_advocate_profile(request, id):
    try:
        advocate = Advocate.objects.get(id=id)

        advocate.full_name = request.data.get(
            "full_name",
            advocate.full_name
        )

        advocate.email = request.data.get(
            "email",
            advocate.email
        )

        advocate.phone = request.data.get(
            "phone",
            advocate.phone
        )

        advocate.experience_years = request.data.get(
            "experience_years",
            advocate.experience_years
        ) or 0

        advocate.cases_won = request.data.get(
            "cases_won",
            advocate.cases_won
        ) or 0

        advocate.case_fees = request.data.get(
            "case_fees",
            advocate.case_fees
        )

        advocate.specialization = request.data.get(
            "specialization",
            advocate.specialization
        )

        advocate.save()

        return Response({
            "success": True,
            "message": "Profile updated successfully.",
            "advocate": {
                "id": advocate.id,
                "full_name": advocate.full_name,
                "email": advocate.email,
                "phone": advocate.phone,
                "bar_number": advocate.bar_number,
                "created_at": advocate.created_at,
                "experience_years": advocate.experience_years,
                "cases_won": advocate.cases_won,
                "case_fees": advocate.case_fees,
                "specialization": advocate.specialization,
            }
        })

    except Advocate.DoesNotExist:
        return Response({
            "success": False,
            "message": "Advocate not found"
        }, status=404)    



# ==========================================================
# AI LEGAL SEARCH
# ==========================================================
from .ai_search import legal_ai_search
class AISearchView(APIView):

    def post(self, request):

        query = request.data.get("query")

        if not query:

            return Response(
                {
                    "success": False,
                    "message": "Query is required"
                },
                status=400
            )

        answer = legal_ai_search(query)

        return Response({
            "success": True,
            "answer": answer
        })

# -------------------------------------------
# SearchClientCaseView
# ------------------------------------------
class SearchClientCaseView(APIView):

    def post(self, request):

        client_email = request.data.get("client_email")
        advocate_id = request.data.get("advocate_id")
        case_number = request.data.get("case_number")

        if not client_email or not advocate_id or not case_number:
            return Response(
                {
                    "success": False,
                    "message": "Missing required fields."
                },
                status=400
            )

        try:

            case = (
                Case.objects
                .select_related("client", "advocate", "analysis")
                .prefetch_related("documents", "updates")
                .get(
                    client__email=client_email,
                    advocate_id=advocate_id,
                    case_number=case_number
                )
            )

            case_data = CaseSerializer(case).data

            history = [
                f"Case Created : {case.created_at.strftime('%d-%m-%Y')}",
                f"Current Status : {case.status}",
            ]

            for update in case.updates.all():
                history.append(
                    f"{update.created_at.strftime('%d-%m-%Y')} : {update.note}"
                )

            return Response({
                "success": True,

                # Full case record (includes nested "analysis" with the AI
                # summary/case_story/dates/acts/sections/evidence/etc, plus
                # "documents" and "updates").
                "case": case_data,

                # Flat convenience fields kept for older/simpler UI code.
                "case_number": case.case_number,
                "case_title": case.case_title,
                "case_type": case.case_type,
                "court": case.court_name,
                "judge": case.judge_name,
                "opponent": case.opponent_name,
                "status": case.status,
                "next_hearing": case.hearing_date,
                "description": case.description,

                "history": history,
            })

        except Case.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Case not found."
                },
                status=404
            )


# ==========================================================
# PDF LIBRARY (advocate's own PDFs, not tied to any case)
# ==========================================================

class PdfLibraryView(APIView):

    # -------- list all pdfs for an advocate --------
    def get(self, request):

        advocate_id = request.query_params.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        documents = PdfLibraryDocument.objects.filter(
            advocate_id=advocate_id
        )

        return Response(
            {
                "success": True,
                "documents": PdfLibraryDocumentSerializer(
                    documents, many=True
                ).data,
            }
        )

    # -------- upload a new pdf --------
    def post(self, request):

        advocate_id = (
            request.data.get("advocate_id")
            or request.query_params.get("advocate_id")
        )

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        pdf = request.FILES.get("pdf")

        if not pdf:

            return Response(
                {
                    "success": False,
                    "message": "PDF file is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not pdf.name.lower().endswith(".pdf"):

            return Response(
                {
                    "success": False,
                    "message": "Only PDF files are allowed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            advocate = Advocate.objects.get(id=advocate_id)

        except Advocate.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Advocate not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        title = request.data.get("title") or pdf.name

        document = PdfLibraryDocument.objects.create(
            advocate=advocate,
            pdf=pdf,
            title=title,
        )

        return Response(
            {
                "success": True,
                "message": "PDF uploaded",
                "document": PdfLibraryDocumentSerializer(document).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ==========================================================
# DELETE A PDF LIBRARY DOCUMENT
# ==========================================================

class PdfLibraryDeleteView(APIView):

    def delete(self, request, pk):

        advocate_id = request.query_params.get("advocate_id")

        if not advocate_id:

            return Response(
                {
                    "success": False,
                    "message": "advocate_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            document = PdfLibraryDocument.objects.get(
                id=pk, advocate_id=advocate_id
            )

            document.delete()

            return Response(
                {
                    "success": True,
                    "message": "Document deleted"
                }
            )

        except PdfLibraryDocument.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Document not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )


# ==========================================================
# ADMIN LOGIN (hardcoded credentials, no DB user needed)
# ==========================================================
# NOTE: For a real deployment, move these into environment
# variables (backend/.env) instead of hardcoding them here.

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"


@api_view(["POST"])
def admin_login(request):

    username = request.data.get("username")
    password = request.data.get("password")

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:

        return Response(
            {
                "success": True,
                "message": "Login Successful",
                "admin": {
                    "username": ADMIN_USERNAME,
                },
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {
            "success": False,
            "message": "Invalid admin credentials",
        },
        status=status.HTTP_401_UNAUTHORIZED,
    )


# ==========================================================
# ADMIN — ADVOCATES (list all / delete)
# ==========================================================

class AdminAdvocateListView(APIView):

    def get(self, request):

        advocates = Advocate.objects.all().order_by("-created_at")

        serializer = AdvocateSerializer(advocates, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAdvocateDeleteView(APIView):

    def delete(self, request, pk):

        try:

            advocate = Advocate.objects.get(id=pk)
            advocate.delete()

            return Response(
                {
                    "success": True,
                    "message": "Advocate deleted successfully",
                },
                status=status.HTTP_200_OK,
            )

        except Advocate.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Advocate not found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==========================================================
# ADMIN — CLIENTS (list all / delete)
# ==========================================================

class AdminClientListView(APIView):

    def get(self, request):

        clients = Client.objects.all().order_by("-created_at")

        serializer = ClientSerializer(clients, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminClientDeleteView(APIView):

    def delete(self, request, pk):

        try:

            client = Client.objects.get(id=pk)
            client.delete()

            return Response(
                {
                    "success": True,
                    "message": "Client deleted successfully",
                },
                status=status.HTTP_200_OK,
            )

        except Client.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Client not found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==========================================================
# ADMIN — CASES (list all / delete)
# ==========================================================

class AdminCaseListView(APIView):

    def get(self, request):

        cases = (
            Case.objects
            .select_related("client", "advocate")
            .prefetch_related("documents")
            .order_by("-created_at")
        )

        serializer = CaseSerializer(cases, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminCaseDeleteView(APIView):

    def delete(self, request, pk):

        try:

            case = Case.objects.get(id=pk)

            for document in case.documents.all():
                if document.pdf:
                    document.pdf.delete(save=False)
                document.delete()

            if hasattr(case, "analysis"):
                case.analysis.delete()

            case.delete()

            return Response(
                {
                    "success": True,
                    "message": "Case deleted successfully",
                },
                status=status.HTTP_200_OK,
            )

        except Case.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Case not found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:

            traceback.print_exc()

            return Response(
                {
                    "success": False,
                    "message": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==========================================================
# ADMIN — DASHBOARD STATS
# ==========================================================

class AdminStatsView(APIView):

    def get(self, request):

        return Response(
            {
                "total_advocates": Advocate.objects.count(),
                "total_clients": Client.objects.count(),
                "total_cases": Case.objects.count(),
                "pending_cases": Case.objects.filter(status="Pending").count(),
            },
            status=status.HTTP_200_OK,
        )