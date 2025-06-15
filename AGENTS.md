# AI Agent Development Context

This document provides essential context for AI assistants working on the Anode project.

## Project Overview

Anode is a real-time collaborative notebook system built on LiveStore, an event-sourcing based local-first data synchronization library. The project uses a monorepo structure with TypeScript and pnpm workspaces.

**Current Status**: Fully operational with zero-latency Python execution.

## Architecture

- **Schema Package** (`@anode/schema`): LiveStore schema definitions (events, state, materializers)
- **Web Client** (`@anode/web-client`): React-based web interface
- **Document Worker** (`@anode/docworker`): Cloudflare Worker for sync backend
- **Kernel Client** (`@anode/dev-server-kernel-ls-client`): Python execution server (manual start per notebook)

## Key Dependencies

- **LiveStore**: Event-sourcing library for local-first apps
- **Effect**: Functional programming library for TypeScript
- **React**: UI framework
- **TypeScript**: Primary language

## Current Architecture - Fully Operational

### **Simplified Notebook/Store Relationship**
- `NOTEBOOK_ID = STORE_ID`: Each notebook gets its own LiveStore database
- URL routing: Access notebooks via `?notebook=notebook-id`
- Single notebook per store eliminates data boundary confusion
- All events naturally scoped to one notebook

### **Reactive Execution Queue System**
- Flow: `executionRequested` → `executionAssigned` → `executionStarted` → `executionCompleted`
- **Kernels use reactive `queryDb` subscriptions** for instant work detection (no polling)
- **Zero-latency execution** - cells execute immediately when run
- Session-based assignment with auth enforcement planned
- **Fully operational** - working end-to-end with lightning-fast response

### **Kernel Session Tracking**
- Each kernel restart gets unique `sessionId`
- 30-second heartbeat mechanism
- Session IDs tracked in execution queue
- Manual kernel management (start one per notebook)

## Development Setup

### Common Commands
```bash
# Start core services (web + sync)
pnpm dev

# Start kernel for specific notebook (manual)
NOTEBOOK_ID=notebook-123-abc pnpm dev:kernel

# Individual services
pnpm dev:web-only
pnpm dev:sync-only

# Development utilities
pnpm reset-storage  # Clear all local storage
pnpm build:schema   # Required after schema changes
```

## Current Working State
## What's Working ✅

- ✅ **Instant Python execution** with zero polling delays
- ✅ **Real-time collaboration** across multiple users  
- ✅ **Reactive architecture** using LiveStore's `queryDb` subscriptions
- ✅ **Multiple isolated notebooks** with separate kernels
- ✅ **Rich output display** for Python results
- ✅ **Offline-first operation** with sync when connected
- ✅ **Event sourcing** for complete history and debugging
- ✅ **Session management** with kernel isolation
- ✅ **Comprehensive testing** (68 passing tests)

## Next Phase: AI Integration & Advanced Features 🤖

**Priority Focus**: AI ↔ Python ↔ User interactions with enterprise-grade features

### Immediate Goals
- **Real AI API Integration** - Replace mock responses with OpenAI, Anthropic, local model calls
- **Markdown Rendering** - Render AI responses as formatted markdown instead of plain text
- **Automatic Kernel Management** - One-click notebook startup with auto-kernel lifecycle
- **Code Completions** - LSP + kernel-based suggestions with Pyodide integration
- **Authentication System** - Google OAuth with proper session management
- **SQL Cell Implementation** - Real database connections and query execution

### Medium-term Roadmap
- **Enhanced Output Rendering** - Rich media, plots, and interactive visualizations
- **Real-time Collaboration** - Live cursors and presence indicators
- **Advanced Cell Operations** - Multi-select, drag-and-drop reordering
- **Performance Optimization** - Handle large notebooks efficiently

