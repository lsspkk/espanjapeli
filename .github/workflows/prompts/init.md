
---
name: foobar
agent: agent
model: GPT-4.1
description: "Analyze codebase and generate documentation game modes in Espanjapeli Svelte app"
---
# Instructions


## Purpose
This prompt instructs an AI agent to perform comprehensive code analysis of the Espanjapeli Svelte application, generate detailed technical documentation similiar to CLAUDE.md created by claude coding environment with the command /init

## Instructions for AI Agent

### Task Overview
Analyze the Svelte codebase in `/home/lvp/study/espanjapeli/svelte/src` and create a comprehensive technical document called `ai-control/codebase.md` that details the architecture, components, and implementation of AR/image-based game modes.

### Analysis Scope

#### 1. Game Modes to Analyze
Focus primarily on visual/image-based learning games:
- **Pipsan ystävät** (`/routes/pipsan-ystavat/`)
- **Pipsan maailma** (`/routes/pipsan-maailma/`)
- Supporting game modes for context

#### 2. Key Areas to Investigate

**A. Architecture & Data Flow**
- Trace how images are loaded and displayed
- Document the game initialization process
- Map the question generation algorithm
- Explain the answer validation flow
- Detail the statistics tracking system

**B. Component Structure**
Search and document all components in:
```
svelte/src/lib/components/
```

For each significant component, document:
- Purpose and responsibility
- Props/interface
- Key functionality
- Usage pattern
- Dependencies

**C. Services & Business Logic**
Analyze services in `svelte/src/lib/services/`:

For each service:
- Core functionality
- Key methods and their purpose
- Data structures used
- Integration points with components

**D. Type Definitions**
Document interfaces and types used across AR modes:
- Game question structures
- Image manifest format
- Statistics/session tracking
- Animation configurations
- Component props

**E. Data Pipeline**
Investigate how content is created and loaded:
- Image generation scripts in the scripts folder
- Manifest structures
- Translation caching
- Asset organization in `svelte/static/`

**F. State Management**
Document how state flows through the application:
- Svelte 5 runes usage (`$state`, `$derived`, `$props`, `$effect`)
- LocalStorage persistence
- Session management
- Component state lifting

#### 3. Documentation Structure

Create `ai-control/codebase.md` with these sections:

1. **Executive Summary**
   - High-level overview of AR-style game modes
   - Key technologies and patterns used

2. **Game Modes Overview**
   - Table of all game modes with routes, types, audiences
   - Focus identification for AR/visual modes

3. **Architecture Deep Dive**
   - Data flow diagram (ASCII/markdown)
   - Core interfaces and types
   - Component hierarchy

4. **Component Catalog**
   - Organized by directory structure
   - Purpose, props, key features for each
   - Usage examples where helpful

5. **Service Layer**
   - Each service documented separately
   - Method signatures and purposes
   - Integration patterns

6. **Statistics & Learning**
   - How learning metrics are tracked
   - Session structure
   - Smart question selection algorithm
   - Data persistence strategy

7. **Audio Integration**
   - TTS service details
   - Browser API usage
   - Accessibility considerations

8. **Animation System**
   - Animation types and configurations
   - Character sprite system
   - Trigger mechanisms

9. **Feedback & UX**
   - Feedback flow (correct/wrong answers)
   - Feedback components
   - Gamification elements

10. **Accessibility Features**
    - Display modes (SVG/emoji)
    - Audio alternatives
    - Responsive design
    - Accessibility patterns

11. **Data Pipeline**
    - Content creation workflow
    - Image generation process
    - Translation integration
    - Manifest building

12. **Future AR Possibilities**
    - Potential camera integration
    - True AR concepts
    - Technical requirements
    - Privacy considerations

13. **Testing Infrastructure**
    - Test file locations
    - Coverage areas
    - Testing patterns used

14. **Code Quality & Patterns**
    - Design principles followed
    - Svelte 5 patterns
    - Component organization rules

15. **Performance Considerations**
    - Image optimization
    - State management efficiency
    - Audio performance

16. **Development Workflow**
    - Adding new content
    - Testing locally
    - Build process

17. **Limitations & Technical Debt**
    - Known issues
    - Areas for improvement

18. **Deployment Notes**
    - Build artifacts
    - Browser compatibility
    - Environment considerations

19. **Related Documentation**
    - Links to other project docs

20. **Summary & Recommendations**
    - Current state assessment
    - Strengths
    - Future directions

### 4. Analysis Methodology

**Step 1: Discovery**
```bash
# Use these tools to discover code:
- file_search for finding components
- semantic_search for conceptual searches
- read_file to examine specific files
- list_dir to explore directory structures
```

**Step 2: Pattern Recognition**
- Identify repeated patterns across components
- Note separation of concerns (kids vs basic)
- Document data flow patterns
- Map component dependencies

**Step 3: Deep Analysis**
- Read key files line by line
- Understand state management
- Trace data transformations
- Document algorithms (question selection, distractor generation)

