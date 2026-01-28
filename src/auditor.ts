import axios from "axios";
import * as fs from "fs";
import { getAuditSections, ChecklistSection, ChecklistItem } from "./templates.js";

export interface AuditResult {
  url: string;
  timestamp: string;
  total_checks: number;
  passed: number;
  failed: number;
  partial: number;
  not_applicable: number;
  score_percentage: number;
  sections: Record<string, SectionResult>;
  priority_fixes: PriorityFix[];
}

interface SectionResult {
  label: string;
  total: number;
  passed: number;
  failed: number;
  items: Record<string, ItemResult>;
}

interface ItemResult {
  check: string;
  priority: string;
  status: "done" | "missing" | "partial" | "not_applicable";
  details: string;
  how_to_fix: string;
}

interface PriorityFix {
  check_id: string;
  check: string;
  priority: string;
  how_to_fix: string;
  section: string;
}

async function fetchPage(url: string): Promise<{ html: string; headers: Record<string, string>; statusCode: number }> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: { "User-Agent": "WebForgeAI-Auditor/1.0" },
      validateStatus: () => true,
    });
    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(response.headers)) {
      headers[key.toLowerCase()] = String(val);
    }
    return { html: String(response.data), headers, statusCode: response.status };
  } catch (err: any) {
    throw new Error(`Failed to fetch ${url}: ${err.message}`);
  }
}

async function fetchOptional(url: string): Promise<string | null> {
  try {
    const r = await axios.get(url, { timeout: 10000, validateStatus: (s) => s < 400 });
    return String(r.data);
  } catch {
    return null;
  }
}

