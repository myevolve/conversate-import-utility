import pg from 'pg';

const dbConfig = {
    host: 'production.co8f8q1zjvhi.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'conversate_production',
    user: 'conversate_admin',
    password: 'iIDoE5nVtQTndysj'
};

async function checkSchema() {
    const client = new pg.Client(dbConfig);
    
    try {
        await client.connect();
        console.log('Connected to database');

        // Check schema for labels table
        console.log('\nChecking labels table schema:');
        const labelsSchema = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'labels'
            ORDER BY ordinal_position;
        `);
        console.log('Labels columns:', labelsSchema.rows);

        // Check schema for tags table
        console.log('\nChecking tags table schema:');
        const tagsSchema = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'tags'
            ORDER BY ordinal_position;
        `);
        console.log('Tags columns:', tagsSchema.rows);

        // Check schema for taggings table
        console.log('\nChecking taggings table schema:');
        const taggingsSchema = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'taggings'
            ORDER BY ordinal_position;
        `);
        console.log('Taggings columns:', taggingsSchema.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
        console.log('Disconnected from database');
    }
}

// Run check
console.log('Checking table schemas...');
checkSchema();