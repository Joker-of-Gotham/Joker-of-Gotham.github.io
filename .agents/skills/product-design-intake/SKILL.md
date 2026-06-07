---
name: product-design-intake
description: 'Use when designing product UI, SaaS applications, dashboards, admin panels, or complex web apps. Collects information architecture, user goals, navigation patterns, data density, and permission models before implementation. Complements design-brief-gate for product-specific requirements.'
---

# Product Design Intake

Deep intake for product-level design work. Goes beyond visual aesthetics into information architecture, user workflows, and system behavior.

## When to Use

- SaaS application design
- Dashboard or analytics platform
- Admin panel or control interface
- Multi-page web application
- Mobile app with complex navigation
- AI/ML product interface
- Data platform or research tool
- E-commerce backend

## Information to Collect

### 1. User Roles & Permissions

- Who are the distinct user types? (admin, viewer, editor, operator)
- What can each role see and do?
- Are there permission-gated sections?

### 2. Core Workflows (Top 3)

- What are the 3 most important things users do?
- What is the critical path for each?
- Where do users spend most time?

### 3. Navigation Model

| Pattern | Best For |
|---------|----------|
| Sidebar + topbar | Dense apps with many sections |
| Top tabs only | Focused apps with 3-5 main areas |
| Bottom tabs | Mobile apps |
| Command palette primary | Power-user tools |
| Wizard/stepper | Onboarding, multi-step flows |

### 4. Data Density

- Low (marketing, content): generous whitespace, large type
- Medium (productivity): balanced information and breathing room
- High (analytics, trading): compact, data-forward, every pixel matters

### 5. Key Screen Inventory

List the primary screens needed:
- Dashboard/home
- List/table views
- Detail/edit views
- Settings/preferences
- Onboarding flow
- Empty states
- Error states

### 6. Real-time Requirements

- Does data update live? (WebSocket, polling)
- Are there notifications or alerts?
- Collaborative features (presence, cursors)?

### 7. Existing Constraints

- Existing API shape (what data is available?)
- Authentication method
- Deployment target (web, Electron, mobile)
- Performance requirements (large datasets, offline)

## Output Format

```
## Product Design Summary

### Users
- Primary: [role + goal]
- Secondary: [role + goal]

### Core Workflows
1. [Workflow]: [steps] → [outcome]
2. [Workflow]: [steps] → [outcome]
3. [Workflow]: [steps] → [outcome]

### Navigation
- Pattern: [sidebar/tabs/command/wizard]
- Primary sections: [list]
- Secondary/contextual: [list]

### Density
- Level: [low/medium/high]
- Rationale: [why]

### Screen Map
- [Screen]: [purpose] → [key components]
- [Screen]: [purpose] → [key components]

### States to Handle
- Loading: [strategy]
- Empty: [strategy]
- Error: [strategy]
- Offline: [if applicable]

### Technical Constraints
- [constraint list]
```

## Constraints

- Do not produce UI code -- only structured intake documentation
- If the user already has detailed specs, summarize rather than re-ask
- Focus on what's unique to this product, not generic UI advice
- Hand off to design-system-governor or frontend-ui-engineering after intake
