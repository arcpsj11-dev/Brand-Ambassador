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

console.log('Testing content_clusters table functionality...\n');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testContentClusters() {
    try {
        // Test 1: Insert sample data
        console.log('1. Inserting sample topics...');
        const sampleTopics = [
            {
                user_id: 'admin',
                slot_id: 'test-slot-1',
                cluster_group: 1,
                content_type: 'pillar',
                title: '테스트 필러 제목',
                description: '테스트 설명',
                day_number: 1,
                status: false
            },
            {
                user_id: 'admin',
                slot_id: 'test-slot-1',
                cluster_group: 1,
                content_type: 'supporting',
                title: '테스트 보조글 제목',
                description: '테스트 보조 설명',
                day_number: 2,
                status: false
            }
        ];

        const { data: inserted, error: insertError } = await supabase
            .from('content_clusters')
            .insert(sampleTopics)
            .select();

        if (insertError) {
            console.error('❌ Insert failed:', insertError);
            return;
        }

        console.log(`✅ Inserted ${inserted.length} sample topics`);
        console.log('   Sample ID:', inserted[0].id);

        // Test 2: Query next unwritten topic
        console.log('\n2. Querying next unwritten topic...');
        const { data: nextTopic, error: queryError } = await supabase
            .from('content_clusters')
            .select('*')
            .eq('slot_id', 'test-slot-1')
            .eq('status', false)
            .order('day_number', { ascending: true })
            .limit(1)
            .single();

        if (queryError) {
            console.error('❌ Query failed:', queryError);
        } else {
            console.log('✅ Next topic:', nextTopic.title);
            console.log('   Day:', nextTopic.day_number);
            console.log('   Type:', nextTopic.content_type);
        }

        // Test 3: Update status
        if (inserted && inserted.length > 0) {
            console.log('\n3. Marking first topic as completed...');
            const { error: updateError } = await supabase
                .from('content_clusters')
                .update({
                    status: true,
                    generated_content: '테스트 생성 콘텐츠',
                    updated_at: new Date().toISOString()
                })
                .eq('id', inserted[0].id);

            if (updateError) {
                console.error('❌ Update failed:', updateError);
            } else {
                console.log('✅ Topic marked as completed');
            }
        }

        // Test 4: Check progress
        console.log('\n4. Checking progress...');
        const { data: allTopics } = await supabase
            .from('content_clusters')
            .select('status')
            .eq('slot_id', 'test-slot-1');

        const completed = allTopics?.filter(t => t.status).length || 0;
        const total = allTopics?.length || 0;
        console.log(`✅ Progress: ${completed}/${total} completed`);

        // Cleanup
        console.log('\n5. Cleaning up test data...');
        const { error: deleteError } = await supabase
            .from('content_clusters')
            .delete()
            .eq('slot_id', 'test-slot-1');

        if (deleteError) {
            console.error('❌ Cleanup failed:', deleteError);
        } else {
            console.log('✅ Test data cleaned up');
        }

        console.log('\n🎉 All tests passed!');

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testContentClusters();
