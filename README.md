# 📚 BookStore Backend API

نظام متكامل لإدارة متجر الكتب الإلكترونية مع نظام دفع Stripe متقدم.

## ✨ المميزات

- 🔐 **أمان عالي** - JWT Authentication + Stripe Webhook Verification
- 📚 **إدارة كتب** - إضافة، حذف، عرض الكتب مع الصور و PDF
- 💳 **نظام دفع** - تكامل كامل مع Stripe
- 👥 **إدارة المستخدمين** - تسجيل، تسجيل دخول، إدارة الحسابات
- 📁 **رفع الملفات** - دعم رفع الصور والملفات
- ⭐ **تحقق المدخلات** - Validation شامل على جميع المدخلات
- 🚀 **الأداء** - استعلامات محسّنة وسريعة

---

## 🛠️ المتطلبات

- **Node.js** >= 16
- **MongoDB** >= 5.0
- **npm** أو **yarn**

---

## 📦 التثبيت

### 1. استنساخ المستودع
```bash
git clone <repository-url>
cd back-End-Stor
```

### 2. تثبيت المكتبات
```bash
npm install
```

### 3. إنشاء ملف .env
```bash
cp .env.example .env
```

### 4. تحديث متغيرات البيئة
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bookstore

# JWT
JWT_SECRET=your-super-secret-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional
NODE_ENV=development
PORT=5000
```

### 5. التشغيل
```bash
# تطوير مع إعادة التحميل التلقائي
nodemon server.js

# أو تشغيل عادي
node server.js
```

السيرفر سيعمل على: `http://localhost:5000`

---

## 📚 الوثائق

### قائمة API كاملة
انظر [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) لقائمة شاملة بجميع الـ endpoints

### ملخص الإصلاحات
انظر [FIXES_SUMMARY.md](./FIXES_SUMMARY.md) لمعرفة المشاكل التي تم إصلاحها

### التفاصيل الدقيقة
انظر [DETAILED_FIXES.md](./DETAILED_FIXES.md) لشرح مفصل لكل إصلاح

### قائمة التحقق النهائية
انظر [FINAL_CHECKLIST.md](./FINAL_CHECKLIST.md) لحالة المشروع

### دليل الصيانة
انظر [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) لنصائح وأفضليات

---

## 🚀 أمثلة الاستخدام

### تسجيل حساب جديد
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد",
    "email": "ahmed@example.com",
    "password": "password123"
  }'
```

### تسجيل الدخول
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "password123"
  }'
```

### الحصول على الكتب
```bash
curl http://localhost:5000/api/books
```

### إضافة كتاب (يحتاج auth)
```bash
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=اسم الكتاب" \
  -F "price=29.99" \
  -F "category=Fiction" \
  -F "description=وصف الكتاب" \
  -F "image=@/path/to/image.jpg" \
  -F "pdf=@/path/to/book.pdf"
```

---

## 🧪 الاختبار

### اختبار جميع الـ endpoints
```bash
bash test-api.sh
```

### اختبار يدوي
استخدم Postman أو Insomnia:
1. استيراد `BookStore.postman_collection.json` (إن وجد)
2. أو أنشئ الطلبات يدويًا كما في الأمثلة أعلاه

---

## 📁 هيكل المشروع

```
back-End-Stor/
├── server.js                    # نقطة البداية
├── package.json                 # الاعتماديات
├── .env                         # متغيرات البيئة
├── config/
│   ├── db.js                   # اتصال MongoDB
│   └── upload.js               # إعدادات Multer
├── middleware/
│   ├── auth.js                 # JWT Authentication
│   └── admin.js                # Role-based Access
├── models/
│   ├── user.js                 # نموذج المستخدم
│   ├── book.js                 # نموذج الكتاب
│   └── order.js                # نموذج الطلب
├── router/
│   └── app.js                  # جميع الـ routes
├── uploads/                    # الملفات المرفوعة
├── README.md                   # هذا الملف
├── API_DOCUMENTATION.md        # وثائق API
├── FIXES_SUMMARY.md            # ملخص الإصلاحات
├── DETAILED_FIXES.md           # التفاصيل
├── FINAL_CHECKLIST.md          # قائمة التحقق
├── MAINTENANCE_GUIDE.md        # دليل الصيانة
└── test-api.sh                 # اختبار API
```

