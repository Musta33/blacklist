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
  Database
} from 'lucide-react';

interface User {
  id: string;
  office_name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'Pending' | 'Approved' | 'Rejected';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'add' | 'admin' | 'html_pages' | 'code' | 'mongo'>('search');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>(localStorage.getItem('tb_token') || '');

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

  // Auth Forms
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOfficeName, setAuthOfficeName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

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
      const res = await fetch('/api/auth/me', {
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
      const res = await fetch(`/api/blacklist/search?q=${encodeURIComponent(query)}`, {
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
      const res = await fetch('/api/admin/users', {
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
      const res = await fetch('/api/auth/login', {
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
      const res = await fetch('/api/auth/signup', {
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

  // Quick Login Demo
  const loginAsAdmin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
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
      const res = await fetch('/api/auth/login', {
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
    setCurrentUser(null);
  };

  // Approve User
  const handleApproveUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/approve', {
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

  // Add Record
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSuccessMsg('');
    setAddErrorMsg('');

    try {
      const res = await fetch('/api/blacklist/add', {
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
    if (!confirm('هل أنت تأكد من تسوية الوضع وحذف المستأجر من القائمة؟')) return;
    try {
      const res = await fetch('/api/blacklist/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ record_id: id })
      });
      const data = await res.json();
      if (data.success) executeSearch();
    } catch (e) { console.error(e); }
  };

  // Connect MongoDB Atlas
  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMongoSuccessMsg('');
    setMongoErrorMsg('');
    setTestingMongo(true);

    try {
      const res = await fetch('/api/mongo/connect', {
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
      const res = await fetch('/api/mongo/connect_external', {
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

  const pendingCount = allUsers.filter(u => u.status === 'Pending').length;
  const totalDebt = records.reduce((s, r) => s + (r.debt_amount || 0), 0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-600 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-rose-900/30">
              🏎️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">منظومة حظر مستأجري السيارات</h1>
                <span className="bg-rose-500/10 text-rose-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  Car Rental Blacklist
                </span>
              </div>
              <p className="text-xs text-slate-400">شبكة مكاتب تأجير السيارات الموحدة للاستعلام عن السجل الائتماني ورخص القيادة</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-2">
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-200 block">{currentUser.office_name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">مكتب مفعل (Approved)</span>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-lg bg-slate-700/60 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 transition">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={loginAsApprovedOffice} className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold transition">
                  دخول بمكتب مفعل تجريبي 🔑
                </button>
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition">
                  تسجيل الدخول لمكتبك
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-slate-800 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto py-2">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'search' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-4 h-4" />
                استعلام مستأجري السيارات
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'add' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                إضافة مستأجر محظور
              </button>

              <button
                onClick={() => { loginAsAdmin(); setActiveTab('admin'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition relative ${
                  activeTab === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                موافقات مكاتب السيارات (/api/admin/approve)
                {pendingCount > 0 && <span className="bg-amber-500 text-slate-950 text-[10px] font-black rounded-full px-2 py-0.5">{pendingCount}</span>}
              </button>

              <button
                onClick={() => setActiveTab('html_pages')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'html_pages' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                معاينة صفحات الـ HTML المباشرة
              </button>

              <button
                onClick={() => setActiveTab('mongo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'mongo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-400" />
                ربط MongoDB Atlas 🍃
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'code' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-4 h-4 text-blue-400" />
                كود Python Flask المحدث
              </button>
            </nav>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>MongoDB Collection: rental_offices & car_blacklist</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {blockedMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{blockedMsg}</span>
            </div>
            <button onClick={loginAsApprovedOffice} className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold">
              دخول سريع بمكتب معتمد
            </button>
          </div>
        )}

        {/* TAB 1: Search */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">مستأجري السيارات المحظورين</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{records.length}</p>
                </div>
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400">
                  <Car className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">إجمالي المبالغ والتلفيات المتعثرة</p>
                  <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                    {totalDebt.toLocaleString('ar-SA')} <span className="text-sm font-normal text-slate-400">د.ع</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">طلبات المكاتب بانتظار الاعتماد</p>
                  <p className="text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الهوية الوطنية / رقم جواز السفر / رقم رخصة القيادة / اسم المستأجر..."
                  className="w-full pl-4 pr-12 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            {/* Records Grid */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                نتائج السجل الائتماني لمستأجري المركبات ({records.length})
              </h2>

              {loadingRecords ? (
                <div className="text-center py-12 text-slate-400">جاري الاستعلام المباشر من قاعدة بيانات MongoDB...</div>
              ) : records.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
                  <Car className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-bold">لم يتم العثور على حظر مسجل لهذه البيانات</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {records.map(r => (
                    <div key={r?.id || Math.random()} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full bg-rose-600"></div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                            مستأجر محظور
                          </span>
                          <h3 className="text-xl font-black text-white">{r?.tenant_name || 'مستأجر غير معروف'}</h3>
                        </div>
                        <button
                          onClick={() => handleDeleteRecord(r?.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="تسوية وضع المستأجر وحذفه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-500 block">الهوية الوطنية / الجواز:</span>
                          <span className="font-mono text-amber-400 font-bold">{r?.national_id || 'غير متوفرة'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">رقم رخصة القيادة:</span>
                          <span className="font-mono text-emerald-400 font-bold">{r?.license_number || 'غير مسجل'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block">المبلغ المتعثر:</span>
                          <span className="text-rose-400 font-extrabold text-sm">{r?.debt_amount ? `${Number(r.debt_amount).toLocaleString('ar-IQ')} د.ع` : 'لا توجد مالية'}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                        <strong className="text-rose-400 block mb-0.5">سبب الحظر:</strong>
                        <p className="text-slate-300">{r?.reason || 'بدون سبب محدد'}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                        <span>المُبلغ: {r?.reported_by_office || 'مكتب تأجير سيارات'}</span>
                        <span>{r?.block_date || 'تاريخ غير معروف'}</span>
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
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-rose-500" />
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

        {/* TAB 3: Admin User Approvals */}
        {activeTab === 'admin' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              لوحة اعتماد موافقات مكاتب السيارات الجدد (/api/admin/approve)
            </h2>

            {adminActionMsg && <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold">{adminActionMsg}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allUsers.filter(u => u.status === 'Pending').map(u => (
                <div key={u.id} className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 space-y-3">
                  <h3 className="font-bold text-white text-base">{u.office_name}</h3>
                  <p className="text-xs text-slate-400">{u.email}</p>
                  <button onClick={() => handleApproveUser(u.id)} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition">
                    اعتماد وموافقة المكتب الآن ✅
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Static HTML Pages Preview */}
        {activeTab === 'html_pages' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-6 h-6 text-emerald-400" />
                صفحات الـ HTML المباشرة المطلوبة (Direct HTML/JS Pages)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تم توفير جميع صفحات الـ HTML المطلوبة مع ربط أزرار مكاتب التأجير مباشرة بـ Backend عبر Fetch API:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/login.html" target="_blank" className="p-5 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl block space-y-2 group transition">
                <div className="text-2xl">🔐</div>
                <h3 className="font-bold text-white text-sm group-hover:text-rose-400">1. login.html</h3>
                <p className="text-[11px] text-slate-400">صفحة تسجيل دخول مكتب التأجير مع أزرار الربط</p>
              </a>

              <a href="/signup.html" target="_blank" className="p-5 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl block space-y-2 group transition">
                <div className="text-2xl">📝</div>
                <h3 className="font-bold text-white text-sm group-hover:text-rose-400">2. signup.html</h3>
                <p className="text-[11px] text-slate-400">إنشاء حساب مكتب جديد وحالة المراجعة</p>
              </a>

              <a href="/waiting.html" target="_blank" className="p-5 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl block space-y-2 group transition">
                <div className="text-2xl">⏳</div>
                <h3 className="font-bold text-white text-sm group-hover:text-amber-400">3. waiting.html</h3>
                <p className="text-[11px] text-slate-400">صفحة انتظار الاعتماد للحسابات المعلقة</p>
              </a>

              <a href="/dashboard.html" target="_blank" className="p-5 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl block space-y-2 group transition">
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
    </div>
    </ErrorBoundary>
  );
}
