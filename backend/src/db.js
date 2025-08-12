import { createPool } from 'mysql2/promise';
const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'Tagnpuacpa330$&!',
    database: 'sys'
});
export default pool;