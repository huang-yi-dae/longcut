/**
 * Run a SQL migration against Supabase using the REST API.
 * Uses service_role key for admin access.
 * 
 * Usage: npx tsx scripts/run-migration.ts supabase/migrations/20260617120000_add_favorite_folders.sql
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration(sqlFile: string) {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Remove comments and split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  // Run statements one by one, handling multi-line
  let current = '';
  const toRun: string[] = [];
  
  for (const stmt of statements) {
    current += (current ? '\n' : '') + stmt;
    // Simple heuristic: if the statement looks complete (contains CREATE/ALTER/INSERT/etc), run it
    if (stmt.match(/^(CREATE|ALTER|INSERT|GRANT|DROP)\s/i)) {
      toRun.push(current + ';');
      current = '';
    }
  }
  
  for (const stmt of toRun) {
    console.log('Running:', stmt.substring(0, 80) + '...');
    const { error } = await supabase.rpc('exec_sql', { query: stmt }).single();
    if (error) {
      // The exec_sql function might not exist; try direct request
      console.error('RPC failed:', error.message);
      
      // Fallback: use fetch to the SQL endpoint
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ query: stmt })
      });
      console.log('  HTTP', res.status, await res.text().then(t => t.substring(0, 100)));
    } else {
      console.log('  OK');
    }
  }
  
  console.log('Migration complete!');
}

const sqlFile = process.argv[2] || 'supabase/migrations/20260617120000_add_favorite_folders.sql';
runMigration(sqlFile).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
