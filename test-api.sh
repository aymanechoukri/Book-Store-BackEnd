#!/bin/bash

# 📚 BookStore API Testing Script
# كيفية الاستخدام: bash test-api.sh

BASE_URL=\"http://localhost:5000/api\"
SLEEP_TIME=2

echo \"🚀 Starting BookStore API Tests...\"
echo \"=================================\"

# 1. تسجيل حساب جديد
echo \"\\n1️⃣ Testing Registration...\"
REGISTER=$(curl -s -X POST $BASE_URL/register \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"name\": \"Ahmed Test\",
    \"email\": \"ahmed.test@example.com\",
    \"password\": \"test123456\"
  }')
echo \"Response: $REGISTER\"
sleep $SLEEP_TIME

# 2. تسجيل الدخول
echo \"\\n2️⃣ Testing Login...\"
LOGIN=$(curl -s -X POST $BASE_URL/login \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"email\": \"ahmed.test@example.com\",
    \"password\": \"test123456\"
  }')
echo \"Response: $LOGIN\"

# استخراج التوكن
TOKEN=$(echo $LOGIN | grep -o '\"token\":\"[^\"]*' | cut -d'\"' -f4)
echo \"Token: $TOKEN\"
sleep $SLEEP_TIME

# 3. الحصول على معلومات المستخدم الحالي
echo \"\\n3️⃣ Testing Get Current User...\"
curl -s -X GET $BASE_URL/me \\
  -H \"Authorization: Bearer $TOKEN\" | jq .
sleep $SLEEP_TIME

# 4. التحقق من التوكن
echo \"\\n4️⃣ Testing Verify Token...\"
curl -s -X POST $BASE_URL/verify-token \\
  -H \"Authorization: Bearer $TOKEN\" \\
  -H \"Content-Type: application/json\" | jq .
sleep $SLEEP_TIME

# 5. الحصول على جميع المستخدمين
echo \"\\n5️⃣ Testing Get All Users...\"
curl -s -X GET $BASE_URL/users | jq .
sleep $SLEEP_TIME

# 6. الحصول على الكتب
echo \"\\n6️⃣ Testing Get All Books...\"
curl -s -X GET $BASE_URL/books | jq .
sleep $SLEEP_TIME

# 7. تسجيل/إنشاء مسؤول
echo \"\\n7️⃣ Testing Create Admin...\"
ADMIN=$(curl -s -X POST $BASE_URL/create-admin \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"name\": \"Admin User\",
    \"email\": \"admin.test@example.com\",
    \"password\": \"admin123456\"
  }')
echo \"Response: $ADMIN\"
sleep $SLEEP_TIME

echo \"\\n✅ Tests Complete!\"
echo \"\\n📝 Notes:\"
echo \"- الاختبارات أعلاه تتطلب سيرفر يعمل على http://localhost:5000\"
echo \"- استخدم jq لتنسيق JSON (قد تحتاج للتثبيت)\"
echo \"- تأكد من أن MongoDB يعمل قبل تشغيل الاختبارات\"
