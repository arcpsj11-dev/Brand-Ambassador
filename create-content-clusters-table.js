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

console.log('Creating content_clusters table...\n');
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSchema() {
    try {
        // Read SQL file
        const sqlPath = path.resolve(__dirname, 'database', 'content_clusters_schema.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL schema...');
        
        // Note: Supabase client doesn't support raw SQL execution directly
        // You'll need to run this SQL in Supabase Dashboard's SQL Editor
        // This script will test if the table exists instead
        
        const { data, error } = await supabase
            .from('content_clusters')
            .select('*')
            .limit(1);

        if (error) {
            console.log('❌ Table does not exist yet.');
            console.log('\n📋 Please run the following SQL in Supabase Dashboard > SQL Editor:');
            console.log('\n' + sqlContent);
            console.log('\nOr copy the SQL from: database/content_clusters_schema.sql');
        } else {
            console.log('✅ Table content_clusters already exists and is accessible!');
            console.log(`   Current row count: ${data?.length || 0}`);
        }

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

createSchema();
