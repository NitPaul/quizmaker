from rest_framework import serializers

from .models import Attempt, AttemptAnswer, Question, Quiz


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "position", "text", "correct_answer", "options")


class QuestionInputSerializer(serializers.Serializer):
    text = serializers.CharField()
    correct_answer = serializers.CharField(max_length=500)
    options = serializers.ListField(
        child=serializers.CharField(max_length=500),
        min_length=2,
        max_length=10,
    )


class QuizListSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "title", "source", "randomness", "question_count", "created_at")


class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "title", "source", "randomness", "questions", "created_at")


class QuizCreateSerializer(serializers.ModelSerializer):
    questions = QuestionInputSerializer(many=True, write_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "title", "source", "randomness", "questions")
        read_only_fields = ("id",)

    def validate_questions(self, value):
        if not value:
            raise serializers.ValidationError("At least one question is required.")
        if len(value) > 200:
            raise serializers.ValidationError("Quiz cannot exceed 200 questions.")
        for i, q in enumerate(value, start=1):
            if q["correct_answer"] not in q["options"]:
                raise serializers.ValidationError(
                    f"Question {i}: correct_answer must be one of the options."
                )
        return value

    def create(self, validated_data):
        questions_data = validated_data.pop("questions")
        user = self.context["request"].user
        quiz = Quiz.objects.create(user=user, **validated_data)
        Question.objects.bulk_create(
            [
                Question(
                    quiz=quiz,
                    position=i,
                    text=q["text"],
                    correct_answer=q["correct_answer"],
                    options=q["options"],
                )
                for i, q in enumerate(questions_data)
            ]
        )
        return quiz

    def to_representation(self, instance):
        return QuizDetailSerializer(instance, context=self.context).data


class AttemptAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    user_answer = serializers.CharField(allow_blank=True, max_length=500)


class AttemptAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptAnswer
        fields = ("question", "user_answer", "is_correct")


class AttemptSerializer(serializers.ModelSerializer):
    percentage = serializers.FloatField(read_only=True)
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    answers = AttemptAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Attempt
        fields = (
            "id",
            "quiz",
            "quiz_title",
            "mode",
            "score",
            "total",
            "percentage",
            "duration_seconds",
            "finished_at",
            "answers",
        )
        read_only_fields = fields


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user_id = serializers.IntegerField()
    user_email = serializers.EmailField()
    user_display_name = serializers.CharField()
    score = serializers.IntegerField()
    total = serializers.IntegerField()
    percentage = serializers.FloatField()
    duration_seconds = serializers.IntegerField()
    finished_at = serializers.DateTimeField()
    is_you = serializers.BooleanField()


class LeaderboardSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    quiz_title = serializers.CharField()
    top = LeaderboardEntrySerializer(many=True)
    you = LeaderboardEntrySerializer(allow_null=True)


class AttemptCreateSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=Attempt.Mode.choices)
    duration_seconds = serializers.IntegerField(min_value=0, default=0)
    answers = AttemptAnswerInputSerializer(many=True)
