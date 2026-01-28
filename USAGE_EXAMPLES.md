# 📖 WebForge AI - Usage Examples

## Scenario 1: Real Estate Agency Website

### Step 1: Clone & Setup
```bash
git clone https://github.com/sumitdhariyal007/webforge-system.git
cd webforge-system
npm install
npm run build
```

### Step 2: Run the server
```bash
npm start
```

### Step 3: Use with Claude (claude.com)

**Prompt:**
```
I need to build a website for my real estate agency.
Use the build_website tool with:
- Domain: leadhorizon.co.in
- Business Name: Lead Horizon
- Category: real_estate_agency
- Phone: +91-9876543210
- Email: info@leadhorizon.co.in
- Location: Delhi NCR
- Services: Residential Sales, Commercial Rentals, Plot Sales
- Tagline: Find Your Perfect Home
```

**Output:** 📁 Complete website in `~/Desktop/LeadHorizon/` folder

---

## Scenario 2: SEO Audit & Fix

### Step 1: Website बन गया, अब audit करो

**Claude Prompt:**
```
Please audit my website at https://leadhorizon.co.in
and give me a detailed SEO report with issues and fixes.
```

**Output:**
```json
{
  "url": "https://leadhorizon.co.in",
  "total_checks": 150,
  "passed": 120,
  "failed": 20,
  "score_percentage": 80,
  "priority_fixes": [
    {
      "check_id": "meta_description",
      "priority": "critical",
      "how_to_fix": "Add meta description under 160 characters"
    },
    ...
  ]
}
```

### Step 2: Issues को fix करो

**Claude Prompt:**
```
Fix these SEO issues in the index.html file:
1. Add meta description
2. Update h1 tag
3. Add schema markup
4. Add Open Graph tags

Save the fixed file to: ~/Desktop/LeadHorizon/index.html
```

---

## Scenario 3: Deploy to Live Server

### Claude Prompt:
```
Deploy my website to my hosting server with:
- SSH Host: leadhorizon.co.in
- SSH User: webadmin
- SSH Password: ****
- Remote Path: /public_html/
- Backup: true (backup existing files first)
```

**What happens:**
- ✅ Backs up existing files
- ✅ Uploads all HTML, CSS, JS files
- ✅ Uploads assets and images
- ✅ Generates .htaccess for SEO
- ✅ Creates robots.txt

---

## Scenario 4: Submit to Google Search Console

### Claude Prompt:
```
Submit my sitemap to Google Search Console:
- Site URL: https://leadhorizon.co.in
- Sitemap URL: https://leadhorizon.co.in/sitemap.xml
```

### Get Performance Report:
```
Get my Google Search Console performance report for:
- Site URL: https://leadhorizon.co.in
- Days: 30 (last 30 days)
```

**Output:**
```json
{
  "site_url": "https://leadhorizon.co.in",
  "period": "Last 30 days",
  "total_clicks": 2543,
  "total_impressions": 45230,
  "average_ctr": 5.6,
  "average_position": 12.3,
  "top_queries": [
    "real estate delhi ncr",
    "property dealers near me",
    ...
  ]
}
```

---

## Scenario 5: Use via Cursor IDE

### Step 1: Configure Cursor

Create `.cursor/rules.md`:
```markdown
# WebForge AI MCP Server

This project includes WebForge AI - an MCP server for website building.

## Usage
- Run: `npm run dev` to start the server
- The server provides tools for website building, SEO auditing, and deployment
```

### Step 2: In Cursor

Open terminal:
```bash
npm run dev
```

In Cursor chat:
```
@webforge-ai build_website domain=myshop.com business_name="My Shop" category=ecommerce_store ...
```

---

## Scenario 6: Restaurant Website

**Claude Prompt:**
```
Build a complete website for my restaurant:

build_website({
  domain: "thegoldenspoon.com",
  business_name: "The Golden Spoon",
  category: "restaurant_cafe",
  phone: "+91-9876543210",
  email: "reservations@goldenspoon.com",
  whatsapp: "+919876543210",
  location: "Mumbai, India",
  services: "Dine-in, Takeaway, Catering, Delivery",
  tagline: "Authentic cuisines, unforgettable flavors",
  brand_colors: {
    primary: "#D4A574",
    secondary: "#2C1810"
  }
})
```

