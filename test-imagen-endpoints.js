// Test different Imagen endpoints
const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function testImagenEndpoints() {
    const endpoints = [
        {
            name: 'Imagen 3 - predict',
            url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict'
        },
        {
            name: 'Imagen 3 - generateImages',
            url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages'
        },
        {
            name: 'List Models',
            url: 'https://generativelanguage.googleapis.com/v1beta/models'
        }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n=== Testing: ${endpoint.name} ===`);

        try {
            const response = await fetch(endpoint.url, {
                method: endpoint.name === 'List Models' ? 'GET' : 'POST',
                headers: {
                    'x-goog-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: endpoint.name !== 'List Models' ? JSON.stringify({
                    instances: [{ prompt: "A red circle" }],
                    parameters: { sampleCount: 1 }
                }) : undefined
            });

            console.log('Status:', response.status);
            const data = await response.json();

            if (endpoint.name === 'List Models') {
                console.log('Available models:', data.models?.map(m => m.name).filter(n => n.includes('imagen')));
            } else {
                console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

testImagenEndpoints();
