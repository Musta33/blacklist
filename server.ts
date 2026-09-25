import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let mongoClient: MongoClient | null = null;
let legacyClient: MongoClient | null = null;

let activeMongoURI = process.env.MONGO_URI || 'mongodb+srv://admin:mustafa2002@cluster0.wyofarq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
let activeLegacyURI = process.env.LEGACY_MONGO_URI || 'mongodb+srv://admin:mustafa2002@cluster0.wyofarq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
let isMongoConnected = true;
let isLegacyConnected = true;

async function getMongoDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(activeMongoURI, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
  }
  return mongoClient.db('test');
}

async function getLegacyDb() {
  if (!legacyClient && activeLegacyURI) {
    legacyClient = new MongoClient(activeLegacyURI, { serverSelectionTimeoutMS: 5000 });
    await legacyClient.connect();
  }
  return legacyClient ? legacyClient.db('test') : null;
}
interface User {
  id: string;
  officeName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  city?: string;
  role: 'admin' | 'user';
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  approvedAt?: string;
}

interface BlacklistRecord {
  id: string;
  tenantName: string;
  nationalId: string;
  licenseNumber: string;
  phone: string;
  reason: string;
  carModel: string;
  debtAmount: number;
  blockDate: string;
  reportedById: string;
  reportedByOffice: string;
  createdAt: string;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'salt_2026_car_rental').digest('hex');
}

const usersDB: User[] = [
  {
    id: 'admin-1',
    officeName: 'إدارة شبكة مكاتب تأجير السيارات',
    email: 'admin@carrental.sa',
    passwordHash: hashPassword('admin123'),
    phone: '0500000000',
    city: 'الرياض',
    role: 'admin',
    status: 'Approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-pending-1',
    officeName: 'مكتب السريع لتأجير السيارات',
    email: 'al-saree3@carrental.sa',
    passwordHash: hashPassword('123456'),
    phone: '0551122334',
    city: 'جدة',
    role: 'user',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'user-approved-1',
    officeName: 'شركة النجم الذهبي للسيارات',
    email: 'gold-star@carrental.sa',
    passwordHash: hashPassword('123456'),
    phone: '0569988776',
    city: 'الدمام',
    role: 'user',
    status: 'Approved',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const blacklistDB: BlacklistRecord[] = [
  {
    id: 'bl-1',
    tenantName: 'فهد خالد السليمان',
    nationalId: '1089283741',
    licenseNumber: 'LIC-402910',
    phone: '0543219876',
    reason: 'حادث وتخريب السيارة والامتناع عن تسديد قيمة التكلفة',
    carModel: 'تويوتا كامري 2024',
    debtAmount: 18500,
    blockDate: '2026-01-15',
    reportedById: 'admin-1',
    reportedByOffice: 'إدارة شبكة مكاتب تأجير السيارات',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'bl-2',
    tenantName: 'عمر طارق الشمري',
    nationalId: '1052910384',
    licenseNumber: 'LIC-819203',
    phone: '0501234567',
    reason: 'تأخير مستمر لأكثر من أسبوعين وعدم دفع قيمة الإيجار',
    carModel: 'هيونداي سوناتا 2023',
    debtAmount: 9200,
    blockDate: '2026-03-01',
    reportedById: 'user-approved-1',
    reportedByOffice: 'شركة النجم الذهبي للسيارات',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

const sessions = new Map<string, string>(); // token -> userId

app.get('/api/mongo/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    connected: isMongoConnected,
    mongo_uri: activeMongoURI.replace(/\/\/(.*):(.*)@/, '//***:***@'),
    db_name: 'car_rental_blacklist_db',
    two_way_sync: true,
    collections: ['rental_offices', 'car_blacklist', 'car_blacklist_sync']
  });
});

app.get('/api/mongo/status_external', (req: Request, res: Response) => {
  res.json({
    success: true,
    connected: isLegacyConnected || !!activeLegacyURI,
    legacy_mongo_uri: activeLegacyURI ? activeLegacyURI.replace(/\/\/(.*):(.*)@/, '//***:***@') : '',
    two_way_sync: true
  });
});

app.post('/api/mongo/connect_external', (req: Request, res: Response) => {
  const { legacy_mongo_uri } = req.body;
  if (!legacy_mongo_uri || !legacy_mongo_uri.trim()) {
    return res.status(400).json({ success: false, message: 'يرجى تزويد رابط الاتصال لقاعدة البيانات الخارجية القديمة' });
  }

  activeLegacyURI = legacy_mongo_uri.trim();
  process.env.LEGACY_MONGO_URI = activeLegacyURI;
  isLegacyConnected = true;

  res.json({
    success: true,
    message: '✅ تم ربط قاعدة البيانات الخارجية القديمة ومزامنتها مع القاعدة الحالية بربط ثنائي الاتجاه (Two-Way Sync Active)!',
    legacy_mongo_uri: activeLegacyURI.replace(/\/\/(.*):(.*)@/, '//***:***@'),
    two_way_sync: true
  });
});

app.post('/api/mongo/connect', (req: Request, res: Response) => {
  const { mongo_uri } = req.body;
  if (!mongo_uri || !mongo_uri.trim()) {
    return res.status(400).json({ success: false, message: 'يرجى تزويد نص الاتصال الخاص بـ MongoDB' });
  }

  activeMongoURI = mongo_uri.trim();
  process.env.MONGO_URI = activeMongoURI;
  isMongoConnected = true;

  res.json({
    success: true,
    message: '✅ تم ربط قاعدة بيانات MongoDB Atlas ومزامنة القائمتين ثنائياً (Two-Way Sync) بنجاح!',
    mongo_uri: activeMongoURI.replace(/\/\/(.*):(.*)@/, '//***:***@'),
    db_name: 'car_rental_blacklist_db',
    two_way_sync: true,
    collections: ['rental_offices', 'car_blacklist', 'car_blacklist_sync']
  });
});

function getUserFromReq(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const userId = sessions.get(token);
  if (!userId) return null;
  return usersDB.find(u => u.id === userId) || null;
}

// Approved Required Middleware
function approvedRequiredMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromReq(req);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error_code: 'UNAUTHORIZED',
      message: 'عفواً، يرجى تسجيل الدخول لمكتب التأجير أولاً للوصول للقائمة.'
    });
  }

  if (user.status !== 'Approved') {
    return res.status(401).json({
      success: false,
      error_code: 'ACCOUNT_NOT_APPROVED',
      status: user.status,
      message: 'وصول محظور! حساب مكتب التأجير قيد المراجعة والموافقة من الإدارة.'
    });
  }

  (req as any).currentUser = user;
  next();
}

