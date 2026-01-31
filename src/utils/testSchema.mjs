import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

let apiKey = process.env.VITE_GEMINI_API_KEY;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && key.trim() === 'VITE_GEMINI_API_KEY') {
            apiKey = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

if (!apiKey) {
    console.error("Error: VITE_GEMINI_API_KEY not found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const TOPIC_CLUSTER_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        clusters: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.STRING },
                    category: { type: SchemaType.STRING },
                    topics: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                day: { type: SchemaType.NUMBER },
                                type: { type: SchemaType.STRING },
                                title: { type: SchemaType.STRING },
                            },
                            required: ["day", "type", "title"]
                        }
                    }
                },
                required: ["id", "category", "topics"]
            }
        }
    },
    required: ["clusters"]
};

async function testSchema() {
    console.log("Testing gemini-2.0-flash-exp with Admin Store Prompt Simulation...");

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: TOPIC_CLUSTER_SCHEMA
            }
        });

        const topic = "Traffic Accident (교통사고)";
        // Exact copy of the prompt now stored in useAdminStore.ts
        const finalPrompt = `Generate 30 blog titles for medical clustering strategy based on "${topic}".
    
[Structure Rules]
- You MUST generate exactly 3 distinct clusters.
- Each cluster MUST contain 1 Pillar Post + 9 Supporting Posts.
- Total: 30 Topics (3 Clusters x 10 Topics).

[Category Naming Rules]
- The 'category' field must be a specific sub-theme of '${topic}'.
- EXTREMELY IMPORTANT: DO NOT use generic names like "Major Symptoms 1", "Cluster A", "Part 1", or "General Info".
- Example Categories for 'Traffic Accident': "Musculoskeletal Pain", "Psychological Trauma", "Rehabilitation Process".

[Title Formula]
- Formula: "[증상/상황] + 왜/어떻게/무엇을 + 설명/정리/이해/관점"
- Tone: Professional yet catchy (MZ style).

Result MUST be JSON with "clusters" array.
JSON Format: { "clusters": [ { "id": "1", "category": "...", "topics": [ { "day": 1, "type": "pillar", "title": "..." } ] } ] }
[STRICT CONSTRAINT]: OUTPUT ONLY PURE JSON. NO MARKDOWN. NO CONVERSATIONAL TEXT. START WITH "{".`;

        // console.log("Final Prompt:", finalPrompt);

        const result = await model.generateContent(finalPrompt);

        console.log("Response Received.");

        const json = JSON.parse(result.response.text());
        if (json.clusters && Array.isArray(json.clusters)) {
            const clusterCount = json.clusters.length;
            let totalTopics = 0;
            json.clusters.forEach(c => totalTopics += c.topics.length);

            console.log(`\nValidating Structure:`);
            console.log(`- Clusters: ${clusterCount} (Expected: 3)`);
            console.log(`- Total Topics: ${totalTopics} (Expected: 30)`);

            if (clusterCount === 3 && totalTopics === 30) {
                console.log("\n✅ SUCCESS: Rigid 30-day structure verified via Admin Prompt!");

                console.log("\n[Category Validation]");
                let hasGenericNames = false;
                json.clusters.forEach(c => {
                    console.log(`  - Category: "${c.category}"`);
                    if (/Cluster \d+|Symptom \d+|Part \d+|Major Symptoms \d+/i.test(c.category)) {
                        hasGenericNames = true;
                    }
                });

                if (hasGenericNames) {
                    console.warn("\n⚠️ WARNING: Generic category names detected!");
                } else {

                }

            } else {
                console.warn("\n⚠️ WARNING: Structure mismatch.");
                json.clusters.forEach(c => { });
            }
        } else {
            console.error("\n❌ FAILURE: JSON structure mismatch.");
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error);
    }
}

testSchema();
