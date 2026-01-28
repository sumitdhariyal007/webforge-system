# WebForge System Setup with Cursor + Claude.com

## Quick Setup

### 1. Cursor Open Karo
```bash
open -a Cursor /Users/macintosh/Desktop/webforge-system
```

### 2. Claude.com Tab Open Karo
- Go to: https://claude.com
- OR: https://claude.ai

### 3. Folder Open Karo Claude Me
- Click **"Files"** or drag-drop folder
- Select: `/Users/macintosh/Desktop/webforge-system`

### 4. Use Both Together
**Cursor:** Code editing + file management
**Claude.com:** AI assistance + project understanding

---

## Workflow

### For Website Building
```
Claude.com: Ask to build website from URL
→ Claude generates HTML/CSS/JS
→ Copy to Cursor
→ Save files
→ Use deploy tool
```

### For SEO Auditing
```
Claude.com: Upload website files
→ Claude runs audit against 360_seo_master_checklist.json
→ Get detailed report
→ Apply fixes in Cursor
→ Re-upload for verification
```

### For Code Development
```
Cursor: Edit TypeScript/config files
→ Claude.com: Ask questions about code
→ Get explanations/improvements
→ Implement in Cursor
```

---

## Pro Tips

### 1. Share Context with Claude
Copy file content → Paste in Claude chat
Claude can see full code + understand structure

### 2. Use 360 Checklist
Upload `360_seo_master_checklist.json` to Claude
Ask specific audit questions

### 3. Bulk Operations
```
Cursor: Edit multiple files
Claude: Review + suggest improvements
```

---

## Commands to Know

### Cursor Navigation
- `Cmd + P` - Quick file search
- `Cmd + Shift + P` - Command palette
- `Cmd + ,` - Settings
- `Cmd + K` - Inline chat (if Claude available)

### Terminal Integration
```bash
cd /Users/macintosh/Desktop/webforge-system

# Build
npm run build

# Dev mode
npm run dev

# Install deps
npm install
```

---

## Directory Reference
```
/Users/macintosh/Desktop/webforge-system/
├── src/
│   ├── builder.ts      - Website generation
│   ├── auditor.ts      - SEO audit logic
│   ├── deployer.ts     - SSH/FTP deployment
│   ├── gsc.ts          - Google Search Console
│   ├── index.ts        - MCP server entry
│   ├── tools.ts        - Tool definitions
│   └── templates.ts    - HTML templates
├── 360_seo_master_checklist.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Project**
   ```bash
   npm run build
   ```

3. **Explore Codebase**
   - Open folder in Cursor
   - Start with `src/index.ts`
   - Claude.com: Ask about architecture

4. **Development**
   ```bash
   npm run dev
   ```

---

Generated: 2026-01-29
