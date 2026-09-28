// Inserts or updates the problems listed in ./seeds/problems.js.
// Usage: npm run seed
import { pool } from './pool.js';
import { problems } from './seeds/problems.js';

async function seed() {
  for (const problem of problems) {
    await pool.query(
      `INSERT INTO problems (slug, number, title, framework, difficulty, tags, image, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         number = EXCLUDED.number,
         title = EXCLUDED.title,
         framework = EXCLUDED.framework,
         difficulty = EXCLUDED.difficulty,
         tags = EXCLUDED.tags,
         image = EXCLUDED.image,
         config = EXCLUDED.config,
         updated_at = now()`,
      [
        problem.slug,
        problem.number,
        problem.title,
        problem.framework,
        problem.difficulty,
        problem.tags,
        problem.image,
        problem.config,
      ],
    );
    console.log(`Seeded ${problem.slug}`);
  }
}

try {
  await seed();
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
