# Aurora Test Form Setup Instructions

## Overview
The "Go to Dashboard" button on your landing page (`index.html`) has been transformed into a "Test Now" button that opens a modal with a form featuring Google Places autocomplete for company search.

## Features
- 🎯 "Test Now" button (replaces "Go to Dashboard", keeps original styling)
- 📍 Google Places autocomplete for company name input
- 🎨 Beautiful gradient modal with smooth animations
- 📤 Automatic POST to webhook: `https://n8n.goreview.fr/webhook-test/test_vapi`
- ✅ Success/error feedback messages
- 📱 Fully responsive design

## Setup Instructions

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 2. Configure the API Key

Open `/public/test-form-inject.js` and replace `YOUR_GOOGLE_API_KEY` on line 6:

```javascript
googleScript.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places';
```

Replace `YOUR_ACTUAL_API_KEY` with your actual Google API key.

### 3. (Optional) Restrict API Key

For security, restrict your API key:
1. In Google Cloud Console, edit your API key
2. Under "Application restrictions", choose "HTTP referrers"
3. Add your domain (e.g., `https://yourdomain.com/*`)
4. Under "API restrictions", select "Restrict key"
5. Choose "Places API"

### 4. Test the Form

1. Open your landing page in a browser
2. Find the main call-to-action button (now says "Test Now" instead of "Go to Dashboard")
3. Click the "Test Now" button to open the modal
4. Start typing a company name - autocomplete suggestions will appear
5. Select a company and click "Start Test Call"
6. Check your n8n webhook at `https://n8n.goreview.fr/webhook-test/test_vapi` to see the received data

## Data Sent to Webhook

The form sends a POST request with the following JSON structure:

```json
{
  "company_name": "Example Company",
  "timestamp": "2025-11-20T12:00:00.000Z",
  "source": "aurora_landing_page",
  "place_details": {
    "name": "Example Company",
    "address": "123 Main St, City, Country",
    "place_id": "ChIJ...",
    "phone": "+1234567890",
    "website": "https://example.com",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
```

## Customization

### Change Button Text
Edit `test-form-inject.js` around line 228:

```javascript
h1.textContent = 'Test Now';
// Change to whatever text you want:
h1.textContent = '🚀 Try Our AI';
```

### Change Colors
The gradient uses these colors: `#667eea` and `#764ba2`

Modify these in the styles section of `test-form-inject.js`.

### Change Webhook URL
Find this line in `test-form-inject.js`:

```javascript
const response = await fetch('https://n8n.goreview.fr/webhook-test/test_vapi', {
```

Replace with your desired webhook URL.

## Troubleshooting

### Button still says "Go to Dashboard"
- The script may not have found the button properly
- Check browser console for errors
- Ensure `test-form-inject.js` is loaded (check Network tab)
- Clear browser cache and refresh

### Autocomplete not working
- Verify your Google API key is correct
- Check that Places API is enabled in Google Cloud Console
- Check browser console for API errors
- Ensure your domain is allowed in API key restrictions

### Form submission fails
- Check browser console for errors
- Verify the webhook URL is correct and accessible
- Check CORS settings on your webhook endpoint

## Files Modified
- `/public/index.html` - Added script tag for the test form
- `/public/test-form-inject.js` - Main script with form functionality

## Support
If you encounter any issues, check the browser console for error messages and ensure all setup steps are completed correctly.

