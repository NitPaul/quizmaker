from django.urls import path

from .views import HealthView, TaskStatusView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("tasks/<str:task_id>/", TaskStatusView.as_view(), name="task-status"),
]
