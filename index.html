import os
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
from flask_cors import CORS
from pymongo import MongoClient, errors
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("SECRET_KEY", "car_rental_blacklist_secret_key_2026")
CORS(app, supports_credentials=True)

# ---------------------------------------------------------
# 1. تهيئة الاتصال بـ MongoDB والتزامن المزدوج بين القاعدة الحالية والقاعدة الخارجية (Two-Way Sync Engine)
# ---------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://admin:mustafa2002@cluster0.wyofarq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0")
LEGACY_MONGO_URI = os.getenv("LEGACY_MONGO_URI", "mongodb+srv://admin:mustafa2002@cluster0.wyofarq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0")

external_client = None
external_db = None
external_blacklist_col = None
external_renters_col = None

def sync_both_collections(db_instance):
    """دالة المزامنة الثنائية الكاملة بين مجموعتي الحظر القائمة الحالية (car_blacklist & car_blacklist_sync)"""
    try:
        col1 = db_instance["car_blacklist"]
        col2 = db_instance["car_blacklist_sync"]

        # مزامنة العناصر من col1 إلى col2
        for doc in col1.find():
            nat_id = doc.get('national_id')
            lic_num = doc.get('license_number')
            t_name = doc.get('tenant_name')

            query_filter = {}
            if nat_id: query_filter["national_id"] = nat_id
            elif lic_num: query_filter["license_number"] = lic_num
            elif t_name: query_filter["tenant_name"] = t_name

            if query_filter:
                clean_doc = {k: v for k, v in doc.items() if k != '_id'}
                clean_doc["synced_at"] = datetime.now(timezone.utc).isoformat()
                col2.update_one(query_filter, {"$set": clean_doc}, upsert=True)

        # مزامنة العكس من col2 إلى col1
        for doc in col2.find():
            nat_id = doc.get('national_id')
            lic_num = doc.get('license_number')
            t_name = doc.get('tenant_name')

            query_filter = {}
            if nat_id: query_filter["national_id"] = nat_id
            elif lic_num: query_filter["license_number"] = lic_num
            elif t_name: query_filter["tenant_name"] = t_name

            if query_filter:
                clean_doc = {k: v for k, v in doc.items() if k != '_id'}
                clean_doc["synced_at"] = datetime.now(timezone.utc).isoformat()
                col1.update_one(query_filter, {"$set": clean_doc}, upsert=True)

    except Exception as sync_err:
        print(f"⚠️ تنبيه تزامن القوائم المحلية: {sync_err}")

