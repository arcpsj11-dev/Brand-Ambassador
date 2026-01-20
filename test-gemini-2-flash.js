// Test Gemini 2.0 Flash (correct model name)
const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function testGemini2Flash() {
    console.log('=== Testing Gemini 2.0 Flash ===\n');

    const modelNames = [
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest'
    ];

    for (const modelName of modelNames) {
        console.log(`\nTrying: ${modelName}`);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
                {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': API_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: "Say 'Working!' in Korean"
                            }]
                        }]
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${modelName} WORKS!`);
                console.log('Response:', data.candidates[0].content.parts[0].text.substring(0, 50));
                break;
            } else {
                console.log(`❌ ${modelName} - Status: ${response.status}`);
            }

        } catch (error) {
            console.log(`❌ ${modelName} - Error: ${error.message}`);
        }
    }
}

testGemini2Flash();
