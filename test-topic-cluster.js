// Test Topic Cluster Generation
const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function testTopicCluster() {
    console.log('=== Testing Topic Cluster Generation ===\n');

    const testKeyword = '교통사고 후유증';

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent`,
            {
                method: 'POST',
                headers: {
                    'x-goog-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `주제: ${testKeyword}\n\n30일치 블로그 주제를 생성해주세요. JSON 형식으로 응답해주세요.`
                        }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
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
        console.log('Response structure:', Object.keys(data));

        if (data.candidates && data.candidates[0]) {
            const content = data.candidates[0].content.parts[0].text;
            console.log('\nGenerated content preview:', content.substring(0, 200) + '...');
        }

    } catch (error) {
        console.error('\n❌ Network Error:', error.message);
    }
}

testTopicCluster();
