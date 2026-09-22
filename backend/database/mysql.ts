import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database.ts';

let pool: mysql.Pool | null = null;
let isConnected = false;

/**
 * Initialize MySQL Connection Pool
 * Configured by default for local development with Laragon (127.0.0.1:3306, user: root, password: '')
 */
export async function getDbPool(): Promise<mysql.Pool | null> {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: dbConfig.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Test the connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    isConnected = true;
    console.log(`[Database] Terhubung ke MySQL Laragon (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
    return pool;
  } catch (error: any) {
    isConnected = false;
    // Log friendly guidance when running without MySQL
    console.warn(`[Database Info] MySQL lokal (${dbConfig.host}:${dbConfig.port}) belum aktif atau database '${dbConfig.database}' belum dibuat di Laragon.`);
    console.warn(`[Database Info] Sistem secara otomatis berjalan menggunakan Penyimpanan Data Terpadu (In-Memory + File/API).`);
    console.warn(`[Database Info] Jika ingin menghubungkan ke Laragon:`);
    console.warn(`               1. Buka Laragon dan klik 'Start All'`);
    console.warn(`               2. Buka Database (phpMyAdmin / HeidiSQL)`);
    console.warn(`               3. Import file: backend/database/schema.sql dan seed.sql`);
    return null;
  }
}

export function isMysqlConnected(): boolean {
  return isConnected;
}

export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = await getDbPool();
  if (!p) {
    throw new Error('MySQL connection pool is not available.');
  }
  const [rows] = await p.execute(sql, params);
  return rows as T[];
}
