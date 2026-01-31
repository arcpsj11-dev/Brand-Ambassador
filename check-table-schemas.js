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

console.log('Checking existing table schemas...\n');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        // Check users table structure
        console.log('1. Checking users table...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (usersError) {
            console.error('❌ Users table error:', usersError);
        } else if (users && users.length > 0) {
            console.log('✅ Users table columns:', Object.keys(users[0]));
            console.log('   Sample user ID:', users[0].id, '(type:', typeof users[0].id, ')');
        }

        // Check blog_slots table structure
        console.log('\n2. Checking blog_slots table...');
        const { data: slots, error: slotsError } = await supabase
            .from('blog_slots')
            .select('*')
            .limit(1);

        if (slotsError) {
            console.error('❌ Blog_slots table error:', slotsError);
        } else if (slots && slots.length > 0) {
            console.log('✅ Blog_slots table columns:', Object.keys(slots[0]));
            console.log('   Sample slot ID:', slots[0].id, '(type:', typeof slots[0].id, ')');
        } else {
            console.log('⚠️  Blog_slots table exists but is empty');
            // Try to describe the table structure using information_schema
            console.log('   Attempting to get schema from information_schema...');
        }

        // Check blog_contents table for reference
        console.log('\n3. Checking blog_contents table (for reference)...');
        const { data: contents, error: contentsError } = await supabase
            .from('blog_contents')
            .select('*')
            .limit(1);

        if (contentsError) {
            console.error('❌ Blog_contents table error:', contentsError);
        } else if (contents && contents.length > 0) {
            console.log('✅ Blog_contents table columns:', Object.keys(contents[0]));
        } else {
            console.log('⚠️  Blog_contents table exists but is empty');
        }

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

checkSchema();
