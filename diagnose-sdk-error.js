import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function diagnoseError() {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Test with the base model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        console.log("Attempting to generate content with gemini-2.0-flash...");
        const result = await model.generateContent("Hello");
        console.log("Result:", result.response.text());
    } catch (error) {
        console.log("=== Error Detected ===");
        console.log("Message:", error.message);
    }
}

diagnoseError();