function checkHtml(html: string, pattern: RegExp): boolean {
  return pattern.test(html);
}

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta\\s[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i"),
    new RegExp(`<meta\\s[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

function countHeadings(html: string, level: number): number {
  const regex = new RegExp(`<h${level}[\\s>]`, "gi");
  return (html.match(regex) || []).length;
}

function hasSchema(html: string, type: string): boolean {
  return html.includes(`"@type"`) && html.includes(`"${type}"`);
}

// ── Audit Checks by Section ──

function auditTechnicalSeo(html: string, headers: Record<string, string>, url: string, robotsTxt: string | null, sitemapXml: string | null): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const isHttps = url.startsWith("https://");
  const sections = getAuditSections();
  const items = sections["1_technical_seo"]?.items || {};

  results["1_01_https"] = { check: items["1_01_https"]?.check || "HTTPS", priority: "critical", status: isHttps ? "done" : "missing", details: isHttps ? "Site uses HTTPS" : "Site does not use HTTPS", how_to_fix: items["1_01_https"]?.how_to_fix || "" };
  results["1_03_robots_txt"] = { check: items["1_03_robots_txt"]?.check || "robots.txt", priority: "critical", status: robotsTxt ? "done" : "missing", details: robotsTxt ? "robots.txt found" : "robots.txt not found", how_to_fix: items["1_03_robots_txt"]?.how_to_fix || "" };
  results["1_04_sitemap_xml"] = { check: items["1_04_sitemap_xml"]?.check || "sitemap.xml", priority: "critical", status: sitemapXml ? "done" : "missing", details: sitemapXml ? "sitemap.xml found" : "sitemap.xml not found", how_to_fix: items["1_04_sitemap_xml"]?.how_to_fix || "" };

  const hasCanonical = checkHtml(html, /rel=["']canonical["']/i);
  results["1_06_canonical_tags"] = { check: items["1_06_canonical_tags"]?.check || "Canonical tag", priority: "critical", status: hasCanonical ? "done" : "missing", details: hasCanonical ? "Canonical tag found" : "No canonical tag", how_to_fix: items["1_06_canonical_tags"]?.how_to_fix || "" };

  const metaRobots = extractMeta(html, "robots");
  results["1_07_meta_robots"] = { check: items["1_07_meta_robots"]?.check || "Meta robots", priority: "high", status: metaRobots ? "done" : "missing", details: metaRobots ? `meta robots: ${metaRobots}` : "No meta robots tag", how_to_fix: items["1_07_meta_robots"]?.how_to_fix || "" };

  const hasViewport = checkHtml(html, /name=["']viewport["']/i);
  results["1_13_viewport_meta"] = { check: items["1_13_viewport_meta"]?.check || "Viewport meta", priority: "critical", status: hasViewport ? "done" : "missing", details: hasViewport ? "Viewport meta tag found" : "No viewport meta tag", how_to_fix: items["1_13_viewport_meta"]?.how_to_fix || "" };

  const hasCharset = checkHtml(html, /charset=["']?UTF-8["']?/i);
  results["1_14_charset"] = { check: items["1_14_charset"]?.check || "Charset UTF-8", priority: "high", status: hasCharset ? "done" : "missing", details: hasCharset ? "UTF-8 charset found" : "No UTF-8 charset", how_to_fix: items["1_14_charset"]?.how_to_fix || "" };

  const hasLang = checkHtml(html, /<html[^>]*lang=["'][a-z]/i);
  results["1_15_lang_attribute"] = { check: items["1_15_lang_attribute"]?.check || "Lang attribute", priority: "medium", status: hasLang ? "done" : "missing", details: hasLang ? "Lang attribute found" : "No lang attribute on <html>", how_to_fix: items["1_15_lang_attribute"]?.how_to_fix || "" };

  return results;
}

function auditOnPageSeo(html: string): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["2_on_page_seo"]?.items || {};

  // Title tag
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : null;
  const titleLen = title ? title.length : 0;
  results["2_01_title_tag"] = { check: items["2_01_title_tag"]?.check || "Title tag", priority: "critical", status: title ? (titleLen >= 30 && titleLen <= 70 ? "done" : "partial") : "missing", details: title ? `Title (${titleLen} chars): "${title}"` : "No title tag found", how_to_fix: items["2_01_title_tag"]?.how_to_fix || "" };

  // Meta description
  const desc = extractMeta(html, "description");
  const descLen = desc ? desc.length : 0;
  results["2_02_meta_description"] = { check: items["2_02_meta_description"]?.check || "Meta description", priority: "critical", status: desc ? (descLen >= 100 && descLen <= 170 ? "done" : "partial") : "missing", details: desc ? `Meta description (${descLen} chars)` : "No meta description", how_to_fix: items["2_02_meta_description"]?.how_to_fix || "" };

  // H1
  const h1Count = countHeadings(html, 1);
  results["2_03_h1_tag"] = { check: items["2_03_h1_tag"]?.check || "H1 tag", priority: "critical", status: h1Count === 1 ? "done" : h1Count > 1 ? "partial" : "missing", details: `Found ${h1Count} H1 tag(s)`, how_to_fix: items["2_03_h1_tag"]?.how_to_fix || "" };

  // Heading hierarchy
  const h2Count = countHeadings(html, 2);
  const h3Count = countHeadings(html, 3);
  results["2_04_heading_hierarchy"] = { check: items["2_04_heading_hierarchy"]?.check || "Heading hierarchy", priority: "high", status: h1Count >= 1 && h2Count >= 1 ? "done" : "partial", details: `H1:${h1Count} H2:${h2Count} H3:${h3Count}`, how_to_fix: items["2_04_heading_hierarchy"]?.how_to_fix || "" };

  // Image alt tags
  const imgTotal = (html.match(/<img\s/gi) || []).length;
  const imgWithAlt = (html.match(/<img\s[^>]*alt=["'][^"']+["']/gi) || []).length;
  results["2_07_image_alt_tags"] = { check: items["2_07_image_alt_tags"]?.check || "Image alt tags", priority: "critical", status: imgTotal === 0 ? "not_applicable" : imgWithAlt === imgTotal ? "done" : imgWithAlt > 0 ? "partial" : "missing", details: `${imgWithAlt}/${imgTotal} images have alt text`, how_to_fix: items["2_07_image_alt_tags"]?.how_to_fix || "" };

  // Image dimensions
  const imgWithDims = (html.match(/<img\s[^>]*width=["']\d+["'][^>]*height=["']\d+["']/gi) || []).length + (html.match(/<img\s[^>]*height=["']\d+["'][^>]*width=["']\d+["']/gi) || []).length;
  results["2_08_image_dimensions"] = { check: items["2_08_image_dimensions"]?.check || "Image dimensions", priority: "high", status: imgTotal === 0 ? "not_applicable" : imgWithDims >= imgTotal ? "done" : imgWithDims > 0 ? "partial" : "missing", details: `${imgWithDims}/${imgTotal} images have dimensions`, how_to_fix: items["2_08_image_dimensions"]?.how_to_fix || "" };

  // Lazy loading
  const imgWithLazy = (html.match(/loading=["']lazy["']/gi) || []).length;
  results["2_11_image_lazy_loading"] = { check: items["2_11_image_lazy_loading"]?.check || "Lazy loading", priority: "high", status: imgTotal <= 1 ? "not_applicable" : imgWithLazy > 0 ? "done" : "missing", details: `${imgWithLazy} images with lazy loading`, how_to_fix: items["2_11_image_lazy_loading"]?.how_to_fix || "" };

  // Favicon
  const hasFavicon = checkHtml(html, /rel=["'](icon|shortcut icon)["']/i) || checkHtml(html, /favicon/i);
  results["2_20_favicon"] = { check: items["2_20_favicon"]?.check || "Favicon", priority: "medium", status: hasFavicon ? "done" : "missing", details: hasFavicon ? "Favicon found" : "No favicon detected", how_to_fix: items["2_20_favicon"]?.how_to_fix || "" };

  return results;
}

function auditSchema(html: string): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["3_structured_data_schema"]?.items || {};

  const checks: [string, string, string][] = [
    ["3_01_organization_schema", "Organization", "Organization schema"],
    ["3_02_local_business_schema", "LocalBusiness", "LocalBusiness schema"],
    ["3_03_breadcrumb_schema", "BreadcrumbList", "BreadcrumbList schema"],
    ["3_04_faq_schema", "FAQPage", "FAQPage schema"],
    ["3_05_article_schema", "Article", "Article schema"],
    ["3_10_speakable_schema", "SpeakableSpecification", "Speakable schema"],
  ];

  for (const [id, schemaType, label] of checks) {
    const found = hasSchema(html, schemaType);
    results[id] = { check: items[id]?.check || label, priority: items[id]?.priority || "high", status: found ? "done" : "missing", details: found ? `${schemaType} schema found` : `No ${schemaType} schema`, how_to_fix: items[id]?.how_to_fix || "" };
  }
  return results;
}

function auditOgTags(html: string): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["4_open_graph_social"]?.items || {};

  const checks: [string, string, string][] = [
    ["4_01_og_type", "og:type", "og:type"],
    ["4_02_og_title", "og:title", "og:title"],
    ["4_03_og_description", "og:description", "og:description"],
    ["4_04_og_image", "og:image", "og:image"],
    ["4_05_og_url", "og:url", "og:url"],
    ["4_08_twitter_card", "twitter:card", "Twitter card"],
  ];

  for (const [id, metaName, label] of checks) {
    const value = extractMeta(html, metaName);
    results[id] = { check: items[id]?.check || label, priority: items[id]?.priority || "high", status: value ? "done" : "missing", details: value ? `${label}: ${value.substring(0, 80)}` : `No ${label} tag`, how_to_fix: items[id]?.how_to_fix || "" };
  }
  return results;
}

function auditSecurity(headers: Record<string, string>): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["8_security"]?.items || {};

  const headerChecks: [string, string, string][] = [
    ["8_01_hsts", "strict-transport-security", "HSTS"],
    ["8_02_x_content_type", "x-content-type-options", "X-Content-Type-Options"],
    ["8_03_x_frame_options", "x-frame-options", "X-Frame-Options"],
    ["8_04_xss_protection", "x-xss-protection", "X-XSS-Protection"],
    ["8_05_referrer_policy", "referrer-policy", "Referrer-Policy"],
    ["8_07_csp", "content-security-policy", "CSP"],
  ];

  for (const [id, header, label] of headerChecks) {
    const value = headers[header];
    results[id] = { check: items[id]?.check || label, priority: items[id]?.priority || "high", status: value ? "done" : "missing", details: value ? `${label}: ${value.substring(0, 80)}` : `No ${label} header`, how_to_fix: items[id]?.how_to_fix || "" };
  }
  return results;
}

function auditPerformance(html: string, headers: Record<string, string>): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["7_performance_core_web_vitals"]?.items || {};

  const gzipHeader = headers["content-encoding"] || "";
  results["7_01_gzip_compression"] = { check: items["7_01_gzip_compression"]?.check || "GZIP", priority: "critical", status: gzipHeader.includes("gzip") || gzipHeader.includes("br") ? "done" : "missing", details: gzipHeader ? `Encoding: ${gzipHeader}` : "No compression detected", how_to_fix: items["7_01_gzip_compression"]?.how_to_fix || "" };

  const hasPreload = checkHtml(html, /rel=["']preload["']/i);
  results["7_07_preload_lcp"] = { check: items["7_07_preload_lcp"]?.check || "Preload LCP", priority: "high", status: hasPreload ? "done" : "missing", details: hasPreload ? "Preload hints found" : "No preload hints", how_to_fix: items["7_07_preload_lcp"]?.how_to_fix || "" };

  const hasPreconnect = checkHtml(html, /rel=["']preconnect["']/i);
  results["7_08_preconnect"] = { check: items["7_08_preconnect"]?.check || "Preconnect", priority: "medium", status: hasPreconnect ? "done" : "missing", details: hasPreconnect ? "Preconnect hints found" : "No preconnect hints", how_to_fix: items["7_08_preconnect"]?.how_to_fix || "" };

  const hasDefer = checkHtml(html, /\bdefer\b/i) || checkHtml(html, /\basync\b/i);
  results["7_09_defer_js"] = { check: items["7_09_defer_js"]?.check || "Defer JS", priority: "high", status: hasDefer ? "done" : "missing", details: hasDefer ? "Deferred/async scripts found" : "No deferred scripts", how_to_fix: items["7_09_defer_js"]?.how_to_fix || "" };

  const hasFontSwap = checkHtml(html, /display=swap/i) || checkHtml(html, /font-display:\s*swap/i);
  results["7_11_font_optimization"] = { check: items["7_11_font_optimization"]?.check || "Font swap", priority: "medium", status: hasFontSwap ? "done" : "missing", details: hasFontSwap ? "font-display:swap found" : "No font-display:swap", how_to_fix: items["7_11_font_optimization"]?.how_to_fix || "" };

  return results;
}

function auditUxCro(html: string): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["11_ux_cro"]?.items || {};

  const hasCta = checkHtml(html, /class=["'][^"']*btn[^"']*["']/i);
  results["11_01_cta_visibility"] = { check: items["11_01_cta_visibility"]?.check || "CTA visibility", priority: "critical", status: hasCta ? "done" : "missing", details: hasCta ? "CTA buttons found" : "No CTA buttons detected", how_to_fix: items["11_01_cta_visibility"]?.how_to_fix || "" };

  const hasPhone = checkHtml(html, /href=["']tel:/i);
  results["11_04_phone_clickable"] = { check: items["11_04_phone_clickable"]?.check || "Clickable phone", priority: "high", status: hasPhone ? "done" : "missing", details: hasPhone ? "Clickable phone link found" : "No tel: link", how_to_fix: items["11_04_phone_clickable"]?.how_to_fix || "" };

  const hasWhatsapp = checkHtml(html, /wa\.me/i) || checkHtml(html, /whatsapp/i);
  results["11_05_whatsapp_button"] = { check: items["11_05_whatsapp_button"]?.check || "WhatsApp button", priority: "medium", status: hasWhatsapp ? "done" : "missing", details: hasWhatsapp ? "WhatsApp integration found" : "No WhatsApp button", how_to_fix: items["11_05_whatsapp_button"]?.how_to_fix || "" };

  const hasForm = checkHtml(html, /<form\s/i);
  results["11_03_contact_form"] = { check: items["11_03_contact_form"]?.check || "Contact form", priority: "high", status: hasForm ? "done" : "missing", details: hasForm ? "Contact form found" : "No contact form", how_to_fix: items["11_03_contact_form"]?.how_to_fix || "" };

  const hasCookieBanner = checkHtml(html, /cookie/i) && checkHtml(html, /accept|consent/i);
  results["11_09_cookie_consent"] = { check: items["11_09_cookie_consent"]?.check || "Cookie consent", priority: "medium", status: hasCookieBanner ? "done" : "missing", details: hasCookieBanner ? "Cookie consent found" : "No cookie consent banner", how_to_fix: items["11_09_cookie_consent"]?.how_to_fix || "" };

  return results;
}

function auditAccessibility(html: string): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["15_accessibility"]?.items || {};

  const hasAria = checkHtml(html, /aria-label/i);
  results["15_01_aria_labels"] = { check: items["15_01_aria_labels"]?.check || "ARIA labels", priority: "high", status: hasAria ? "done" : "missing", details: hasAria ? "ARIA labels found" : "No ARIA labels detected", how_to_fix: items["15_01_aria_labels"]?.how_to_fix || "" };

  const hasSemanticHtml = checkHtml(html, /<(header|nav|main|section|article|footer)[\s>]/i);
  results["15_06_semantic_html"] = { check: items["15_06_semantic_html"]?.check || "Semantic HTML", priority: "medium", status: hasSemanticHtml ? "done" : "missing", details: hasSemanticHtml ? "Semantic HTML5 elements found" : "No semantic HTML5 elements", how_to_fix: items["15_06_semantic_html"]?.how_to_fix || "" };

  const hasFormLabels = checkHtml(html, /<label\s/i);
  results["15_04_form_labels"] = { check: items["15_04_form_labels"]?.check || "Form labels", priority: "high", status: hasFormLabels ? "done" : (checkHtml(html, /<form/i) ? "missing" : "not_applicable"), details: hasFormLabels ? "Form labels found" : "Forms without labels", how_to_fix: items["15_04_form_labels"]?.how_to_fix || "" };

  return results;
}

function auditLegal(html: string, url: string): Record<string, ItemResult> {
  const results: Record<string, ItemResult> = {};
  const sections = getAuditSections();
  const items = sections["16_legal_compliance"]?.items || {};

  const hasPrivacyLink = checkHtml(html, /privacy.?policy/i);
  results["16_01_privacy_policy"] = { check: items["16_01_privacy_policy"]?.check || "Privacy Policy", priority: "critical", status: hasPrivacyLink ? "done" : "missing", details: hasPrivacyLink ? "Privacy policy link found" : "No privacy policy link", how_to_fix: items["16_01_privacy_policy"]?.how_to_fix || "" };

  const hasTermsLink = checkHtml(html, /terms.?(of|&).?service|terms.?conditions/i);
  results["16_02_terms_of_service"] = { check: items["16_02_terms_of_service"]?.check || "Terms of Service", priority: "high", status: hasTermsLink ? "done" : "missing", details: hasTermsLink ? "Terms link found" : "No terms link", how_to_fix: items["16_02_terms_of_service"]?.how_to_fix || "" };

  const hasCopyright = checkHtml(html, /©|&copy;|copyright/i);
  results["16_04_copyright_notice"] = { check: items["16_04_copyright_notice"]?.check || "Copyright", priority: "medium", status: hasCopyright ? "done" : "missing", details: hasCopyright ? "Copyright notice found" : "No copyright notice", how_to_fix: items["16_04_copyright_notice"]?.how_to_fix || "" };

  return results;
}

// ── Main Audit Function ──

export async function auditWebsite(url: string): Promise<AuditResult> {
  // Normalize URL
  if (!url.startsWith("http")) url = "https://" + url;
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  // Fetch pages and resources in parallel
  const [pageData, robotsTxt, sitemapXml] = await Promise.all([
    fetchPage(url),
    fetchOptional(`${baseUrl}/robots.txt`),
    fetchOptional(`${baseUrl}/sitemap.xml`),
  ]);

  const { html, headers } = pageData;

  // Run all audits
  const sectionResults: Record<string, SectionResult> = {};
  const allChecks: Record<string, Record<string, ItemResult>> = {
    "1_technical_seo": auditTechnicalSeo(html, headers, url, robotsTxt, sitemapXml),
    "2_on_page_seo": auditOnPageSeo(html),
    "3_structured_data_schema": auditSchema(html),
    "4_open_graph_social": auditOgTags(html),
    "7_performance_core_web_vitals": auditPerformance(html, headers),
    "8_security": auditSecurity(headers),
    "11_ux_cro": auditUxCro(html),
    "15_accessibility": auditAccessibility(html),
    "16_legal_compliance": auditLegal(html, url),
  };

  const auditSections = getAuditSections();
  let totalChecks = 0, passed = 0, failed = 0, partial = 0, na = 0;
  const priorityFixes: PriorityFix[] = [];

  for (const [sectionKey, checkResults] of Object.entries(allChecks)) {
    const sectionLabel = auditSections[sectionKey]?.label || sectionKey;
    let sectionPassed = 0, sectionFailed = 0;

    for (const [checkId, result] of Object.entries(checkResults)) {
      totalChecks++;
      if (result.status === "done") { passed++; sectionPassed++; }
      else if (result.status === "partial") { partial++; sectionFailed++; }
      else if (result.status === "not_applicable") { na++; }
      else { failed++; sectionFailed++; }

      if (result.status !== "done" && result.status !== "not_applicable") {
        priorityFixes.push({
          check_id: checkId,
          check: result.check,
          priority: result.priority,
          how_to_fix: result.how_to_fix,
          section: sectionLabel,
        });
      }
    }

    sectionResults[sectionKey] = {
      label: sectionLabel,
      total: Object.keys(checkResults).length,
      passed: sectionPassed,
      failed: sectionFailed,
      items: checkResults,
    };
  }

  // Sort priority fixes
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  priorityFixes.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  const applicable = totalChecks - na;
  const scorePercentage = applicable > 0 ? Math.round((passed / applicable) * 100) : 0;

  return {
    url,
    timestamp: new Date().toISOString(),
    total_checks: totalChecks,
    passed,
    failed,
    partial,
    not_applicable: na,
    score_percentage: scorePercentage,
    sections: sectionResults,
    priority_fixes: priorityFixes,
  };
}

// ── Fix SEO Issues ──

export interface FixIssue {
  check_id: string;
  fix_instruction: string;
}

export async function fixSeoIssues(
  filePath: string,
  issues: FixIssue[],
  domain?: string,
  businessName?: string
): Promise<{ original_size: number; fixed_size: number; changes: string[] }> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let content = fs.readFileSync(filePath, "utf-8");
  const originalSize = content.length;
  const changes: string[] = [];

  for (const issue of issues) {
    const { check_id, fix_instruction } = issue;

    // Apply fix based on check_id
    if (check_id.startsWith("2_01") && !content.includes("<title>")) {
      const titleText = fix_instruction || `${businessName || "Website"} | ${domain || ""}`;
      content = content.replace(/<head>/i, `<head>\n    <title>${titleText}</title>`);
      changes.push(`Added title tag: "${titleText}"`);
    }

    if (check_id.startsWith("2_02") && !extractMeta(content, "description")) {
      const descText = fix_instruction || `${businessName || "Website"} - Professional services. Contact us today.`;
      content = content.replace(/<\/title>/i, `</title>\n    <meta name="description" content="${descText}">`);
      changes.push(`Added meta description`);
    }

    if (check_id.startsWith("1_06") && !content.includes('rel="canonical"') && !content.includes("rel='canonical'")) {
      const canonical = domain ? `https://${domain}/` : fix_instruction;
      content = content.replace(/<\/title>/i, `</title>\n    <link rel="canonical" href="${canonical}">`);
      changes.push(`Added canonical tag: ${canonical}`);
    }

    if (check_id.startsWith("1_07") && !extractMeta(content, "robots")) {
      content = content.replace(/<\/title>/i, `</title>\n    <meta name="robots" content="index, follow">`);
      changes.push(`Added meta robots: index, follow`);
    }

    if (check_id.startsWith("1_13") && !extractMeta(content, "viewport")) {
      content = content.replace(/<head>/i, `<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
      changes.push(`Added viewport meta tag`);
    }

    if (check_id.startsWith("1_14") && !content.includes('charset')) {
      content = content.replace(/<head>/i, `<head>\n    <meta charset="UTF-8">`);
      changes.push(`Added charset UTF-8`);
    }

    if (check_id.startsWith("4_") && check_id.includes("og_")) {
      // Generic OG tag fix
      const ogProp = fix_instruction.split(":")[0] || "";
      if (ogProp && !extractMeta(content, ogProp)) {
        const ogValue = fix_instruction.split(":").slice(1).join(":").trim() || "";
        if (ogValue) {
          content = content.replace(/<\/head>/i, `    <meta property="${ogProp}" content="${ogValue}">\n</head>`);
          changes.push(`Added ${ogProp} tag`);
        }
      }
    }

    if (check_id.startsWith("1_15") && !/<html[^>]*lang=/i.test(content)) {
      content = content.replace(/<html/i, '<html lang="en"');
      changes.push(`Added lang="en" to <html>`);
    }
  }

  fs.writeFileSync(filePath, content, "utf-8");

  return {
    original_size: originalSize,
    fixed_size: content.length,
    changes,
  };
}
