# BLA अधिकारी प्रबंधन - नई सुविधाएं

## सारांश
BLA (Booth Level Officer) प्रबंधन प्रणाली में निम्नलिखित नई सुविधाएं जोड़ी गई हैं:

### 1. प्रदर्शन रेटिंग (Performance Rating) ⭐
- **स्टार रेटिंग सिस्टम**: 0 से 5 स्टार तक
- **उपयोग**: BLA अधिकारियों के प्रदर्शन को रेट करें
- **प्रदर्शन**: टेबल में स्टार के रूप में दिखाई देता है

#### कैसे उपयोग करें:
1. BLA जोड़ें या संपादित करें
2. "Performance Rating" फील्ड में स्टार पर क्लिक करें
3. 0 से 5 तक रेटिंग चुनें
4. सेव करें

### 2. मोबाइल नंबर मास्किंग (Phone Number Masking) 🔒
- **सुरक्षा**: मोबाइल नंबर छिपा हुआ दिखता है
- **प्रारूप**: `xxxxx89` (केवल अंतिम 2 अंक दिखते हैं)
- **उदाहरण**: `9876543210` → `xxxxx10`

#### विशेषताएं:
- सभी मोबाइल नंबर स्वचालित रूप से मास्क हो जाते हैं
- केवल अधिकृत उपयोगकर्ता ही पूरा नंबर देख सकते हैं
- डेटा सुरक्षा बढ़ती है

### 3. OTP सत्यापन (OTP Verification) 📱
- **पूरा नंबर देखने के लिए**: OTP की आवश्यकता
- **OTP समय सीमा**: 5 मिनट
- **प्रयास सीमा**: अधिकतम 5 बार

#### कैसे काम करता है:
1. मास्क किए गए नंबर के पास आंख (👁️) आइकन पर क्लिक करें
2. OTP डायलॉग खुलेगा
3. SMS से प्राप्त OTP दर्ज करें
4. "Verify & Reveal" बटन पर क्लिक करें
5. पूरा मोबाइल नंबर दिखाई देगा

## तकनीकी विवरण

### Backend में बदलाव:
1. **नया फील्ड**: `performance_rating` (0-5)
2. **नई API Endpoints**:
   - `/api/blos/:id/request-phone-otp` - OTP मांगें
   - `/api/blos/:id/verify-phone-otp` - OTP सत्यापित करें
3. **Phone Masking**: सभी API responses में स्वचालित

### Frontend में बदलाव:
1. **StarRating Component**: रेटिंग दिखाने और संपादित करने के लिए
2. **MaskedPhoneNumber Component**: मास्क किए गए नंबर और OTP डायलॉग
3. **BLO List Page**: नया Performance कॉलम
4. **BLO Modal**: Performance rating इनपुट फील्ड

## सुरक्षा विशेषताएं

### मोबाइल नंबर सुरक्षा:
- ✅ सभी नंबर डिफ़ॉल्ट रूप से मास्क
- ✅ केवल अंतिम 2 अंक दिखाई देते हैं
- ✅ OTP के बिना पूरा नंबर नहीं दिखता
- ✅ पेज रिफ्रेश पर फिर से मास्क हो जाता है

### OTP सुरक्षा:
- ✅ 6 अंकों का रैंडम OTP
- ✅ 5 मिनट में समाप्त हो जाता है
- ✅ अधिकतम 5 प्रयास
- ✅ एक बार उपयोग (दोबारा उपयोग नहीं हो सकता)
- ✅ Super Admin को SMS भेजा जाता है

## उपयोग के उदाहरण

### प्रदर्शन रेटिंग देखना:
```
1. BLA सूची पेज खोलें
2. "Performance" कॉलम में स्टार दिखेंगे
3. प्रत्येक BLA की रेटिंग देखें
```

### मोबाइल नंबर देखना:
```
1. BLA सूची में नंबर "xxxxx89" के रूप में दिखेगा
2. आंख आइकन पर क्लिक करें
3. OTP दर्ज करें
4. पूरा नंबर दिखाई देगा
```

## Development Mode में टेस्टिंग

Development mode में:
- OTP कंसोल में प्रिंट होता है
- OTP डायलॉग में ऑटो-फिल हो जाता है
- आसान टेस्टिंग के लिए

### Console में OTP देखें:
```
==========================================================
🔐 BLO PHONE REVEAL OTP (Development Mode)
==========================================================
OTP: 123456
BLO: राजेश कुमार
Mobile: 91******89
Expires in: 5 minutes
==========================================================
```

## Configuration

### Environment Variables:
```env
# OTP भेजने के लिए मोबाइल नंबर
CSV_OTP_MOBILE_NUMBER=+919876543210

# OTP सेटिंग्स
CSV_EXPORT_OTP_TTL_MINUTES=5
CSV_EXPORT_OTP_LENGTH=6

# Development mode
NODE_ENV=development
```

## फाइलें बनाई/संशोधित की गईं

### Backend:
1. `Backend/models/BLO.js` - performance_rating फील्ड जोड़ा
2. `Backend/utils/phoneUtils.js` - Phone masking utility (नया)
3. `Backend/controllers/bloController.js` - OTP endpoints जोड़े
4. `Backend/routes/bloRoutes.js` - नए routes जोड़े

### Frontend:
1. `frontend/src/components/StarRating.jsx` - Star rating component (नया)
2. `frontend/src/components/MaskedPhoneNumber.jsx` - Phone masking component (नया)
3. `frontend/src/pages/curd/blo/BLOListPage.jsx` - Performance column जोड़ा
4. `frontend/src/pages/curd/blo/BLOModal.jsx` - Rating input जोड़ा

## समस्या निवारण

### OTP नहीं मिल रहा:
- Console logs चेक करें (development mode में)
- SMS configuration जांचें
- Super Admin का mobile number verify करें

### Phone Number मास्क नहीं हो रहा:
- Browser cache clear करें
- API response network tab में चेक करें
- Backend logs देखें

### Stars नहीं दिख रहे:
- Browser console में errors चेक करें
- `iconsax-react` package installed है verify करें
- Database में `performance_rating` field है check करें

## आगे की योजनाएं

1. **Performance Analytics Dashboard**
2. **Region-wise Rating Reports**
3. **Top Performers List**
4. **Rating History Tracking**
5. **Automated Performance Alerts**

## सहायता

समस्या होने पर:
1. Console logs चेक करें
2. Development mode में test करें
3. Network tab में API responses देखें
4. Documentation पढ़ें
