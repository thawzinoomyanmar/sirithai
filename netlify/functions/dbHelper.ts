import fs from 'fs';
import path from 'path';

// In-memory & file-persisted store for Netlify serverless environments
const DB_FILE_PATH = path.join('/tmp', 'sirithai_netlify_d1.json');

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  phone?: string | null;
  xp: number;
  created_at: string;
}

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_mgmg',
    full_name: 'mg mg',
    email: 'mgmg@gmail.com',
    avatar_url: null,
    role: 'student',
    phone: '09-771234567',
    xp: 0,
    created_at: '2026-08-11 15:44:00'
  },
  {
    id: 'ko_nay_min',
    full_name: 'Ko Nay Min',
    email: 'naymin@gmail.com',
    avatar_url: null,
    role: 'student',
    phone: '09-771234567',
    xp: 1250,
    created_at: '2026-05-12 10:00:00'
  },
  {
    id: 'ma_khine',
    full_name: 'Ma Khine',
    email: 'makhineoo@viber-me.com',
    avatar_url: null,
    role: 'student',
    phone: '09-881234567',
    xp: 350,
    created_at: '2026-08-11 14:21:42'
  },
  {
    id: 'phyo_wai',
    full_name: 'Phyo Wai',
    email: 'phyowai@gmail.com',
    avatar_url: null,
    role: 'student',
    phone: '09-991234567',
    xp: 150,
    created_at: '2026-08-11 14:21:42'
  },
  {
    id: 'admin',
    full_name: 'System Admin',
    email: 'admin@sirithai.com',
    avatar_url: null,
    role: 'admin',
    phone: '09-123456789',
    xp: 500,
    created_at: '2026-08-11 14:21:42'
  }
];

function loadStore(): { users_profile: UserProfile[]; transactions: any[] } {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.users_profile) && parsed.users_profile.length >= INITIAL_USERS.length) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[dbHelper Store Read Note]', e);
  }
  const initialStore = { users_profile: [...INITIAL_USERS], transactions: [] };
  saveStore(initialStore);
  return initialStore;
}

function saveStore(store: { users_profile: UserProfile[]; transactions: any[] }) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[dbHelper Store Write Note]', e);
  }
}

let globalMemoryStore = loadStore();

export function getDB(context: any): any {
  let db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;
  
  if (db && typeof db.prepare === 'function') {
    return db;
  }

  // Netlify Serverless persistent store engine
  return {
    prepare(sql: string) {
      let boundArgs: any[] = [];
      const d1Stmt = {
        bind(...args: any[]) {
          boundArgs = args.map(arg => typeof arg === 'undefined' ? null : arg);
          return d1Stmt;
        },
        async run() {
          const sqlLower = sql.toLowerCase();
          
          if (sqlLower.includes('insert into users_profile')) {
            const [id, full_name, email, avatar_url, role, phone, xp] = boundArgs;
            const userId = String(id || '').trim();
            if (userId) {
              const existingIdx = globalMemoryStore.users_profile.findIndex(u => u.id.toLowerCase() === userId.toLowerCase());
              const newUser: UserProfile = {
                id: userId,
                full_name: String(full_name || email?.split('@')[0] || 'Student'),
                email: String(email || ''),
                avatar_url: avatar_url || '',
                role: role === 'admin' ? 'admin' : 'student',
                phone: phone || null,
                xp: typeof xp === 'number' ? xp : 0,
                created_at: new Date().toISOString().replace('T', ' ').split('.')[0]
              };
              if (existingIdx >= 0) {
                globalMemoryStore.users_profile[existingIdx] = {
                  ...globalMemoryStore.users_profile[existingIdx],
                  full_name: newUser.full_name,
                  email: newUser.email,
                  avatar_url: newUser.avatar_url,
                  phone: newUser.phone || globalMemoryStore.users_profile[existingIdx].phone,
                  xp: newUser.xp || globalMemoryStore.users_profile[existingIdx].xp,
                  role: newUser.role || globalMemoryStore.users_profile[existingIdx].role
                };
              } else {
                globalMemoryStore.users_profile.unshift(newUser);
              }
              saveStore(globalMemoryStore);
            }
            return { success: true, meta: { changes: 1 } };
          }

          if (sqlLower.includes('delete from users_profile')) {
            const userId = boundArgs[0] ? String(boundArgs[0]).trim() : '';
            if (userId) {
              globalMemoryStore.users_profile = globalMemoryStore.users_profile.filter(u => u.id.toLowerCase() !== userId.toLowerCase());
              saveStore(globalMemoryStore);
            }
            return { success: true, meta: { changes: 1 } };
          }

          return { success: true, meta: { changes: 0 } };
        },

        async all() {
          const sqlLower = sql.toLowerCase();

          if (sqlLower.includes('users_profile')) {
            globalMemoryStore = loadStore();
            return { success: true, results: globalMemoryStore.users_profile };
          }

          if (sqlLower.includes('transactions')) {
            globalMemoryStore = loadStore();
            return { success: true, results: globalMemoryStore.transactions };
          }

          return { success: true, results: [] };
        },

        async first() {
          const res = await d1Stmt.all();
          return (res.results && res.results[0]) || null;
        }
      };
      return d1Stmt;
    }
  };
}
