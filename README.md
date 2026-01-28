# WebForge AI - MCP Server

AI-powered website builder, SEO auditor, and deployment system. Automatically builds production-ready websites with complete SEO optimization and manages Google Search Console.

## Features

### 🔨 Website Building
- **Auto Website Generation**: Provide domain + business details → complete website generated
- **Multiple Category Templates**: Real Estate, Digital Marketing, Restaurant, Doctor, Lawyer, E-commerce, SaaS, Education, Gym, Hotel, Wedding, and more
- **SEO Optimized**: All pages come with meta tags, schema markup, Open Graph, Twitter cards
- **Responsive Design**: Mobile-first CSS with animations and micro-interactions
- **Dynamic Content**: Auto-generated blog posts, FAQ sections, testimonials

### 🔍 SEO Audit & Fixes
- **360 Degree Audit**: 150+ SEO checks across 16 categories
- **Auto-Fix Capabilities**: Automatically fix HTML, meta tags, schema, .htaccess
- **Detailed Reports**: Before/after comparison with prioritized fixes
- **Categories Audited**:
  - Technical SEO
  - On-Page SEO
  - Structured Data/Schema
  - Open Graph & Social
  - Google Search Console
  - Google Business Profile
  - Performance & Core Web Vitals
  - Security
  - Local SEO
  - Content Strategy
  - UX & CRO
  - Analytics & Tracking
  - Answer Engine Optimization (AEO)
  - Off-Page SEO
  - Accessibility
  - Legal & Compliance

### 🚀 Deployment
- **SSH/FTP Deployment**: Deploy generated files to hosting servers
- **File Management**: List and verify files on hosting
- **Backup Support**: Auto-backup existing files before uploading

### 📊 Google Search Console Integration
- **Performance Reports**: Fetch clicks, impressions, CTR, ranking data
- **Sitemap Submission**: Auto-submit sitemaps to GSC
- **Indexing Checks**: Verify page indexing status

## Installation

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

## Building

```bash
npm run build
npm start
```

## MCP Tools Available

### Website Building
- `build_website` - Generate complete website from domain + business details
- `generate_page` - Generate specific page types
- `generate_seo_files` - Generate SEO files (robots.txt, sitemap.xml, etc.)

### SEO Audit
- `audit_website` - Run complete 360 SEO audit on any URL
- `fix_seo_issues` - Auto-fix identified SEO issues

### Deployment
- `deploy_to_hosting` - Deploy files via SSH/FTP
- `list_hosting_files` - List files on remote server

### Google Search Console
- `gsc_report` - Get GSC performance data
- `gsc_submit_sitemap` - Submit sitemap to GSC
- `gsc_check_indexing` - Check page indexing status

## Environment Variables

Create `.env` file with:
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GSC_CREDENTIALS=path/to/gsc-credentials.json
```

## Project Structure

```
src/
├── index.ts          # MCP Server setup and tool handlers
├── builder.ts        # Website generation logic
├── auditor.ts        # SEO audit and auto-fix logic
├── deployer.ts       # SSH/FTP deployment
├── gsc.ts            # Google Search Console integration
├── tools.ts          # Tool definitions
└── templates.ts      # HTML/CSS templates

360_seo_master_checklist.json  # Complete SEO checklist with all checks
```

## SEO Checklist

The `360_seo_master_checklist.json` contains:
- **16 major SEO categories**
- **150+ individual checks**
- **Prioritization levels**: critical, high, medium, low
- **Auto-fixable items list**
- **Manual action items list**

## Usage Example

```bash
# Build website
build_website {
  domain: "example.com",
  business_name: "My Business",
  category: "real_estate_agency",
  phone: "+91-XXXXXXXXXX",
  email: "info@example.com"
}

# Audit website
audit_website {
  url: "https://example.com"
}

# Deploy to hosting
deploy_to_hosting {
  local_folder: "/path/to/website",
  ssh_host: "example.com",
  ssh_user: "user",
  remote_path: "/public_html"
}
```

## License

MIT
