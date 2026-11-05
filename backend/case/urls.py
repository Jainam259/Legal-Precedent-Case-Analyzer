from django.urls import path
from . import views
from .views import (
    UploadCaseView,
    CaseListView,
    CaseDetailView,
    DeleteCaseView,
     AISearchView,
)
from .views import (
    advocate_profile,
    update_advocate_profile,
    
)
from .views import SearchClientCaseView

from .views import CaseAnalyticsView

from .views import (
    AddCaseUpdateView,
    EditCaseView,
    AddCaseDocumentView,
)

from .views import (
    PdfLibraryView,
    PdfLibraryDeleteView,
)

from .views import (
    admin_login,
    AdminAdvocateListView,
    AdminAdvocateDeleteView,
    AdminClientListView,
    AdminClientDeleteView,
    AdminCaseListView,
    AdminCaseDeleteView,
    AdminStatsView,
)

urlpatterns = [

    path("advocate/register/", views.register),

    path("advocate/login/", views.login),

    path("client/register/", views.client_register),
    
    path("client/login/", views.client_login),
    
    path( "client/advocates/",  views.get_advocates, name="client-advocates"),
    
    path("cases/", UploadCaseView.as_view()),

    path("cases/all/", CaseListView.as_view()),

    path("cases/<int:pk>/", CaseDetailView.as_view()),

    path("cases/delete/<int:pk>/", DeleteCaseView.as_view()),

    path("advocate/profile/<int:id>/", advocate_profile),
    
    path("advocate/profile/update/<int:id>/", update_advocate_profile),

    path("ai-search/", AISearchView.as_view()),

    path("client/search-case/", SearchClientCaseView.as_view(),),

     path("cases/analytics/", CaseAnalyticsView.as_view(), name="case-analytics"),

    path("cases/<int:pk>/updates/", AddCaseUpdateView.as_view()),

    path("cases/<int:pk>/edit/", EditCaseView.as_view()),

    path("cases/<int:pk>/documents/add/", AddCaseDocumentView.as_view()),

    path("pdf-library/", PdfLibraryView.as_view()),

    path("pdf-library/<int:pk>/delete/", PdfLibraryDeleteView.as_view()),

    # ------------------------------------------------------
    # Admin panel
    # ------------------------------------------------------

    path("admin/login/", admin_login),

    path("admin/stats/", AdminStatsView.as_view()),

    path("admin/advocates/", AdminAdvocateListView.as_view()),
    path("admin/advocates/<int:pk>/delete/", AdminAdvocateDeleteView.as_view()),

    path("admin/clients/", AdminClientListView.as_view()),
    path("admin/clients/<int:pk>/delete/", AdminClientDeleteView.as_view()),

    path("admin/cases/", AdminCaseListView.as_view()),
    path("admin/cases/<int:pk>/delete/", AdminCaseDeleteView.as_view()),

]