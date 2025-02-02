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

        // Get all information in one query
        const query = `
            SELECT 
                l.id as label_id,
                l.title as label_title,
                l.account_id,
                l.color,
                l.show_on_sidebar,
                l.created_at as label_created_at,
                t.id as tag_id,
                t.name as tag_name,
                t.taggings_count,
                tg.id as tagging_id,
                tg.taggable_id as contact_id,
                tg.created_at as tagging_created_at
            FROM public.labels l
            JOIN public.tags t ON t.name = l.title
            JOIN public.taggings tg ON tg.tag_id = t.id
            WHERE l.title = ANY($1)
            AND tg.taggable_type = 'Contact'
            AND tg.taggable_id = $2
            ORDER BY l.title
        `;

        const result = await client.query(query, [labelTitles, contactId]);
        
        console.log('Full verification results:');
        result.rows.forEach(row => {
            console.log('\nLabel:', row.label_title);
            console.log('Label details:', {
                id: row.label_id,
                accountId: row.account_id,
                color: row.color,
                showOnSidebar: row.show_on_sidebar,
                createdAt: row.label_created_at
            });
            console.log('Tag details:', {
                id: row.tag_id,
                name: row.tag_name,
                taggingsCount: row.taggings_count
            });
            console.log('Tagging details:', {
                id: row.tagging_id,
                contactId: row.contact_id,
                createdAt: row.tagging_created_at
            });
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
        console.log('\nDisconnected from database');
    }
}

// Run verification
console.log('Verifying final label state...');
verifyLabels();