import pg from 'pg';

const dbConfig = {
    host: 'production.co8f8q1zjvhi.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'conversate_production',
    user: 'conversate_admin',
    password: 'iIDoE5nVtQTndysj'
};

async function checkContactsSchema() {
    const client = new pg.Client(dbConfig);
    
    try {
        await client.connect();
        console.log('Connected to database');

        // Check schema for contacts table
        console.log('\nChecking contacts table schema:');
        const contactsSchema = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'contacts'
            ORDER BY ordinal_position;
        `);
        console.log('Contacts columns:', contactsSchema.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
        console.log('\nDisconnected from database');
    }
}

// Run check
console.log('Checking contacts schema...');
checkContactsSchema();