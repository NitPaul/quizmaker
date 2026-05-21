from celery.result import AsyncResult
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Health check",
        description=(
            "Returns 200 OK with service status. "
            "Used by uptime monitors to keep the Render free tier warm."
        ),
        responses={
            200: inline_serializer(
                name="HealthResponse",
                fields={
                    "status": serializers.CharField(),
                    "version": serializers.CharField(),
                },
            )
        },
    )
    def get(self, request):
        return Response({"status": "ok", "version": "0.1.0"})


class TaskStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Poll Celery task status",
        description=(
            "Returns the task's current state. When status is SUCCESS, `result` "
            "contains the task return value (e.g. `{\"quiz_id\": 5}`). When FAILURE, "
            "`error` contains the exception message."
        ),
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="TaskStatusResponse",
                    fields={
                        "task_id": serializers.CharField(),
                        "status": serializers.CharField(),
                        "ready": serializers.BooleanField(),
                        "result": serializers.JSONField(allow_null=True),
                        "error": serializers.CharField(allow_null=True),
                    },
                )
            )
        },
    )
    def get(self, request, task_id):
        result = AsyncResult(task_id)
        body = {
            "task_id": task_id,
            "status": result.status,
            "ready": result.ready(),
            "result": None,
            "error": None,
        }
        if result.successful():
            body["result"] = result.result
        elif result.failed():
            err = result.result
            body["error"] = str(err) if err else "Task failed"
        return Response(body)
