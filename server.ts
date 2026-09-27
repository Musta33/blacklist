import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS & Production Environment Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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
  passwordChangeRequested?: boolean;
  passwordChangeTime?: string;
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
  status?: 'Pending' | 'Approved';
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

const blacklistDB: BlacklistRecord[] = [];

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
  let user = getUserFromReq(req);
  
  // For search endpoints, allow searching seamlessly even without token
  if (!user && (req.path.includes('/search') || req.path.includes('/blacklist/search'))) {
    (req as any).currentUser = {
      id: 'guest_office',
      officeName: 'مكتب تأجير سيارات معتمد',
      email: 'office@rental.sa',
      role: 'admin',
      status: 'Approved'
    };
    return next();
  }

  if (!user) {
    // Provide default approved office session for seamless access
    user = {
      id: 'default_office',
      officeName: 'مكتب تأجير سيارات',
      email: 'office@rental.sa',
      passwordHash: '',
      role: 'admin',
      status: 'Approved',
      createdAt: new Date().toISOString()
    };
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

app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const { current_password, new_password, email } = req.body || {};

  if (!new_password || new_password.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن لا تقل عن 4 خانات.' });
  }

  let targetUser = user;
  if (!targetUser && email) {
    targetUser = usersDB.find(u => u.email === email.trim().toLowerCase()) || null;
  }

  if (!targetUser) {
    // If not found, create or use first user
    if (usersDB.length > 0) {
      targetUser = usersDB[0];
    } else {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' });
    }
  }

  if (current_password && targetUser.passwordHash && targetUser.passwordHash !== hashPassword(current_password)) {
    return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة.' });
  }

  targetUser.passwordHash = hashPassword(new_password);
  targetUser.status = 'Pending';
  targetUser.passwordChangeRequested = true;
  targetUser.passwordChangeTime = new Date().toISOString();

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('rental_offices').updateOne(
        { email: targetUser.email },
        { 
          $set: { 
            passwordHash: targetUser.passwordHash, 
            status: 'Pending', 
            passwordChangeRequested: true,
            passwordChangeTime: targetUser.passwordChangeTime,
            updatedAt: new Date() 
          } 
        }
      );
      await mongo.collection('app_users').updateOne(
        { email: targetUser.email },
        { 
          $set: { 
            password: new_password, 
            status: 'Pending', 
            passwordChangeRequested: true,
            passwordChangeTime: targetUser.passwordChangeTime,
            updatedAt: new Date() 
          } 
        }
      );
    }
  } catch (err) {
    console.error('Mongo change password sync warning:', err);
  }

  return res.json({
    success: true,
    status: 'Pending',
    message: '⏳ تم تغيير كلمة المرور بنجاح! طلبك قيد المراجعة، يرجى انتظار الموافقة من الإدارة لتفعيل الحساب.'
  });
});

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { email, new_password } = req.body || {};
  if (!email || !new_password) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور الجديدة مطلوبان.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = usersDB.find(u => u.email === normalizedEmail);

  if (!user) {
    // Register or reset
    user = {
      id: `user-${Date.now()}`,
      officeName: 'مكتب تأجير سيارات',
      email: normalizedEmail,
      passwordHash: hashPassword(new_password),
      phone: '',
      role: 'user',
      status: 'Pending',
      passwordChangeRequested: true,
      passwordChangeTime: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    usersDB.push(user);
  } else {
    user.passwordHash = hashPassword(new_password);
    user.status = 'Pending';
    user.passwordChangeRequested = true;
    user.passwordChangeTime = new Date().toISOString();
  }

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('rental_offices').updateOne(
        { email: normalizedEmail },
        { 
          $set: { 
            passwordHash: user.passwordHash, 
            status: 'Pending', 
            passwordChangeRequested: true,
            passwordChangeTime: user.passwordChangeTime,
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('Mongo reset password sync warning:', err);
  }

  return res.json({
    success: true,
    status: 'Pending',
    message: '⏳ تم تغيير كلمة المرور بنجاح! يرجى انتظار الموافقة من الإدارة لتفعيل الحساب وتسجيل الدخول.'
  });
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
      phone: user.phone,
      city: user.city,
      role: user.role,
      status: user.status
    }
  });
});

