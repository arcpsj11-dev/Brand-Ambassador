// List available Gemini models
const API_KEY = 'AIzaSyC8FhBiGOjVX1Is9nYnyzwWdC4Q2LTYpwA';

async function listModels() {
    console.log('=== Listing Available Gemini Models ===\n');
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models`,
            {
                method: 'GET',
                headers: {
                    'x-goog-api-key': API_KEY,
                },
            }
        );

        const data = await response.json();
        
        console.log('Available Gemini models:\n');
        data.models
            .filter(m => m.name.includes('gemini'))
            .forEach(model => {
                console.log(`- ${model.name}`);
                console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
                console.log('');
            });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
