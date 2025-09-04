# API URL Double Path Fix

## Problem

Frontend was making requests with double `/api/api/` paths, causing 404 errors:

```
Request URL: http://localhost:5000/api/api/customer/list
Request Method: GET
Status Code: 404 Not Found
```

## Root Cause

The issue was in the API endpoint configurations across multiple files in `frontend/src/api/`. The endpoint keys were including the `api/` prefix when the axios base URL already included it.

**Axios Configuration:**

```javascript
// utils/axios.js
baseURL: "http://localhost:5000/api"; // Already includes /api
```

**Problematic API Configurations:**

```javascript
// api/customer.js (and others)
export const endpoints = {
  key: "api/customer", // ❌ This causes double /api/api/
  list: "/list",
};
```

**Result:** `baseURL + key + list` = `http://localhost:5000/api` + `api/customer` + `/list` = `/api/api/customer/list`

## Solution

Removed the `api/` prefix from all endpoint keys in the API configuration files:

### Files Fixed:

1. **`frontend/src/api/customer.js`**

   ```javascript
   export const endpoints = {
     key: "customer", // ✅ Fixed: removed 'api/' prefix
     list: "/list",
     modal: "/modal",
     insert: "/insert",
     update: "/update",
     delete: "/delete",
   };
   ```

2. **`frontend/src/api/calender.js`**

   ```javascript
   export const endpoints = {
     key: "calendar/events", // ✅ Fixed: was 'api/calendar/events'
   };
   ```

3. **`frontend/src/api/kanban.js`**

   ```javascript
   export const endpoints = {
     key: "kanban", // ✅ Fixed: was 'api/kanban'
   };
   ```

4. **`frontend/src/api/invoice.js`**

   ```javascript
   export const endpoints = {
     key: "invoice", // ✅ Fixed: was 'api/invoice'
   };
   ```

5. **`frontend/src/api/menu.js`**

   ```javascript
   export const endpoints = {
     key: "menu", // ✅ Fixed: was 'api/menu'
   };
   ```

6. **`frontend/src/api/chat.js`**

   ```javascript
   export const endpoints = {
     key: "chat", // ✅ Fixed: was 'api/chat'
   };
   ```

7. **`frontend/src/api/address.js`**
   ```javascript
   export const endpoints = {
     key: "address", // ✅ Fixed: was 'api/address'
   };
   ```

## Result

Now the API calls generate correct URLs:

- ✅ `http://localhost:5000/api/customer/list`
- ✅ `http://localhost:5000/api/calendar/events`
- ✅ `http://localhost:5000/api/kanban`
- ✅ `http://localhost:5000/api/invoice`
- ✅ `http://localhost:5000/api/menu`
- ✅ `http://localhost:5000/api/chat`
- ✅ `http://localhost:5000/api/address`

## Note

Most of these endpoints appear to be template code from the original React theme and may not have corresponding backend implementations. You may need to either:

1. Remove unused API files and components
2. Implement the missing backend endpoints
3. Mock these endpoints for development

## Testing

1. Check browser console for API calls
2. No more double `/api/api/` paths should appear
3. API calls should hit correct endpoints (though they may still return 404 if backend endpoints don't exist)

The URL path duplication issue has been resolved!
