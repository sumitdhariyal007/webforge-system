import * as fs from "fs";
import * as path from "path";

export interface CategoryTemplate {
  label: string;
  color_scheme: { primary: string; secondary: string; dark: string };
  font_pair: { heading: string; body: string };
  sections: string[];
  cta_text: string[];
  trust_signals: string[];
  schema_types: string[];
  target_keywords: string[];
  tone: string;
}

export interface ChecklistItem {
  check: string;
  priority: string;
  how_to_fix: string;
  status: string;
}

export interface ChecklistSection {
  label: string;
  description: string;
  items: Record<string, ChecklistItem>;
}

let cachedChecklist: any = null;

export function loadChecklist(): any {
  if (cachedChecklist) return cachedChecklist;

  // Try multiple paths
  const pathsToTry: string[] = [];

  if (process.env.CHECKLIST_PATH) {
    pathsToTry.push(process.env.CHECKLIST_PATH);
  }

  pathsToTry.push(path.join(__dirname, "../360_seo_master_checklist.json")); // Project root (for compiled)
  pathsToTry.push(path.join(process.cwd(), "360_seo_master_checklist.json")); // Current working directory

  const home = process.env.HOME;
  if (home) {
    pathsToTry.push(path.join(home, "Desktop/LeadHorizon/360_seo_master_checklist.json")); // Fallback to original path
  }

  for (const tryPath of pathsToTry) {
    try {
      if (fs.existsSync(tryPath)) {
        const raw = fs.readFileSync(tryPath, "utf-8");
        cachedChecklist = JSON.parse(raw);
        console.error(`✓ Loaded checklist from: ${tryPath}`);
        return cachedChecklist;
      }
    } catch (err: any) {
      // Continue to next path
    }
  }

  console.error(`Failed to load checklist from any path. Tried: ${pathsToTry.join(", ")}`);
  return null;
}

export function getCategoryTemplate(category: string): CategoryTemplate | null {
  const checklist = loadChecklist();
  if (!checklist) return null;
  const templates = checklist?.["0_website_builder_system"]?.category_templates;
  if (!templates) return null;
  return templates[category] || null;
}

export function getAllCategories(): string[] {
  const checklist = loadChecklist();
  if (!checklist) return [];
  const templates = checklist?.["0_website_builder_system"]?.category_templates;
  if (!templates) return [];
  return Object.keys(templates).filter((k) => k !== "description");
}

export function getAuditSections(): Record<string, ChecklistSection> {
  const checklist = loadChecklist();
  if (!checklist) return {};
  const sections: Record<string, ChecklistSection> = {};
  for (const key of Object.keys(checklist)) {
    if (
      key.match(/^\d+_/) &&
      key !== "0_website_builder_system" &&
      checklist[key]?.items
    ) {
      sections[key] = checklist[key];
    }
  }
  return sections;
}

export function getFileStructure(): Record<string, string> {
  const checklist = loadChecklist();
  if (!checklist) return {};
  return (
    checklist?.["0_website_builder_system"]?.file_structure?.files || {}
  );
}

export function getPageBlueprint(): any {
  const checklist = loadChecklist();
  if (!checklist) return null;
  return checklist?.["0_website_builder_system"]?.page_blueprint || null;
}

export function getCssSystem(): any {
  const checklist = loadChecklist();
  if (!checklist) return null;
  return checklist?.["0_website_builder_system"]?.css_system || null;
}

export function getJsSystem(): any {
  const checklist = loadChecklist();
  if (!checklist) return null;
  return checklist?.["0_website_builder_system"]?.js_system || null;
}

export function getContentRules(): any {
  const checklist = loadChecklist();
  if (!checklist) return null;
  return checklist?.["0_website_builder_system"]?.content_generation || null;
}

export const DEFAULT_SERVICES: Record<string, string[]> = {
  real_estate_agency: [
    "Lead Generation",
    "Digital Marketing",
    "SEO for Real Estate",
    "Social Media Marketing",
    "Website Development",
    "PPC Campaigns",
  ],
  real_estate_project: [
    "2 BHK Apartments",
    "3 BHK Apartments",
    "Penthouses",
    "Commercial Spaces",
    "Retail Shops",
  ],
  digital_marketing_agency: [
    "SEO Services",
    "PPC Management",
    "Social Media Marketing",
    "Content Marketing",
    "Web Development",
    "Email Marketing",
  ],
  restaurant_cafe: [
    "Dine In",
    "Takeaway",
    "Home Delivery",
    "Catering",
    "Party Orders",
    "Reservations",
  ],
  doctor_clinic: [
    "General Consultation",
    "Specialist Treatment",
    "Diagnostics",
    "Health Checkup",
    "Telemedicine",
    "Emergency Care",
  ],
  lawyer_legal: [
    "Criminal Law",
    "Civil Law",
    "Family Law",
    "Corporate Law",
    "Property Law",
    "Consumer Law",
  ],
  ecommerce_store: [
    "Product Categories",
    "Flash Sales",
    "New Arrivals",
    "Best Sellers",
    "Combo Deals",
    "Gift Cards",
  ],
  saas_startup: [
    "Free Trial",
    "Pro Plan",
    "Enterprise Plan",
    "API Access",
    "Integrations",
    "Custom Solutions",
  ],
  education_coaching: [
    "Classroom Coaching",
    "Online Classes",
    "Test Series",
    "Study Material",
    "Doubt Clearing",
    "Mentorship",
  ],
  gym_fitness: [
    "Personal Training",
    "Group Classes",
    "Yoga",
    "CrossFit",
    "Nutrition Planning",
    "Body Transformation",
  ],
  hotel_hospitality: [
    "Luxury Rooms",
    "Suites",
    "Dining",
    "Spa & Wellness",
    "Conference Hall",
    "Event Hosting",
  ],
  wedding_events: [
    "Wedding Planning",
    "Destination Weddings",
    "Corporate Events",
    "Birthday Parties",
    "Decor & Design",
    "Vendor Management",
  ],
  custom: [
    "Service 1",
    "Service 2",
    "Service 3",
    "Service 4",
    "Service 5",
    "Service 6",
  ],
};
