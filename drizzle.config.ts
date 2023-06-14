import type { Config } from 'drizzle-kit';

export default {
    schema: './src/lib/database/schema.ts',
    out: './drizzle'
} satisfies Config;
