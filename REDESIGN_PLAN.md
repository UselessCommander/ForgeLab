# ForgeLab Project-Based Redesign Plan

## Overview

ForgeLab has been redesigned from a tool catalog into a **project-based workspace platform**. Users create projects, add tools to them, and work within a unified workspace.

---

## 1. Updated Layout Structure

### Route Hierarchy

```
/dashboard                    → Main dashboard (Your Projects + Available Tools)
/dashboard/projects/[id]      → Project workspace (sidebar + tool content)
/tools/[slug]                 → Standalone tool (still works for direct links)
/tools/[slug]?embed=1         → Embed mode (no header, compact for iframe)
```

### Page Flows

| User Action | Flow |
|-------------|------|
| Login | → Dashboard |
| Create Project | → Modal → Project Workspace |
| Open Project | → Project Workspace with sidebar |
| Add Tool | → Modal in workspace → Tool loads in main area |
| Switch Tool | → Content area updates (no navigation) |
| Back to Dashboard | → Sidebar link |

---

## 2. Component Hierarchy

```
Dashboard
├── DashboardClient
│   ├── Header (logo, logout)
│   ├── ProjectsSection
│   │   ├── CreateProjectButton
│   │   ├── ProjectCard[] (links to workspace)
│   │   └── CreateProjectModal
│   └── AvailableToolsSection
│       └── AvailableToolCard[]

ProjectWorkspace
├── ProjectWorkspaceClient
│   ├── Sidebar
│   │   ├── BackToDashboard
│   │   ├── ProjectName + description
│   │   ├── ToolList (click to switch)
│   │   ├── AddToolButton
│   │   └── Export (placeholder)
│   ├── MainContent
│   │   ├── ToolToolbar (save, export)
│   │   └── ToolIframe (loads /tools/[slug]?embed=1)
│   └── AddToolModal
│       └── ToolPicker (available tools not in project)

Tools (each)
├── ToolLayout (supports embed via ?embed=1)
│   └── [Tool-specific content]
```

---

## 3. Tailwind Layout Grid

### Dashboard

```html
<div class="max-w-4xl mx-auto px-6 py-10">
  <header class="flex justify-between mb-12">...</header>
  <section class="mb-16">
    <div class="flex justify-between mb-6">...</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Project cards -->
    </div>
  </section>
  <section>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <!-- Available tools -->
    </div>
  </section>
</div>
```

### Project Workspace

```html
<div class="flex min-h-screen bg-[#fafbfc]">
  <aside class="w-64 flex-shrink-0 border-r bg-white flex flex-col">
    <!-- Sidebar: fixed width -->
  </aside>
  <main class="flex-1 flex flex-col min-w-0">
    <div class="h-12 border-b bg-white">Toolbar</div>
    <div class="flex-1 min-h-0 overflow-hidden">
      <iframe />
    </div>
  </main>
</div>
```

- Sidebar: `w-64`, `flex-shrink-0`
- Main: `flex-1`, `min-w-0` for overflow
- Iframe: `w-full h-full` to fill main area

---

## 4. UX Improvements

| Before | After |
|--------|-------|
| Dense tool cards with long descriptions | Minimal project cards, icon-driven tool list |
| Direct tool links | Project → Add tools → Switch between tools in-context |
| Full-page tool navigation | Dynamic content switch (iframe), no full reload |
| Marketing-style grid | SaaS-style layout (Notion / Linear feel) |
| Heavy gradients, many borders | Neutral light bg, subtle borders, more whitespace |

### Design Principles Applied

- **Reduce card density** – Projects: name, description, last edited, tool count. Tools: icon + title + short line.
- **More whitespace** – `mb-12`, `gap-4`, `max-w-4xl`.
- **Clear hierarchy** – "Dine projekter" primary, "Tilgængelige værktøjer" secondary.
- **Accent only for actions** – Amber/gray for primary buttons; neutral for structure.
- **Consistent icons** – Lucide via `getToolIcon()`.

---

## 5. State Handling

### Current (MVP)

- **Projects**: `localStorage` via `lib/projects.ts`
  - `getProjects()`, `createProject()`, `updateProject()`, `deleteProject()`
  - `addToolToProject()`, `removeToolFromProject()`, `reorderProjectTools()`
- **Tool state**: Per-tool React state (no persistence yet; tools are stateless on reload)

### Recommended Next Steps

1. **API + DB**
   - `projects` table: `id`, `user_id`, `name`, `description`, `updated_at`, `created_at`
   - `project_tools` table: `project_id`, `tool_slug`, `order`
   - `project_tool_data` table: `project_id`, `tool_slug`, `data` (JSON) for per-tool state

2. **Tool state persistence**
   - Each tool exposes `getState()` / `setState()` or uses a shared hook
   - Save to `project_tool_data` on change (debounced)
   - Load on workspace mount

3. **React Context** (optional)
   - `ProjectContext`: `{ projectId, project, activeTool, setActiveTool }`
   - Tools can read `projectId` for scoped saves

4. **URL state**
   - `?tool=swot-generator` for deep links and back/forward

---

## 6. Future-Proofing

### Collaboration

- Add `project_members` table and RLS
- Use Supabase Realtime for live updates
- Optimistic UI for tool edits

### AI Suggestions

- Extend toolbar with "AI assist" button
- Optional right panel for notes/insights
- API endpoint for suggestions based on project + tool context

### Shared Links

- `/share/[projectId]` or `/p/[shareSlug]` for read-only view
- Optional public/private toggle per project

### Version History

- `project_versions` table with snapshots
- Diff view and restore in project settings

### Scalability

- Sidebar: collapsible on small screens
- Tool list: virtualized if many tools
- Projects: pagination or infinite scroll on dashboard

---

## 7. File Structure

```
lib/
  projects.ts        # Project CRUD (localStorage)
  tool-slugs.ts      # Canonical tool list

components/
  ToolLayout.tsx     # Wraps tools, supports ?embed=1
  dashboard/
    ProjectCard.tsx
    AvailableToolCard.tsx

app/
  dashboard/
    page.tsx
    DashboardClient.tsx
    projects/[projectId]/
      page.tsx
      ProjectWorkspaceClient.tsx
```

---

## 8. Embed Mode

Tools use `ToolLayout` and check `?embed=1` via `useSearchParams`:

- **Normal**: Full header, back link, max-w-7xl
- **Embed**: Compact padding, no header, max-w-5xl

Example: SWOT, Empathy Map. Other tools can be migrated to `ToolLayout` the same way.
