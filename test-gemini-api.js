// Test Gemini API and Admin Prompts
const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function testGeminiAPI() {
    console.log('=== Testing Gemini 2.0 Flash API ===\n');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
            {
                method: 'POST',
                headers: {
                    'x-goog-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Say 'Hello, Gemini 2.0 Flash is working!' in Korean"
                        }]
                    }]
                })
            }
        );

        console.log('Status:', response.status);

        if (!response.ok) {
            const error = await response.text();
            console.error('\n❌ API Error:');
            console.error(error);
            return;
        }

        const data = await response.json();
        console.log('\n✅ SUCCESS!');
        console.log('Response:', data.candidates[0].content.parts[0].text);

    } catch (error) {
        console.error('\n❌ Network Error:', error.message);
    }
}

testGeminiAPI();
