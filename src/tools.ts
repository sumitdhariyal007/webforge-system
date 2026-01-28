export const TOOLS = [
  // === Website Building Tools ===
  {
    name: "build_website",
    description:
      "Generate a complete, production-ready website from a business category template. Creates all HTML pages, CSS, JS, SEO files, schema markup, and infrastructure files in ~/Desktop/[ProjectName]/ folder. Uses the 360 SEO Master Checklist category templates for design, content tone, sections, and CTAs.",
    inputSchema: {
      type: "object" as const,
      properties: {
        domain: {
          type: "string",
          description: "Domain name for the website (e.g., leadhorizon.co.in)",
        },
        business_name: {
          type: "string",
          description: "Business/brand name",
        },
        category: {
          type: "string",
          description:
            "Business category template to use. Options: real_estate_agency, real_estate_project, digital_marketing_agency, restaurant_cafe, doctor_clinic, lawyer_legal, ecommerce_store, saas_startup, education_coaching, gym_fitness, hotel_hospitality, wedding_events, custom",
        },
        phone: {
          type: "string",
          description: "Business phone number (e.g., +91-7011066532)",
        },
        email: {
          type: "string",
          description: "Business email address",
        },
        whatsapp: {
          type: "string",
          description: "WhatsApp number without dashes (e.g., +917011066532)",
        },
        location: {
          type: "string",
          description: "Business location (e.g., Delhi NCR, India)",
        },
        services: {
          type: "string",
          description:
            "Comma-separated list of services. If empty, auto-generated based on category.",
        },
        tagline: {
          type: "string",
          description: "Business tagline or one-liner",
        },
        logo_path: {
          type: "string",
          description: "Path to logo file. If empty, an SVG logo will be generated.",
        },
        brand_colors: {
          type: "object",
          description: "Custom brand colors. If empty, category defaults are used.",
          properties: {
            primary: { type: "string" },
            secondary: { type: "string" },
          },
        },
        google_analytics_id: {
          type: "string",
          description: "GA4 Measurement ID (e.g., G-XXXXXXXXXX). Optional.",
        },
        gtm_id: {
          type: "string",
          description: "GTM Container ID (e.g., GTM-XXXXXXX). Optional.",
        },
      },
      required: ["domain", "business_name", "category", "phone", "email"],
    },
  },
  {
    name: "generate_page",
    description:
      "Generate a single HTML page with full SEO optimization, schema markup, OG tags, and responsive design. Supports: index, contact, blog, privacy, terms, faq, 404, thankyou page types.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page_type: {
          type: "string",
          description:
            "Type of page to generate: index, contact, blog, privacy, terms, faq, 404, thankyou",
          enum: [
            "index",
            "contact",
            "blog",
            "privacy",
            "terms",
            "faq",
            "404",
            "thankyou",
          ],
        },
        domain: {
          type: "string",
          description: "Domain name",
        },
        business_name: {
          type: "string",
          description: "Business name",
        },
        category: {
          type: "string",
          description: "Business category for template selection",
        },
        content_data: {
          type: "object",
          description:
            "Additional content data specific to the page type (e.g., FAQ items, blog posts, services list)",
        },
      },
      required: ["page_type", "domain", "business_name", "category"],
    },
  },
  {
    name: "generate_seo_files",
    description:
      "Generate all SEO infrastructure files: sitemap.xml, robots.txt, .htaccess (with security headers, GZIP, caching), manifest.json (PWA), and llms.txt (AI crawler info). All files follow best practices from the 360 SEO checklist.",
    inputSchema: {
      type: "object" as const,
      properties: {
        domain: {
          type: "string",
          description: "Domain name (e.g., leadhorizon.co.in)",
        },
        pages_list: {
          type: "array",
          items: { type: "string" },
          description:
            'List of page URLs/paths to include in sitemap (e.g., ["index.html", "contact.html", "blog.html"])',
        },
        business_name: {
          type: "string",
          description: "Business name for manifest.json and llms.txt",
        },
        business_description: {
          type: "string",
          description: "Short business description for llms.txt",
        },
        theme_color: {
          type: "string",
          description: "Theme color hex for manifest.json (e.g., #800000)",
        },
      },
      required: ["domain", "pages_list"],
    },
  },

  // === SEO Audit Tools ===
  {
    name: "audit_website",
    description:
      "Run a comprehensive 360 SEO audit against the full checklist (140+ checks across 16 categories: Technical SEO, On-Page, Schema, OG Tags, GSC, Performance, Security, Local SEO, Content, UX/CRO, Analytics, AEO/AI Readiness, Accessibility, Legal). Fetches the website and evaluates each check item.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "Full URL to audit (e.g., https://leadhorizon.co.in)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "fix_seo_issues",
    description:
      "Auto-fix detected SEO issues in HTML files. Can fix: meta tags, OG tags, schema markup, image alt/dimensions, canonical URLs, heading hierarchy, .htaccess rules, and more. Returns the fixed file content with a summary of changes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "Absolute path to the HTML file to fix",
        },
        issues_list: {
          type: "array",
          items: {
            type: "object",
            properties: {
              check_id: {
                type: "string",
                description: "Check ID from the audit (e.g., 2_01_title_tag)",
              },
              fix_instruction: {
                type: "string",
                description: "Specific fix to apply",
              },
            },
          },
          description: "List of issues to fix with their check IDs and fix instructions",
        },
        domain: {
          type: "string",
          description: "Domain name for canonical URLs and OG tags",
        },
        business_name: {
          type: "string",
          description: "Business name for meta tags and schema",
        },
      },
      required: ["file_path", "issues_list"],
    },
  },

  // === Deployment Tools ===
  {
    name: "deploy_to_hosting",
    description:
      "Upload website files to a remote hosting server via SSH/SCP. Uploads all files from a local folder to the remote path, preserving directory structure. Shows upload status for each file.",
    inputSchema: {
      type: "object" as const,
      properties: {
        local_folder: {
          type: "string",
          description:
            "Local folder path containing website files (e.g., /Users/macintosh/Desktop/MyWebsite)",
        },
        ssh_host: {
          type: "string",
          description: "SSH hostname or IP address",
        },
        ssh_port: {
          type: "number",
          description: "SSH port (default: 22)",
          default: 22,
        },
        ssh_user: {
          type: "string",
          description: "SSH username",
        },
        remote_path: {
          type: "string",
          description:
            "Remote directory path (e.g., /home/user/public_html)",
        },
        ssh_key_path: {
          type: "string",
          description:
            "Path to SSH private key file. If not provided, uses default ~/.ssh/id_rsa",
        },
        ssh_password: {
          type: "string",
          description: "SSH password (used if no key is available)",
        },
      },
      required: ["local_folder", "ssh_host", "ssh_user", "remote_path"],
    },
  },
  {
    name: "list_hosting_files",
    description:
      "List files and directories on a remote hosting server via SSH. Shows file listing with sizes and permissions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ssh_host: {
          type: "string",
          description: "SSH hostname or IP address",
        },
        ssh_port: {
          type: "number",
          description: "SSH port (default: 22)",
          default: 22,
        },
        ssh_user: {
          type: "string",
          description: "SSH username",
        },
        remote_path: {
          type: "string",
          description: "Remote directory path to list",
        },
        ssh_key_path: {
          type: "string",
          description: "Path to SSH private key file",
        },
        ssh_password: {
          type: "string",
          description: "SSH password",
        },
      },
      required: ["ssh_host", "ssh_user", "remote_path"],
    },
  },

  // === Google Search Console Tools ===
  {
    name: "gsc_report",
    description:
      "Get a full Google Search Console performance report including top queries, pages, countries, and devices. Shows clicks, impressions, CTR, and average position for each dimension.",
    inputSchema: {
      type: "object" as const,
      properties: {
        site_url: {
          type: "string",
          description:
            "Site URL as registered in GSC (e.g., https://leadhorizon.co.in/ or sc-domain:leadhorizon.co.in)",
        },
        days: {
          type: "number",
          description: "Number of days to report on (default: 28)",
          default: 28,
        },
        start_date: {
          type: "string",
          description: "Custom start date (YYYY-MM-DD). Overrides days parameter.",
        },
        end_date: {
          type: "string",
          description: "Custom end date (YYYY-MM-DD). Overrides days parameter.",
        },
      },
      required: ["site_url"],
    },
  },
  {
    name: "gsc_submit_sitemap",
    description:
      "Submit or resubmit a sitemap to Google Search Console. If the sitemap was previously submitted, it will be resubmitted to trigger a re-crawl.",
    inputSchema: {
      type: "object" as const,
      properties: {
        site_url: {
          type: "string",
          description: "Site URL as registered in GSC",
        },
        sitemap_url: {
          type: "string",
          description:
            "Full URL of the sitemap (e.g., https://leadhorizon.co.in/sitemap.xml)",
        },
      },
      required: ["site_url", "sitemap_url"],
    },
  },
  {
    name: "gsc_check_indexing",
    description:
      "Check which pages of a site are indexed in Google Search Console. Shows indexed pages, excluded pages, and their status. Uses the URL Inspection API where available.",
    inputSchema: {
      type: "object" as const,
      properties: {
        site_url: {
          type: "string",
          description: "Site URL as registered in GSC",
        },
      },
      required: ["site_url"],
    },
  },
];