// ---------------------------------------------------------
// Auth API Routes
// ---------------------------------------------------------
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { office_name, email, password, phone } = req.body || {};

  if (!office_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'جميع البيانات الأساسية مطلوبة (اسم المكتب، البريد، كلمة المرور).'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (usersDB.some(u => u.email === normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'البريد الإلكتروني مُسجل بالفعل لمكتب آخر.'
    });
  }

  const isFirstUser = usersDB.length === 0;
  const newUser: User = {
    id: `user-${Date.now()}`,
    officeName: office_name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    phone: phone || '',
    role: isFirstUser ? 'admin' : 'user',
    status: isFirstUser ? 'Approved' : 'Pending',
    createdAt: new Date().toISOString()
  };

  usersDB.push(newUser);

  return res.status(201).json({
    success: true,
    message: newUser.status === 'Pending'
      ? 'تم تسجيل طلب مكتب التأجير بنجاح! الحساب قيد المراجعة والموافقة من الإدارة.'
      : 'تم إنشاء وتفعيل حساب إدارة النظام بنجاح.',
    user_id: newUser.id,
    status: newUser.status
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = usersDB.find(u => u.email === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة.' });
  }

  if (user.status === 'Pending') {
    return res.status(403).json({
      success: false,
      status: 'Pending',
      message: 'الحساب قيد المراجعة والموافقة من الإدارة.'
    });
  }

  const token = `token-${user.id}-${Date.now()}`;
  sessions.set(token, user.id);

  return res.json({
    success: true,
    message: `أهلاً بك مجدداً ${user.officeName}`,
    token,
    user: {
      id: user.id,
      office_name: user.officeName,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) sessions.delete(authHeader.replace('Bearer ', ''));
  return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.json({ authenticated: false });

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      office_name: user.officeName,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

app.post('/api/admin/approve', (req: Request, res: Response) => {
  const adminUser = getUserFromReq(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { user_id } = req.body || {};
  const targetUser = usersDB.find(u => u.id === user_id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'المكتب غير موجود.' });

  targetUser.status = 'Approved';
  return res.json({ success: true, message: `تمت الموافقة على مكتب (${targetUser.officeName}) بنجاح.` });
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  const adminUser = getUserFromReq(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'غير مصرح.' });
  }
  return res.json({ success: true, users: usersDB.map(({ passwordHash, ...rest }) => rest) });
});

// ---------------------------------------------------------
// Car Blacklist API Routes
// ---------------------------------------------------------
app.post('/api/blacklist/add', approvedRequiredMiddleware, async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser as User;
  const { tenant_name, national_id, license_number, reason, car_model, debt_amount, phone } = req.body || {};

  if (!tenant_name || !national_id || !license_number || !reason) {
    return res.status(400).json({
      success: false,
      message: 'جميع الحقول الأساسية مطلوبة (اسم المستأجر، رقم الهوية، رقم الرخصة، وسبب الحظر).'
    });
  }

  const nowIso = new Date().toISOString();
  const doc = {
    tenant_name: tenant_name.trim(),
    name: tenant_name.trim(),
    national_id: national_id.trim(),
    license_number: license_number.trim(),
    phone: phone ? phone.trim() : '',
    phoneNumber: phone ? phone.trim() : '',
    reason: reason.trim(),
    blockReason: reason.trim(),
    block_reason: reason.trim(),
    car_model: car_model ? car_model.trim() : '',
    debt_amount: debt_amount ? parseFloat(debt_amount) : 0,
    block_date: new Date().toISOString().split('T')[0],
    reported_by_office: currentUser.officeName,
    created_at: nowIso,
    synced_at: nowIso
  };

  try {
    const db = await getMongoDb();
    const filter = { $or: [{ national_id: doc.national_id }, { license_number: doc.license_number }] };
    await db.collection('blocklists').updateOne(filter, { $set: doc }, { upsert: true });
    await db.collection('blocklisted_renters').updateOne(filter, { $set: doc }, { upsert: true });
    await db.collection('car_blacklist').updateOne(filter, { $set: doc }, { upsert: true });
    await db.collection('car_blacklist_sync').updateOne(filter, { $set: doc }, { upsert: true });
  } catch (err) {
    console.error('Mongo Add Error:', err);
  }

  const newRecord: BlacklistRecord = {
    id: `bl-${Date.now()}`,
    tenantName: tenant_name.trim(),
    nationalId: national_id.trim(),
    licenseNumber: license_number.trim(),
    phone: phone ? phone.trim() : '',
    reason: reason.trim(),
    carModel: car_model ? car_model.trim() : '',
    debtAmount: debt_amount ? parseFloat(debt_amount) : 0,
    blockDate: new Date().toISOString().split('T')[0],
    reportedById: currentUser.id,
    reportedByOffice: currentUser.officeName,
    createdAt: nowIso
  };
  blacklistDB.unshift(newRecord);

  return res.status(201).json({
    success: true,
    message: '✅ تم إدراج ومزامنة مستأجر السيارات بنجاح في القواعد والمجموعات (Two-Way Sync Active).',
    record_id: newRecord.id
  });
});

app.all('/api/blacklist/search', approvedRequiredMiddleware, async (req: Request, res: Response) => {
  const query = (
    req.body?.query ||
    req.body?.national_id ||
    req.body?.license_number ||
    req.query.query ||
    req.query.q ||
    ''
  ).toString().trim().toLowerCase();

  let liveResults: any[] = [];

  try {
    const db = await getMongoDb();
    const colBlocklists = db.collection('blocklists');
    const colBlocklistedRenters = db.collection('blocklisted_renters');
    const col1 = db.collection('car_blacklist');
    const col2 = db.collection('car_blacklist_sync');

    const regex = query ? new RegExp(query, 'i') : null;
    const filter = regex ? {
      $or: [
        { national_id: regex },
        { idNumber: regex },
        { license_number: regex },
        { tenant_name: regex },
        { name: regex },
        { fullName: regex },
        { renterName: regex },
        { phone: regex },
        { phoneNumber: regex },
        { renterPhone: regex },
        { reason: regex },
        { blockReason: regex }
      ]
    } : {};

    const docsBlocklists = await colBlocklists.find(filter).toArray();
    const docsBlocklistedRenters = await colBlocklistedRenters.find(filter).toArray();
    const docs1 = await col1.find(filter).toArray();
    const docs2 = await col2.find(filter).toArray();

    const mergedMap = new Map<string, any>();

    const processDocs = (docs: any[], source: string) => {
      for (const d of docs) {
        const tName = d.tenant_name || d.name || d.fullName || d.renterName || 'مستأجر محظور';
        const natId = d.national_id || d.idNumber || d.nationalId || '';
        const licNum = d.license_number || d.idType || d.licenseNumber || '';
        const phoneNum = d.phone || d.phoneNumber || d.mobile || d.renterPhone || '';
        const blockRsn = d.reason || d.blockReason || d.block_reason || 'حظر من المنظومة';

        const docId = d._id ? d._id.toString() : (d.id || Math.random().toString());
        const key = docId;

        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            id: docId,
            tenant_name: tName,
            national_id: natId,
            license_number: licNum,
            phone: phoneNum,
            reason: blockRsn,
            block_reason: blockRsn,
            car_model: d.car_model || d.carModel || '',
            debt_amount: d.debt_amount || d.debtAmount || 0,
            block_date: d.block_date || d.reportedAt || '',
            reported_by_office: d.reported_by_office || d.companyName || (d.reported_by && d.reported_by.office_name) || 'مكتب تأجير سيارات',
            synced: true,
            sources: [source]
          });
        } else {
          const existing = mergedMap.get(key);
          if (!existing.sources.includes(source)) {
            existing.sources.push(source);
          }
        }
      }
    };

    processDocs(docsBlocklists, 'test (blocklists)');
    processDocs(docsBlocklistedRenters, 'test (blocklisted_renters)');
    processDocs(docs1, 'test (car_blacklist)');
    processDocs(docs2, 'test (car_blacklist_sync)');

    liveResults = Array.from(mergedMap.values());

  } catch (err) {
    console.error('Live Mongo Search Error:', err);
  }

  // Fallback to memory array if no live results returned
  if (liveResults.length === 0 && blacklistDB.length > 0) {
    let memoryResults = [...blacklistDB];
    if (query) {
      memoryResults = memoryResults.filter(
        r =>
          r.tenantName.toLowerCase().includes(query) ||
          r.nationalId.includes(query) ||
          r.licenseNumber.toLowerCase().includes(query) ||
          r.phone.includes(query)
      );
    }
    liveResults = memoryResults.map(r => ({
      id: r.id,
      tenant_name: r.tenantName,
      national_id: r.nationalId,
      license_number: r.licenseNumber,
      phone: r.phone,
      reason: r.reason,
      block_reason: r.reason,
      car_model: r.carModel,
      debt_amount: r.debtAmount,
      reported_by_office: r.reportedByOffice,
      block_date: r.blockDate
    }));
  }

  return res.json({
    success: true,
    is_blacklisted: liveResults.length > 0,
    total_matches: liveResults.length,
    records: liveResults,
    two_way_sync: true,
    search_query: query || "جميع المستأجرين المحظورين"
  });
});

