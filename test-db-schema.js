
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

console.log('Testing DB Write/Read...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
    try {
        console.log('\n1. Fetching first user to check ID format...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (userError) {
            console.error('❌ Users Fetch Error:', userError);
        } else {
            console.log('✅ Users fetched:', users);
            if (users.length > 0) {
                console.log('   Sample ID type:', typeof users[0].id, 'Value:', users[0].id);
            }
        }

        console.log('\n2. Attempting to READ blog_slots...');
        const { data: slots, error: slotError } = await supabase
            .from('blog_slots')
            .select('*')
            .limit(1);

        if (slotError) {
            console.error('❌ Blog_slots Read Error:', slotError);
        } else {
            console.log('✅ Blog_slots accessible.');
        }

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testSchema();
