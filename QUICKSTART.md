# 🚀 WebForge AI - Quick Start Guide

## 1️⃣ Clone और Setup करो

```bash
# Repository clone करो
git clone https://github.com/sumitdhariyal007/webforge-system.git
cd webforge-system

# Dependencies install करो
npm install

# TypeScript को JavaScript में compile करो
npm run build
```

---

## 2️⃣ Configuration करो

### Step 1: `.env` file बना

```bash
# .env.example को copy करो
cp .env.example .env
```

### Step 2: `.env` में credentials add करो (Optional)

```bash
# If using Google Search Console features:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GSC_CREDENTIALS=/path/to/gsc-credentials.json

# If checklist is in different location:
CHECKLIST_PATH=/path/to/360_seo_master_checklist.json
```

---

## 3️⃣ Run करो - दो तरीके हैं

### **Option A: Dev Mode** (सीधे TypeScript)
```bash
npm run dev
```
- Direct TypeScript चलेगा
- Changes real-time reflect होंगे
- Development के लिए बेस्ट

### **Option B: Production Mode** (Compiled)
```bash
npm run build    # Compile करो
npm start        # Run करो
```
- Optimized compiled code
- Production के लिए बेस्ट

---

## 4️⃣ Cursor/Claude में Use करो

### **Cursor के साथ setup करो:**

```json
// .cursor/rules या .cursor/settings में add करो:
{
  "mcp": {
    "servers": {
      "webforge-ai": {
        "command": "node",
        "args": ["dist/index.js"],
        "cwd": "/path/to/webforge-system"
      }
    }
  }
}
```

### **Claude.com के साथ use करो:**

1. **https://claude.com** पर जाओ
2. **Files** section में यह folder drag-drop करो
3. Claude से कहो:

```
Build a website for a real estate agency
Domain: myproperty.com
Business Name: My Property Agency
Category: real_estate_agency
Phone: +91-XXXXXXXXXX
Email: info@myproperty.com
```

---

## 5️⃣ Available Commands

### Website Building
```javascript
build_website({
  domain: "example.com",
  business_name: "My Business",
  category: "real_estate_agency", // or digital_marketing_agency, restaurant_cafe, etc
  phone: "+91-XXXXXXXXXX",
  email: "info@example.com",
  whatsapp: "+917011066532",     // Optional
  location: "Delhi NCR",          // Optional
  services: "Service1, Service2", // Optional
  tagline: "Your tagline",        // Optional
  logo_path: "/path/to/logo.png", // Optional
  brand_colors: {                 // Optional
    primary: "#FF6B6B",
    secondary: "#4ECDC4"
  }
})
```

### Generate Single Page
```javascript
generate_page({
  page_type: "contact",  // index, contact, blog, privacy, terms, faq, 404, thankyou
  domain: "example.com",
  business_name: "My Business",
  category: "real_estate_agency",
  content_data: { /* page specific data */ }
})
```

### Generate SEO Files
```javascript
generate_seo_files({
  domain: "example.com",
  pages_list: ["index", "about", "contact", "blog"],
  business_name: "My Business",
  business_description: "Our description"
})
```

### Audit Website
```javascript
audit_website({
  url: "https://example.com"
})
```

### Auto-Fix SEO Issues
```javascript
fix_seo_issues({
  file_path: "/path/to/index.html",
  issues_list: [
    { check_id: "meta_description", fix_type: "add" },
    { check_id: "h1_tag", fix_type: "update" }
  ]
})
```

### Deploy to Hosting
```javascript
deploy_to_hosting({
  local_folder: "/path/to/website",
  ssh_host: "example.com",
  ssh_user: "user",
  ssh_password: "password",    // या ssh_key_path
  remote_path: "/public_html",
  ssh_port: 22  // Optional
})
```

### Google Search Console
```javascript
gsc_report({
  site_url: "https://example.com",
  days: 30  // या start_date/end_date
})

gsc_submit_sitemap({
  site_url: "https://example.com",
  sitemap_url: "https://example.com/sitemap.xml"
})

gsc_check_indexing({
  site_url: "https://example.com"
})
```

---

## 6️⃣ Categories Available

```
✅ real_estate_agency
✅ real_estate_project
✅ digital_marketing_agency
✅ restaurant_cafe
✅ doctor_clinic
✅ lawyer_legal
✅ ecommerce_store
✅ saas_startup
✅ education_coaching
✅ gym_fitness
✅ hotel_hospitality
✅ wedding_events
✅ custom
```

---

## 7️⃣ Output Files

Website build करने के बाद ये files generate होंगी:

```
ProjectName/
├── index.html
├── about.html
├── contact.html
├── blog.html
├── privacy.html
├── terms.html
├── faq.html
├── 404.html
├── thankyou.html
├── css/
│   ├── style.css
│   ├── responsive.css
│   └── animations.css
├── js/
│   ├── main.js
│   ├── form-handler.js
│   └── animations.js
├── assets/
│   ├── logo.svg
│   ├── favicon.ico
│   └── hero-image.jpg
├── robots.txt
├── sitemap.xml
├── sitemap-images.xml
└── .htaccess
```

---

## 8️⃣ Workflow Example

### Complete Website Building & Deployment

```bash
# Step 1: Start the server
npm run dev

# Step 2: Ask Claude (on Claude.com):
# "Build a website for Real Estate Agency
#  Domain: leadhorizon.co.in
#  Name: Lead Horizon
#  Category: real_estate_agency"

# Step 3: Audit the website
# "Audit https://leadhorizon.co.in"

# Step 4: Fix issues (if any)
# "Fix these SEO issues in index.html"

# Step 5: Deploy to hosting
# "Deploy to ssh://user@hosting.com:/public_html"

# Step 6: Submit to Google
# "Submit sitemap to Google Search Console"
```

---

## 🔧 Troubleshooting

### Issue: Checklist not found
```bash
# Set checklist path explicitly
export CHECKLIST_PATH=/full/path/to/360_seo_master_checklist.json
npm run dev
```

### Issue: Google credentials error
```bash
# Make sure .env में correct paths हैं
cat .env
# Both files should exist and be valid JSON
```

### Issue: SSH deployment error
```bash
# SSH key permission check करो
chmod 600 ~/.ssh/id_rsa

# Or use password authentication in deploy config
```

---

## 📚 More Info

- **README.md** - Detailed features
- **SETUP_INSTRUCTIONS.md** - Advanced setup
- **360_seo_master_checklist.json** - All SEO checks
- **GitHub Issues** - Report bugs or ask questions

---

**Happy Building! 🚀**