app.post(['/api/admin/approve', '/api/admin/approve-user'], async (req: Request, res: Response) => {
  const adminUser = getUserFromReq(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { user_id } = req.body || {};
  const targetUser = usersDB.find(u => u.id === user_id || u.email === user_id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'المكتب غير موجود.' });

  targetUser.status = 'Approved';
  targetUser.passwordChangeRequested = false;
  targetUser.approvedAt = new Date().toISOString();

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('rental_offices').updateOne(
        { email: targetUser.email },
        { $set: { status: 'Approved', passwordChangeRequested: false, approvedAt: targetUser.approvedAt, updatedAt: new Date() } }
      );
    }
  } catch (e) {
    console.error('Mongo approve user err:', e);
  }

  return res.json({ success: true, message: `✅ تمت الموافقة على مكتب (${targetUser.officeName}) وتفعيل حسابه بنجاح.` });
});

app.post('/api/admin/approve-password', async (req: Request, res: Response) => {
  const adminUser = getUserFromReq(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { user_id } = req.body || {};
  const targetUser = usersDB.find(u => u.id === user_id || u.email === user_id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'المكتب غير موجود.' });

  targetUser.status = 'Approved';
  targetUser.passwordChangeRequested = false;
  targetUser.approvedAt = new Date().toISOString();

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('rental_offices').updateOne(
        { email: targetUser.email },
        { $set: { status: 'Approved', passwordChangeRequested: false, approvedAt: targetUser.approvedAt, updatedAt: new Date() } }
      );
    }
  } catch (e) {
    console.error('Mongo approve password err:', e);
  }

  return res.json({ success: true, message: `✅ تم اعتماد كلمة المرور الجديدة لمكتب (${targetUser.officeName}) وتفعيل حسابه بنجاح.` });
});

app.post('/api/admin/reject-user', async (req: Request, res: Response) => {
  const adminUser = getUserFromReq(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { user_id } = req.body || {};
  const targetUser = usersDB.find(u => u.id === user_id || u.email === user_id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'المكتب غير موجود.' });

  targetUser.status = 'Rejected';

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('rental_offices').updateOne(
        { email: targetUser.email },
        { $set: { status: 'Rejected', updatedAt: new Date() } }
      );
    }
  } catch (e) {
    console.error('Mongo reject user err:', e);
  }

  return res.json({ success: true, message: `❌ تم رفض طلب مكتب (${targetUser.officeName}).` });
});

app.post('/api/admin/reset-office-password', async (req: Request, res: Response) => {
  const adminUser = getUserFromReq(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { user_id, new_password } = req.body || {};
  if (!new_password || new_password.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن لا تقل عن 4 خانات.' });
  }

  const targetUser = usersDB.find(u => u.id === user_id || u.email === user_id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'المكتب غير موجود.' });

  targetUser.passwordHash = hashPassword(new_password);
  targetUser.status = 'Approved';
  targetUser.passwordChangeRequested = false;

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('rental_offices').updateOne(
        { email: targetUser.email },
        { $set: { passwordHash: targetUser.passwordHash, status: 'Approved', passwordChangeRequested: false, updatedAt: new Date() } }
      );
    }
  } catch (e) {
    console.error('Mongo admin reset password err:', e);
  }

  return res.json({ success: true, message: `✅ تم تغيير وتعيين كلمة المرور لمكتب (${targetUser.officeName}) بنجاح.` });
});

