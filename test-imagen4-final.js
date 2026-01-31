// Test Google Imagen 4 with current API key
const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function testImagen4() {
    console.log('Testing Google Imagen 4 API...\n');

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
                    instances: [{ prompt: "A simple red circle" }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1",
                        personGeneration: "allow_adult"
                    }
                })
            }
        );

        console.log('Status:', response.status);
        const data = await response.json();

        if (!response.ok) {
            console.error('\n❌ ERROR:');
            console.error(JSON.stringify(data, null, 2));

            // Check if it's a permission issue
            if (response.status === 403) {
                console.log('\n💡 SOLUTION: This API key does not have Imagen access.');
                console.log('You need to:');
                console.log('1. Enable Imagen API in Google Cloud Console');
                console.log('2. Or use a different API key with Imagen permissions');
            }
        } else {
            console.log('\n✅ SUCCESS!');
            console.log('Response structure:', Object.keys(data));
            if (data.predictions && data.predictions[0]) {
                console.log('Image data available:', !!data.predictions[0].bytesBase64Encoded);
            }
        }
    } catch (error) {
        console.error('\n❌ NETWORK ERROR:', error.message);
    }
}

testImagen4();
