const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const migrationFiles = [
    '001_create_magazalar.sql',
    '002_create_aspect_rules.sql',
    '003_create_ledler.sql',
    '004_create_users.sql',
    '005_create_projects_tables.sql',
    '006_create_scraper_tables.sql',
    '007_extend_templates.sql'
  ];

  for (const file of migrationFiles) {
    try {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrations', file), 'utf8');
      
      // SQL'i temizle ve böl
      const cleanSql = sql
        .replace(/--.*$/gm, '') // Yorumları kaldır
        .replace(/\/\*[\s\S]*?\*\//g, '') // Block yorumları kaldır
        .replace(/^\s*$/gm, ''); // Boş satırları kaldır
      
      const statements = cleanSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`  Executing: ${statement.substring(0, 50)}...`);
          await connection.execute(statement);
        }
      }
      
      console.log(`✅ ${file} completed`);
    } catch (error) {
      console.error(`❌ Error in ${file}:`, error.message);
      console.error(`SQL that failed: ${error.sql?.substring(0, 200)}...`);
    }
  }

  await connection.end();
  console.log('🎉 All migrations completed');
}

runMigrations().catch(console.error);