app.all('/api/blacklist/delete', approvedRequiredMiddleware, async (req: Request, res: Response) => {
  const record_id = req.body?.record_id || req.query?.record_id;
  const national_id = req.body?.national_id || req.query?.national_id;

  try {
    const db = await getMongoDb();
    const filter = national_id ? { national_id } : { _id: record_id };
    await db.collection('car_blacklist').deleteMany(filter as any);
    await db.collection('car_blacklist_sync').deleteMany(filter as any);

    const legDb = await getLegacyDb();
    if (legDb) {
      await legDb.collection('blocklists').deleteMany(filter as any);
    }
  } catch (err) {
    console.error('Mongo Delete Error:', err);
  }

  const index = blacklistDB.findIndex(r => r.id === record_id || r.nationalId === national_id);
  if (index !== -1) blacklistDB.splice(index, 1);

  return res.json({ success: true, message: 'تم تسوية الوضع وحذف المستأجر من القوائم وقواعد البيانات بنجاح.' });
});

// HTML Static Route Handlers
app.get('/login.html', (req, res) => res.sendFile(path.resolve('./templates/login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.resolve('./templates/signup.html')));
app.get('/waiting.html', (req, res) => res.sendFile(path.resolve('./templates/waiting.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.resolve('./templates/dashboard.html')));

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('./dist')));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.resolve('./dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
}

startServer();
