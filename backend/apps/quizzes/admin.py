from django.contrib import admin

from .models import Attempt, AttemptAnswer, Question, Quiz


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ("position", "text", "correct_answer", "options")


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "source", "created_at")
    list_filter = ("source",)
    search_fields = ("title", "user__email")
    inlines = [QuestionInline]


class AttemptAnswerInline(admin.TabularInline):
    model = AttemptAnswer
    extra = 0
    readonly_fields = ("question", "user_answer", "is_correct")
    can_delete = False


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "quiz", "mode", "score", "total", "finished_at")
    list_filter = ("mode",)
    search_fields = ("user__email", "quiz__title")
    readonly_fields = ("user", "quiz", "mode", "score", "total", "duration_seconds", "finished_at")
    inlines = [AttemptAnswerInline]