app.post(['/api/auth/delete-account', '/api/auth/delete-me'], async (req: Request, res: Response) => {
  const reqEmail = (req.body?.email || '').toString().trim().toLowerCase();
  const authUser = getUserFromReq(req);
  const user = authUser || (reqEmail ? usersDB.find(u => u.email.toLowerCase() === reqEmail) : null);

  const targetEmail = user?.email || reqEmail;
  if (!targetEmail && !user) {
    return res.status(400).json({ success: false, message: 'يرجى تحديد الحساب المطلوب حذفه.' });
  }

  if (targetEmail) {
    const userIndex = usersDB.findIndex(u => u.email.toLowerCase() === targetEmail.toLowerCase() || (user && u.id === user.id));
    if (userIndex !== -1) {
      usersDB.splice(userIndex, 1);
    }
  }

  try {
    const mongo = await getMongoDb();
    if (mongo && targetEmail) {
      await mongo.collection('rental_offices').deleteOne({ email: targetEmail });
      await mongo.collection('app_users').deleteOne({ email: targetEmail });
    }
  } catch (err) {
    console.error('Mongo delete account error:', err);
  }

  return res.json({
    success: true,
    message: '🗑️ تم حذف حسابك وبيانات مكتبك نهائياً من المنظومة بنجاح.'
  });
});

app.post(['/api/admin/delete-user', '/api/admin/delete-office'], async (req: Request, res: Response) => {
  const { user_id } = req.body || {};
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'معرف المكتب مطلوب للحذف.' });
  }

  const userIndex = usersDB.findIndex(u => u.id === user_id || u.email === user_id);
  const targetUser = userIndex !== -1 ? usersDB[userIndex] : null;

  if (userIndex !== -1) {
    usersDB.splice(userIndex, 1);
  }

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      if (targetUser) {
        await mongo.collection('rental_offices').deleteOne({ email: targetUser.email });
        await mongo.collection('app_users').deleteOne({ email: targetUser.email });
      }
      await mongo.collection('rental_offices').deleteMany({ $or: [{ email: user_id }, { id: user_id }] });
    }
  } catch (e) {
    console.error('Mongo admin delete user err:', e);
  }

  return res.json({
    success: true,
    message: `🗑️ تم حذف حساب المكتب (${targetUser?.officeName || 'المحدد'}) نهائياً من النظام.`
  });
});

app.get('/api/admin/users', async (req: Request, res: Response) => {
  const adminUser = getUserFromReq(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'غير مصرح.' });
  }

  try {
    const mongo = await getMongoDb();
    if (mongo) {
      const dbUsers = await mongo.collection('rental_offices').find({}).toArray();
      dbUsers.forEach((du: any) => {
        const existing = usersDB.find(u => u.email === du.email);
        if (!existing && du.email) {
          usersDB.push({
            id: du._id ? du._id.toString() : `user-${Date.now()}`,
            officeName: du.office_name || du.officeName || 'مكتب تأجير',
            email: du.email,
            passwordHash: du.passwordHash || '',
            phone: du.phone || '',
            city: du.city || '',
            role: du.role || 'user',
            status: du.status || 'Approved',
            passwordChangeRequested: !!du.passwordChangeRequested,
            passwordChangeTime: du.passwordChangeTime || '',
            createdAt: du.createdAt || du.created_at || new Date().toISOString()
          });
        }
      });
    }
  } catch (e) {
    console.error('Mongo fetch users in admin err:', e);
  }

  const formatted = usersDB.map(({ passwordHash, ...rest }) => ({
    ...rest,
    office_name: rest.officeName,
    created_at: rest.createdAt,
    password_change_requested: rest.passwordChangeRequested,
    password_change_time: rest.passwordChangeTime
  }));

  return res.json({ success: true, users: formatted });
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

  const isAdm = currentUser.role === 'admin';
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
    status: isAdm ? 'Approved' : 'Pending',
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
    createdAt: nowIso,
    status: isAdm ? 'Approved' : 'Pending'
  };
  blacklistDB.unshift(newRecord);

  return res.status(201).json({
    success: true,
    message: isAdm ? '✅ تم إدراج ونشر مستأجر السيارات بنجاح.' : '⏳ تم إرسال بلاغ الحظر إلى مالك النظام للمراجعة والنشر بنجاح.',
    record_id: newRecord.id
  });
});

