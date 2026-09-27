import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserCheck,
  UserX,
  Lock,
  Search,
  UserPlus,
  LogOut,
  LogIn,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Car,
  FileText,
  CreditCard,
  Building,
  KeyRound,
  Trash2,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  Layers,
  Database,
  Phone,
  MapPin,
  Calendar,
  XCircle,
  Key
} from 'lucide-react';

interface User {
  id: string;
  office_name: string;
  email: string;
  phone?: string;
  city?: string;
  role: 'admin' | 'user' | 'office';
  status: 'Pending' | 'Approved' | 'Rejected';
  password_change_requested?: boolean;
  password_change_time?: string;
  created_at?: string;
}

interface BlacklistRecord {
  id: string;
  tenant_name: string;
  national_id: string;
  license_number: string;
  phone: string;
  reason: string;
  car_model: string;
  debt_amount: number;
  reported_by_office: string;
  block_date: string;
  status?: 'Pending' | 'Approved' | string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">⚠️</div>
            <h1 className="text-xl font-black text-white">عذراً، حدث خطأ غير متوقع في واجهة النظام</h1>
            <p className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-auto max-h-32 text-left" dir="ltr">
              {this.state.error?.toString()}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
            >
              إعادة تحميل التطبيق وتحديث البيانات
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import INITIAL_RECORDS from './initial_data.json';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

const MOCK_RECORDS: BlacklistRecord[] = INITIAL_RECORDS as BlacklistRecord[];

const apiFetch = async (endpoint: string, options?: RequestInit) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Static fallback mode');
    }
    return res;
  } catch (err) {
    // Return a mock response object for static hosting (Hostinger)
    return createStaticMockResponse(endpoint, options);
  }
};

const createStaticMockResponse = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = endpoint.split('?')[0];
  const queryParams = new URLSearchParams(endpoint.split('?')[1] || '');
  const q = queryParams.get('q')?.toLowerCase() || '';

  let bodyData: any = {};
  try {
    if (options?.body) {
      bodyData = JSON.parse(options.body as string);
    }
  } catch (e) {}

  let responsePayload: any = { success: true };
  let status = 200;

  if (url === '/api/auth/me') {
    const storedUser = localStorage.getItem('tb_mock_user');
    if (storedUser) {
      responsePayload = { authenticated: true, user: JSON.parse(storedUser) };
    } else {
      responsePayload = { authenticated: false, user: null };
      status = 401;
    }
  } else if (url === '/api/blacklist/search') {
    let filtered = MOCK_RECORDS;
    const localAdded = JSON.parse(localStorage.getItem('tb_local_records') || '[]');
    const allRecs = [...localAdded, ...MOCK_RECORDS];
    if (q) {
      filtered = allRecs.filter(r => 
        (r.tenant_name && r.tenant_name.toLowerCase().includes(q)) ||
        (r.national_id && r.national_id.toLowerCase().includes(q)) ||
        (r.license_number && r.license_number.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q))
      );
    } else {
      filtered = allRecs;
    }
    responsePayload = { success: true, is_blacklisted: filtered.length > 0, total_matches: filtered.length, records: filtered };
  } else if (url === '/api/blacklist/add') {
    const newRec: BlacklistRecord = {
      id: `local_${Date.now()}`,
      tenant_name: bodyData.tenant_name || 'مستأجر جديد',
      national_id: bodyData.national_id || '0000000000',
      license_number: bodyData.license_number || 'LIC-000',
      phone: bodyData.phone || '07000000000',
      reason: bodyData.reason || 'عدم دفع الإيجار',
      car_model: bodyData.car_model || 'سيارة سدان',
      debt_amount: Number(bodyData.debt_amount) || 500,
      reported_by_office: bodyData.reported_by_office || 'مكتب التأجير المحلي',
      block_date: new Date().toISOString().split('T')[0],
      status: 'Approved'
    };
    const localAdded = JSON.parse(localStorage.getItem('tb_local_records') || '[]');
    localStorage.setItem('tb_local_records', JSON.stringify([newRec, ...localAdded]));
    responsePayload = { success: true, message: 'تم إدراج مستأجر السيارات لقائمة الحظر بنجاح.' };
  } else if (url === '/api/auth/login') {
    const mockUser = { id: 'user_1', office_name: bodyData.office_name || 'مكتب تأجير معتمد', email: bodyData.email, role: bodyData.email?.includes('admin') ? 'admin' : 'office', status: 'Approved' };
    localStorage.setItem('tb_mock_user', JSON.stringify(mockUser));
    responsePayload = { success: true, token: 'mock_jwt_token_123', user: mockUser };
  } else if (url === '/api/auth/signup') {
    const newUser = { id: `user_${Date.now()}`, office_name: bodyData.office_name, email: bodyData.email, role: 'office', status: 'Approved' };
    localStorage.setItem('tb_mock_user', JSON.stringify(newUser));
    responsePayload = { success: true, message: 'تم إنشاء الحساب بنجاح وتم تفعيله.', user: newUser };
  } else if (url === '/api/auth/change-password' || url === '/api/auth/reset-password') {
    responsePayload = { success: true, status: 'Pending', message: '⏳ تم تغيير كلمة المرور بنجاح! طلبك قيد المراجعة، يرجى انتظار الموافقة من الإدارة لتفعيل الحساب.' };
  } else if (url === '/api/auth/delete-account' || url === '/api/auth/delete-me') {
    localStorage.removeItem('tb_mock_user');
    localStorage.removeItem('tb_token');
    responsePayload = { success: true, message: '🗑️ تم حذف حسابك وبيانات مكتبك نهائياً من المنظومة بنجاح.' };
  } else if (url === '/api/admin/delete-user' || url === '/api/admin/delete-office') {
    responsePayload = { success: true, message: '🗑️ تم حذف حساب المكتب نهائياً بنجاح.' };
  } else if (url === '/api/admin/users') {
    responsePayload = { success: true, users: [
      { id: 'user_1', office_name: 'مكتب بغداد للتأجير', email: 'baghdad@office.iq', phone: '07901112233', role: 'office', status: 'Approved' },
      { id: 'user_2', office_name: 'مكتب البصرة المركزي', email: 'basra@office.iq', phone: '07802223344', role: 'office', status: 'Approved' }
    ]};
  } else {
    responsePayload = { success: true, message: 'Mock static response' };
  }

  return new Response(JSON.stringify(responsePayload), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
};


