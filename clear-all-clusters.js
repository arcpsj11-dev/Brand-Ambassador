import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env parser
const envPath = path.resolve(__dirname, '.env');
let envConfig = {};

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && !key.startsWith('#')) {
                envConfig[key] = value;
            }
        }
    });
} catch (e) {
    console.error('Failed to read .env file');
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllClusters() {
    console.log('🧹 Starting Full Purge of content_clusters table...');

    try {
        // DELETE ALL ROWS
        const { error, count } = await supabase
            .from('content_clusters')
            .delete()
            .neq('id', 0); // Delete all rows where ID is not 0 (which is all rows)

        if (error) {
            console.error('❌ Purge Failed:', error);
        } else {
            console.log('✅ Successfully deleted all topic data.');
        }

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

clearAllClusters();
