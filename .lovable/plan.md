

# AI Prompt Generator — Export to Any AI Agent (ZIP Download)

## What Gets Built

A new page and edge function that takes a user's structured problem data and generates **downloadable ZIP files** containing platform-specific prompt systems. When the user selects **OpenClaw**, the output follows the uploaded STRATOS template structure (SOUL.md, AGENTS.md, MODULES.md, DIAGNOSTIC.md, MEMORY.md, HEARTBEAT.md, USER.md, PLAYBOOK.md). For other platforms, it generates the appropriate format.

## How It Works (User Flow)

1. User navigates to `/prompt-export` from the sidebar
2. Selects a problem from their existing problems
3. Chooses a target platform (OpenClaw, ChatGPT/Custom GPTs, Claude Projects, Cursor, AutoGPT, Generic)
4. Clicks "Generate" — AI builds the prompt system using their problem data
5. Previews the output files in-app
6. Downloads as a `.zip` file

## Target Platforms & Output Format

| Platform | Output Files |
|----------|-------------|
| **OpenClaw** | 8 `.md` files matching the STRATOS template: SOUL.md, DIAGNOSTIC.md, AGENTS.md, MODULES.md, MEMORY.md, HEARTBEAT.md, USER.md, PLAYBOOK.md — all populated with the user's problem data |
| **ChatGPT / Custom GPTs** | `system-prompt.md` + `conversation-starters.md` + `knowledge-base.md` |
| **Claude Projects** | `project-instructions.md` + `context-docs.md` |
| **Cursor / Windsurf** | `.cursorrules` file |
| **AutoGPT / CrewAI** | `agents.yaml` + `tasks.yaml` |
| **Generic** | `prompt-system.md` (universal, works anywhere) |

## Technical Implementation

### 1. Edge Function: `generate-ai-prompt`
- Accepts `problemId` and `platform` in the request body
- Fetches the full problem profile (problem, solutions, tasks, KPIs) from the database using the authenticated user's token
- Builds a meta-prompt that instructs Lovable AI to generate platform-specific files, using the STRATOS template as the structural reference for OpenClaw output
- Returns JSON: `{ files: [{ name: string, content: string }] }` (not streaming — single response)
- Uses `LOVABLE_API_KEY` (already configured)

### 2. Frontend: `src/pages/PromptExport.tsx`
- Problem selector dropdown (reuses existing pattern from AI Coach)
- Platform selector cards with icons and descriptions
- "Generate" button that calls the edge function
- File preview panel: tabbed view showing each generated file with syntax highlighting
- "Download ZIP" button using JSZip library (client-side zip creation from the returned files)
- Copy individual files to clipboard

### 3. Sidebar + Routing
- Add "Prompt Export" nav item with a `Download` icon to the sidebar
- Add `/prompt-export` route in `App.tsx`

### 4. ZIP Generation
- Uses `jszip` npm package (client-side) to bundle the returned files into a downloadable `.zip`
- No server-side zip needed — the edge function returns the file contents as JSON, and the client bundles them

## No Database Changes Required
Reads from existing `problems`, `solutions`, `tasks`, and `kpis` tables. No new tables needed.

## Dependencies to Install
- `jszip` — client-side ZIP file creation

