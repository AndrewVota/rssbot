import { migrate } from 'drizzle-orm/postgres-js/migrator';
import db, { endDatabaseConnection } from './database.js';

await migrate(db, { migrationsFolder: 'drizzle' });
endDatabaseConnection();
console.log('Database migration complete!');
