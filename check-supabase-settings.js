import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdheewwtebldkhtsarzi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaGVld3d0ZWJsZGtodHNhcnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMzg0MjQsImV4cCI6MjA1MzcxNDQyNH0.9_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8'; // The one from .env

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    console.log("Checking admin_settings table...");
    const { data, error } = await supabase
        .from('admin_settings')
        .select('*');

    if (error) {
        console.error("Error fetching admin_settings:", error);
    } else {
        console.log("Success! Data count:", data.length);
        data.forEach(item => {
            if (item.key === 'geminiApiKey') {
                console.log(`geminiApiKey: ${item.value.substring(0, 4)}...${item.value.substring(item.value.length - 4)}`);
            } else {
                console.log(`Key: ${item.key}`);
            }
        });
    }
}

checkTable();
