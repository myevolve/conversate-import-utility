import { NextResponse } from "next/server";
import { Pool } from "pg";

const dbConfig = {
  host: "production.co8f8q1zjvhi.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: "conversate_production",
  user: "conversate_admin",
  password: "iIDoE5nVtQTndysj",
};

export async function POST(request: Request) {
  const { accountId, contactId, labels } = await request.json();

  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    // Process each label
    for (const labelTitle of labels) {
      // Check if label exists
      const checkLabelQuery = `
                SELECT l.id, t.id as tag_id
                FROM public.labels l
                LEFT JOIN public.tags t ON t.name = l.title
                WHERE l.title = $1 AND l.account_id = $2
            `;
      const labelResult = await client.query(checkLabelQuery, [
        labelTitle,
        accountId,
      ]);

      let tagId: number;

      if (labelResult.rows.length > 0) {
        // Label exists
        tagId = parseInt(labelResult.rows[0].tag_id);
      } else {
        // Create new label and tag
        await client.query("BEGIN");

        try {
          // Get next label ID
          const lastLabelResult = await client.query(
            "SELECT id FROM public.labels ORDER BY id DESC LIMIT 1",
          );
          const nextLabelId = (parseInt(lastLabelResult.rows[0]?.id) || 0) + 1;

          // Create label
          const now = new Date().toISOString();
          const insertLabelQuery = `
                        INSERT INTO public.labels (
                            id, title, color, show_on_sidebar, account_id, 
                            created_at, updated_at
                        )
                        VALUES ($1, $2, '#1f93ff', true, $3, $4, $4)
                        RETURNING id
                    `;
          await client.query(insertLabelQuery, [
            nextLabelId,
            labelTitle,
            accountId,
            now,
          ]);

          // Get next tag ID
          const lastTagResult = await client.query(
            "SELECT id FROM public.tags ORDER BY id DESC LIMIT 1",
          );
          const nextTagId = (parseInt(lastTagResult.rows[0]?.id) || 0) + 1;

          // Create tag
          const insertTagQuery = `
                        INSERT INTO public.tags (id, name, taggings_count)
                        VALUES ($1, $2, 0)
                        RETURNING id
                    `;
          const newTagResult = await client.query(insertTagQuery, [
            nextTagId,
            labelTitle,
          ]);
          tagId = parseInt(newTagResult.rows[0].id);

          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }

      // Check if tagging exists
      const checkTaggingQuery = `
                SELECT id 
                FROM public.taggings 
                WHERE tag_id = $1 
                AND taggable_type = 'Contact' 
                AND taggable_id = $2 
                AND context = 'labels'
            `;
      const taggingResult = await client.query(checkTaggingQuery, [
        tagId,
        contactId,
      ]);

      if (taggingResult.rows.length === 0) {
        // Create new tagging and update count
        await client.query("BEGIN");

        try {
          // Get next tagging ID
          const lastTaggingResult = await client.query(
            "SELECT id FROM public.taggings ORDER BY id DESC LIMIT 1",
          );
          const nextTaggingId =
            (parseInt(lastTaggingResult.rows[0]?.id) || 0) + 1;

          // Create tagging
          const now = new Date().toISOString();
          const insertTaggingQuery = `
                        INSERT INTO public.taggings (
                            id, tag_id, taggable_type, taggable_id, context,
                            created_at
                        )
                        VALUES ($1, $2, 'Contact', $3, 'labels', $4)
                    `;
          await client.query(insertTaggingQuery, [
            nextTaggingId,
            tagId,
            contactId,
            now,
          ]);

          // Update tag count for existing tags
          if (labelResult.rows.length > 0) {
            await client.query(
              "UPDATE public.tags SET taggings_count = taggings_count + 1 WHERE id = $1",
              [tagId],
            );
          }

          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding labels:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  } finally {
    client.release();
    await pool.end();
  }
}