**Step 4: Integration Understanding**
- How do components communicate?
- What props are passed down?
- How is state lifted/shared?
- Service injection patterns

**Step 5: Testing Review**
- Find all test files
- Understand what's tested
- Note coverage gaps
- Document testing patterns

### 5. Output Format Guidelines

**Markdown Best Practices:**
- Use clear headers (##, ###, ####)
- Include code blocks with language tags
- Use tables for structured comparisons
- Add ASCII diagrams for data flow
- Use lists (bullet/numbered) appropriately
- Add horizontal rules (---) for major sections
- Use **bold** for emphasis, `code` for symbols/filenames
- Include file paths in code comments

**Code Examples:**
```typescript
// Show actual interfaces from the code
// Include comments explaining purpose
// Keep examples concise but complete
```

**File References:**
Always include file paths:
```
Location: svelte/src/lib/components/kids/feedback/KidsCelebration.svelte
```

**Diagrams:**
```
Use ASCII art for flow diagrams:
┌─────────┐
│  Start  │
└────┬────┘
     │
     ▼
┌─────────┐
│ Process │
└────┬────┘
```

### 6. Special Considerations

**Do:**
- ✅ Focus on AR/image-based game modes primarily
- ✅ Include enough detail for a new developer to understand
- ✅ Explain *why* architectural decisions were made
- ✅ Note future enhancement opportunities
- ✅ Document both happy paths and error handling
- ✅ Include testing information
- ✅ Note accessibility features
- ✅ Reference related documentation files

**Don't:**
- ❌ Include every single line of code
- ❌ Copy-paste entire files
- ❌ Make assumptions about code you haven't read
- ❌ Skip error handling patterns
- ❌ Ignore test files
- ❌ Forget about mobile/responsive considerations

### 7. Verification Checklist

Before finalizing the document, ensure:

- [ ] All game components are documented
- [ ] Data flow is clearly explained with diagrams
- [ ] Key interfaces are included with full type definitions
- [ ] Service layer is thoroughly documented
- [ ] Statistics tracking system is explained
- [ ] Audio/TTS integration is covered
- [ ] Animation system is documented
- [ ] Testing infrastructure is noted
- [ ] Accessibility features are highlighted
- [ ] Future AR possibilities are explored
- [ ] File paths are accurate
- [ ] Code examples compile/make sense
- [ ] Tables are properly formatted
- [ ] No placeholder text remains (like "TODO" or "...")

### 8. Example Analysis Flow

**Example: Analyzing Pipsan ystävät**

1. **Start with the route file:**
   ```
   Read: svelte/src/routes/pipsan-ystavat/+page.svelte
   Extract: Interfaces, state variables, key functions
   ```

2. **Find imported components:**
   ```
   Search: KidsGameHeader, KidsImageOptions, KidsCelebration, etc.
   Read each component file
   Document their purpose and props
   ```

3. **Trace data sources:**
   ```
   Find: image_manifest.json loading
   Understand: manifest structure
   Document: how questions are generated
   ```

4. **Analyze services:**
   ```
   Read: peppaStatistics.ts - understand session tracking
   Read: tts.ts - understand audio playback
   Document: key methods and data structures
   ```

5. **Map the user flow:**
   ```
   Start → Load data → Start game → Show question → 
   Play audio → User selects → Validate → Show feedback → 
   Next question → End game → Show results
   ```

6. **Document testing:**
   ```
   Find: pipsan-ystavat tests
   Note: what scenarios are tested
   Document: testing patterns used
   ```

### 9. Output Location

**File to create:** `/home/lvp/study/espanjapeli/ai-control/codebase.md`

**IMPORTANT - Version Management:**
1. **NEVER read the previous `codebase.md` for reference** - Always analyze the code directly
2. **Before creating new version:**
   - Check if `ai-control/codebase.md` exists
   - If it exists, backup to `docs/status/codebase-v{N}.md` where N is incremented version number
   - Start with v1, increment for each backup (v1, v2, v3, etc.)
   - Use `run_in_terminal` with `mv` command to move the file
   - Example: `mv ai-control/codebase.md docs/status/codebase-v1.md`
3. **Then create fresh analysis** from scratch by reading the actual code

**Metadata to include at top:**
```markdown
# Espanjapeli Codebase Analysis - AR Game Modes

**Generated:** [Current Date]
**Purpose:** Comprehensive code analysis of AR/image-based game modes
**Target:** svelte/src code for AR-style game implementations
**Agent:** [AI Agent Name/Version]

---
```

**Metadata to include at bottom:**
```markdown
---

**Document Version:** 1.0
**Last Updated:** [Date]
**Maintainer:** AI Development Team
**Analysis Tools:** [List tools used - grep_search, semantic_search, etc.]
```


**Prompt Version:** 1.0  
**Created:** 2026-01-14  
**Purpose:** Initialize codebase documentation for AR game modes