### Recent UX Achievements ✅
- ✅ Fluid notebook navigation with arrow keys
- ✅ Always-on textareas replacing click-to-edit model
- ✅ Clean, focus-driven interface design
- ✅ Standard keyboard shortcuts (Shift+Enter, Ctrl+Enter)
- ✅ Prominent keyboard shortcuts help
- ✅ Consistent behavior across all cell types

## Important Considerations

### Schema Design
- Schema package must be built before dependent packages can consume changes
- Single `notebook` table per store (not `notebooks`)
- `kernelSessions` and `executionQueue` tables for lifecycle management
- **No timestamp fields** - eliminated for simplicity and stability (LiveStore handles timing automatically)

### Local-First Architecture
- All data operations happen locally first
- Events synced across clients via document worker
- SQLite provides local reactive state per notebook
- Network connectivity optional

### Code Style
- Prefer functional programming patterns (Effect library)
- Event sourcing over direct state mutations
- Reactive queries over imperative data fetching
- TypeScript strict mode enabled

## File Structure
```
anode/
├── packages/
│   ├── schema/           # LiveStore schema definitions
│   ├── web-client/       # React web application
│   ├── docworker/        # Cloudflare Worker sync backend
│   └── dev-server-kernel-ls-client/  # Python kernel server
├── start-dev.sh          # Development startup script
├── reset-local-storage.cjs  # Clean development state
├── package.json          # Root workspace configuration
└── pnpm-workspace.yaml   # Dependency catalog
```

## Troubleshooting

### Common Issues
- **Build failures**: Run `pnpm build:schema` first
- **Sync issues**: Check document worker deployment
- **Execution not working**: Start kernel manually with `NOTEBOOK_ID=your-notebook-id pnpm dev:kernel`
- **Stale state**: Run `pnpm reset-storage` to clear everything

### Debugging
- Browser console for client-side issues
- Wrangler logs for worker debugging
- Terminal output for kernel server issues
- Comprehensive logging in kernel for execution flow

## Notes for AI Assistants

### Current State - Fully Operational + AI Ready
- **Zero-latency execution** with reactive architecture breakthrough
- **AI cell integration** ✅ COMPLETED - Unified execution queue system
- **Mock AI responses** ✅ WORKING - Through standard output system
- Manual kernel management (automation planned)
- Simplified schemas for reliability and rapid development
- Each notebook = separate LiveStore database for clean isolation
- **Stable reactive architecture** leveraging LiveStore's capabilities
- Ready for real AI API integration and advanced features

### Communication Style
- Use authentic developer voice - uncertainty is fine, just be explicit
- Focus on AI ↔ Python ↔ User interaction goals as primary differentiator
- Acknowledge both technical and UX achievements completed
- Emphasize production readiness and solid foundation for AI features
- Balance current capabilities with enterprise collaboration roadmap

### Key Insights for Development
- **Reactive architecture breakthrough** - Zero-latency execution achieved
- **Fluid UX transformation** - Jupyter-like navigation and interaction completed
- **Unified execution system** - AI cells work exactly like code cells through execution queue
- Simple schemas enable rapid prototyping and reliable operation
- Event sourcing provides excellent debugging and audit capabilities  
- Local-first design enables offline work and instant responsiveness
- **Proper event deferral** resolves LiveStore execution segment conflicts effectively
- Session-based kernel management enables clean isolation and scaling
- **Focus-based UI patterns** create clean, keyboard-driven workflows
- **Consistent cross-cell behavior** enables predictable user experience
- **AI integration architecture** - Mock responses working, ready for real API integration

**Current Development Cycle**: Major UX improvements completed in June 2025, creating a fluid notebook experience that rivals Jupyter while maintaining real-time collaboration advantages.

The system provides a **production-ready foundation** for AI-native collaborative notebooks with modern UX and is positioned for advanced enterprise features.

## Important Note on Timestamps

**Do NOT use manual timestamps in code or events.** LiveStore automatically handles all timing through its event sourcing system. Focus development on features and architecture rather than timestamp management - this was a key lesson learned that improved system stability significantly.