import * as fs from "fs";
import * as path from "path";
import {
  getCategoryTemplate,
  getFileStructure,
  getPageBlueprint,
  getCssSystem,
  getJsSystem,
  getContentRules,
  DEFAULT_SERVICES,
  CategoryTemplate,
} from "./templates.js";

export interface BuildConfig {
  domain: string;
  business_name: string;
  category: string;
  phone: string;
  email: string;
  whatsapp?: string;
  location?: string;
  services?: string;
  tagline?: string;
  logo_path?: string;
  brand_colors?: { primary?: string; secondary?: string };
  google_analytics_id?: string;
  gtm_id?: string;
}

export interface GeneratePageConfig {
  page_type: string;
  domain: string;
  business_name: string;
  category: string;
  content_data?: any;
}

export interface SeoFilesConfig {
  domain: string;
  pages_list: string[];
  business_name?: string;
  business_description?: string;
  theme_color?: string;
}

function sanitizeProjectName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getProjectDir(businessName: string): string {
  const home = process.env.HOME || "/tmp";
  return path.join(home, "Desktop", sanitizeProjectName(businessName));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resolveTemplate(config: BuildConfig): CategoryTemplate {
  const template = getCategoryTemplate(config.category);
  const fallback: CategoryTemplate = {
    label: config.business_name,
    color_scheme: { primary: "#333333", secondary: "#007bff", dark: "#1a1a2e" },
    font_pair: { heading: "Inter", body: "Open Sans" },
    sections: ["hero", "services", "about", "testimonials", "faq", "contact", "footer"],
    cta_text: ["Contact Us", "Get Started"],
    trust_signals: ["years_experience", "clients_served"],
    schema_types: ["Organization", "LocalBusiness", "FAQPage", "BreadcrumbList"],
    target_keywords: [config.business_name.toLowerCase()],
    tone: "professional",
  };
  if (!template) return fallback;

  // Apply custom colors if provided
  if (config.brand_colors?.primary) {
    template.color_scheme.primary = config.brand_colors.primary;
  }
  if (config.brand_colors?.secondary) {
    template.color_scheme.secondary = config.brand_colors.secondary;
  }
  return template;
}

function getServices(config: BuildConfig): string[] {
  if (config.services) {
    return config.services.split(",").map((s) => s.trim());
  }
  return DEFAULT_SERVICES[config.category] || DEFAULT_SERVICES["custom"];
}

// ── HTML Generators ──

function generateHeadSection(config: BuildConfig, template: CategoryTemplate, pageTitle: string, pageDesc: string, pagePath: string): string {
  const url = `https://${config.domain}/${pagePath}`;
  const canonical = pagePath === "index.html" ? `https://${config.domain}/` : url;
  const gaScript = config.google_analytics_id
    ? `\n    <!-- Google Analytics -->\n    <script async src="https://www.googletagmanager.com/gtag/js?id=${config.google_analytics_id}"></script>\n    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${config.google_analytics_id}');</script>`
    : "";
  const gtmScript = config.gtm_id
    ? `\n    <!-- Google Tag Manager -->\n    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${config.gtm_id}');</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${pageDesc}">
    <meta name="keywords" content="${template.target_keywords.join(", ")}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonical}">${gaScript}${gtmScript}

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/logo.png">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${pageDesc}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="https://${config.domain}/og-image.jpg">
    <meta property="og:site_name" content="${config.business_name}">
    <meta property="og:locale" content="en_IN">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${pageTitle}">
    <meta name="twitter:description" content="${pageDesc}">
    <meta name="twitter:image" content="https://${config.domain}/og-image.jpg">

    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=${template.font_pair.heading.replace(/ /g, "+")}:wght@400;600;700;800&family=${template.font_pair.body.replace(/ /g, "+")}:wght@300;400;500;600&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Main CSS -->
    <link rel="stylesheet" href="/style.css?v=1.0">

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="${template.color_scheme.primary}">
</head>`;
}

function generateSchemaMarkup(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const whatsapp = config.whatsapp || config.phone.replace(/[-\s]/g, "");
  const schemas: string[] = [];

  // LocalBusiness / Organization
  schemas.push(`    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "${config.business_name}",
      "description": "${config.tagline || template.label}",
      "url": "https://${config.domain}",
      "telephone": "${config.phone}",
      "email": "${config.email}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${config.location || "India"}"
      },
      "image": "https://${config.domain}/og-image.jpg",
      "priceRange": "$$",
      "sameAs": []
    }
    </script>`);

  // BreadcrumbList
  schemas.push(`    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://${config.domain}/"}
      ]
    }
    </script>`);

  // FAQPage
  schemas.push(`    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What services does ${config.business_name} offer?",
          "acceptedAnswer": {"@type": "Answer", "text": "${config.business_name} offers ${services.slice(0, 3).join(", ")} and more in ${config.location || "India"}."}
        },
        {
          "@type": "Question",
          "name": "How can I contact ${config.business_name}?",
          "acceptedAnswer": {"@type": "Answer", "text": "You can reach us at ${config.phone} or email ${config.email}. WhatsApp is also available for instant contact."}
        },
        {
          "@type": "Question",
          "name": "Where is ${config.business_name} located?",
          "acceptedAnswer": {"@type": "Answer", "text": "${config.business_name} is located in ${config.location || "India"}. We serve clients across the region."}
        }
      ]
    }
    </script>`);

  // SpeakableSpecification
  schemas.push(`    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".hero-subtitle", ".about-text"]
      }
    }
    </script>`);

  return schemas.join("\n\n");
}

function generateHeader(config: BuildConfig, template: CategoryTemplate): string {
  return `    <!-- Header -->
    <header class="header" id="header">
        <div class="container">
            <a href="/" class="logo">
                <span class="logo-text">${config.business_name}</span>
            </a>
            <nav class="nav" id="nav">
                <a href="/" class="nav-link active">Home</a>
                <a href="/#services" class="nav-link">Services</a>
                <a href="/#about" class="nav-link">About</a>
                <a href="/blog.html" class="nav-link">Blog</a>
                <a href="/contact.html" class="nav-link">Contact</a>
            </nav>
            <a href="#" class="btn btn-primary open-contact-form">${template.cta_text[0] || "Get Started"}</a>
            <button class="hamburger" id="hamburger" aria-label="Menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    </header>`;
}

function generateHeroSection(config: BuildConfig, template: CategoryTemplate): string {
  const tagline = config.tagline || `Professional ${template.label} Solutions`;
  return `
    <!-- Hero Section -->
    <section class="hero" id="hero">
        <div class="container">
            <div class="hero-content">
                <span class="badge">${template.label}</span>
                <h1>${tagline} in ${config.location || "India"}</h1>
                <p class="hero-subtitle">We help businesses grow with expert ${template.target_keywords[0] || "services"}. Trusted by leading brands across ${config.location || "India"}.</p>
                <div class="hero-buttons">
                    <a href="#" class="btn btn-primary open-contact-form">${template.cta_text[0] || "Get Started"}</a>
                    <a href="tel:${config.phone.replace(/[-\s]/g, "")}" class="btn btn-outline"><i class="fas fa-phone"></i> Call Now</a>
                </div>
                <div class="trust-rating">
                    <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></div>
                    <span>4.8/5 Rating | Trusted by 200+ Clients</span>
                </div>
            </div>
        </div>
    </section>`;
}

function generateStatsSection(config: BuildConfig, template: CategoryTemplate): string {
  const stats = [
    { value: "250", suffix: "+", label: "Projects Delivered" },
    { value: "95", suffix: "%", label: "Client Satisfaction" },
    { value: "10", suffix: "+", label: "Years Experience" },
    { value: "4.8", suffix: "/5", label: "Google Rating" },
  ];
  return `
    <!-- Stats Section -->
    <section class="stats-section">
        <div class="container">
            <div class="stats-grid">
${stats.map((s) => `                <div class="stat-item">
                    <span class="stat-number" data-target="${s.value}">${s.value}</span><span class="stat-suffix">${s.suffix}</span>
                    <span class="stat-label">${s.label}</span>
                </div>`).join("\n")}
            </div>
        </div>
    </section>`;
}

function generateServicesSection(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const icons = ["fas fa-chart-line", "fas fa-bullhorn", "fas fa-search", "fas fa-code", "fas fa-mobile-alt", "fas fa-rocket"];
  return `
    <!-- Services Section -->
    <section class="services-section" id="services">
        <div class="container">
            <div class="section-header">
                <span class="badge">Our Services</span>
                <h2>What We Offer at ${config.business_name}</h2>
                <p>Comprehensive ${template.target_keywords[0] || "solutions"} tailored for your business needs in ${config.location || "India"}.</p>
            </div>
            <div class="services-grid">
${services.slice(0, 6).map((service, i) => `                <div class="service-card fade-in">
                    <div class="service-icon"><i class="${icons[i % icons.length]}"></i></div>
                    <h3>${service}</h3>
                    <p>Professional ${service.toLowerCase()} services designed to deliver measurable results and drive business growth.</p>
                    <a href="/contact.html" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>`).join("\n")}
            </div>
        </div>
    </section>`;
}

function generateTestimonialsSection(config: BuildConfig): string {
  const testimonials = [
    { name: "Rajesh Kumar", role: "Business Owner", text: "Outstanding results! Our leads increased by 300% within 3 months of working together.", stars: 5 },
    { name: "Priya Sharma", role: "Marketing Director", text: "Professional team that truly understands digital marketing. Highly recommended!", stars: 5 },
    { name: "Amit Patel", role: "CEO", text: "The best decision we made was partnering with them. ROI has been exceptional.", stars: 5 },
  ];
  return `
    <!-- Testimonials Section -->
    <section class="testimonials-section" id="testimonials">
        <div class="container">
            <div class="section-header">
                <span class="badge">Testimonials</span>
                <h2>What Our Clients Say About ${config.business_name}</h2>
            </div>
            <div class="testimonials-grid">
${testimonials.map((t) => `                <div class="testimonial-card fade-in">
                    <div class="stars">${'<i class="fas fa-star"></i>'.repeat(t.stars)}</div>
                    <p class="testimonial-text">"${t.text}"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar">${t.name[0]}</div>
                        <div>
                            <strong>${t.name}</strong>
                            <span>${t.role}</span>
                        </div>
                    </div>
                </div>`).join("\n")}
            </div>
        </div>
    </section>`;
}

function generateAboutSection(config: BuildConfig, template: CategoryTemplate): string {
  return `
    <!-- About Section -->
    <section class="about-section" id="about">
        <div class="container">
            <div class="about-grid">
                <div class="about-content">
                    <span class="badge">About Us</span>
                    <h2>Why Choose ${config.business_name}?</h2>
                    <p class="about-text">${config.business_name} is a trusted ${template.label.toLowerCase()} based in ${config.location || "India"}. With years of experience and a results-driven approach, we help businesses achieve their goals through innovative solutions and dedicated support.</p>
                    <div class="usp-grid">
                        <div class="usp-item"><i class="fas fa-check-circle"></i><div><strong>Proven Results</strong><span>Data-driven strategies that deliver</span></div></div>
                        <div class="usp-item"><i class="fas fa-users"></i><div><strong>Expert Team</strong><span>Experienced professionals</span></div></div>
                        <div class="usp-item"><i class="fas fa-headset"></i><div><strong>24/7 Support</strong><span>Always here to help</span></div></div>
                        <div class="usp-item"><i class="fas fa-trophy"></i><div><strong>Award Winning</strong><span>Recognized for excellence</span></div></div>
                    </div>
                    <a href="/contact.html" class="btn btn-primary">${template.cta_text[0] || "Get Started"}</a>
                </div>
            </div>
        </div>
    </section>`;
}

function generateFaqSection(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const faqs = [
    { q: `What services does ${config.business_name} offer?`, a: `${config.business_name} offers comprehensive ${template.target_keywords[0] || "services"} including ${services.slice(0, 3).join(", ")} and more. We cater to businesses of all sizes in ${config.location || "India"}.` },
    { q: `How can I contact ${config.business_name}?`, a: `You can reach us by phone at ${config.phone}, email at ${config.email}, or through WhatsApp for instant messaging. Visit our contact page for more options.` },
    { q: `Where is ${config.business_name} located?`, a: `We are based in ${config.location || "India"} and serve clients across the region. We also offer remote and online services for clients anywhere.` },
    { q: `What makes ${config.business_name} different?`, a: `Our data-driven approach, experienced team, and commitment to measurable results set us apart. We focus on ROI and long-term growth for every client.` },
    { q: `How quickly can I see results?`, a: `While results vary by service, most clients see initial improvements within the first 30 days. We provide regular progress reports and transparent communication throughout.` },
  ];
  return `
    <!-- FAQ Section -->
    <section class="faq-section" id="faq">
        <div class="container">
            <div class="section-header">
                <span class="badge">FAQ</span>
                <h2>Frequently Asked Questions</h2>
            </div>
            <div class="faq-list">
${faqs.map((f) => `                <div class="faq-item">
                    <button class="faq-question" aria-expanded="false">
                        <span>${f.q}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer"><p>${f.a}</p></div>
                </div>`).join("\n")}
            </div>
        </div>
    </section>`;
}

function generateCtaSection(config: BuildConfig, template: CategoryTemplate): string {
  return `
    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <h2>Ready to Grow Your Business?</h2>
            <p>Get in touch with ${config.business_name} today and let's start building something great together.</p>
            <a href="#" class="btn btn-primary btn-large open-contact-form">${template.cta_text[0] || "Get Started"}</a>
        </div>
    </section>`;
}

function generateFooter(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const whatsapp = config.whatsapp || config.phone.replace(/[-\s]/g, "");
  const year = new Date().getFullYear();
  return `
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <h3 class="logo-text">${config.business_name}</h3>
                    <p>${config.tagline || `Professional ${template.label.toLowerCase()} in ${config.location || "India"}.`}</p>
                    <div class="social-icons">
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                    </div>
                </div>
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/#services">Services</a></li>
                        <li><a href="/#about">About</a></li>
                        <li><a href="/blog.html">Blog</a></li>
                        <li><a href="/contact.html">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Services</h4>
                    <ul>
${services.slice(0, 5).map((s) => `                        <li><a href="/contact.html">${s}</a></li>`).join("\n")}
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact Info</h4>
                    <ul class="contact-list">
                        <li><i class="fas fa-phone"></i> <a href="tel:${config.phone.replace(/[-\s]/g, "")}">${config.phone}</a></li>
                        <li><i class="fas fa-envelope"></i> <a href="mailto:${config.email}">${config.email}</a></li>
                        <li><i class="fas fa-map-marker-alt"></i> ${config.location || "India"}</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${year} ${config.business_name}. All rights reserved.</p>
                <div class="legal-links">
                    <a href="/privacy-policy.html">Privacy Policy</a>
                    <a href="/terms.html">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- WhatsApp Float -->
    <a href="https://wa.me/${whatsapp}" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
        <i class="fab fa-whatsapp"></i>
        <span class="whatsapp-tooltip">Chat with us</span>
    </a>

    <!-- Contact Modal -->
    <div class="modal" id="contactModal">
        <div class="modal-content">
            <button class="modal-close" aria-label="Close">&times;</button>
            <h2>Get In Touch</h2>
            <p>Fill the form below and we'll get back to you within 24 hours.</p>
            <form id="contactForm" action="/thankyou.html" method="GET">
                <div class="form-group"><label for="name">Full Name</label><input type="text" id="name" name="name" required placeholder="Your full name"></div>
                <div class="form-group"><label for="phone">Phone Number</label><input type="tel" id="phone" name="phone" required placeholder="Your phone number"></div>
                <div class="form-group"><label for="email_input">Email Address</label><input type="email" id="email_input" name="email" required placeholder="Your email"></div>
                <div class="form-group"><label for="location_input">Location</label><input type="text" id="location_input" name="location" placeholder="Your city"></div>
                <div class="form-group"><label for="message">Message</label><textarea id="message" name="message" rows="3" placeholder="Tell us about your requirements"></textarea></div>
                <button type="submit" class="btn btn-primary btn-full">${template.cta_text[0] || "Submit"}</button>
            </form>
        </div>
    </div>

    <!-- Exit Intent Popup -->
    <div class="popup" id="exitPopup">
        <div class="popup-content">
            <button class="popup-close" aria-label="Close">&times;</button>
            <i class="fas fa-gift popup-icon"></i>
            <h2>Wait! Don't Leave Yet</h2>
            <p>Get a <strong>FREE consultation</strong> with our experts</p>
            <ul class="popup-benefits">
                <li><i class="fas fa-check"></i> No obligation consultation</li>
                <li><i class="fas fa-check"></i> Expert advice tailored to your business</li>
                <li><i class="fas fa-check"></i> Actionable growth strategies</li>
            </ul>
            <a href="#" class="btn btn-primary btn-full open-contact-form">${template.cta_text[0] || "Get Free Consultation"}</a>
            <p class="popup-skip">No thanks, I'll pass</p>
        </div>
    </div>

    <!-- Cookie Consent -->
    <div class="cookie-banner" id="cookieBanner">
        <p>We use cookies to enhance your experience. By continuing, you agree to our <a href="/privacy-policy.html">Privacy Policy</a>.</p>
        <button class="btn btn-small" id="acceptCookies">Accept</button>
    </div>`;
}

// ── CSS Generator ──

function generateCSS(config: BuildConfig, template: CategoryTemplate): string {
  return `/* ===== WebForge AI Generated CSS ===== */
/* ${config.business_name} | ${config.domain} */

:root {
    --primary: ${template.color_scheme.primary};
    --secondary: ${template.color_scheme.secondary};
    --dark: ${template.color_scheme.dark};
    --white: #ffffff;
    --light-bg: #f8f9fa;
    --text: #333333;
    --text-light: #666666;
    --border: #e0e0e0;
    --shadow: 0 4px 20px rgba(0,0,0,0.08);
    --shadow-hover: 0 8px 30px rgba(0,0,0,0.15);
    --radius: 12px;
    --transition: all 0.3s ease;
    --font-heading: '${template.font_pair.heading}', sans-serif;
    --font-body: '${template.font_pair.body}', sans-serif;
}

/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-body); color: var(--text); line-height: 1.7; -webkit-font-smoothing: antialiased; }
a { text-decoration: none; color: inherit; }
ul { list-style: none; }
img { max-width: 100%; height: auto; display: block; }

/* Container */
.container { max-width: 1200px; width: 90%; margin: 0 auto; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: var(--transition); border: 2px solid transparent; font-family: var(--font-body); }
.btn-primary { background: var(--primary); color: var(--white); }
.btn-primary:hover { background: var(--dark); transform: translateY(-2px); box-shadow: var(--shadow-hover); }
.btn-outline { border-color: var(--primary); color: var(--primary); background: transparent; }
.btn-outline:hover { background: var(--primary); color: var(--white); }
.btn-large { padding: 18px 40px; font-size: 18px; }
.btn-full { width: 100%; justify-content: center; }
.btn-small { padding: 8px 20px; font-size: 14px; }

/* Badge */
.badge { display: inline-block; padding: 6px 16px; background: rgba(${hexToRgb(template.color_scheme.primary)}, 0.1); color: var(--primary); border-radius: 50px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

/* Header */
.header { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: var(--white); transition: var(--transition); padding: 16px 0; }
.header.scrolled { padding: 10px 0; box-shadow: var(--shadow); }
.header .container { display: flex; align-items: center; justify-content: space-between; }
.logo-text { font-family: var(--font-heading); font-size: 24px; font-weight: 800; color: var(--primary); }
.nav { display: flex; align-items: center; gap: 32px; }
.nav-link { font-weight: 500; color: var(--text); transition: var(--transition); position: relative; }
.nav-link:hover, .nav-link.active { color: var(--primary); }
.hamburger { display: none; background: none; border: none; cursor: pointer; width: 30px; height: 24px; position: relative; }
.hamburger span { display: block; width: 100%; height: 3px; background: var(--dark); border-radius: 3px; position: absolute; transition: var(--transition); }
.hamburger span:nth-child(1) { top: 0; }
.hamburger span:nth-child(2) { top: 50%; transform: translateY(-50%); }
.hamburger span:nth-child(3) { bottom: 0; }
.hamburger.active span:nth-child(1) { transform: rotate(45deg); top: 50%; }
.hamburger.active span:nth-child(2) { opacity: 0; }
.hamburger.active span:nth-child(3) { transform: rotate(-45deg); bottom: auto; top: 50%; }

/* Hero */
.hero { padding: 160px 0 100px; background: linear-gradient(135deg, var(--dark) 0%, ${template.color_scheme.primary}dd 100%); color: var(--white); }
.hero-content { max-width: 700px; }
.hero h1 { font-family: var(--font-heading); font-size: 48px; font-weight: 800; line-height: 1.2; margin: 16px 0; }
.hero-subtitle { font-size: 18px; opacity: 0.9; margin-bottom: 32px; line-height: 1.6; }
.hero .badge { background: rgba(255,255,255,0.2); color: var(--white); }
.hero-buttons { display: flex; gap: 16px; margin-bottom: 24px; }
.hero .btn-primary { background: var(--secondary); color: var(--dark); }
.hero .btn-outline { border-color: var(--white); color: var(--white); }
.trust-rating { display: flex; align-items: center; gap: 12px; font-size: 14px; opacity: 0.9; }
.stars { color: var(--secondary); }
.stars i { margin-right: 2px; }

/* Stats */
.stats-section { padding: 60px 0; background: var(--white); border-bottom: 1px solid var(--border); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; text-align: center; }
.stat-item { padding: 20px; }
.stat-number { font-family: var(--font-heading); font-size: 42px; font-weight: 800; color: var(--primary); }
.stat-suffix { font-family: var(--font-heading); font-size: 24px; font-weight: 700; color: var(--primary); }
.stat-label { display: block; color: var(--text-light); margin-top: 8px; font-size: 14px; }

/* Section Header */
.section-header { text-align: center; max-width: 600px; margin: 0 auto 60px; }
.section-header h2 { font-family: var(--font-heading); font-size: 36px; font-weight: 700; margin: 12px 0; color: var(--dark); }
.section-header p { color: var(--text-light); font-size: 16px; }

/* Services */
.services-section { padding: 100px 0; background: var(--light-bg); }
.services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
.service-card { background: var(--white); padding: 40px 30px; border-radius: var(--radius); box-shadow: var(--shadow); transition: var(--transition); }
.service-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-hover); }
.service-icon { width: 60px; height: 60px; border-radius: 12px; background: rgba(${hexToRgb(template.color_scheme.primary)}, 0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.service-icon i { font-size: 24px; color: var(--primary); }
.service-card h3 { font-family: var(--font-heading); font-size: 20px; margin-bottom: 12px; color: var(--dark); }
.service-card p { color: var(--text-light); font-size: 15px; margin-bottom: 16px; }
.service-link { color: var(--primary); font-weight: 600; font-size: 14px; }

/* Testimonials */
.testimonials-section { padding: 100px 0; background: var(--white); }
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
.testimonial-card { background: var(--light-bg); padding: 32px; border-radius: var(--radius); transition: var(--transition); }
.testimonial-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
.testimonial-card .stars { color: var(--secondary); margin-bottom: 16px; }
.testimonial-text { font-size: 15px; color: var(--text); margin-bottom: 20px; font-style: italic; line-height: 1.7; }
.testimonial-author { display: flex; align-items: center; gap: 12px; }
.author-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--primary); color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; }
.testimonial-author strong { display: block; font-size: 15px; }
.testimonial-author span { font-size: 13px; color: var(--text-light); }

/* About */
.about-section { padding: 100px 0; background: var(--light-bg); }
.about-content { max-width: 800px; }
.about-text { color: var(--text-light); font-size: 16px; margin-bottom: 30px; line-height: 1.8; }
.usp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
.usp-item { display: flex; align-items: flex-start; gap: 12px; }
.usp-item i { color: var(--primary); font-size: 20px; margin-top: 4px; }
.usp-item strong { display: block; font-size: 15px; }
.usp-item span { font-size: 13px; color: var(--text-light); }

/* FAQ */
.faq-section { padding: 100px 0; background: var(--white); }
.faq-list { max-width: 800px; margin: 0 auto; }
.faq-item { border-bottom: 1px solid var(--border); }
.faq-question { width: 100%; padding: 20px 0; background: none; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; color: var(--dark); font-family: var(--font-body); text-align: left; }
.faq-question i { transition: var(--transition); color: var(--primary); }
.faq-question[aria-expanded="true"] i { transform: rotate(180deg); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.faq-answer p { padding: 0 0 20px; color: var(--text-light); line-height: 1.7; }

/* CTA Section */
.cta-section { padding: 80px 0; background: linear-gradient(135deg, var(--primary), var(--dark)); color: var(--white); text-align: center; }
.cta-section h2 { font-family: var(--font-heading); font-size: 36px; margin-bottom: 16px; }
.cta-section p { font-size: 18px; opacity: 0.9; margin-bottom: 32px; }
.cta-section .btn-primary { background: var(--secondary); color: var(--dark); }

/* Footer */
.footer { padding: 80px 0 30px; background: var(--dark); color: rgba(255,255,255,0.8); }
.footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.5fr; gap: 40px; margin-bottom: 40px; }
.footer h3 { color: var(--white); margin-bottom: 16px; }
.footer h4 { color: var(--white); margin-bottom: 16px; font-size: 16px; }
.footer ul li { margin-bottom: 10px; }
.footer a:hover { color: var(--secondary); }
.social-icons { display: flex; gap: 12px; margin-top: 16px; }
.social-icons a { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.social-icons a:hover { background: var(--primary); border-color: var(--primary); color: var(--white); }
.contact-list li { display: flex; align-items: flex-start; gap: 10px; }
.contact-list i { margin-top: 4px; color: var(--secondary); }
.footer-bottom { padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.legal-links { display: flex; gap: 20px; }

/* WhatsApp Float */
.whatsapp-float { position: fixed; bottom: 24px; right: 24px; z-index: 999; background: #25D366; color: var(--white); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 4px 15px rgba(37,211,102,0.4); transition: var(--transition); }
.whatsapp-float:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(37,211,102,0.5); }
.whatsapp-tooltip { position: absolute; right: 70px; background: var(--dark); color: var(--white); padding: 8px 16px; border-radius: 8px; font-size: 13px; white-space: nowrap; opacity: 0; pointer-events: none; transition: var(--transition); }
.whatsapp-float:hover .whatsapp-tooltip { opacity: 1; }

/* Modal */
.modal { display: none; position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); align-items: center; justify-content: center; }
.modal.active { display: flex; }
.modal-content { background: var(--white); padding: 40px; border-radius: var(--radius); max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; }
.modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 28px; cursor: pointer; color: var(--text-light); }
.modal-content h2 { font-family: var(--font-heading); margin-bottom: 8px; }
.modal-content > p { color: var(--text-light); margin-bottom: 24px; font-size: 14px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: var(--dark); }
.form-group input, .form-group textarea { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 15px; font-family: var(--font-body); transition: var(--transition); }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(${hexToRgb(template.color_scheme.primary)}, 0.1); }

/* Popup */
.popup { display: none; position: fixed; inset: 0; z-index: 2001; background: rgba(0,0,0,0.6); align-items: center; justify-content: center; }
.popup.active { display: flex; }
.popup-content { background: var(--white); padding: 40px; border-radius: var(--radius); max-width: 420px; width: 90%; text-align: center; }
.popup-close { position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 28px; cursor: pointer; }
.popup-icon { font-size: 48px; color: var(--primary); margin-bottom: 16px; }
.popup-content h2 { font-family: var(--font-heading); margin-bottom: 8px; }
.popup-benefits { text-align: left; margin: 20px 0; }
.popup-benefits li { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.popup-benefits i { color: var(--primary); }
.popup-skip { margin-top: 16px; font-size: 13px; color: var(--text-light); cursor: pointer; }

/* Cookie Banner */
.cookie-banner { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1999; background: var(--dark); color: var(--white); padding: 16px 24px; align-items: center; justify-content: center; gap: 20px; }
.cookie-banner.active { display: flex; }
.cookie-banner p { font-size: 14px; }
.cookie-banner a { color: var(--secondary); text-decoration: underline; }

/* Contact Page */
.contact-page { padding: 140px 0 80px; }
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
.contact-info h1 { font-family: var(--font-heading); font-size: 36px; margin-bottom: 16px; color: var(--dark); }
.contact-info p { color: var(--text-light); margin-bottom: 30px; }
.contact-details li { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
.contact-details .icon-box { width: 48px; height: 48px; border-radius: 12px; background: rgba(${hexToRgb(template.color_scheme.primary)}, 0.1); display: flex; align-items: center; justify-content: center; color: var(--primary); }
.contact-form { background: var(--white); padding: 40px; border-radius: var(--radius); box-shadow: var(--shadow); }

/* Blog Page */
.blog-page { padding: 140px 0 80px; }
.blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
.blog-card { background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); transition: var(--transition); }
.blog-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-hover); }
.blog-card-image { height: 200px; background: var(--light-bg); display: flex; align-items: center; justify-content: center; color: var(--text-light); }
.blog-card-content { padding: 24px; }
.blog-card-category { display: inline-block; font-size: 12px; color: var(--primary); font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
.blog-card h3 { font-family: var(--font-heading); font-size: 18px; margin-bottom: 8px; color: var(--dark); }
.blog-card p { font-size: 14px; color: var(--text-light); margin-bottom: 16px; }
.read-more { color: var(--primary); font-weight: 600; font-size: 14px; }

/* Utility Pages */
.utility-page { padding: 140px 0 80px; }
.utility-page .container { max-width: 800px; }
.utility-page h1 { font-family: var(--font-heading); font-size: 36px; margin-bottom: 20px; color: var(--dark); }
.utility-page h2 { font-family: var(--font-heading); font-size: 24px; margin: 30px 0 12px; color: var(--dark); }
.utility-page p, .utility-page li { color: var(--text-light); line-height: 1.8; margin-bottom: 12px; }
.utility-page ul { padding-left: 20px; list-style: disc; }

/* 404 Page */
.page-404 { padding: 200px 0 100px; text-align: center; }
.page-404 h1 { font-family: var(--font-heading); font-size: 120px; color: var(--primary); line-height: 1; }
.page-404 h2 { font-size: 28px; margin: 16px 0; }
.page-404 p { color: var(--text-light); margin-bottom: 30px; }

/* Thank You Page */
.thankyou-page { padding: 200px 0 100px; text-align: center; }
.thankyou-page .icon { font-size: 64px; color: var(--primary); margin-bottom: 20px; }
.thankyou-page h1 { font-family: var(--font-heading); font-size: 42px; margin-bottom: 16px; color: var(--dark); }
.thankyou-page p { color: var(--text-light); font-size: 18px; margin-bottom: 30px; }

/* Fade In Animation */
.fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }

/* Responsive */
@media (max-width: 768px) {
    .nav { display: none; position: fixed; top: 70px; left: 0; right: 0; background: var(--white); flex-direction: column; padding: 20px; gap: 16px; box-shadow: var(--shadow); }
    .nav.active { display: flex; }
    .hamburger { display: block; }
    .header .btn { display: none; }
    .hero h1 { font-size: 32px; }
    .hero { padding: 120px 0 60px; }
    .hero-buttons { flex-direction: column; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .services-grid { grid-template-columns: 1fr; }
    .testimonials-grid { grid-template-columns: 1fr; }
    .usp-grid { grid-template-columns: 1fr; }
    .footer-grid { grid-template-columns: 1fr; }
    .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
    .blog-grid { grid-template-columns: 1fr; }
    .contact-grid { grid-template-columns: 1fr; }
    .section-header h2 { font-size: 28px; }
    .stat-number { font-size: 32px; }
}

@media (max-width: 1024px) and (min-width: 769px) {
    .services-grid { grid-template-columns: repeat(2, 1fr); }
    .footer-grid { grid-template-columns: repeat(2, 1fr); }
}
`;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// ── JS Generator ──

function generateJS(): string {
  return `/* ===== WebForge AI Generated JavaScript ===== */
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
        nav.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }

    // Header Shrink on Scroll
    var header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // Scroll Fade-in Animations
    var fadeEls = document.querySelectorAll('.fade-in');
    if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
        var fadeObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        fadeEls.forEach(function(el) { fadeObserver.observe(el); });
    }

    // Counter Animation
    var statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
        var counterObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseFloat(el.getAttribute('data-target'));
                    var isDecimal = target % 1 !== 0;
                    var duration = 2000;
                    var start = 0;
                    var startTime = null;
                    function animate(ts) {
                        if (!startTime) startTime = ts;
                        var progress = Math.min((ts - startTime) / duration, 1);
                        var eased = 1 - Math.pow(1 - progress, 3);
                        var current = start + (target - start) * eased;
                        el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
                        if (progress < 1) requestAnimationFrame(animate);
                    }
                    requestAnimationFrame(animate);
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        statNumbers.forEach(function(el) { counterObserver.observe(el); });
    }

    // Contact Modal
    var modal = document.getElementById('contactModal');
    if (modal) {
        document.querySelectorAll('.open-contact-form').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                modal.classList.add('active');
                // Close exit popup if open
                var exitPopup = document.getElementById('exitPopup');
                if (exitPopup) exitPopup.classList.remove('active');
            });
        });
        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.classList.remove('active');
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    // Exit Intent Popup
    var exitPopup = document.getElementById('exitPopup');
    if (exitPopup) {
        var exitShown = sessionStorage.getItem('exitPopupShown');
        if (!exitShown) {
            // Desktop: mouse leave
            document.addEventListener('mouseout', function(e) {
                if (e.clientY < 0 && !sessionStorage.getItem('exitPopupShown')) {
                    exitPopup.classList.add('active');
                    sessionStorage.setItem('exitPopupShown', 'true');
                }
            });
            // Mobile: 30s timeout
            if (window.innerWidth < 768) {
                setTimeout(function() {
                    if (!sessionStorage.getItem('exitPopupShown')) {
                        exitPopup.classList.add('active');
                        sessionStorage.setItem('exitPopupShown', 'true');
                    }
                }, 30000);
            }
        }
        exitPopup.querySelector('.popup-close').addEventListener('click', function() {
            exitPopup.classList.remove('active');
        });
        var skipText = exitPopup.querySelector('.popup-skip');
        if (skipText) {
            skipText.addEventListener('click', function() {
                exitPopup.classList.remove('active');
            });
        }
        exitPopup.addEventListener('click', function(e) {
            if (e.target === exitPopup) exitPopup.classList.remove('active');
        });
    }

    // Escape key closes modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modal) modal.classList.remove('active');
            if (exitPopup) exitPopup.classList.remove('active');
        }
    });

    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                var headerHeight = header ? header.offsetHeight : 0;
                var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // Form Validation
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            var phone = contactForm.querySelector('[name="phone"]');
            if (phone && phone.value.replace(/\\D/g, '').length < 10) {
                e.preventDefault();
                alert('Please enter a valid phone number (minimum 10 digits).');
                phone.focus();
                return;
            }
        });
    }

    // Cookie Consent
    var cookieBanner = document.getElementById('cookieBanner');
    var acceptBtn = document.getElementById('acceptCookies');
    if (cookieBanner && !localStorage.getItem('cookiesAccepted')) {
        setTimeout(function() {
            cookieBanner.classList.add('active');
        }, 2000);
    }
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieBanner.classList.remove('active');
        });
    }

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var expanded = this.getAttribute('aria-expanded') === 'true';
            // Close all
            document.querySelectorAll('.faq-question').forEach(function(q) {
                q.setAttribute('aria-expanded', 'false');
                q.nextElementSibling.style.maxHeight = null;
            });
            // Toggle current
            if (!expanded) {
                this.setAttribute('aria-expanded', 'true');
                this.nextElementSibling.style.maxHeight = this.nextElementSibling.scrollHeight + 'px';
            }
        });
    });
});
`;
}

// ── Page Generators ──

function generateIndexPage(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `${config.tagline || template.target_keywords[0]} | ${config.business_name}`;
  const pageDesc = `${config.business_name} - ${template.label} in ${config.location || "India"}. ${template.cta_text[0]} today! Call ${config.phone}.`;
  const gtmNoscript = config.gtm_id ? `\n    <!-- GTM noscript -->\n    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${config.gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : "";

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "index.html")}
<body>${gtmNoscript}
${generateHeader(config, template)}
${generateHeroSection(config, template)}
${generateStatsSection(config, template)}
${generateServicesSection(config, template, services)}
${generateTestimonialsSection(config)}
${generateAboutSection(config, template)}
${generateFaqSection(config, template, services)}
${generateCtaSection(config, template)}
${generateFooter(config, template, services)}

${generateSchemaMarkup(config, template, services)}

    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generateContactPage(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `Contact Us | ${config.business_name}`;
  const pageDesc = `Get in touch with ${config.business_name}. Call ${config.phone}, email ${config.email}, or fill our contact form for a quick response.`;

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "contact.html")}
<body>
${generateHeader(config, template)}

    <section class="contact-page">
        <div class="container">
            <div class="contact-grid">
                <div class="contact-info">
                    <h1>Contact ${config.business_name}</h1>
                    <p>Have a question or want to work together? Reach out to us through any of the channels below or fill out the form.</p>
                    <ul class="contact-details">
                        <li><div class="icon-box"><i class="fas fa-phone"></i></div><div><strong>Phone</strong><br><a href="tel:${config.phone.replace(/[-\s]/g, "")}">${config.phone}</a></div></li>
                        <li><div class="icon-box"><i class="fas fa-envelope"></i></div><div><strong>Email</strong><br><a href="mailto:${config.email}">${config.email}</a></div></li>
                        <li><div class="icon-box"><i class="fas fa-map-marker-alt"></i></div><div><strong>Location</strong><br>${config.location || "India"}</div></li>
                        <li><div class="icon-box"><i class="fab fa-whatsapp"></i></div><div><strong>WhatsApp</strong><br><a href="https://wa.me/${(config.whatsapp || config.phone).replace(/[-\s]/g, "")}" target="_blank" rel="noopener">Chat with us</a></div></li>
                    </ul>
                </div>
                <div class="contact-form">
                    <h2>Send Us a Message</h2>
                    <form id="contactForm" action="/thankyou.html" method="GET">
                        <div class="form-group"><label for="name">Full Name *</label><input type="text" id="name" name="name" required placeholder="Your full name"></div>
                        <div class="form-group"><label for="phone">Phone Number *</label><input type="tel" id="phone" name="phone" required placeholder="Your phone number"></div>
                        <div class="form-group"><label for="email_input">Email Address *</label><input type="email" id="email_input" name="email" required placeholder="Your email"></div>
                        <div class="form-group"><label for="location_input">City / Location</label><input type="text" id="location_input" name="location" placeholder="Your city"></div>
                        <div class="form-group"><label for="message">Message</label><textarea id="message" name="message" rows="4" placeholder="Tell us about your requirements"></textarea></div>
                        <button type="submit" class="btn btn-primary btn-full">${template.cta_text[0] || "Send Message"}</button>
                    </form>
                </div>
            </div>
        </div>
    </section>

${generateFooter(config, template, services)}

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact ${config.business_name}",
      "url": "https://${config.domain}/contact.html"
    }
    </script>

    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generateBlogPage(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `Blog | ${config.business_name}`;
  const pageDesc = `Read the latest insights on ${template.target_keywords[0] || "industry trends"} from ${config.business_name}. Expert tips, guides, and strategies.`;
  const posts = [
    { title: `The Ultimate Guide to ${template.target_keywords[0] || "Business Growth"} in ${new Date().getFullYear()}`, category: "Guide", excerpt: `Learn everything you need to know about ${template.target_keywords[0] || "business growth"} with this comprehensive guide.` },
    { title: `Top 10 ${template.target_keywords[1] || "Strategies"} Every Business Should Know`, category: "Tips", excerpt: `Discover the most effective strategies that successful businesses use to stay ahead of the competition.` },
    { title: `How ${config.business_name} Helped a Client Achieve 300% Growth`, category: "Case Study", excerpt: `A detailed look at how our team delivered exceptional results for one of our clients.` },
    { title: `${template.target_keywords[0] || "Industry"} Trends to Watch in ${new Date().getFullYear()}`, category: "Trends", excerpt: `Stay updated with the latest trends shaping the industry and how to leverage them.` },
  ];

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "blog.html")}
<body>
${generateHeader(config, template)}

    <section class="blog-page">
        <div class="container">
            <div class="section-header">
                <span class="badge">Our Blog</span>
                <h1>Insights & Articles from ${config.business_name}</h1>
                <p>Expert tips, strategies, and industry insights to help your business grow.</p>
            </div>
            <div class="blog-grid">
${posts.map((post, i) => `                <div class="blog-card fade-in">
                    <div class="blog-card-image"><i class="fas fa-newspaper" style="font-size:48px"></i></div>
                    <div class="blog-card-content">
                        <span class="blog-card-category">${post.category}</span>
                        <h3>${post.title}</h3>
                        <p>${post.excerpt}</p>
                        <a href="/blog/post-${i + 1}.html" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>`).join("\n")}
            </div>
        </div>
    </section>

${generateFooter(config, template, services)}
    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generatePrivacyPage(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `Privacy Policy | ${config.business_name}`;
  const pageDesc = `Privacy Policy of ${config.business_name}. Learn how we collect, use, and protect your personal information.`;
  const year = new Date().getFullYear();

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "privacy-policy.html")}
<body>
${generateHeader(config, template)}

    <section class="utility-page">
        <div class="container">
            <h1>Privacy Policy</h1>
            <p><em>Last updated: January ${year}</em></p>

            <h2>Introduction</h2>
            <p>${config.business_name} ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website https://${config.domain}.</p>

            <h2>Information We Collect</h2>
            <p>We may collect personal information that you voluntarily provide to us when you:</p>
            <ul>
                <li>Fill out a contact form (name, email, phone number, location)</li>
                <li>Subscribe to our newsletter</li>
                <li>Communicate with us via email, phone, or WhatsApp</li>
            </ul>
            <p>We also automatically collect certain information including your IP address, browser type, device information, and pages visited through cookies and analytics tools.</p>

            <h2>How We Use Your Information</h2>
            <ul>
                <li>To respond to your inquiries and provide our services</li>
                <li>To send you marketing communications (with your consent)</li>
                <li>To improve our website and user experience</li>
                <li>To comply with legal obligations</li>
            </ul>

            <h2>Cookies</h2>
            <p>We use cookies and similar tracking technologies to track activity on our website and improve your experience. You can set your browser to refuse all cookies or indicate when a cookie is being sent.</p>

            <h2>Third-Party Services</h2>
            <p>We may use third-party services such as Google Analytics, Google Tag Manager, and social media platforms that may collect information about you. These services have their own privacy policies.</p>

            <h2>Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

            <h2>Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at ${config.email}.</p>

            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, contact us at:</p>
            <ul>
                <li>Email: ${config.email}</li>
                <li>Phone: ${config.phone}</li>
                <li>Address: ${config.location || "India"}</li>
            </ul>
        </div>
    </section>

${generateFooter(config, template, services)}
    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generateTermsPage(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `Terms of Service | ${config.business_name}`;
  const pageDesc = `Terms of Service for ${config.business_name}. Read our terms and conditions for using our website and services.`;
  const year = new Date().getFullYear();

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "terms.html")}
<body>
${generateHeader(config, template)}

    <section class="utility-page">
        <div class="container">
            <h1>Terms of Service</h1>
            <p><em>Last updated: January ${year}</em></p>

            <h2>Agreement to Terms</h2>
            <p>By accessing and using the website https://${config.domain}, operated by ${config.business_name}, you agree to be bound by these Terms of Service.</p>

            <h2>Services</h2>
            <p>${config.business_name} provides ${template.label.toLowerCase()} services. The specific scope of services will be agreed upon between us and the client on a project-by-project basis.</p>

            <h2>Intellectual Property</h2>
            <p>All content on this website, including text, graphics, logos, and images, is the property of ${config.business_name} and is protected by applicable intellectual property laws.</p>

            <h2>User Responsibilities</h2>
            <ul>
                <li>You agree to use this website only for lawful purposes</li>
                <li>You will not attempt to gain unauthorized access to any part of our website</li>
                <li>You will provide accurate information when filling out forms</li>
            </ul>

            <h2>Limitation of Liability</h2>
            <p>${config.business_name} shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our website or services.</p>

            <h2>Disclaimer</h2>
            <p>The information on this website is provided "as is" without any warranties, express or implied. Results mentioned on this website are based on past performance and do not guarantee similar outcomes.</p>

            <h2>Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this website.</p>

            <h2>Contact</h2>
            <p>For questions about these Terms, contact us at ${config.email}.</p>
        </div>
    </section>

${generateFooter(config, template, services)}
    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generateFaqPage(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `FAQ | ${config.business_name}`;
  const pageDesc = `Frequently asked questions about ${config.business_name} services. Find answers about ${template.target_keywords[0] || "our services"}.`;

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "faq.html")}
<body>
${generateHeader(config, template)}

    <section class="utility-page">
        <div class="container">
            <div class="section-header">
                <span class="badge">FAQ</span>
                <h1>Frequently Asked Questions</h1>
                <p>Find answers to the most common questions about ${config.business_name} and our services.</p>
            </div>
${generateFaqSection(config, template, services)}
        </div>
    </section>

${generateFooter(config, template, services)}
    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generate404Page(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `Page Not Found | ${config.business_name}`;
  const pageDesc = `The page you're looking for doesn't exist. Go back to ${config.business_name} homepage.`;

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "404.html")}
<body>
${generateHeader(config, template)}

    <section class="page-404">
        <div class="container">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
            <div class="hero-buttons" style="justify-content:center">
                <a href="/" class="btn btn-primary">Go to Homepage</a>
                <a href="/contact.html" class="btn btn-outline">Contact Us</a>
            </div>
        </div>
    </section>

${generateFooter(config, template, services)}
    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generateThankYouPage(config: BuildConfig, template: CategoryTemplate, services: string[]): string {
  const pageTitle = `Thank You | ${config.business_name}`;
  const pageDesc = `Thank you for contacting ${config.business_name}. We'll get back to you shortly.`;

  return `${generateHeadSection(config, template, pageTitle, pageDesc, "thankyou.html")}
<body>
${generateHeader(config, template)}

    <section class="thankyou-page">
        <div class="container">
            <div class="icon"><i class="fas fa-check-circle"></i></div>
            <h1>Thank You!</h1>
            <p>Your message has been received. We'll get back to you within 24 hours.</p>
            <div class="hero-buttons" style="justify-content:center">
                <a href="/" class="btn btn-primary">Back to Homepage</a>
                <a href="https://wa.me/${(config.whatsapp || config.phone).replace(/[-\s]/g, "")}" class="btn btn-outline" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Chat on WhatsApp</a>
            </div>
        </div>
    </section>

${generateFooter(config, template, services)}

    <!-- Conversion Tracking -->
    ${config.google_analytics_id ? `<script>if(typeof gtag==='function'){gtag('event','conversion',{send_to:'${config.google_analytics_id}'});}</script>` : "<!-- Add conversion tracking here -->"}

    <script src="/script.js" defer></script>
</body>
</html>`;
}

function generateFavicon(businessName: string): string {
  const initials = businessName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#333"/>
  <text x="50" y="65" font-family="Arial,sans-serif" font-size="40" font-weight="bold" fill="#fff" text-anchor="middle">${initials}</text>
</svg>`;
}

// ── Public API ──

export async function buildWebsite(config: BuildConfig): Promise<{ projectDir: string; files: string[] }> {
  const template = resolveTemplate(config);
  const services = getServices(config);
  const projectDir = getProjectDir(config.business_name);

  ensureDir(projectDir);
  ensureDir(path.join(projectDir, "blog"));

  const files: Record<string, string> = {
    "index.html": generateIndexPage(config, template, services),
    "contact.html": generateContactPage(config, template, services),
    "blog.html": generateBlogPage(config, template, services),
    "privacy-policy.html": generatePrivacyPage(config, template, services),
    "terms.html": generateTermsPage(config, template, services),
    "faq.html": generateFaqPage(config, template, services),
    "404.html": generate404Page(config, template, services),
    "thankyou.html": generateThankYouPage(config, template, services),
    "style.css": generateCSS(config, template),
    "script.js": generateJS(),
    "favicon.svg": generateFavicon(config.business_name),
  };

  const fileList: string[] = [];
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(projectDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    fileList.push(filename);
  }

  // Generate SEO files
  const seoFiles = generateSeoFilesContent({
    domain: config.domain,
    pages_list: Object.keys(files).filter((f) => f.endsWith(".html")),
    business_name: config.business_name,
    business_description: config.tagline || template.label,
    theme_color: template.color_scheme.primary,
  });
  for (const [filename, content] of Object.entries(seoFiles)) {
    const filePath = path.join(projectDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    fileList.push(filename);
  }

  return { projectDir, files: fileList };
}

export function generatePage(config: GeneratePageConfig): string {
  const buildConfig: BuildConfig = {
    domain: config.domain,
    business_name: config.business_name,
    category: config.category,
    phone: config.content_data?.phone || "+91-0000000000",
    email: config.content_data?.email || `info@${config.domain}`,
    whatsapp: config.content_data?.whatsapp,
    location: config.content_data?.location,
    services: config.content_data?.services,
    tagline: config.content_data?.tagline,
  };
  const template = resolveTemplate(buildConfig);
  const services = getServices(buildConfig);

  switch (config.page_type) {
    case "index": return generateIndexPage(buildConfig, template, services);
    case "contact": return generateContactPage(buildConfig, template, services);
    case "blog": return generateBlogPage(buildConfig, template, services);
    case "privacy": return generatePrivacyPage(buildConfig, template, services);
    case "terms": return generateTermsPage(buildConfig, template, services);
    case "faq": return generateFaqPage(buildConfig, template, services);
    case "404": return generate404Page(buildConfig, template, services);
    case "thankyou": return generateThankYouPage(buildConfig, template, services);
    default: return `<!-- Unknown page type: ${config.page_type} -->`;
  }
}

export function generateSeoFilesContent(config: SeoFilesConfig): Record<string, string> {
  const now = new Date().toISOString().split("T")[0];
  const files: Record<string, string> = {};

  // sitemap.xml
  const sitemapEntries = config.pages_list.map((page) => {
    const loc = page === "index.html" ? `https://${config.domain}/` : `https://${config.domain}/${page}`;
    const priority = page === "index.html" ? "1.0" : page.includes("blog") ? "0.7" : "0.8";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page === "index.html" ? "weekly" : "monthly"}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });
  files["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join("\n")}\n</urlset>`;

  // robots.txt
  files["robots.txt"] = `User-agent: *\nAllow: /\nDisallow: /thankyou.html\n\nSitemap: https://${config.domain}/sitemap.xml`;

  // .htaccess
  files[".htaccess"] = `# === WebForge AI Generated .htaccess ===

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Force non-www (uncomment one)
# RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]
# RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# Error Pages
ErrorDocument 404 /404.html

# Security Headers
<IfModule mod_headers.c>
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Header set Content-Security-Policy "upgrade-insecure-requests"
    Header unset ETag
</IfModule>
FileETag None

# Disable Directory Listing
Options -Indexes

# Block Sensitive Files
<FilesMatch "\\.(env|git|sql|zip|bak|log|ini|sh)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# GZIP Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css text/xml text/javascript
    AddOutputFilterByType DEFLATE application/javascript application/json application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml application/rss+xml
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/json "access plus 1 hour"
    ExpiresByType text/html "access plus 1 hour"
    ExpiresByType application/xml "access plus 1 hour"
</IfModule>

# Cache-Control
<IfModule mod_headers.c>
    <FilesMatch "\\.(ico|jpg|jpeg|png|gif|webp|svg|woff|woff2)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
    <FilesMatch "\\.(css|js)$">
        Header set Cache-Control "max-age=2592000, public"
    </FilesMatch>
    <FilesMatch "\\.(html|htm)$">
        Header set Cache-Control "max-age=3600, public, must-revalidate"
    </FilesMatch>
</IfModule>
`;

  // manifest.json
  files["manifest.json"] = JSON.stringify(
    {
      name: config.business_name || "Website",
      short_name: (config.business_name || "Site").substring(0, 12),
      description: config.business_description || "",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: config.theme_color || "#333333",
      icons: [
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
        { src: "/logo.png", sizes: "192x192", type: "image/png" },
      ],
    },
    null,
    2
  );

  // llms.txt
  files["llms.txt"] = `# ${config.business_name || "Website"}
> ${config.business_description || "Business website"}

## About
${config.business_name || "Website"} is accessible at https://${config.domain}

## Pages
${config.pages_list.map((p) => `- [${p.replace(".html", "").replace(/[-_]/g, " ")}](https://${config.domain}/${p})`).join("\n")}

## Contact
- Website: https://${config.domain}
- Contact: https://${config.domain}/contact.html
`;

  return files;
}
