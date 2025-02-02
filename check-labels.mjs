import pg from 'pg';

const dbConfig = {
    host: 'production.co8f8q1zjvhi.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'conversate_production',
    user: 'conversate_admin',
    password: 'iIDoE5nVtQTndysj'
};

async function checkLabels() {
    const client = new pg.Client(dbConfig);
    
    try {
        await client.connect();
        console.log('Connected to database');

        // Check existing labels for account
        const accountId = 387;
        const checkLabelsQuery = `
            SELECT l.id, l.title, l.color, l.show_on_sidebar, t.id as tag_id, t.name as tag_name
            FROM public.labels l
            LEFT JOIN public.tags t ON t.name = l.title
            WHERE l.account_id = $1
            ORDER BY l.id
        `;
        
        console.log('Checking labels for account:', accountId);
        const result = await client.query(checkLabelsQuery, [accountId]);
        
        console.log('Found labels:', result.rows);
        console.log('Total labels:', result.rows.length);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
        console.log('Disconnected from database');
    }
}

// Run check
console.log('Checking existing labels...');
checkLabels();