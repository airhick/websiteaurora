# 🚀 Quick Start - Aurora Test Form

## What Was Added

A beautiful, interactive test form has been integrated into your landing page!

**The "Go to Dashboard" button has been transformed into a "Test Now" button** that opens the test form modal.

### Visual Preview

```
┌─────────────────────────────────────────────┐
│                                             │
│         Your Landing Page Content           │
│                                             │
│              [ Test Now ]    ← Changed!     │
│         (was "Go to Dashboard")             │
│                                             │
└─────────────────────────────────────────────┘
              ↓ (Click Button)
              
┌─────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════╗  │
│  ║ ✕         Try Aurora AI               ║  │
│  ║ Enter a company name to test our      ║  │
│  ║ AI receptionist                       ║  │
│  ║                                       ║  │
│  ║  Company Name                         ║  │
│  ║  ┌─────────────────────────────────┐  ║  │
│  ║  │ Search for a company...       ▼│  ║  │
│  ║  └─────────────────────────────────┘  ║  │
│  ║                                       ║  │
│  ║     [ Start Test Call ]               ║  │
│  ╚═══════════════════════════════════════╝  │
└─────────────────────────────────────────────┘
```

## ⚡ Quick Setup (2 minutes)

### Step 1: Get Google API Key
```bash
1. Visit: https://console.cloud.google.com/
2. Enable "Places API"
3. Create API Key
4. Copy the key
```

### Step 2: Update Config
Open this file:
```
/public/test-form-inject.js
```

Find line 6 and replace `YOUR_GOOGLE_API_KEY`:
```javascript
// BEFORE:
googleScript.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_API_KEY&libraries=places';

// AFTER:
googleScript.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC1h5...YOUR_ACTUAL_KEY&libraries=places';
```

### Step 3: Test It! 🎉
```bash
1. Open your landing page (index.html)
2. Find the main button (now says "Test Now")
3. Click it to open the modal
4. Type a company name
5. Watch the autocomplete magic!
6. Submit to test
```

## 📤 Data Flow

```
User Types Company Name
         ↓
Google Places Autocomplete
         ↓
User Selects Company
         ↓
Form Submits (POST)
         ↓
https://n8n.goreview.fr/webhook-test/test_vapi
         ↓
Your n8n Workflow Receives:
{
  "company_name": "Example Corp",
  "place_details": {
    "name": "Example Corp",
    "address": "123 Main St...",
    "phone": "+1234567890",
    "website": "https://example.com",
    "location": { "lat": 40.7, "lng": -74.0 }
  },
  "timestamp": "2025-11-20T12:00:00Z",
  "source": "aurora_landing_page"
}
```

## 🎨 Features

✅ **Integrated Button** - Replaces "Go to Dashboard" with "Test Now" (keeps original styling)
✅ **Beautiful Modal** - Gradient design with smooth animations  
✅ **Google Places** - Autocomplete with rich location data  
✅ **Smart Form** - Validation and error handling  
✅ **Success Feedback** - User-friendly messages  
✅ **Responsive** - Works on all devices  
✅ **Fast** - No performance impact on landing page  

## 🔧 Customization Examples

### Change Button Text
```javascript
// In test-form-inject.js, find line 228:
h1.textContent = 'Test Now';

// Change to:
h1.textContent = '🚀 Try Demo';
```

### Change Colors
```javascript
// In .aurora-modal-content CSS:
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Try other gradients:
// Blue: #4facfe 0%, #00f2fe 100%
// Purple: #a8edea 0%, #fed6e3 100%
// Orange: #fa709a 0%, #fee140 100%
```

## 📱 Mobile Friendly

The form automatically adapts to mobile screens:
- Touch-friendly button size
- Full-screen modal on small devices
- Native mobile keyboard support
- Smooth animations optimized for mobile

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Button still says "Go to Dashboard" | Clear cache, check console for errors |
| Modal doesn't open | Check browser console, ensure script loaded |
| Autocomplete not working | Verify API key, check Places API is enabled |
| Form won't submit | Check webhook URL, verify CORS settings |
| Styling issues | Check for CSS conflicts, ensure script loaded |

## 📚 Full Documentation

See `TEST_FORM_SETUP.md` for complete documentation.

## Need Help?

Check the browser console (F12) for detailed error messages!

