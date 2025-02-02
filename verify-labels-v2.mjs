import pg from 'pg';

const dbConfig = {
    host: 'production.co8f8q1zjvhi.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'conversate_production',
    user: 'conversate_admin',
    password: 'iIDoE5nVtQTndysj'
};

async function verifyLabels() {
    const client = new pg.Client(dbConfig);
    
    try {
        await client.connect();
        console.log('Connected to database');

        const contactId = 310893;
        const labelTitles = ['test-db-1', 'test-db-2'];

        for (const labelTitle of labelTitles) {
            console.log(`\nChecking label: ${labelTitle}`);
            
            // Get all label information
            const query = `
                SELECT 
                    l.id as label_id,
                    l.title as label_title,
                    l.account_id,
                    t.id as tag_id,
                    t.name as tag_name,
                    t.taggings_count,
                    tg.id as tagging_id,
                    tg.taggable_id as contact_id,
                    tg.created_at as tagging_created_at
                FROM public.labels l
                LEFT JOIN public.tags t ON t.name = l.title
                LEFT JOIN public.taggings tg ON tg.tag_id = t.id
                WHERE l.title = $1
                AND tg.taggable_type = 'Contact'
                AND tg.taggable_id = $2
            `;

            const result = await client.query(query, [labelTitle, contactId]);
            console.log('Label verification result:', result.rows);

            // Also get the raw tag count
            const tagQuery = `
                SELECT id, name, taggings_count
                FROM public.tags
                WHERE name = $1
            `;
            const tagResult = await client.query(tagQuery, [labelTitle]);
            console.log('Tag details:', tagResult.rows);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
        console.log('Disconnected from database');
    }
}

// Run verification
console.log('Verifying label associations...');
verifyLabels();