**Generated Pages:**
- Home - With hero, featured dishes, reservations
- Menu - Full restaurant menu with categories
- Gallery - Food photos and ambiance
- About Us - Restaurant story and team
- Contact & Reservations
- Testimonials from customers
- Blog - Food tips and recipes
- Online reservation system ready

---

## Scenario 7: E-commerce Store

**Claude Prompt:**
```
I need a quick e-commerce website for my online store:

build_website({
  domain: "techgear.shop",
  business_name: "TechGear",
  category: "ecommerce_store",
  phone: "+91-9876543210",
  email: "support@techgear.shop",
  location: "Bangalore",
  services: "Electronics, Gadgets, Accessories",
  tagline: "Premium tech at best prices"
})
```

**Generated Features:**
- Product showcase pages
- Category filtering
- Shopping cart ready
- Customer testimonials
- Blog for tech reviews
- FAQ section
- Return policy page
- Track order info page

---

## Scenario 8: Service-Based Business (Digital Marketing)

**Claude Prompt:**
```
Build website for my digital marketing agency:

build_website({
  domain: "marketpro.agency",
  business_name: "MarketPro Agency",
  category: "digital_marketing_agency",
  phone: "+91-9876543210",
  email: "hello@marketpro.agency",
  location: "Delhi NCR",
  services: "SEO, Social Media, Content Marketing, PPC",
  tagline: "Grow your business online"
})
```

---

## Scenario 9: Custom Category

**Claude Prompt:**
```
Build website with custom configuration:

build_website({
  domain: "myproject.com",
  business_name: "My Project",
  category: "custom",
  phone: "+91-9876543210",
  email: "info@myproject.com",
  services: "Custom services"
})
```

---

## Scenario 10: Batch Operations

### Build Multiple Websites

**Claude Prompt:**
```
Build 3 websites for my different businesses:

1. Real Estate Agency (leadhorizon.co.in)
2. Digital Marketing (marketpro.agency)
3. Restaurant (goldenspoon.com)

Use appropriate categories for each and ensure:
- Each has proper SEO setup
- Custom brand colors
- Contact forms
- Testimonials section
```

### Audit All 3 Websites

**Claude Prompt:**
```
Run SEO audits on all three websites:
1. https://leadhorizon.co.in
2. https://marketpro.agency
3. https://goldenspoon.com

Create a comparison report showing:
- SEO scores
- Critical issues in each
- Priority fixes needed
```

---

## Available Business Categories

```
Real Estate
├── real_estate_agency
└── real_estate_project

Business Services
├── digital_marketing_agency
├── lawyer_legal
└── doctor_clinic

Hospitality & Food
├── restaurant_cafe
├── hotel_hospitality
└── wedding_events

E-Commerce
└── ecommerce_store

Education
└── education_coaching

Health & Fitness
└── gym_fitness

Tech
└── saas_startup

Custom
└── custom
```

---

## Pro Tips

### 1. Always Start with Audit First
```
Audit existing website → Get report → Build new → Compare
```

### 2. Use Environment Variables
```bash
export CHECKLIST_PATH=/path/to/checklist.json
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds.json
```

### 3. Customize After Generation
1. Generate base website
2. Add custom content
3. Upload company images
4. Configure email forms
5. Add tracking codes

### 4. SEO Best Practices
- Run audit after building
- Fix critical issues first
- Submit sitemap to Google
- Monitor GSC performance
- Re-audit monthly

### 5. Deployment Checklist
```
✅ Build website
✅ Audit & fix issues
✅ Test all links
✅ Test forms
✅ Test responsiveness
✅ Deploy to server
✅ Submit sitemap
✅ Monitor in GSC
```

---

**Ready to build? Start with:** https://github.com/sumitdhariyal007/webforge-system

🚀 Happy Building!