def sync_external_database():
    """دالة التزامن الثنائي المباشر مع دعم Schema Mapping للأنظمة القديمة (Cross-Database Sync)"""
    global external_blacklist_col, blacklist_collection, blacklist_sync_collection
    if not external_blacklist_col:
        return
    try:
        # 1. المزامنة من القواعد الحالية إلى القاعدة الخارجية مع دعم كلاً من الحقول القديمة والجديدة
        for doc in blacklist_collection.find():
            nat_id = doc.get('national_id')
            lic_num = doc.get('license_number')
            t_name = doc.get('tenant_name') or doc.get('name')

            query_filter = {}
            if nat_id: query_filter["national_id"] = nat_id
            elif lic_num: query_filter["license_number"] = lic_num
            elif t_name: query_filter["$or"] = [{"tenant_name": t_name}, {"name": t_name}]

            if query_filter:
                clean_doc = {k: v for k, v in doc.items() if k != '_id'}
                clean_doc["name"] = doc.get('tenant_name') or doc.get('name', '')
                clean_doc["tenant_name"] = doc.get('tenant_name') or doc.get('name', '')
                clean_doc["phoneNumber"] = doc.get('phone') or doc.get('phoneNumber', '')
                clean_doc["phone"] = doc.get('phone') or doc.get('phoneNumber', '')
                clean_doc["blockReason"] = doc.get('reason') or doc.get('blockReason') or doc.get('block_reason', '')
                clean_doc["reason"] = doc.get('reason') or doc.get('blockReason') or doc.get('block_reason', '')
                clean_doc["cross_db_synced_at"] = datetime.now(timezone.utc).isoformat()
                external_blacklist_col.update_one(query_filter, {"$set": clean_doc}, upsert=True)

        # 2. المزامنة المعاكسة من القاعدة الخارجية إلى القواعد الحالية
        for doc in external_blacklist_col.find():
            nat_id = doc.get('national_id')
            lic_num = doc.get('license_number')
            t_name = doc.get('tenant_name') or doc.get('name')

            query_filter = {}
            if nat_id: query_filter["national_id"] = nat_id
            elif lic_num: query_filter["license_number"] = lic_num
            elif t_name: query_filter["tenant_name"] = t_name

            if query_filter:
                clean_doc = {k: v for k, v in doc.items() if k != '_id'}
                clean_doc["tenant_name"] = doc.get('tenant_name') or doc.get('name', 'مستأجر محظور')
                clean_doc["phone"] = doc.get('phone') or doc.get('phoneNumber', '')
                clean_doc["reason"] = doc.get('reason') or doc.get('blockReason') or doc.get('block_reason', 'حظر إداري')
                clean_doc["cross_db_synced_at"] = datetime.now(timezone.utc).isoformat()
                
                blacklist_collection.update_one(query_filter, {"$set": clean_doc}, upsert=True)
                if blacklist_sync_collection:
                    blacklist_sync_collection.update_one(query_filter, {"$set": clean_doc}, upsert=True)

        print("🔄 تم إكمال التزامن الثنائي بنجاح ومطابقة حقول (name, phoneNumber, blockReason).")
    except Exception as e:
        print(f"⚠️ خطأ أثناء التزامن الثنائي مع القاعدة الخارجية: {e}")

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
    
    # المجموعات (Collections) الخاصّة بمكاتب وشركات تأجير السيارات مع التزامن الثنائي
    users_collection = db["rental_offices"]           # حسابات مكاتب السيارات
    blacklist_collection = db["car_blacklist"]        # قائمة حظر مستأجري السيارات الأولى
    blacklist_sync_collection = db["car_blacklist_sync"] # قائمة حظر مستأجري السيارات الثانية (المتزامنة)
    
    # إنشاء الفهارس الفريدة وعمليات التسريع (Indexes) في المجموعتين
    users_collection.create_index("email", unique=True)
    blacklist_collection.create_index("national_id")
    blacklist_collection.create_index("license_number")
    blacklist_collection.create_index("tenant_name")

    blacklist_sync_collection.create_index("national_id")
    blacklist_sync_collection.create_index("license_number")
    blacklist_sync_collection.create_index("tenant_name")

    # إضافة بيانات أولية تلقائية إذا كانت القوائم فارغة
    if users_collection.count_documents({}) == 0:
        users_collection.insert_one({
            "office_name": "مكتب بغداد الدولي لتأجير السيارات",
            "email": "office@baghdad-rental.com",
            "password": generate_password_hash("123456"),
            "commercial_reg": "CR-908122",
            "status": "Approved",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    if blacklist_collection.count_documents({}) == 0 and blacklist_sync_collection.count_documents({}) == 0:
        seed_data = [
            {
                "tenant_name": "محمد علي القيسي",
                "national_id": "1098234101",
                "license_number": "LIC-Iraqi-9012",
                "reason": "عدم دفع الإيجار والامتناع عن السداد",
                "debt_amount": 750000,
                "reported_by_office": "مكتب بغداد الدولي لتأجير السيارات",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "tenant_name": "حسين أحمد العبيدي",
                "national_id": "1045239912",
                "license_number": "LIC-Iraqi-5521",
                "reason": "حادث مروري وتخريب السيارة",
                "debt_amount": 1200000,
                "reported_by_office": "مكتب الرشيد لتأجير السيارات",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        blacklist_collection.insert_many(seed_data)

    # تشغيل التزامن الثنائي الأولي
    sync_both_collections(db)

    # الاتصال التلقائي بالقاعدة الخارجية والتزامن الثنائي اللحظي
    if LEGACY_MONGO_URI:
        try:
            external_client = MongoClient(LEGACY_MONGO_URI, serverSelectionTimeoutMS=5000)
            external_db = external_client.get_database()
            possible_cols = external_db.list_collection_names()
            target_col = "blocklists"
            if "blocklists" in possible_cols:
                target_col = "blocklists"
            elif "car_blacklist" in possible_cols:
                target_col = "car_blacklist"
            elif "blacklist" in possible_cols:
                target_col = "blacklist"

            external_blacklist_col = external_db[target_col]
            external_blacklist_col.create_index("national_id")
            external_blacklist_col.create_index("license_number")
            external_blacklist_col.create_index("tenant_name")
            external_blacklist_col.create_index("phone")

            sync_external_database()
            print(f"✅ تم الاتصال المباشر بالقاعدة الخارجية ({external_db.name}) ومجموعة ({target_col}) وتفعيل التزامن ثنائي الاتجاه!")
        except Exception as ext_init_err:
            print(f"⚠️ فشل الاتصال بالقاعدة الخارجية عند التشغيل: {ext_init_err}")

    print("✅ تم الاتصال بـ MongoDB وبناء التزامن الثنائي (Two-Way Sync) بين قواعد البيانات بنجاح.")
except Exception as e:
    print(f"❌ خطأ أثناء الاتصال بقاعدة بيانات MongoDB: {e}")

# ---------------------------------------------------------
# جدار الحماية الحاسم (Middleware / Decorator)
# ---------------------------------------------------------
def approved_required(f):
    """
    جدار حماية أمني مشدد لمكاتب التأجير:
    يتحقق من أن المستخدم:
    1. مسجل الدخول بالفعل وله جلسة نَشطة (Session).
    2. حالة مكتب التأجير هي "Approved" في قاعدة بيانات MongoDB.
    إذا كانت الحالة "Pending" أو غير مسجل، يُحظر إرجاع أي بيانات وتُرجع استجابة 401 Unauthorized.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({
                "success": False,
                "error_code": "UNAUTHORIZED",
                "message": "عفواً، يرجى تسجيل الدخول لمكتب التأجير أولاً للوصول للقائمة."
            }), 401

        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return jsonify({"success": False, "message": "رمز الجلسة غير صالح."}), 401

        if not user:
            session.clear()
            return jsonify({"success": False, "message": "حساب المكتب غير موجود بالنظام."}), 401

        if user.get('status') != 'Approved':
            return jsonify({
                "success": False,
                "error_code": "ACCOUNT_NOT_APPROVED",
                "status": user.get('status', 'Pending'),
                "message": "حساب مكتب التأجير قيد المراجعة والموافقة من الإدارة حتى الآن."
            }), 401

        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """جدار حماية لعمليات الإدارة العُليا للمنظومة"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id or session.get('role') != 'admin':
            return jsonify({
                "success": False,
                "message": "غير مسموح. هذه العملية مقتصرة على إدارة المنظومة."
            }), 403
        return f(*args, **kwargs)
    return decorated_function

# ---------------------------------------------------------
# 2. مسارات إدارة الحسابات والوثوقية (Auth Endpoints)
# ---------------------------------------------------------

# تسجيل مكتب تأجير جديد (/api/auth/signup)
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json() or {}
        office_name = data.get('office_name') or data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        phone = data.get('phone', '').strip()
        city = data.get('city', 'الرياض').strip()

        if not office_name or not email or not password:
            return jsonify({
                "success": False,
                "message": "جميع البيانات الأساسية مطلوبة (اسم المكتب/الشركة، البريد، كلمة المرور)."
            }), 400

        if len(password) < 6:
            return jsonify({"success": False, "message": "كلمة المرور يجب ألا تقل عن 6 أحرف."}), 400

        hashed_password = generate_password_hash(password)

        # الحساب الأول يكون مدير المنظومة تلقائياً ومفعل، وباقي المكاتب Pending
        user_count = users_collection.count_documents({})
        initial_role = 'admin' if user_count == 0 else 'user'
        initial_status = 'Approved' if user_count == 0 else 'Pending'

        office_doc = {
            "office_name": office_name,
            "email": email,
            "password": hashed_password,
            "phone": phone,
            "city": city,
            "role": initial_role,
            "status": initial_status,  # الحالة التلقائية: Pending بانتظار موافقة الإدارة
            "created_at": datetime.utcnow()
        }

        result = users_collection.insert_one(office_doc)

        msg = "تم تسجيل طلب مكتب التأجير بنجاح! الحساب قيد المراجعة والموافقة من الإدارة." if initial_status == 'Pending' else "تم إنشاء وتفعيل حساب إدارة النظام بنجاح."

        return jsonify({
            "success": True,
            "message": msg,
            "user_id": str(result.inserted_id),
            "status": initial_status
        }), 201

    except errors.DuplicateKeyError:
        return jsonify({"success": False, "message": "البريد الإلكتروني مُسجل بالفعل لمكتب آخر."}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"حدث خطأ أثناء التسجيل: {str(e)}"}), 500

# تسجيل دخول مكتب التأجير (/api/auth/login)
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({"success": False, "message": "يرجى أدخال البريد الإلكتروني وكلمة المرور."}), 400

        user = users_collection.find_one({"email": email})

        if not user or not check_password_hash(user['password'], password):
            return jsonify({"success": False, "message": "بيانات الدخول غير صحيحة."}), 401

        # يمنع الدخول تماماً إذا كانت الحالة "Pending"
        if user.get('status') == 'Pending':
            return jsonify({
                "success": False,
                "status": "Pending",
                "message": "الحساب قيد المراجعة والموافقة من الإدارة. يرجى الانتظار حتى يتم الاعتماد."
            }), 403

        if user.get('status') == 'Rejected':
            return jsonify({
                "success": False,
                "status": "Rejected",
                "message": "عذراً، تم رفض طلب تسجيل هذا المكتب من قبل الإدارة."
            }), 403

        # حفظ الجلسة
        session['user_id'] = str(user['_id'])
        session['email'] = user['email']
        session['name'] = user.get('office_name', user.get('name'))
        session['role'] = user.get('role', 'user')

        return jsonify({
            "success": True,
            "message": f"أهلاً بك مجدداً {user.get('office_name', user.get('name'))}",
            "user": {
                "id": str(user['_id']),
                "office_name": user.get('office_name', user.get('name')),
                "email": user['email'],
                "role": user.get('role', 'user'),
                "status": user.get('status', 'Approved')
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# تسجيل الخروج (/api/auth/logout)
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "تم تسجيل الخروج بنجاح."}), 200

# معلومات الجلسة الحالية (/api/auth/me)
@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"authenticated": False}), 200
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            session.clear()
            return jsonify({"authenticated": False}), 200

        return jsonify({
            "authenticated": True,
            "user": {
                "id": str(user['_id']),
                "office_name": user.get('office_name', user.get('name')),
                "email": user['email'],
                "role": user.get('role', 'user'),
                "status": user.get('status', 'Approved')
            }
        }), 200
    except Exception:
        return jsonify({"authenticated": False}), 200

# موافقة الإدارة على الحسابات (/api/admin/approve)
@app.route('/api/admin/approve', methods=['POST'])
@admin_required
def approve_user():
    try:
        data = request.get_json() or {}
        target_user_id = data.get('user_id')

        if not target_user_id:
            return jsonify({"success": False, "message": "معرّف المكتب مطلوب."}), 400

        result = users_collection.update_one(
            {"_id": ObjectId(target_user_id)},
            {"$set": {
                "status": "Approved",
                "approved_at": datetime.utcnow(),
                "approved_by": session.get('user_id')
            }}
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "message": "المكتب غير موجود."}), 404

        return jsonify({
            "success": True,
            "message": "تمت الموافقة على مكتب التأجير وتفعيل حسابه بنجاح. يمكنه الآن تسجيل الدخول والاستعلام."
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ---------------------------------------------------------
# 3. مسارات حظر مستأجري السيارات (Car Rental Blacklist Endpoints)
# ---------------------------------------------------------

# إضافة مستأجر سيارات محظور (/api/blacklist/add)
@app.route('/api/blacklist/add', methods=['POST'])
@approved_required
def add_to_blacklist():
    """
    تستقبل بيانات الحظر وتحفظها مع التزامن الثنائي اللحظي المباشر في:
    1. القائمة الأولى المحليه (car_blacklist)
    2. القائمة الثانية المحليه (car_blacklist_sync)
    3. قاعدة البيانات الخارجية القديمة (إذا كانت مربوطة)
    """
    try:
        data = request.get_json() or {}
        
        tenant_name = data.get('tenant_name', '').strip()
        national_id = data.get('national_id', '').strip()
        license_number = data.get('license_number', '').strip()
        reason = data.get('reason', '').strip()
        car_model = data.get('car_model', '').strip()
        debt_amount = data.get('debt_amount', 0)
        phone = data.get('phone', '').strip()
        block_date = data.get('block_date', datetime.utcnow().strftime('%Y-%m-%d'))

        if not tenant_name or not national_id or not license_number or not reason:
            return jsonify({
                "success": False,
                "message": "بيانات غير مكتملة. الحقول الإلزامية هي: اسم المستأجر، رقم الهوية/الجواز، رقم رخصة القيادة، وسبب الحظر."
            }), 400

        now_iso = datetime.utcnow().isoformat()
        blacklist_doc = {
            "tenant_name": tenant_name,
            "national_id": national_id,
            "license_number": license_number,
            "phone": phone,
            "reason": reason,
            "car_model": car_model,
            "debt_amount": float(debt_amount) if debt_amount else 0.0,
            "block_date": block_date,
            "reported_by": {
                "office_id": str(request.current_user['_id']),
                "office_name": request.current_user.get('office_name', request.current_user.get('name')),
                "email": request.current_user['email']
            },
            "created_at": now_iso,
            "synced_at": now_iso
        }

        # 1. الإضافة/التحديث في القائمة الأولى القائمة الحالية (car_blacklist)
        filter_query = {"$or": [{"national_id": national_id}, {"license_number": license_number}]}
        blacklist_collection.update_one(filter_query, {"$set": blacklist_doc}, upsert=True)

        # 2. المزامنة في القائمة الثانية القائمة الحالية (car_blacklist_sync)
        if blacklist_sync_collection:
            blacklist_sync_collection.update_one(filter_query, {"$set": blacklist_doc}, upsert=True)

        # 3. المزامنة الخارجية مع قاعدة البيانات القديمة iraqrentl مع دعم Schema Mapping
        if external_blacklist_col:
            try:
                ext_doc = {
                    **blacklist_doc,
                    "name": tenant_name,
                    "phoneNumber": phone,
                    "blockReason": reason,
                    "block_reason": reason
                }
                external_blacklist_col.update_one(filter_query, {"$set": ext_doc}, upsert=True)
            except Exception as ext_err:
                print(f"⚠️ فشل تحديث القاعدة الخارجية: {ext_err}")

        return jsonify({
            "success": True,
            "message": "✅ تم إدراج ومزامنة مستأجر السيارات بنجاح في قاعدة البيانات الحالية والقاعدة الخارجية (Two-Way Sync Active).",
            "synced": True,
            "external_synced": external_blacklist_col is not None
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": f"خطأ أثناء الإضافة والمزامنة: {str(e)}"}), 500

# البحث والاستعلام السريع المتقاطع من القاعدة الحالية والقاعدة الخارجية (/api/blacklist/search)
@app.route('/api/blacklist/search', methods=['GET', 'POST'])
@approved_required
def search_blacklist():
    """
    فحص واستعلام متقاطع يجمع الأسماء من قاعدة البيانات الحالية والقاعدة الخارجية القديمة بدون تكرار مع مطابقة حقول Schema Mapping (name, phoneNumber, blockReason).
    """
    try:
        data = request.get_json() if request.method == 'POST' else {}
        query = (
            data.get('query') or
            data.get('national_id') or
            data.get('license_number') or
            request.args.get('query') or
            request.args.get('q') or
            request.args.get('national_id') or
            request.args.get('license_number') or
            ''
        ).strip()

        or_conditions = []
        ext_or_conditions = []
        if query:
            or_conditions = [
                {"national_id": {"$regex": query, "$options": "i"}},
                {"license_number": {"$regex": query, "$options": "i"}},
                {"tenant_name": {"$regex": query, "$options": "i"}},
                {"phone": {"$regex": query, "$options": "i"}}
            ]
            ext_or_conditions = [
                {"national_id": {"$regex": query, "$options": "i"}},
                {"license_number": {"$regex": query, "$options": "i"}},
                {"tenant_name": {"$regex": query, "$options": "i"}},
                {"name": {"$regex": query, "$options": "i"}},
                {"phone": {"$regex": query, "$options": "i"}},
                {"phoneNumber": {"$regex": query, "$options": "i"}},
                {"reason": {"$regex": query, "$options": "i"}},
                {"blockReason": {"$regex": query, "$options": "i"}},
                {"block_reason": {"$regex": query, "$options": "i"}}
            ]

        filter_query = {"$or": or_conditions} if or_conditions else {}
        ext_filter_query = {"$or": ext_or_conditions} if ext_or_conditions else {}

        # 1. البحث في القواعد الحالية
        cursor1 = list(blacklist_collection.find(filter_query))
        cursor2 = list(blacklist_sync_collection.find(filter_query)) if blacklist_sync_collection else []

        # 2. البحث في القاعدة الخارجية القديمة إن كانت متصلة مع Schema Mapping
        cursor3 = []
        if external_blacklist_col:
            try:
                cursor3 = list(external_blacklist_col.find(ext_filter_query))
            except Exception as ext_search_err:
                print(f"⚠️ تنبيه بحث القاعدة الخارجية: {ext_search_err}")

        merged_map = {}
        
        def process_docs(docs, source_label):
            for doc in docs:
                t_name = doc.get('tenant_name') or doc.get('name') or doc.get('fullName') or 'مستأجر محظور'
                nat_id = doc.get('national_id', '')
                lic_num = doc.get('license_number', '')
                phone_num = doc.get('phone') or doc.get('phoneNumber') or doc.get('mobile') or ''
                block_rsn = doc.get('reason') or doc.get('blockReason') or doc.get('block_reason') or 'حظر من المنظومة'

                doc_id = str(doc.get('_id', '')) or str(doc.get('id', ''))
                key = doc_id
                if key not in merged_map:
                    merged_map[key] = {
                        "id": doc_id,
                        "tenant_name": t_name,
                        "national_id": nat_id,
                        "license_number": lic_num,
                        "phone": phone_num,
                        "reason": block_rsn,
                        "block_reason": block_rsn,
                        "car_model": doc.get('car_model', ''),
                        "debt_amount": doc.get('debt_amount', 0),
                        "block_date": doc.get('block_date', ''),
                        "reported_by_office": doc.get('reported_by', {}).get('office_name', 'مكتب تأجير سيارات') if isinstance(doc.get('reported_by'), dict) else doc.get('reported_by_office', 'مكتب تأجير سيارات'),
                        "synced": True,
                        "sources": [source_label]
                    }
                else:
                    if source_label not in merged_map[key]["sources"]:
                        merged_map[key]["sources"].append(source_label)

        process_docs(cursor1, "قاعدة البيانات الحالية (car_blacklist)")
        process_docs(cursor2, "قاعدة البيانات الحالية (car_blacklist_sync)")
        process_docs(cursor3, "قاعدة البيانات القديمة (External Legacy DB)")

        results = list(merged_map.values())

        return jsonify({
            "success": True,
            "is_blacklisted": len(results) > 0,
            "total_matches": len(results),
            "records": results,
            "two_way_sync": True,
            "external_connected": external_blacklist_col is not None,
            "search_query": query or "جميع المستأجرين المحظورين"
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# حذف مستأجر سيارات ومزامنته بـ القائمتين والقاعدة الخارجية (/api/blacklist/delete)
@app.route('/api/blacklist/delete', methods=['DELETE', 'POST'])
@approved_required
def delete_from_blacklist():
    try:
        data = request.get_json() or {}
        record_id = data.get('record_id') or request.args.get('record_id') or request.args.get('id')
        national_id = data.get('national_id')
        license_number = data.get('license_number')

        delete_filter = {}
        if record_id:
            try:
                delete_filter = {"$or": [{"_id": ObjectId(record_id)}]}
            except Exception:
                delete_filter = {"$or": [{"national_id": record_id}, {"license_number": record_id}]}
        elif national_id or license_number:
            or_list = []
            if national_id: or_list.append({"national_id": national_id})
            if license_number: or_list.append({"license_number": license_number})
            delete_filter = {"$or": or_list}

        if not delete_filter:
            return jsonify({"success": False, "message": "معرّف السجل أو رقم الهوية مطلوب لإكمال عملية الحذف."}), 400

        # جلب السجل لتحديد الهوية وحذفه من جميع القواعد والمجموعات
        found_doc = blacklist_collection.find_one(delete_filter) or (blacklist_sync_collection.find_one(delete_filter) if blacklist_sync_collection else None)
        if not found_doc and external_blacklist_col:
            found_doc = external_blacklist_col.find_one(delete_filter)
        
        clean_filter = delete_filter
        if found_doc:
            clean_filter = {"$or": [
                {"national_id": found_doc.get("national_id", "___NONE___")},
                {"license_number": found_doc.get("license_number", "___NONE___")}
            ]}

        res1 = blacklist_collection.delete_many(clean_filter)
        res2 = blacklist_sync_collection.delete_many(clean_filter) if blacklist_sync_collection else None
        
        res3_deleted = 0
        if external_blacklist_col:
            try:
                res3 = external_blacklist_col.delete_many(clean_filter)
                res3_deleted = res3.deleted_count
            except Exception as ext_del_err:
                print(f"⚠️ فشل حذف القاعدة الخارجية: {ext_del_err}")

        return jsonify({
            "success": True,
            "message": "✅ تم حذف المستأجر بنجاح وتزامن الحذف من جميع قواعد البيانات المحليه والخارجية.",
            "deleted_count_primary": res1.deleted_count,
            "deleted_count_external": res3_deleted
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ---------------------------------------------------------
# MongoDB Connect & Status Endpoints (/api/mongo/status, /api/mongo/connect)
# ---------------------------------------------------------
@app.route('/api/mongo/status_external', methods=['GET'])
def mongo_status_external():
    current_legacy_uri = os.getenv("LEGACY_MONGO_URI", LEGACY_MONGO_URI)
    masked_uri = current_legacy_uri
    if "@" in masked_uri:
        try:
            prefix, rest = masked_uri.split("@", 1)
            masked_uri = "mongodb+srv://***:***@" + rest
        except Exception:
            pass
    return jsonify({
        "success": True,
        "connected": external_blacklist_col is not None,
        "legacy_mongo_uri": masked_uri,
        "external_database": external_db.name if external_db else "غير متصل",
        "two_way_sync": True
    }), 200

@app.route('/api/mongo/connect_external', methods=['POST'])
def mongo_connect_external():
    global external_client, external_db, external_blacklist_col, LEGACY_MONGO_URI
    data = request.get_json() or {}
    new_legacy_uri = data.get('legacy_mongo_uri', '').strip()
    
    if not new_legacy_uri:
        return jsonify({"success": False, "message": "يرجى تزويد رابط الاتصال لقاعدة البيانات الخارجية القديمة"}), 400

    try:
        ext_cli = MongoClient(new_legacy_uri, serverSelectionTimeoutMS=6000)
        ext_cli.admin.command('ping')
        
        ext_database = ext_cli.get_database()
        
        # اختيار أو إنشاء مجموعة الحظر blocklists في القاعدة القديمة
        possible_cols = ext_database.list_collection_names()
        target_col_name = "blocklists"
        if "blocklists" in possible_cols:
            target_col_name = "blocklists"
        elif "car_blacklist" in possible_cols:
            target_col_name = "car_blacklist"
        elif "blacklist" in possible_cols:
            target_col_name = "blacklist"
        
        ext_col = ext_database[target_col_name]
        ext_col.create_index("national_id")
        ext_col.create_index("license_number")
        ext_col.create_index("tenant_name")
        ext_col.create_index("phone")
        
        external_client = ext_cli
        external_db = ext_database
        external_blacklist_col = ext_col
        LEGACY_MONGO_URI = new_legacy_uri
        os.environ["LEGACY_MONGO_URI"] = new_legacy_uri
        
        # تشغيل التزامن المباشر المزدوج بضغطة زر عند الربط
        sync_external_database()

        return jsonify({
            "success": True,
            "message": "✅ تم الاتصال المباشر بقاعدة البيانات الخارجية القديمة وتفعيل التزامن ثنائي الاتجاه (Two-Way Sync Active) بنجاح!",
            "external_db_name": external_db.name,
            "target_collection": target_col_name,
            "two_way_sync": True
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"❌ فشل الاتصال بالقاعدة الخارجية: {str(e)}"}), 500

@app.route('/api/mongo/connect', methods=['POST'])
def mongo_connect():
    global client, db, users_collection, blacklist_collection, blacklist_sync_collection, MONGO_URI
    data = request.get_json() or {}
    new_uri = data.get('mongo_uri', '').strip()
    
    if not new_uri:
        return jsonify({"success": False, "message": "يرجى تزويد رابط الاتصال بـ MongoDB Atlas"}), 400

    try:
        new_client = MongoClient(new_uri, serverSelectionTimeoutMS=5000)
        new_client.admin.command('ping')
        
        new_db = new_client.get_database()
        u_col = new_db["rental_offices"]
        b_col = new_db["car_blacklist"]
        b_sync_col = new_db["car_blacklist_sync"]
        
        u_col.create_index("email", unique=True)
        b_col.create_index("national_id")
        b_col.create_index("license_number")
        b_col.create_index("tenant_name")

        b_sync_col.create_index("national_id")
        b_sync_col.create_index("license_number")
        b_sync_col.create_index("tenant_name")
        
        # تنفيذ المزامنة المزدوجة الفورية بين القائمتين
        sync_both_collections(new_db)

        client = new_client
        db = new_db
        users_collection = u_col
        blacklist_collection = b_col
        blacklist_sync_collection = b_sync_col
        MONGO_URI = new_uri
        os.environ["MONGO_URI"] = new_uri
        
        return jsonify({
            "success": True,
            "message": "✅ تم الربط بـ MongoDB Atlas ومزامنة القائمتين ثنائياً (Two-Way Sync Active) بنجاح!",
            "db_name": db.name,
            "collections": ["rental_offices", "car_blacklist", "car_blacklist_sync"],
            "two_way_sync": True
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"❌ فشل الاتصال: {str(e)}"}), 500

# ---------------------------------------------------------
# 4. توجيه صفحات الـ HTML المباشرة (Static HTML Routes)
# ---------------------------------------------------------
@app.route('/')
@app.route('/dashboard')
@app.route('/dashboard.html')
def dashboard():
    currency = "د.ع"
    show_db_status = False
    try:
        return render_template('dashboard.html', currency=currency, show_db_status=show_db_status)
    except Exception:
        return send_from_directory('templates', 'dashboard.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
