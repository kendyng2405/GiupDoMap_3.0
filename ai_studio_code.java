package com.example;

import com.google.common.collect.ImmutableList;
import com.google.genai.Client;
import com.google.genai.interactions.models.interactions.CreateModelInteractionParams;
import com.google.genai.interactions.models.interactions.Content;
import com.google.genai.interactions.models.interactions.Input;
import com.google.genai.interactions.models.interactions.Interaction;
import com.google.genai.interactions.models.interactions.Step;
import com.google.genai.interactions.models.interactions.TextContent;
import com.google.genai.interactions.models.interactions.ImageContent;
import com.google.genai.interactions.models.interactions.AudioContent;
import com.google.genai.interactions.models.interactions.Tool;
import com.google.genai.interactions.models.interactions.Function;
import com.google.genai.interactions.models.interactions.GenerationConfig;
import com.google.genai.interactions.models.interactions.GoogleSearch;
import com.google.genai.interactions.core.JsonValue;
import com.google.genai.JsonSerializable;

public class  {
    public static void main(String[] args) {
        String apiKey = System.getenv("GEMINI_API_KEY");
        Client client = Client.builder().apiKey(apiKey).build();

        CreateModelInteractionParams.Builder paramsBuilder =
            CreateModelInteractionParams.builder()
                .model("models/gemini-3-flash-preview");

        paramsBuilder = paramsBuilder.input("");
        paramsBuilder = paramsBuilder.systemInstruction("Bạn là một trợ lý kiểm duyệt nội dung cho dự án Trái Tim Việt. Hãy đọc đoạn mô tả sau, đánh giá xem có chứa nội dung phản cảm không, và tóm tắt lại thành 3 gạch đầu dòng...");
        paramsBuilder = paramsBuilder.generationConfig(GenerationConfig.builder()
            .temperature(1f)
            .maxOutputTokens(65536)
            .topP(0.95f)
            .build());
        CreateModelInteractionParams params = paramsBuilder.build();

        Interaction interaction = client.interactions.create(params);

        for (Step step : interaction.steps()) {
            if (step.isModelOutput()) {
                step.asModelOutput().content().ifPresent(contents -> {
                    for (Content output : contents) {
                        output.text().ifPresent(text -> System.out.println(text.text()));
                    }
                });
            }
        }
    }
}


