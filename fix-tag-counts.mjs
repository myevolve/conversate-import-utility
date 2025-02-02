import pg from 'pg';

const dbConfig = {
    host: 'production.co8f8q1zjvhi.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'conversate_production',
    user: 'conversate_admin',
    password: 'iIDoE5nVtQTndysj'
};

async function fixTagCounts() {
    const client = new pg.Client(dbConfig);
    
    try {
        await client.connect();
        console.log('Connected to database');

        // First, let's get all tags and their current counts
        const getTagsQuery = `
            SELECT id, name, taggings_count as current_count
            FROM public.tags
            ORDER BY id
        `;
        const tagsResult = await client.query(getTagsQuery);
        console.log(`Found ${tagsResult.rows.length} tags`);

        // For each tag, count its actual taggings
        for (const tag of tagsResult.rows) {
            const countTaggingsQuery = `
                SELECT COUNT(*) as actual_count
                FROM public.taggings
                WHERE tag_id = $1
            `;
            const countResult = await client.query(countTaggingsQuery, [tag.id]);
            const actualCount = parseInt(countResult.rows[0].actual_count);

            console.log(`\nTag "${tag.name}" (ID: ${tag.id}):`, {
                currentCount: tag.current_count,
                actualCount
            });

            // Update if counts don't match
            if (tag.current_count !== actualCount) {
                const updateQuery = `
                    UPDATE public.tags
                    SET taggings_count = $1
                    WHERE id = $2
                `;
                await client.query(updateQuery, [actualCount, tag.id]);
                console.log(`Updated tag count from ${tag.current_count} to ${actualCount}`);
            } else {
                console.log('Count is correct');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
        console.log('\nDisconnected from database');
    }
}

// Run fix
console.log('Starting tag count fix...');
fixTagCounts();