---

## 🔑 متغيرات البيئة

| المتغير | الوصف | مثال |
|---------|-------|------|
| `MONGO_URI` | رابط MongoDB | `mongodb+srv://...` |
| `JWT_SECRET` | مفتاح JWT | `your-secret-key` |
| `STRIPE_SECRET_KEY` | مفتاح Stripe | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | سر Webhook | `whsec_...` |
| `NODE_ENV` | البيئة | `development` أو `production` |
| `PORT` | المنفذ | `5000` |

---

## 🔒 الأمان

### ✅ تم التطبيق
- [x] JWT Authentication
- [x] Password Hashing (bcrypt)
- [x] Input Validation
- [x] Email Format Validation
- [x] Stripe Webhook Verification
- [x] Admin Authorization
- [x] Role-based Access Control
- [x] CORS Configuration

### 🔄 يُنصح بإضافة
- [ ] Rate Limiting (Helmet/express-rate-limit)
- [ ] HTTPS
- [ ] Request Logging (Morgan)
- [ ] Helmet Security Headers
- [ ] Environment-based Logging

قراءة [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) للتفاصيل

---

## 🚀 النشر على Heroku

### 1. إنشاء تطبيق على Heroku
```bash
heroku create your-app-name
```

### 2. إضافة متغيرات البيئة
```bash
heroku config:set MONGO_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-secret"
heroku config:set STRIPE_SECRET_KEY="your-key"
heroku config:set STRIPE_WEBHOOK_SECRET="your-webhook-secret"
```

### 3. النشر
```bash
git push heroku main
```

---

## 🐛 استكشاف الأخطاء

### السيرفر لا ينطلق
```bash
# تحقق من متغيرات البيئة
cat .env

# تحقق من اتصال MongoDB
mongosh "mongodb+srv://..."

# تحقق من الملفات
node -c server.js
```

### الخطأ "Cannot find module"
```bash
# أعد تثبيت المكتبات
rm -rf node_modules package-lock.json
npm install
```

### مشكلة في Stripe
```bash
# تحقق من المفاتيح
echo $STRIPE_SECRET_KEY
echo $STRIPE_WEBHOOK_SECRET

# تحقق من الـ webhook
curl https://api.stripe.com/v1/webhook_endpoints \
  -u sk_test_YOUR_KEY:
```

---

## 📞 الدعم

### المشاكل الشائعة

**1. MongoDB connection timeout**
- تحقق من رابط MongoDB
- تحقق من أن IP الخاص بك مسموح على MongoDB Atlas

**2. JWT token expired**
- التوكن ينتهي بعد 1 ساعة
- المستخدم يحتاج لتسجيل دخول مرة أخرى

**3. Stripe webhook not receiving**
- تحقق من الرابط على Stripe Dashboard
- تأكد من أن السيرفر يعمل على HTTPS

---

## 📝 التطوير

### إضافة endpoint جديد
```javascript
// في router/app.js
app.post("/api/new-endpoint", auth, async (req, res) => {
  try {
    // الكود هنا
    res.json({ message: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
```

### إضافة middleware جديد
```javascript
// في middleware/newMiddleware.js
const newMiddleware = (req, res, next) => {
  // الكود هنا
  next();
};

export default newMiddleware;
```

---

## 🤝 المساهمة

نرحب بالمساهمات! الرجاء:

1. Fork المشروع
2. إنشاء فرع للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى الفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License - انظر ملف [LICENSE](LICENSE) للتفاصيل

---

## 👨‍💻 المؤلف

**BookStore Team**
- GitHub: [@team](https://github.com)
- Email: info@bookstore.com

---

## 🙏 شكر خاص

شكر لجميع المساهمين والمكتبات المستخدمة:
- Express.js
- MongoDB & Mongoose
- Stripe
- JWT

---

## 📊 الإحصائيات

- **Endpoints:** 18
- **Models:** 3
- **Middleware:** 2
- **Authentication:** JWT + Role-based
- **Payment:** Stripe Integration
- **Database:** MongoDB

---

## 🔗 الروابط المهمة

- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [JWT Documentation](https://jwt.io/)
- [Mongoose Documentation](https://mongoosejs.com/)

---

**آخر تحديث:** 31 مارس 2026  
**الإصدار:** 1.0.0  
**الحالة:** ✅ Production Ready
