# UI (@repo/ui) Codemap

**Last Updated:** 2026-02-28
**Entry Points:** `src/components/`, `src/hooks/`, `src/lib/`

## Architecture

```
@repo/ui (shared component library)
├── src/
│   ├── components/
│   │   └── [shadcn/ui components]
│   │       └── button, input, card, modal, etc.
│   ├── hooks/
│   │   └── [React custom hooks]
│   │       └── useAuth, useTheme, etc.
│   ├── lib/
│   │   └── [Utility functions]
│   │       └── cn(), formatting, validation, etc.
│   └── styles/
│       └── globals.css (Tailwind base styles)
└── package.json

External:
├── React 19 (@repo/ui is React library)
├── Tailwind CSS v4
├── shadcn/ui (@base-ui/react components)
├── Next Themes (dark mode)
└── Tabler Icons, Recharts (optional utilities)
```

## Component Library

### Built-in shadcn/ui Components

Components imported from `@repo/ui/components/`:

```typescript
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@repo/ui/components/dialog";
// ... and more
```

**Popular components:**

- `button` - Interactive button
- `input` - Text input field
- `card` - Container with border/shadow
- `dialog`/`modal` - Modal overlay
- `select` - Dropdown selection
- `table` - Data table
- `tabs` - Tab navigation
- `toast` - Notification toast
- `form` - Form wrapper with validation

**Installation:** New components via:

```bash
npx shadcn@latest add <component-name> -c packages/ui
```

## Hooks

### `useAuth()` - Authentication State

```typescript
import { useAuth } from "@repo/ui/hooks/useAuth";

const { user, session, loading, error } = useAuth();
// → { user: { id, email, name, image }, ... }
```

**Returns:**

- `user` - Current user object or null
- `session` - Current session token
- `loading` - Boolean, true while fetching
- `error` - Error object or null

### `useTheme()` - Dark Mode Toggle

```typescript
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
// → "light" | "dark" | "system"
```

**Usage:**

```typescript
<button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
  Toggle Theme
</button>
```

## Utilities

### `cn()` - Class Name Merging

```typescript
import { cn } from "@repo/ui/lib/cn";

const classes = cn("px-4 py-2", isActive && "bg-blue-500", "text-white");
// Merges and deduplicates Tailwind classes
```

**Purpose:** Safely merge Tailwind classes without conflicts
(uses `clsx` + `tailwind-merge`)

### `formatDate()` - Date Formatting

```typescript
import { formatDate } from "@repo/ui/lib/formatDate";

formatDate(new Date(), "short"); // "Feb 28, 2026"
formatDate(new Date(), "long"); // "February 28, 2026"
```

## Styling

### Global Styles

```css
/* @repo/ui/src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Imported in app layout:

```typescript
import "@repo/ui/globals.css";
```

### Tailwind Configuration

**Tailwind v4** configured in `tailwind.config.ts`:

- Custom font: Pretendard Variable (local)
- Color palette: Extended with brand colors
- Dark mode: Enabled (class-based toggle)

## Export API

```json
{
  "./globals.css": "./src/styles/globals.css",
  "./postcss.config": "./postcss.config.mjs",
  "./lib/*": "./src/lib/*.ts",
  "./components/*": "./src/components/*.tsx",
  "./hooks/*": "./src/hooks/*.ts"
}
```

**Usage:**

```typescript
// Styles
import "@repo/ui/globals.css";

// Components
import { Button } from "@repo/ui/components/button";

// Hooks
import { useTheme } from "@repo/ui/hooks/useTheme";

// Utilities
import { cn } from "@repo/ui/lib/cn";
```

## Dependencies

| Package                  | Version | Purpose                 |
| ------------------------ | ------- | ----------------------- |
| React                    | ^19.1.1 | UI framework            |
| React DOM                | ^19.1.1 | DOM rendering           |
| Tailwind CSS             | ^4.1.11 | Utility CSS             |
| @base-ui/react           | ^1.2.0  | Headless components     |
| next-themes              | ^0.4.6  | Dark mode management    |
| @tabler/icons-react      | ^3.36.1 | Icon library            |
| recharts                 | 2.15.4  | Charting library        |
| class-variance-authority | ^0.7.1  | CSS class variants      |
| clsx                     | ^2.1.1  | Conditional class names |
| tailwind-merge           | ^3.3.1  | Merge Tailwind classes  |

## Icon Usage

**Tabler Icons** from `@tabler/icons-react`:

```typescript
import { IconMicrophone, IconTrash, IconCheck } from "@tabler/icons-react";

<IconMicrophone size={24} stroke={2} />
<IconTrash size={20} />
<IconCheck className="text-green-500" />
```

**Available:** 5000+ icons, fully customizable

## Charting

**Recharts** for data visualization:

```typescript
import { LineChart, Line, XAxis, YAxis } from "recharts";

<LineChart width={400} height={300} data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>
```

## Related Areas

- **[@speakmemo/app](./APP.md)** - Primary consumer of components
- **[@speakmemo/web](./WEB.md)** - Landing page also uses components
- **Design System** - Tailwind + shadcn/ui = consistent UI

---

## Implementation Notes

1. **shadcn/ui:** Copy-paste component library (not npm dependency)
2. **Tailwind v4:** Latest with improved performance and smaller bundle
3. **No Runtime Dependencies:** Components are pure React
4. **Dark Mode:** Built-in via next-themes
5. **Fully Customizable:** All component styles in source (no locked configs)
6. **TypeScript:** Full type safety for all exports

---

Status: **Stable** - Core UI library, component-based architecture