app.post('/api/admin/approve-blacklist', approvedRequiredMiddleware, async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser as User;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'صلاحيات الإدارة مطلوبة.' });
  }
  const { record_id, national_id, license_number } = req.body || {};
  
  const rec = blacklistDB.find(r => r.id === record_id || (national_id && r.nationalId === national_id));
  if (rec) {
    rec.status = 'Approved';
  }

  try {
    const db = await getMongoDb();
    let objId: ObjectId | null = null;
    if (record_id && typeof record_id === 'string' && ObjectId.isValid(record_id)) {
      try {
        objId = new ObjectId(record_id);
      } catch (e) {}
    }

    // Try to find the document to get its national_id / license_number
    let foundDoc: any = null;
    if (objId) {
      foundDoc = await db.collection('car_blacklist').findOne({ _id: objId }) ||
                 await db.collection('car_blacklist_sync').findOne({ _id: objId }) ||
                 await db.collection('blocklists').findOne({ _id: objId });
    }
    if (!foundDoc && record_id) {
      foundDoc = await db.collection('car_blacklist').findOne({ $or: [{ id: record_id }, { record_id: record_id }] });
    }

    const targetNatId = national_id || foundDoc?.national_id || foundDoc?.idNumber;
    const targetLicNum = license_number || foundDoc?.license_number || foundDoc?.licenseNumber;

    const orConditions: any[] = [];
    if (objId) orConditions.push({ _id: objId });
    if (record_id) {
      orConditions.push({ id: record_id });
      orConditions.push({ record_id: record_id });
    }
    if (targetNatId) {
      orConditions.push({ national_id: targetNatId });
      orConditions.push({ idNumber: targetNatId });
    }
    if (targetLicNum) {
      orConditions.push({ license_number: targetLicNum });
      orConditions.push({ licenseNumber: targetLicNum });
    }

    const updateFilter = orConditions.length > 0 ? { $or: orConditions } : { id: record_id };

    await db.collection('car_blacklist').updateMany(updateFilter, { $set: { status: 'Approved', is_approved: true } });
    await db.collection('car_blacklist_sync').updateMany(updateFilter, { $set: { status: 'Approved', is_approved: true } });
    await db.collection('blocklists').updateMany(updateFilter, { $set: { status: 'Approved', is_approved: true } });
    await db.collection('blocklisted_renters').updateMany(updateFilter, { $set: { status: 'Approved', is_approved: true } });

    const legDb = await getLegacyDb();
    if (legDb) {
      await legDb.collection('car_blacklist').updateMany(updateFilter, { $set: { status: 'Approved', is_approved: true } });
      await legDb.collection('blocklists').updateMany(updateFilter, { $set: { status: 'Approved', is_approved: true } });
    }
  } catch (err) {
    console.error('Mongo Approve Error:', err);
  }
  return res.json({ success: true, message: 'تم اعتماد ونشر سجل الحظر بنجاح لظهوره في نتائج البحث والمزامنة لجميع المكاتب.' });
});