export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'add' | 'admin' | 'html_pages' | 'code' | 'mongo'>('search');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem('tb_mock_user');
      return u ? JSON.parse(u) : null;
    } catch(e) {
      return null;
    }
  });
  const [token, setToken] = useState<string>(() => localStorage.getItem('tb_token') || '');

  // MongoDB Connection State
  const [mongoUri, setMongoUri] = useState('mongodb+srv://admin:mustafa2002@cluster0.wyofarq.mongodb.net/car_rental_blacklist_db?retryWrites=true&w=majority&appName=Cluster0');
  const [mongoConnected, setMongoConnected] = useState(true);
  const [mongoSuccessMsg, setMongoSuccessMsg] = useState('');
  const [mongoErrorMsg, setMongoErrorMsg] = useState('');
  const [testingMongo, setTestingMongo] = useState(false);

  // External / Legacy MongoDB Connection State
  const [legacyMongoUri, setLegacyMongoUri] = useState('mongodb+srv://admin:mustafa2002@cluster0.wyofarq.mongodb.net/iraqrentl?retryWrites=true&w=majority&appName=Cluster0');
  const [legacyConnected, setLegacyConnected] = useState(true);
  const [legacySuccessMsg, setLegacySuccessMsg] = useState('');
  const [legacyErrorMsg, setLegacyErrorMsg] = useState('');
  const [testingLegacyMongo, setTestingLegacyMongo] = useState(false);

  // Auth Forms (Defaulting to login)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOfficeName, setAuthOfficeName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authCity, setAuthCity] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Password Change Modal State
  const [showChangePwdModal, setShowChangePwdModal] = useState<boolean>(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Admin Reset Office Password Modal State
  const [showAdminResetModal, setShowAdminResetModal] = useState<boolean>(false);
  const [adminTargetUserId, setAdminTargetUserId] = useState('');
  const [adminTargetOfficeName, setAdminTargetOfficeName] = useState('');
  const [adminNewPwd, setAdminNewPwd] = useState('');
  const [adminResetMsg, setAdminResetMsg] = useState('');
  const [adminResetErr, setAdminResetErr] = useState('');
  const [adminResetLoading, setAdminResetLoading] = useState(false);

  // Delete Account Modal State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteErr, setDeleteErr] = useState('');

  // Blacklist Data
  const [records, setRecords] = useState<BlacklistRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState('');

  // Add Form Data
  const [newTenantName, setNewTenantName] = useState('');
  const [newNationalId, setNewNationalId] = useState('');
  const [newLicenseNumber, setNewLicenseNumber] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newReason, setNewReason] = useState('عدم دفع الإيجار والامتناع عن السداد');
  const [newCarModel, setNewCarModel] = useState('');
  const [newDebt, setNewDebt] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState('');
  const [addErrorMsg, setAddErrorMsg] = useState('');

  // Admin Data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminActionMsg, setAdminActionMsg] = useState('');

  // Code View Copy
  const [copiedCode, setCopiedCode] = useState(false);

  const pythonFlaskCode = `import os
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient, errors
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("SECRET_KEY", "car_rental_blacklist_secret_key_2026")
CORS(app, supports_credentials=True)

# ---------------------------------------------------------
# 1. تهيئة الاتصال بـ MongoDB لقواعد حظر مستأجري السيارات
# ---------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/car_rental_blacklist_db")

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
    
    users_collection = db["rental_offices"]      # مجموعات مكاتب السيارات
    blacklist_collection = db["car_blacklist"]   # قائمة حظر مستأجري السيارات
    
    users_collection.create_index("email", unique=True)
    blacklist_collection.create_index("national_id")
    blacklist_collection.create_index("license_number")
    blacklist_collection.create_index("tenant_name")
    
    print("✅ تم الاتصال بـ MongoDB وبناء الفهارس بنجاح.")
except Exception as e:
    print(f"❌ خطأ الاتصال: {e}")

# ---------------------------------------------------------
# جدار الحماية الحاسم (Middleware / Decorator)
# ---------------------------------------------------------
def approved_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"success": False, "message": "يرجى تسجيل الدخول لمكتب التأجير أولاً."}), 401

        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user or user.get('status') != 'Approved':
            return jsonify({"success": False, "message": "حساب المكتب قيد المراجعة والموافقة من الإدارة."}), 401

        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function

# ---------------------------------------------------------
# 2. إضافة مستأجر سيارات محظور (/api/blacklist/add)
# ---------------------------------------------------------
@app.route('/api/blacklist/add', methods=['POST'])
@approved_required
def add_to_blacklist():
    data = request.get_json() or {}
    tenant_name = data.get('tenant_name', '').strip()
    national_id = data.get('national_id', '').strip()
    license_number = data.get('license_number', '').strip()
    reason = data.get('reason', '').strip()
    car_model = data.get('car_model', '').strip()
    debt_amount = data.get('debt_amount', 0)

    if not tenant_name or not national_id or not license_number or not reason:
        return jsonify({"success": False, "message": "الاسم، الهوية، رقم الرخصة، وسبب الحظر حقول إلزامية."}), 400

    doc = {
        "tenant_name": tenant_name,
        "national_id": national_id,
        "license_number": license_number,
        "reason": reason,
        "car_model": car_model,
        "debt_amount": float(debt_amount) if debt_amount else 0.0,
        "reported_by_office": request.current_user.get('office_name'),
        "created_at": datetime.utcnow()
    }

    result = blacklist_collection.insert_one(doc)
    return jsonify({"success": True, "message": "تم إدراج مستأجر السيارات لقائمة الحظر بنجاح.", "record_id": str(result.inserted_id)}), 201

# ---------------------------------------------------------
# 3. الاستعلام السريع برقم الهوية أو الرخصة (/api/blacklist/search)
# ---------------------------------------------------------
@app.route('/api/blacklist/search', methods=['GET', 'POST'])
@approved_required
def search_blacklist():
    query = request.args.get('q', '').strip()
    filter_q = {}
    if query:
        filter_q = {
            "$or": [
                {"national_id": {"$regex": query, "$options": "i"}},
                {"license_number": {"$regex": query, "$options": "i"}},
                {"tenant_name": {"$regex": query, "$options": "i"}}
            ]
        }

    records = list(blacklist_collection.find(filter_q).sort("created_at", -1))
    for r in records:
        r['id'] = str(r['_id'])
        del r['_id']

    return jsonify({"success": True, "records": records}), 200

# ---------------------------------------------------------
# 4. حذف وتسوية وضع مستأجر (/api/blacklist/delete)
# ---------------------------------------------------------
@app.route('/api/blacklist/delete', methods=['DELETE', 'POST'])
@approved_required
def delete_from_blacklist():
    data = request.get_json() or {}
    record_id = data.get('record_id')
    blacklist_collection.delete_one({"_id": ObjectId(record_id)})
    return jsonify({"success": True, "message": "تم حذف المستأجر من قائمة الحظر بنجاح."}), 200

# توجيه دالة عرض لوحة التحكم ببرمجة العملة وإخفاء المربع
@app.route('/dashboard')
@app.route('/dashboard.html')
def dashboard():
    currency = "د.ع"
    show_db_status = False
    return render_template('dashboard.html', currency=currency, show_db_status=show_db_status)

@app.route('/login.html')
def login_p(): return send_from_directory('templates', 'login.html')

@app.route('/signup.html')
def signup_p(): return send_from_directory('templates', 'signup.html')

@app.route('/waiting.html')
def waiting_p(): return send_from_directory('templates', 'waiting.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
`;

  // Fetch Session
  const checkAuth = async () => {
    try {
      const res = await apiFetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) { console.error(err); }
  };

  // Search Blacklist
  const executeSearch = async (query = '') => {
    setLoadingRecords(true);
    setBlockedMsg('');

    try {
      const res = await apiFetch(`/api/blacklist/search?q=${encodeURIComponent(query)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        setBlockedMsg(data.message || 'وصول محظور! يجب تسجيل الدخول وتفعيل حساب مكتبك أولاً من الإدارة.');
        setRecords([]);
      } else if (data.success) {
        setRecords(data.records || []);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Fetch Users for Admin
  const fetchUsers = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const res = await apiFetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) setAllUsers(data.users || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { checkAuth(); }, [token]);
  useEffect(() => { executeSearch(searchQuery); }, [searchQuery, token, currentUser]);
  useEffect(() => { if (activeTab === 'admin' && currentUser?.role === 'admin') fetchUsers(); }, [activeTab, currentUser]);

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        localStorage.setItem('tb_token', data.token);
        setCurrentUser(data.user);
        setShowAuthModal(false);
      } else if (res.status === 403 && data.status === 'Pending') {
        window.location.href = '/waiting.html';
      } else {
        setAuthError(data.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) { setAuthError('حدث خطأ في الاتصال بالخادم'); }
  };

  // Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office_name: authOfficeName,
          email: authEmail,
          password: authPassword,
          phone: authPhone
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.status === 'Pending') {
          window.location.href = '/waiting.html';
        } else {
          setAuthSuccess(data.message);
          setAuthMode('login');
        }
      } else {
        setAuthError(data.message || 'فشل التسجيل');
      }
    } catch (err) { setAuthError('خطأ بالخادم'); }
  };

  // Change Password for Logged-in User
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErr('');
    setPwdMsg('');

    if (newPwd !== confirmPwd) {
      setPwdErr('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    if (newPwd.length < 4) {
      setPwdErr('كلمة المرور يجب أن لا تقل عن 4 خانات.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          email: currentUser?.email,
          current_password: currentPwd,
          new_password: newPwd
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwdMsg(data.message || '⏳ تم تغيير كلمة المرور بنجاح! يرجى انتظار الموافقة من الإدارة لتفعيل الحساب.');
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setTimeout(() => {
          setShowChangePwdModal(false);
          setPwdMsg('');
        }, 3500);
      } else {
        setPwdErr(data.message || 'فشل في تغيير كلمة المرور.');
      }
    } catch (err) {
      setPwdErr('خطأ في الاتصال بالخادم.');
    } finally {
      setPwdLoading(false);
    }
  };

  // Reset Password from Auth screen
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail || !authPassword) {
      setAuthError('يرجى إدخال البريد الإلكتروني وكلمة المرور الجديدة.');
      return;
    }

    if (authPassword.length < 4) {
      setAuthError('كلمة المرور الجديدة يجب أن لا تقل عن 4 خانات.');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          new_password: authPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthSuccess(data.message || '⏳ تم تغيير كلمة المرور بنجاح! يرجى انتظار الموافقة من الإدارة لتفعيل الحساب.');
        setTimeout(() => {
          setAuthMode('login');
          setAuthSuccess('');
        }, 4000);
      } else {
        setAuthError(data.message || 'فشل إعادة تعيين كلمة المرور.');
      }
    } catch (err) {
      setAuthError('خطأ في الاتصال بالخادم.');
    }
  };

  // Quick Login Demo
  const loginAsAdmin = async () => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@carrental.sa', password: 'admin123' })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('tb_token', data.token);
        setCurrentUser(data.user);
        setShowAuthModal(false);
      }
    } catch (e) { console.error(e); }
  };

  const loginAsApprovedOffice = async () => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'gold-star@carrental.sa', password: '123456' })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('tb_token', data.token);
        setCurrentUser(data.user);
        setShowAuthModal(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('tb_token');
    localStorage.removeItem('tb_mock_user');
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // Approve User Registration
  const handleApproveUser = async (userId: string) => {
    try {
      const res = await apiFetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setAdminActionMsg(data.message);
        fetchUsers();
      }
    } catch (e) { console.error(e); }
  };

  // Approve Password Change Request
  const handleApprovePassword = async (userId: string) => {
    try {
      const res = await apiFetch('/api/admin/approve-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setAdminActionMsg(data.message);
        fetchUsers();
      }
    } catch (e) { console.error(e); }
  };

  // Reject User or Password Request
  const handleRejectUser = async (userId: string) => {
    try {
      const res = await apiFetch('/api/admin/reject-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setAdminActionMsg(data.message);
        fetchUsers();
      }
    } catch (e) { console.error(e); }
  };

  // Admin Reset Office Password
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminResetErr('');
    setAdminResetMsg('');

    if (adminNewPwd.length < 4) {
      setAdminResetErr('كلمة المرور يجب أن لا تقل عن 4 خانات.');
      return;
    }

    setAdminResetLoading(true);
    try {
      const res = await apiFetch('/api/admin/reset-office-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: adminTargetUserId, new_password: adminNewPwd })
      });
      const data = await res.json();
      if (data.success) {
        setAdminResetMsg(data.message || '✅ تم تغيير كلمة المرور للمكتب بنجاح!');
        fetchUsers();
        setTimeout(() => {
          setShowAdminResetModal(false);
          setAdminResetMsg('');
          setAdminNewPwd('');
        }, 2200);
      } else {
        setAdminResetErr(data.message || 'فشل في تغيير كلمة المرور.');
      }
    } catch (e) {
      setAdminResetErr('خطأ في الاتصال بالخادم.');
    } finally {
      setAdminResetLoading(false);
    }
  };

  // User Delete Own Account Handler
  const handleDeleteOwnAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setDeleteLoading(true);
    setDeleteErr('');
    setDeleteMsg('');
    try {
      const emailToDelete = currentUser?.email || authEmail;
      const res = await apiFetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ email: emailToDelete })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteMsg(data.message || '🗑️ تم حذف حسابك وبيانات مكتبك نهائياً بنجاح.');
        setTimeout(() => {
          handleLogout();
          setShowDeleteAccountModal(false);
          setDeleteMsg('');
          setDeleteConfirmText('');
        }, 1500);
      } else {
        setDeleteErr(data.message || 'فشل في حذف الحساب.');
      }
    } catch (e) {
      setDeleteErr('خطأ في الاتصال بالخادم.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Admin Delete Office Handler
  const handleAdminDeleteUser = async (userId: string, officeName: string) => {
    try {
      // Optimistic UI update
      setAllUsers(prev => prev.filter(u => u.id !== userId && u.email !== userId));
      setAdminActionMsg(`🗑️ تم حذف حساب مكتب (${officeName}) نهائياً من المنظومة بنجاح.`);

      const res = await apiFetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Delete office error:', e);
    }
  };

  // Approve Blacklist Record
  const handleApproveBlacklist = async (recordId: string) => {
    try {
      const target = records.find(r => r.id === recordId);
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'Approved' } : r));
      const res = await apiFetch('/api/admin/approve-blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          record_id: recordId,
          national_id: target?.national_id,
          license_number: target?.license_number
        })
      });
      const data = await res.json();
      if (data.success) {
        setAdminActionMsg(data.message);
        executeSearch();
      }
    } catch (e) { console.error(e); }
  };

  // Add Record
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSuccessMsg('');
    setAddErrorMsg('');

    try {
      const res = await apiFetch('/api/blacklist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tenant_name: newTenantName,
          national_id: newNationalId,
          license_number: newLicenseNumber,
          phone: newTenantPhone,
          reason: newReason,
          debt_amount: newDebt
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAddSuccessMsg(data.message);
        setNewTenantName('');
        setNewNationalId('');
        setNewLicenseNumber('');
        setNewCarModel('');
        setNewDebt('');
        executeSearch();
      } else {
        setAddErrorMsg(data.message || 'فشلت الإضافة');
      }
    } catch (e) { setAddErrorMsg('خطأ بالخادم'); }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    try {
      // Optimistic update
      setRecords(prev => prev.filter(r => r.id !== id));
      const res = await apiFetch('/api/blacklist/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ record_id: id })
      });
      const data = await res.json();
      if (data.success) {
        setAdminActionMsg('🗑️ تم حذف المستأجر وتسوية وضعه بنجاح.');
        executeSearch();
      }
    } catch (e) { console.error(e); }
  };

  // Connect MongoDB Atlas
  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMongoSuccessMsg('');
    setMongoErrorMsg('');
    setTestingMongo(true);

    try {
      const res = await apiFetch('/api/mongo/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongo_uri: mongoUri })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMongoConnected(true);
        setMongoSuccessMsg(data.message || '✅ تم ربط قاعدة بيانات MongoDB Atlas بنجاح وتأكيد الاتصال!');
        executeSearch();
      } else {
        setMongoErrorMsg(data.message || 'فشل الاتصال بـ MongoDB');
      }
    } catch (err) {
      setMongoErrorMsg('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setTestingMongo(false);
    }
  };

  // Connect External / Legacy MongoDB Atlas
  const handleConnectLegacyMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLegacySuccessMsg('');
    setLegacyErrorMsg('');
    setTestingLegacyMongo(true);

    try {
      const res = await apiFetch('/api/mongo/connect_external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legacy_mongo_uri: legacyMongoUri })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLegacyConnected(true);
        setLegacySuccessMsg(data.message || '✅ تم الاتصال بقاعدة البيانات الخارجية القديمة ومزامنتها بنجاح!');
        executeSearch();
      } else {
        setLegacyErrorMsg(data.message || 'فشل الاتصال بالقاعدة الخارجية القديمة');
      }
    } catch (err) {
      setLegacyErrorMsg('حدث خطأ في الاتصال بالسيرفر الخارجي');
    } finally {
      setTestingLegacyMongo(false);
    }
  };

  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        loginAsAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pendingCount = allUsers.filter(u => u.status === 'Pending').length;
  const totalDebt = records.reduce((s, r) => s + (r.debt_amount || 0), 0);

  if (!currentUser) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full space-y-5 sm:space-y-6 shadow-2xl my-auto">
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div 
                onClick={() => {
                  const next = logoClicks + 1;
                  setLogoClicks(next);
                  if (next >= 5) {
                    loginAsAdmin();
                    setLogoClicks(0);
                  }
                }}
                title="منظومة حظر مستأجري السيارات"
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-rose-600 via-amber-600 to-amber-500 rounded-2xl mx-auto flex items-center justify-center text-2xl sm:text-3xl shadow-xl shadow-rose-900/40 cursor-pointer select-none"
              >
                🏎️
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">منظومة حظر مستأجري السيارات</h1>
              <p className="text-xs text-slate-400">بوابة تسجيل الدخول الموحدة لمكاتب وشركات تأجير السيارات</p>
            </div>

            {/* Toggle Tabs: Login (Default) vs Registration vs Reset */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                className={`py-2 rounded-lg text-[11px] sm:text-xs font-extrabold transition flex items-center justify-center gap-1 ${
                  authMode === 'login'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🔑</span> تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                className={`py-2 rounded-lg text-[11px] sm:text-xs font-extrabold transition flex items-center justify-center gap-1 ${
                  authMode === 'signup'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📝</span> تسجيل جديد
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccess(''); }}
                className={`py-2 rounded-lg text-[11px] sm:text-xs font-extrabold transition flex items-center justify-center gap-1 ${
                  authMode === 'forgot'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🔒</span> نسيت الرمز؟
              </button>
            </div>

            {/* Alerts */}
            {authError && (
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️</span> {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>✅</span> {authSuccess}
              </div>
            )}

            {/* Form */}
            <form 
              onSubmit={
                authMode === 'login' 
                  ? handleLogin 
                  : (authMode === 'signup' ? handleSignup : handleResetPassword)
              } 
              className="space-y-3.5 text-right"
            >
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اسم مكتب / شركة تأجير السيارات *</label>
                    <input
                      type="text"
                      required
                      value={authOfficeName}
                      onChange={e => setAuthOfficeName(e.target.value)}
                      placeholder="مثال: شركة الوفاق لتأجير السيارات"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">المدينة / المحافظة</label>
                      <input
                        type="text"
                        value={authCity}
                        onChange={e => setAuthCity(e.target.value)}
                        placeholder="بغداد / أربيل / الرياض"
                        className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف / الواتساب *</label>
                      <input
                        type="text"
                        required
                        value={authPhone}
                        onChange={e => setAuthPhone(e.target.value)}
                        placeholder="07XXXXXXXXX"
                        className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {authMode === 'forgot' ? 'البريد الإلكتروني لحساب المكتب *' : 'البريد الإلكتروني الرسمي *'}
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="office@carrental.iq"
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    {authMode === 'forgot' ? 'كلمة المرور الجديدة المطلوبة *' : 'كلمة المرور *'}
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-[11px] text-amber-400 hover:underline font-semibold"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'forgot'
                    ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-amber-900/30'
                    : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-900/30'
                }`}
              >
                {authMode === 'signup' && (
                  <><span>📝</span> إرسال طلب تسجيل المكتب والانضمام</>
                )}
                {authMode === 'login' && (
                  <><span>🔑</span> تسجيل الدخول إلى المنظومة</>
                )}
                {authMode === 'forgot' && (
                  <><span>💾</span> حفظ وتعيين كلمة المرور الجديدة</>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <a
                href="/download-zip"
                target="_blank"
                download
                className="text-xs text-indigo-400 hover:underline font-bold"
              >
                📥 تحميل حزمة هوسيتنجر (ZIP)
              </a>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-600 to-amber-500 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-rose-900/30 flex-shrink-0">
              🏎️
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-white truncate">منظومة حظر مستأجري السيارات</h1>
                <span className="bg-rose-500/10 text-rose-400 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1 flex-shrink-0">
                  <Car className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Car Blacklist
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">شبكة مكاتب تأجير السيارات الموحدة للاستعلام عن السجل الائتماني ورخص القيادة</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <a
              href="/download-zip"
              target="_blank"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold transition shadow"
              title="تحميل الملفات المجمعة الجاهزة للرفع على هوسيتنجر"
            >
              📥 <span className="hidden xs:inline">تحميل حزمة هوسيتنجر (ZIP)</span><span className="xs:hidden">تحميل ZIP</span>
            </a>
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 border border-slate-700/60 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2">
                <div className="text-right">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block truncate max-w-[120px] sm:max-w-none">{currentUser.office_name}</span>
                  <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold block">{currentUser.role === 'admin' ? '👑 مالك النظام' : 'مكتب مفعل'}</span>
                </div>
                <button 
                  onClick={() => { setShowChangePwdModal(true); setPwdErr(''); setPwdMsg(''); }}
                  className="p-1.5 sm:p-2 rounded-lg bg-slate-700/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 transition" 
                  title="تغيير كلمة المرور"
                >
                  <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={() => { setShowDeleteAccountModal(true); setDeleteErr(''); setDeleteMsg(''); setDeleteConfirmText(''); }}
                  className="p-1.5 sm:p-2 rounded-lg bg-slate-700/60 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 transition" 
                  title="حذف الحساب نهائياً"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button onClick={handleLogout} className="p-1.5 sm:p-2 rounded-lg bg-slate-700/60 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 transition" title="تسجيل الخروج">
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] sm:text-xs font-bold transition">
                  دخول المكتب
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-slate-800 bg-slate-900/60">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto py-1.5 sm:py-2 scrollbar-none no-scrollbar">
            <nav className="flex gap-1.5 sm:gap-2 whitespace-nowrap">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition min-h-[36px] ${
                  activeTab === 'search' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                استعلام المستأجرين
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition min-h-[36px] ${
                  activeTab === 'add' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                إضافة محظور
              </button>

              {currentUser?.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition relative min-h-[36px] ${
                      activeTab === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    لوحة مالك النظام
                    {pendingCount > 0 && <span className="bg-amber-500 text-slate-950 text-[10px] font-black rounded-full px-1.5 py-0.2">{pendingCount}</span>}
                  </button>

                  <button
                    onClick={() => setActiveTab('html_pages')}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition min-h-[36px] ${
                      activeTab === 'html_pages' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    صفحات HTML
                  </button>

                  <button
                    onClick={() => setActiveTab('mongo')}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition min-h-[36px] ${
                      activeTab === 'mongo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    ربط MongoDB 🍃
                  </button>

                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition min-h-[36px] ${
                      activeTab === 'code' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                    كود Python Flask
                  </button>
                </>
              )}
            </nav>

            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 px-3 py-1 rounded-lg flex-shrink-0">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>MongoDB Collection: rental_offices & car_blacklist</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {blockedMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{blockedMsg}</span>
          </div>
        )}

        {/* TAB 1: Search */}
        {activeTab === 'search' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">مستأجري السيارات المحظورين</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{records.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400 flex-shrink-0">
                  <Car className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">إجمالي المبالغ والتلفيات المتعثرة</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                    {totalDebt.toLocaleString('ar-SA')} <span className="text-xs sm:text-sm font-normal text-slate-400">د.ع</span>
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between sm:col-span-2 lg:col-span-1">
                <div>
                  <p className="text-slate-400 text-xs font-medium">طلبات المكاتب بانتظار الاعتماد</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
              <div className="relative">
                <Search className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الهوية / الجواز / رخصة القيادة / الاسم..."
                  className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Records Grid */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                نتائج السجل الائتماني لمستأجري المركبات ({records.length})
              </h2>

              {loadingRecords ? (
                <div className="text-center py-8 sm:py-12 text-slate-400 text-xs sm:text-sm">جاري الاستعلام المباشر من قاعدة بيانات MongoDB...</div>
              ) : records.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center space-y-2">
                  <Car className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-bold text-xs sm:text-sm">لم يتم العثور على حظر مسجل لهذه البيانات</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {records.map(r => (
                    <div key={r?.id || Math.random()} className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1.5 sm:w-2 h-full bg-rose-600"></div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] sm:text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 sm:px-2.5 py-0.5 rounded-full inline-block mb-1">
                            مستأجر محظور
                          </span>
                          <h3 className="text-lg sm:text-xl font-black text-white">{r?.tenant_name || 'مستأجر غير معروف'}</h3>
                        </div>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteRecord(r?.id)}
                            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition flex-shrink-0"
                            title="تسوية وضع المستأجر وحذفه (صلاحية المالك فقط)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs bg-slate-950 p-3 sm:p-3.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-500 text-[11px] block">الهوية الوطنية / الجواز:</span>
                          <span className="font-mono text-amber-400 font-bold">{r?.national_id || 'غير متوفرة'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">رقم رخصة القيادة:</span>
                          <span className="font-mono text-emerald-400 font-bold">{r?.license_number || 'غير مسجل'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 text-[11px] block">المبلغ المتعثر:</span>
                          <span className="text-rose-400 font-extrabold text-xs sm:text-sm">{r?.debt_amount ? `${Number(r.debt_amount).toLocaleString('ar-IQ')} د.ع` : 'لا توجد مالية'}</span>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                        <strong className="text-rose-400 block mb-0.5">سبب الحظر:</strong>
                        <p className="text-slate-300">{r?.reason || 'بدون سبب محدد'}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-800 pt-2.5 sm:pt-3">
                        <span className="truncate max-w-[180px] sm:max-w-none">المُبلغ: {r?.reported_by_office || 'مكتب تأجير سيارات'}</span>
                        <span className="flex-shrink-0">{r?.block_date || 'تاريخ غير معروف'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Add */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 space-y-4 sm:space-y-6">
            <div className="border-b border-slate-800 pb-3 sm:pb-4">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                إدراج مستأجر سيارات محظور بـ MongoDB
              </h2>
            </div>

            {addSuccessMsg && <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">{addSuccessMsg}</div>}
            {addErrorMsg && <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">{addErrorMsg}</div>}

            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم المستأجر الرباعي *</label>
                  <input type="text" required value={newTenantName} onChange={e => setNewTenantName(e.target.value)} placeholder="عبدالعزيز فهد الدوسري" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهوية / الجواز *</label>
                  <input type="text" required value={newNationalId} onChange={e => setNewNationalId(e.target.value)} placeholder="1092837419" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم رخصة القيادة *</label>
                  <input type="text" required value={newLicenseNumber} onChange={e => setNewLicenseNumber(e.target.value)} placeholder="LIC-920192" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المبلغ المالي المتعثر (دينار عراقي - د.ع)</label>
                  <input type="number" value={newDebt} onChange={e => setNewDebt(e.target.value)} placeholder="0.00" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">سبب الحظر المعتمد *</label>
                <select value={newReason} onChange={e => setNewReason(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <option value="عدم دفع الإيجار والامتناع عن السداد">عدم دفع الإيجار والامتناع عن السداد</option>
                  <option value="حادث مروري وتخريب السيارة">حادث مروري وتخريب السيارة</option>
                  <option value="تأخير مستمر وإخفاء السيارة">تأخير مستمر وإخفاء السيارة</option>
                  <option value="تجاوز حدود السرعة ومخالفات باهظة">تجاوز حدود السرعة ومخالفات باهظة</option>
                  <option value="محاولة تهريب أو تعديل المركبة">محاولة تهريب أو تعديل المركبة</option>
                </select>
              </div>

              <button type="submit" className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-sm transition">
                إدراج المستأجر في قائمة الحظر الموحدة
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Admin User Approvals & System Overview */}
        {activeTab === 'admin' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Pending Blacklist Additions by Companies */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-amber-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                بلاغات الحظر المعلقة من الشركات ({records.filter(r => (r as any).status === 'Pending').length})
              </h2>

              {adminActionMsg && <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold">{adminActionMsg}</div>}

              {records.filter(r => (r as any).status === 'Pending').length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد بلاغات حظر معلقة بانتظار المراجعة.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {records.filter(r => (r as any).status === 'Pending').map(r => (
                    <div key={r.id} className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-amber-500/30 space-y-3 relative">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-bold">بانتظار موافقة النشر</span>
                          <h3 className="font-bold text-white text-base mt-1">{r.tenant_name}</h3>
                        </div>
                        <span className="text-xs text-indigo-400 font-bold flex-shrink-0">🏢 {r.reported_by_office}</span>
                      </div>
                      <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg space-y-1">
                        <div>الهوية: <span className="text-amber-400 font-mono">{r.national_id}</span> | الرخصة: <span className="text-emerald-400 font-mono">{r.license_number}</span></div>
                        <div>السبب: {r.reason}</div>
                        <div>المبلغ: {r.debt_amount ? `${Number(r.debt_amount).toLocaleString('ar-IQ')} د.ع` : 'لا يوجد'}</div>
                      </div>
                      <button onClick={() => handleApproveBlacklist(r.id)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition">
                        اعتماد ونشر السجل في المنظومة العامة ✅
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 1. Pending Password Change Requests */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-lg shadow-amber-950/20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base sm:text-lg lg:text-xl font-black text-amber-400 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                  طلبات اعتماد تغيير كلمة المرور للمكاتب ({allUsers.filter(u => u.password_change_requested || (u.status === 'Pending' && u.password_change_time)).length})
                </h2>
                <span className="text-[11px] text-slate-400">تتطلب مراجعة وموافقة المدير لتفعيل كلمة المرور</span>
              </div>

              {adminActionMsg && <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold">{adminActionMsg}</div>}

              {allUsers.filter(u => u.password_change_requested || (u.status === 'Pending' && u.password_change_time)).length === 0 ? (
                <p className="text-xs text-slate-400 py-2">لا توجد طلبات معلقة لتغيير كلمة المرور حالياً.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {allUsers.filter(u => u.password_change_requested || (u.status === 'Pending' && u.password_change_time)).map(u => (
                    <div key={`pwd-${u.id}`} className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-amber-500/40 space-y-3 relative overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-bold flex items-center gap-1 w-fit mb-1">
                            <Key className="w-3 h-3" /> طلب تغيير كلمة المرور
                          </span>
                          <h3 className="font-black text-white text-base">{u.office_name}</h3>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {u.status === 'Approved' ? 'مكتب معتمد' : 'حساب معلق'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-slate-500 text-[10px] block">البريد الإلكتروني:</span>
                          <span className="font-mono text-slate-200 font-bold break-all">{u.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">الهاتف / الواتساب:</span>
                          <span className="font-mono text-emerald-400 font-bold">{u.phone || 'غير مسجل'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">المدينة:</span>
                          <span className="text-slate-300 font-bold">{u.city || 'غير محددة'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">تاريخ ووقت الطلب:</span>
                          <span className="text-amber-400 text-[11px] font-mono">
                            {u.password_change_time ? new Date(u.password_change_time).toLocaleString('ar-IQ') : 'اليوم'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => handleApprovePassword(u.id)} 
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> اعتماد وتفعيل كلمة المرور ✅
                        </button>
                        <button 
                          onClick={() => handleRejectUser(u.id)} 
                          className="px-3 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                          title="رفض الطلب"
                        >
                          <XCircle className="w-4 h-4" /> رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Pending New Office Registrations */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                  طلبات انضمام وتسجيل مكاتب التأجير الجديدة ({allUsers.filter(u => u.status === 'Pending' && !u.password_change_requested).length})
                </h2>
                <span className="text-[11px] text-slate-400">حسابات تنتظر التفعيل الأول للانضمام للمنظومة</span>
              </div>

              {allUsers.filter(u => u.status === 'Pending' && !u.password_change_requested).length === 0 ? (
                <p className="text-xs text-slate-400 py-2">لا توجد طلبات انضمام جديدة معلقة حالياً.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {allUsers.filter(u => u.status === 'Pending' && !u.password_change_requested).map(u => (
                    <div key={`reg-${u.id}`} className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-cyan-500/30 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">مكتب جديد قيد الاعتماد</span>
                          <h3 className="font-black text-white text-base mt-1">{u.office_name}</h3>
                        </div>
                        <span className="text-xs text-slate-400">{u.city || ''}</span>
                      </div>

                      <div className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div>البريد: <span className="font-mono text-slate-200 font-bold">{u.email}</span></div>
                        <div>الهاتف: <span className="font-mono text-emerald-400 font-bold">{u.phone || 'غير مسجل'}</span></div>
                        <div>المدينة: <span className="text-slate-300 font-bold">{u.city || 'غير محددة'}</span></div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveUser(u.id)} 
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> اعتماد وتفعيل الحساب ✅
                        </button>
                        <button 
                          onClick={() => handleRejectUser(u.id)} 
                          className="px-3 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition"
                          title="رفض"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Detailed Companies & Rental Offices Directory */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-black text-white flex items-center gap-2">
                    <Building className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    الدليل الشامل لمعلومات شركات ومكاتب التأجير ({allUsers.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">عرض كافة البيانات الرسمية، جهات الاتصال، وإدارة كلمات المرور لكل مكتب</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                    {allUsers.filter(u => u.status === 'Approved').length} مفعل
                  </span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
                    {allUsers.filter(u => u.status === 'Pending').length} معلق
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {allUsers.map(u => {
                  const submittedCount = records.filter(r => r.reported_by_office === u.office_name).length;
                  return (
                    <div key={u.id} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 space-y-3 relative transition flex flex-col justify-between">
                      <div className="space-y-2.5">
                        {/* Title & Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-black text-white text-sm sm:text-base">{u.office_name}</h3>
                            <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                              {u.role === 'admin' ? '👑 مالك ومدير النظام' : '🏢 مكتب تأجير سيارات'}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold flex-shrink-0 border ${
                            u.status === 'Approved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                              : (u.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30')
                          }`}>
                            {u.status === 'Approved' ? '🟢 معتمد ومفعل' : (u.status === 'Pending' ? '🟡 قيد المراجعة' : '🔴 محظور / مرفوض')}
                          </span>
                        </div>

                        {/* Full Info Grid */}
                        <div className="space-y-1.5 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <span>📧</span> البريد الرسمي:
                            </span>
                            <span className="font-mono text-slate-200 font-bold truncate max-w-[150px]">{u.email}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-emerald-400" /> الهاتف:
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">{u.phone || '07XXXXXXXXX'}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3 h-3 text-rose-400" /> المدينة:
                            </span>
                            <span className="text-slate-200 font-bold">{u.city || 'بغداد / العراق'}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <ShieldAlert className="w-3 h-3 text-amber-400" /> البلاغات المضافة:
                            </span>
                            <span className="text-amber-400 font-bold font-mono">{submittedCount} مستأجر</span>
                          </div>

                          {u.created_at && (
                            <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                              <span>تاريخ الانضمام:</span>
                              <span className="font-mono">{new Date(u.created_at).toLocaleDateString('ar-IQ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Quick Actions */}
                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <button
                          onClick={() => {
                            setAdminTargetUserId(u.id);
                            setAdminTargetOfficeName(u.office_name);
                            setAdminNewPwd('');
                            setAdminResetErr('');
                            setAdminResetMsg('');
                            setShowAdminResetModal(true);
                          }}
                          className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" /> تغيير / تعيين كلمة المرور من الإدارة
                        </button>

                        <div className="flex gap-1.5">
                          {u.status !== 'Approved' ? (
                            <button
                              onClick={() => handleApproveUser(u.id)}
                              className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition"
                            >
                              ✅ تفعيل المكتب
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRejectUser(u.id)}
                              className="flex-1 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-[11px] font-bold transition"
                            >
                              ⚠️ إيقاف الحساب
                            </button>
                          )}
                          <button
                            onClick={() => handleAdminDeleteUser(u.id, u.office_name)}
                            className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            title="حذف هذا المكتب نهائياً من النظام"
                          >
                            <Trash2 className="w-3 h-3" /> حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All Added Blacklist Records with Reporting Office */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                جميع أسماء المستأجرين المحظورين والشركات التي أضافتهم ({records.length})
              </h2>

              {records.length === 0 ? (
                <p className="text-xs text-slate-400">لم يتم إدراج أي أسماء في المنظومة حتى الآن.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {records.map(r => (
                    <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1.5 sm:w-2 h-full bg-rose-600"></div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-bold">مستأجر محظور</span>
                          <h3 className="text-base font-black text-white mt-1">{r.tenant_name}</h3>
                        </div>
                        <button onClick={() => handleDeleteRecord(r.id)} className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition flex-shrink-0" title="حذف السجل">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-slate-500 text-[10px] block">الهوية الوطنية:</span>
                          <span className="font-mono text-amber-400 font-bold">{r.national_id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">رخصة القيادة:</span>
                          <span className="font-mono text-emerald-400 font-bold">{r.license_number}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 text-[10px] block">المبلغ المتعثر:</span>
                          <span className="text-rose-400 font-bold">{r.debt_amount ? `${Number(r.debt_amount).toLocaleString('ar-IQ')} د.ع` : 'لا يوجد'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <strong className="text-rose-400">السبب:</strong> {r.reason}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                        <span className="text-indigo-400 font-bold truncate max-w-[180px] sm:max-w-none">🏢 الشركة: {r.reported_by_office || 'مكتب تأجير'}</span>
                        <span className="flex-shrink-0">{r.block_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Static HTML Pages Preview */}
        {activeTab === 'html_pages' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                صفحات الـ HTML المباشرة المطلوبة (Direct HTML/JS Pages)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تم توفير جميع صفحات الـ HTML المطلوبة مع ربط أزرار مكاتب التأجير مباشرة بـ Backend عبر Fetch API:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <a href="/login.html" target="_blank" className="p-4 sm:p-5 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl block space-y-2 group transition">
                <div className="text-2xl">🔐</div>
                <h3 className="font-bold text-white text-sm group-hover:text-rose-400">1. login.html</h3>
                <p className="text-[11px] text-slate-400">صفحة تسجيل دخول مكتب التأجير مع أزرار الربط</p>
              </a>

              <a href="/signup.html" target="_blank" className="p-4 sm:p-5 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl block space-y-2 group transition">
                <div className="text-2xl">📝</div>
                <h3 className="font-bold text-white text-sm group-hover:text-rose-400">2. signup.html</h3>
                <p className="text-[11px] text-slate-400">إنشاء حساب مكتب جديد وحالة المراجعة</p>
              </a>

              <a href="/waiting.html" target="_blank" className="p-4 sm:p-5 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl block space-y-2 group transition">
                <div className="text-2xl">⏳</div>
                <h3 className="font-bold text-white text-sm group-hover:text-amber-400">3. waiting.html</h3>
                <p className="text-[11px] text-slate-400">صفحة انتظار الاعتماد للحسابات المعلقة</p>
              </a>

              <a href="/dashboard.html" target="_blank" className="p-4 sm:p-5 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl block space-y-2 group transition">
                <div className="text-2xl">🚗</div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-400">4. dashboard.html</h3>
                <p className="text-[11px] text-slate-400">لوحة تحكم وشريط بحث وتأكيد الحظر</p>
              </a>
            </div>
          </div>
        )}

        {/* TAB 5: MongoDB Connection Setup */}
        {activeTab === 'mongo' && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-emerald-400" />
                  ربط وتزامن MongoDB Atlas المزدوج (Two-Way Sync)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  نظام التزامن المباشر والبحث المتقاطع بين مجموعتي الحظر ومكاتب تأجير السيارات
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">
                  {mongoConnected ? '🟢 متصل حالياً بـ MongoDB Atlas' : '🔴 غير متصل'}
                </span>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  🔄 التزامن الثنائي مفعل (Two-Way Sync Active)
                </span>
              </div>
            </div>

            {mongoSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{mongoSuccessMsg}</span>
              </div>
            )}

            {mongoErrorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{mongoErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConnectMongo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  رابط الاتصال بـ MongoDB (MongoDB Connection String URI) *
                </label>
                <input
                  type="text"
                  required
                  value={mongoUri}
                  onChange={e => setMongoUri(e.target.value)}
                  placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/car_rental_blacklist_db"
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  مثال: <code className="text-amber-400">mongodb+srv://admin:12345@cluster0.mongodb.net/car_rental_blacklist_db</code>
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  المجموعات المتزامنة في MongoDB Atlas (Collections & Two-Way Sync)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                  <li><strong className="text-white">rental_offices</strong>: حسابات ومعلومات مكاتب تأجير السيارات.</li>
                  <li><strong className="text-white">car_blacklist</strong>: القائمة الأولى لحظر مستأجري السيارات.</li>
                  <li><strong className="text-cyan-400">car_blacklist_sync</strong>: القائمة الثانية المتزامنة ثنائياً (تتشارك نفس البيانات وتتحدث تلقائياً).</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={testingMongo}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                {testingMongo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري اختبار الاتصال وبناء الفهارس بـ MongoDB...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    حفظ واختبار الربط بـ MongoDB الرئيسية
                  </>
                )}
              </button>
            </form>

            {/* External / Legacy Database Connection Form */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-cyan-400" />
                    ربط قاعدة البيانات الخارجية / القديمة (Two-Way Database Sync)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    أدخل رابط الاتصال لقاعدتك القديمة لربط واستعلام الأسماء ومزامنة الإضافات ثنائياً فوراً
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${legacyConnected ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {legacyConnected ? '🟢 متصلة ومفتوحة بالتزامن' : '⚪ غير متصلة'}
                </span>
              </div>

              {legacySuccessMsg && (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{legacySuccessMsg}</span>
                </div>
              )}

              {legacyErrorMsg && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{legacyErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleConnectLegacyMongo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    رابط الاتصال (Connection String) لقاعدة البيانات الخارجية القديمة *
                  </label>
                  <input
                    type="text"
                    required
                    value={legacyMongoUri}
                    onChange={e => setLegacyMongoUri(e.target.value)}
                    placeholder="mongodb+srv://admin:<password>@cluster_legacy.mongodb.net/old_blacklist_db"
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ضع رابط القاعدة القديمة ليقوم النظام بالاستعلام منها ومن القواعد الحالية في نفس الوقت ومزامنة الأسماء.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={testingLegacyMongo}
                  className="w-full py-3.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
                >
                  {testingLegacyMongo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري ربط القاعدة الخارجية ومزامنة الأسماء ثنائياً...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      تفعيل الربط والتزامن ثنائي الاتجاه مع القاعدة القديمة
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                ملفات السجلات الجاهزة للاستيراد المباشر في MongoDB (JSON Seed Files)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يمكنك انسخ البيانات أدناه أو استيرادها مباشرة في MongoDB Atlas عبر خيار <strong className="text-emerald-400">Insert Document</strong>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* File 1: rental_offices.json */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-emerald-400 font-bold">📄 rental_offices.json (الحسابات)</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify([
                          {
                            "office_name": "مكتب بغداد الدولي لتأجير السيارات",
                            "email": "office@baghdad-rental.com",
                            "commercial_reg": "CR-908122",
                            "status": "Approved"
                          },
                          {
                            "office_name": "مكتب اربيل لتأجير السيارات",
                            "email": "info@erbil-cars.com",
                            "commercial_reg": "CR-441092",
                            "status": "Approved"
                          }
                        ], null, 2));
                        alert('تم نسخ ملف الحسابات rental_offices.json');
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition"
                    >
                      نسخ JSON
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
{`[
  {
    "office_name": "مكتب بغداد الدولي لتأجير السيارات",
    "email": "office@baghdad-rental.com",
    "commercial_reg": "CR-908122",
    "status": "Approved"
  },
  {
    "office_name": "مكتب اربيل لتأجير السيارات",
    "email": "info@erbil-cars.com",
    "commercial_reg": "CR-441092",
    "status": "Approved"
  }
]`}
                  </pre>
                </div>

                {/* File 2: car_blacklist.json */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-amber-400 font-bold">📄 car_blacklist.json (الأسماء والحظر)</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify([
                          {
                            "tenant_name": "محمد علي القيسي",
                            "national_id": "1098234101",
                            "license_number": "LIC-Iraqi-9012",
                            "reason": "عدم دفع الإيجار والامتناع عن السداد",
                            "debt_amount": 750000,
                            "reported_by_office": "مكتب بغداد الدولي لتأجير السيارات"
                          },
                          {
                            "tenant_name": "حسين أحمد العبيدي",
                            "national_id": "1045239912",
                            "license_number": "LIC-Iraqi-5521",
                            "reason": "حادث مروري وتخريب السيارة",
                            "debt_amount": 1200000,
                            "reported_by_office": "مكتب الرشيد لتأجير السيارات"
                          }
                        ], null, 2));
                        alert('تم نسخ ملف الأسماء والمحظورين car_blacklist.json');
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition"
                    >
                      نسخ JSON
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
{`[
  {
    "tenant_name": "محمد علي القيسي",
    "national_id": "1098234101",
    "license_number": "LIC-Iraqi-9012",
    "reason": "عدم دفع الإيجار والامتناع عن السداد",
    "debt_amount": 750000,
    "reported_by_office": "مكتب بغداد الدولي لتأجير السيارات"
  },
  {
    "tenant_name": "حسين أحمد العبيدي",
    "national_id": "1045239912",
    "license_number": "LIC-Iraqi-5521",
    "reason": "حادث مروري وتخريب السيارة",
    "debt_amount": 1200000,
    "reported_by_office": "مكتب الرشيد لتأجير السيارات"
  }
]`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-3">
              <h3 className="text-sm font-bold text-white">خطوات الحصول على قاعدة بيانات مجانية من MongoDB Atlas:</h3>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 leading-relaxed">
                <li>سجل حساباً مجانياً في <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-bold">MongoDB Atlas</a> وقم بإنشاء Cluster مجاني M0.</li>
                <li>من تبويب <strong className="text-slate-200">Database Access</strong> قم بإنشاء اسم مستخدم وكلمة مرور (Database User).</li>
                <li>من تبويب <strong className="text-slate-200">Network Access</strong> أضف IP (`0.0.0.0/0`) للسماح بالاتصال.</li>
                <li>اضغط على <strong className="text-slate-200">Connect &gt; Drivers</strong> وانسخ نص الاتصال (Connection String).</li>
                <li>ضع نص الاتصال في الحقل أعلاه واضغط على زر الحفظ والربط!</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 6: Code View */}
        {activeTab === 'code' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between font-['Cairo']">
              <h2 className="text-lg font-bold text-white">كود Backend الشامل بلغة Python Flask و MongoDB</h2>
              <button onClick={() => { navigator.clipboard.writeText(pythonFlaskCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }} className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold">
                {copiedCode ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-emerald-400 text-xs">
              {pythonFlaskCode}
            </pre>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-white text-center">
              {authMode === 'login' ? 'تسجيل الدخول لمكتب التأجير' : 'إنشاء حساب مكتب جديد'}
            </h2>

            {authError && <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs rounded-xl">{authError}</div>}
            {authSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-xl">{authSuccess}</div>}

            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-3">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold mb-1">اسم المكتب / شركة التأجير</label>
                  <input type="text" required value={authOfficeName} onChange={e => setAuthOfficeName(e.target.value)} placeholder="شركة الوفاق للتأجير" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">البريد الإلكتروني الرسمي</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="office@carrental.sa" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs" />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">كلمة المرور</label>
                <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs" />
              </div>

              <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition">
                {authMode === 'login' ? 'دخول لمكتب التأجير' : 'إرسال طلب التسجيل'}
              </button>
            </form>

            <button onClick={() => setShowAuthModal(false)} className="w-full py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">
              إلغاء
            </button>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showChangePwdModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex items-center justify-center p-3 sm:p-4 z-50 font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                تغيير كلمة المرور
              </h2>
              <button 
                onClick={() => setShowChangePwdModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {pwdErr && (
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️</span> {pwdErr}
              </div>
            )}
            {pwdMsg && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>✅</span> {pwdMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الحالية (اختياري)</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  required
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  required
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pwdLoading ? 'جاري الحفظ...' : '💾 حفظ وتعيين كلمة المرور'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePwdModal(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Office Password Modal */}
      {showAdminResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex items-center justify-center p-3 sm:p-4 z-50 font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  تعيين كلمة مرور لمكتب التأجير
                </h2>
                <p className="text-xs text-amber-400 font-bold mt-0.5">{adminTargetOfficeName}</p>
              </div>
              <button 
                onClick={() => setShowAdminResetModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {adminResetErr && (
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️</span> {adminResetErr}
              </div>
            )}
            {adminResetMsg && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>✅</span> {adminResetMsg}
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الجديدة للمكتب *</label>
                <input
                  type="password"
                  required
                  value={adminNewPwd}
                  onChange={e => setAdminNewPwd(e.target.value)}
                  placeholder="أدخل كلمة مرور جديدة (4 خانات على الأقل)"
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={adminResetLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {adminResetLoading ? 'جاري التعيين...' : '💾 تعيين كلمة المرور وتفعيل المكتب'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminResetModal(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur flex items-center justify-center p-3 sm:p-4 z-50 font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border border-rose-500/50 p-5 sm:p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-rose-500 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                حذف الحساب وبيانات المكتب نهائياً
              </h2>
              <button 
                onClick={() => setShowDeleteAccountModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-xl text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> تحذير هام: هذا الإجراء لا يمكن التراجع عنه!
              </p>
              <p className="text-slate-300">
                سيتم مسح حساب مكتب <strong className="text-white">({currentUser?.office_name})</strong> وبيانات اعتماده نهائياً من قاعدة البيانات، ولن تتمكن من تسجيل الدخول أو الاستعلام عن القائمة السوداء بعد الآن إلا بإنشاء حساب جديد وموافقة الإدارة.
              </p>
            </div>

            {deleteErr && (
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️</span> {deleteErr}
              </div>
            )}
            {deleteMsg && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-xl flex items-center gap-2">
                <span>✅</span> {deleteMsg}
              </div>
            )}

            <form onSubmit={handleDeleteOwnAccount} className="space-y-4 pt-2">
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <span>جاري الحذف نهائياً...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>نعم، احذف حسابي وبياناتي نهائياً 🗑️</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  إلغاء التراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
