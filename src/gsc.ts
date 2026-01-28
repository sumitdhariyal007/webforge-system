import { google } from "googleapis";
import * as fs from "fs";

let cachedAuth: any = null;

async function getAuth(): Promise<any> {
  if (cachedAuth) return cachedAuth;

  const credentialsPath = process.env.GSC_CREDENTIALS_PATH || "";
  const tokenPath = process.env.GSC_TOKEN_PATH || "";

  if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    throw new Error(
      `GSC credentials not found at ${credentialsPath}. Set GSC_CREDENTIALS_PATH env variable.`
    );
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  const { client_id, client_secret, redirect_uris } =
    credentials.installed || credentials.web || {};

  if (!client_id || !client_secret) {
    throw new Error("Invalid credentials file format. Expected installed or web credentials.");
  }

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris?.[0] || "urn:ietf:wg:oauth:2.0:oob"
  );

  if (tokenPath && fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    oAuth2Client.setCredentials(token);
  } else {
    throw new Error(
      `GSC token not found at ${tokenPath}. Please authenticate first via OAuth flow.`
    );
  }

  cachedAuth = oAuth2Client;
  return oAuth2Client;
}

export interface GscReportConfig {
  site_url: string;
  days?: number;
  start_date?: string;
  end_date?: string;
}

export interface GscReportResult {
  site_url: string;
  date_range: { start: string; end: string };
  queries: QueryData[];
  pages: PageData[];
  countries: CountryData[];
  devices: DeviceData[];
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

interface QueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface CountryData {
  country: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface DeviceData {
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function getDateRange(config: GscReportConfig): { start: string; end: string } {
  if (config.start_date && config.end_date) {
    return { start: config.start_date, end: config.end_date };
  }
  const days = config.days || 28;
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC data has 3-day delay
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

async function querySearchAnalytics(
  auth: any,
  siteUrl: string,
  dateRange: { start: string; end: string },
  dimensions: string[],
  rowLimit: number = 25
): Promise<any[]> {
  const searchconsole = google.searchconsole({ version: "v1", auth });

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: dateRange.start,
        endDate: dateRange.end,
        dimensions,
        rowLimit,
      },
    });
    return response.data.rows || [];
  } catch (err: any) {
    throw new Error(`GSC API error (${dimensions.join(",")}): ${err.message}`);
  }
}

function formatRows(rows: any[], dimensionName: string): any[] {
  return rows.map((row) => ({
    [dimensionName]: row.keys?.[0] || "unknown",
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: Math.round((row.ctr || 0) * 10000) / 100,
    position: Math.round((row.position || 0) * 10) / 10,
  }));
}

export async function gscReport(config: GscReportConfig): Promise<GscReportResult> {
  const auth = await getAuth();
  const dateRange = getDateRange(config);

  // Fetch all dimensions in parallel
  const [queryRows, pageRows, countryRows, deviceRows] = await Promise.all([
    querySearchAnalytics(auth, config.site_url, dateRange, ["query"], 50),
    querySearchAnalytics(auth, config.site_url, dateRange, ["page"], 50),
    querySearchAnalytics(auth, config.site_url, dateRange, ["country"], 25),
    querySearchAnalytics(auth, config.site_url, dateRange, ["device"], 10),
  ]);

  // Calculate totals from query data
  let totalClicks = 0, totalImpressions = 0, totalCtr = 0, totalPosition = 0;
  for (const row of queryRows) {
    totalClicks += row.clicks || 0;
    totalImpressions += row.impressions || 0;
  }
  totalCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  totalPosition = queryRows.length > 0
    ? queryRows.reduce((sum: number, r: any) => sum + (r.position || 0), 0) / queryRows.length
    : 0;

  return {
    site_url: config.site_url,
    date_range: dateRange,
    queries: formatRows(queryRows, "query") as QueryData[],
    pages: formatRows(pageRows, "page") as PageData[],
    countries: formatRows(countryRows, "country") as CountryData[],
    devices: formatRows(deviceRows, "device") as DeviceData[],
    totals: {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: Math.round(totalCtr * 10000) / 100,
      position: Math.round(totalPosition * 10) / 10,
    },
  };
}

export async function gscSubmitSitemap(
  siteUrl: string,
  sitemapUrl: string
): Promise<{ status: string; message: string }> {
  const auth = await getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  try {
    await searchconsole.sitemaps.submit({
      siteUrl,
      feedpath: sitemapUrl,
    });
    return {
      status: "success",
      message: `Sitemap ${sitemapUrl} submitted successfully to ${siteUrl}`,
    };
  } catch (err: any) {
    throw new Error(`Failed to submit sitemap: ${err.message}`);
  }
}

export async function gscCheckIndexing(
  siteUrl: string
): Promise<{
  site_url: string;
  sitemaps: any[];
  indexing_status: string;
}> {
  const auth = await getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  try {
    // Get sitemaps list (includes indexing info)
    const sitemapsResponse = await searchconsole.sitemaps.list({ siteUrl });
    const sitemaps = (sitemapsResponse.data.sitemap || []).map((sm: any) => ({
      path: sm.path,
      lastSubmitted: sm.lastSubmitted,
      isPending: sm.isPending,
      lastDownloaded: sm.lastDownloaded,
      warnings: sm.warnings,
      errors: sm.errors,
      contents: sm.contents?.map((c: any) => ({
        type: c.type,
        submitted: c.submitted,
        indexed: c.indexed,
      })),
    }));

    // Get page-level indexing data via search analytics
    const dateRange = getDateRange({ site_url: siteUrl, days: 28 });
    const indexedPages = await querySearchAnalytics(
      auth,
      siteUrl,
      dateRange,
      ["page"],
      100
    );

    const indexedPageUrls = indexedPages.map((r: any) => r.keys?.[0]).filter(Boolean);

    return {
      site_url: siteUrl,
      sitemaps,
      indexing_status: `${indexedPageUrls.length} pages found in search results (last 28 days). Check GSC Coverage report for full indexing status.\n\nIndexed pages:\n${indexedPageUrls.map((u: string) => `  - ${u}`).join("\n") || "  No pages found in search results"}`,
    };
  } catch (err: any) {
    throw new Error(`GSC indexing check failed: ${err.message}`);
  }
}
