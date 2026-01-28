#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";

dotenv.config();

import { TOOLS } from "./tools.js";
import {
  buildWebsite,
  generatePage,
  generateSeoFilesContent,
  BuildConfig,
  GeneratePageConfig,
  SeoFilesConfig,
} from "./builder.js";
import { auditWebsite, fixSeoIssues, FixIssue } from "./auditor.js";
import {
  deployToHosting,
  listHostingFiles,
  DeployConfig,
  ListConfig,
} from "./deployer.js";
import {
  gscReport,
  gscSubmitSitemap,
  gscCheckIndexing,
  GscReportConfig,
} from "./gsc.js";

class WebForgeAIServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "webforge-ai",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // ── Website Building ──
          case "build_website": {
            const config: BuildConfig = {
              domain: args?.domain as string,
              business_name: args?.business_name as string,
              category: args?.category as string,
              phone: args?.phone as string,
              email: args?.email as string,
              whatsapp: args?.whatsapp as string | undefined,
              location: args?.location as string | undefined,
              services: args?.services as string | undefined,
              tagline: args?.tagline as string | undefined,
              logo_path: args?.logo_path as string | undefined,
              brand_colors: args?.brand_colors as
                | { primary?: string; secondary?: string }
                | undefined,
              google_analytics_id: args?.google_analytics_id as string | undefined,
              gtm_id: args?.gtm_id as string | undefined,
            };
            const result = await buildWebsite(config);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "success",
                      message: `Website built successfully for ${config.business_name}`,
                      project_directory: result.projectDir,
                      files_generated: result.files,
                      total_files: result.files.length,
                      next_steps: [
                        "Review generated files in the project directory",
                        "Customize content as needed",
                        "Use deploy_to_hosting to upload to server",
                        "Use audit_website to verify SEO compliance",
                        "Use gsc_submit_sitemap to submit sitemap to Google",
                      ],
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case "generate_page": {
            const config: GeneratePageConfig = {
              page_type: args?.page_type as string,
              domain: args?.domain as string,
              business_name: args?.business_name as string,
              category: args?.category as string,
              content_data: args?.content_data as any,
            };
            const html = generatePage(config);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "success",
                      page_type: config.page_type,
                      html_length: html.length,
                      html_content: html,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case "generate_seo_files": {
            const config: SeoFilesConfig = {
              domain: args?.domain as string,
              pages_list: args?.pages_list as string[],
              business_name: args?.business_name as string | undefined,
              business_description: args?.business_description as string | undefined,
              theme_color: args?.theme_color as string | undefined,
            };
            const files = generateSeoFilesContent(config);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "success",
                      files_generated: Object.keys(files),
                      files_content: files,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // ── SEO Audit ──
          case "audit_website": {
            const url = args?.url as string;
            if (!url) throw new McpError(ErrorCode.InvalidParams, "url is required");
            const result = await auditWebsite(url);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "fix_seo_issues": {
            const filePath = args?.file_path as string;
            const issuesList = args?.issues_list as FixIssue[];
            const domain = args?.domain as string | undefined;
            const businessName = args?.business_name as string | undefined;
            if (!filePath || !issuesList) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "file_path and issues_list are required"
              );
            }
            const result = await fixSeoIssues(filePath, issuesList, domain, businessName);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "success",
                      file: filePath,
                      ...result,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // ── Deployment ──
          case "deploy_to_hosting": {
            const config: DeployConfig = {
              local_folder: args?.local_folder as string,
              ssh_host: args?.ssh_host as string,
              ssh_port: (args?.ssh_port as number) || 22,
              ssh_user: args?.ssh_user as string,
              remote_path: args?.remote_path as string,
              ssh_key_path: args?.ssh_key_path as string | undefined,
              ssh_password: args?.ssh_password as string | undefined,
            };
            const result = await deployToHosting(config);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "success",
                      ...result,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case "list_hosting_files": {
            const config: ListConfig = {
              ssh_host: args?.ssh_host as string,
              ssh_port: (args?.ssh_port as number) || 22,
              ssh_user: args?.ssh_user as string,
              remote_path: args?.remote_path as string,
              ssh_key_path: args?.ssh_key_path as string | undefined,
              ssh_password: args?.ssh_password as string | undefined,
            };
            const result = await listHostingFiles(config);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // ── Google Search Console ──
          case "gsc_report": {
            const config: GscReportConfig = {
              site_url: args?.site_url as string,
              days: args?.days as number | undefined,
              start_date: args?.start_date as string | undefined,
              end_date: args?.end_date as string | undefined,
            };
            const result = await gscReport(config);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "gsc_submit_sitemap": {
            const siteUrl = args?.site_url as string;
            const sitemapUrl = args?.sitemap_url as string;
            if (!siteUrl || !sitemapUrl) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "site_url and sitemap_url are required"
              );
            }
            const result = await gscSubmitSitemap(siteUrl, sitemapUrl);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "gsc_check_indexing": {
            const siteUrl = args?.site_url as string;
            if (!siteUrl) {
              throw new McpError(ErrorCode.InvalidParams, "site_url is required");
            }
            const result = await gscCheckIndexing(siteUrl);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        if (error instanceof McpError) throw error;
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("WebForge AI MCP server running...");
  }
}

const server = new WebForgeAIServer();
server.run().catch(console.error);