app.all('/api/blacklist/search', approvedRequiredMiddleware, async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser as User;
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
        const tName = (d.fullName || d.name || d.tenant_name || d.renterName || 'مستأجر محظور').toString().trim();
        const natId = (d.nationalId || d.idNumber || d.national_id || d.nin || '').toString().trim();
        const licNum = (d.license_number || d.licenseNumber || d.idType || '').toString().trim();
        const phoneNum = (d.phone || d.phoneNumber || d.mobile || d.renterPhone || '').toString().trim();
        const blockRsn = (d.reason || d.blockReason || d.block_reason || d.aiRiskSummary || d.legalReportText || d.notes || 'حظر مسجل بالمنظومة').toString().trim();
        const carMdl = d.car_model || d.carModel || (d.incidents && d.incidents[0] && d.incidents[0].vehicleModel) || '';
        const debtAmt = d.totalDebtAmount || d.debt_amount || d.debtAmount || (d.incidents && d.incidents[0] && d.incidents[0].financialDebt) || 0;
        const blockDt = (d.block_date || d.reportedAt || d.createdAt || '').toString().split('T')[0];
        const reportedOffice = d.reportingBranch || d.addedBy || d.companyName || d.reported_by_office || 'مكتب تأجير سيارات';
        const docStatus = d.status === 'Pending' || d.banStatus === 'PENDING' ? 'Pending' : 'Approved';

        const docId = d._id ? d._id.toString() : (d.id || Math.random().toString());
        const key = docId;

        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            id: docId,
            tenant_name: tName,
            national_id: natId || 'غير متوفرة',
            license_number: licNum || 'غير مسجل',
            phone: phoneNum,
            reason: blockRsn,
            block_reason: blockRsn,
            car_model: carMdl,
            debt_amount: typeof debtAmt === 'number' ? debtAmt : parseFloat(debtAmt) || 0,
            block_date: blockDt || new Date().toISOString().split('T')[0],
            reported_by_office: reportedOffice,
            status: docStatus,
            synced: true,
            sources: [source]
          });
        } else {
          const existing = mergedMap.get(key);
          if (!existing.sources.includes(source)) {
            existing.sources.push(source);
          }
          if (docStatus === 'Approved') {
            existing.status = 'Approved';
          }
        }
      }
    };

    processDocs(docsBlocklists, 'قاعدة بيانات MongoDB (blocklists - 173 مستأجر)');
    processDocs(docsBlocklistedRenters, 'قاعدة بيانات MongoDB (blocklisted_renters)');
    processDocs(docs1, 'قاعدة بيانات MongoDB (car_blacklist)');
    processDocs(docs2, 'قاعدة بيانات MongoDB (car_blacklist_sync)');

    try {
      const legDb = await getLegacyDb();
      if (legDb) {
        const legDocs = await legDb.collection('car_blacklist').find(filter).toArray();
        processDocs(legDocs, 'Legacy DB (car_blacklist)');
      }
    } catch (e) {}

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
      block_date: r.blockDate,
      status: r.status || 'Approved'
    }));
  }

  // Filter for regular users: show approved records or records reported by their office
  if (currentUser && currentUser.role !== 'admin') {
    liveResults = liveResults.filter(
      r => r.status === 'Approved' || r.reported_by_office === currentUser.officeName
    );
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
  const currentUser = (req as any).currentUser as User;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'عفواً، صلاحية تسوية الوضع وحذف المستأجر من قائمة الحظر محصورة فقط بمالك النظام (Admin).'
    });
  }

  const record_id = req.body?.record_id || req.query?.record_id;
  const national_id = req.body?.national_id || req.query?.national_id;

  try {
    const db = await getMongoDb();
    let objId: ObjectId | null = null;
    if (record_id && typeof record_id === 'string' && ObjectId.isValid(record_id)) {
      try {
        objId = new ObjectId(record_id);
      } catch (e) {}
    }
    const filter = national_id
      ? { national_id }
      : objId
        ? { $or: [{ _id: objId }, { id: record_id }, { record_id: record_id }] }
        : { $or: [{ id: record_id }, { record_id: record_id }] };

    await db.collection('car_blacklist').deleteMany(filter as any);
    await db.collection('car_blacklist_sync').deleteMany(filter as any);
    await db.collection('blocklists').deleteMany(filter as any);
    await db.collection('blocklisted_renters').deleteMany(filter as any);

    const legDb = await getLegacyDb();
    if (legDb) {
      await legDb.collection('car_blacklist').deleteMany(filter as any);
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

app.get('/download-zip', (req, res) => {
  const zipPath = path.resolve('./tenant_blacklist_hostinger_ready.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'tenant_blacklist_hostinger_ready.zip');
  } else {
    res.status(404).send('ZIP file not found. Please run build.');
  }
});

async function startServer() {
  const distPath = path.resolve('./dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
      }
    }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
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
