from rest_framework import serializers


class GenerateQuizSerializer(serializers.Serializer):
    text = serializers.CharField(min_length=50, max_length=50_000)
    num_questions = serializers.IntegerField(min_value=1, max_value=50)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    provider = serializers.ChoiceField(choices=["groq", "gemini"], required=False)
    api_key = serializers.CharField(required=False, allow_blank=True, max_length=500)


class GenerateFromDocumentSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()
    topic = serializers.CharField(max_length=300)
    num_questions = serializers.IntegerField(min_value=1, max_value=50)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    provider = serializers.ChoiceField(choices=["groq", "gemini"], required=False)
    api_key = serializers.CharField(required=False, allow_blank=True, max_length=500)
