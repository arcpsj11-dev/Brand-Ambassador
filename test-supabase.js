
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

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('\n1. Testing "users" table access...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (userError) {
            console.error('❌ Users Error:', userError.message, userError.hint || '');
            console.error('Details:', userError);
        } else {
            console.log('✅ Users Table Accessible.');
        }

        console.log('\n2. Testing "blog_slots" table access...');
        const { data: slots, error: slotError } = await supabase
            .from('blog_slots')
            .select('count', { count: 'exact', head: true });

        if (slotError) {
            console.error('❌ Blog_slots Error:', slotError.message, slotError.hint || '');
            console.error('Details:', slotError);
        } else {
            console.log('✅ Blog_slots Table Accessible.');
        }

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testConnection();
