// Test Google Imagen API
const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function testImagenAPI() {
    console.log('Testing Google Imagen API...');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`,
            {
                method: 'POST',
                headers: {
                    'x-goog-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instances: [
                        {
                            prompt: "A simple red circle"
                        }
                    ],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1",
                        personGeneration: "allow_adult"
                    }
                })
            }
        );

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('API Error:', data);
        } else {
            console.log('Success! Image generated.');
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testImagenAPI();
