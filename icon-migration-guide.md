# Icon Migration Guide

## What We've Done

✅ **Installed**: `lucide-react-native` - A modern, reliable icon library
✅ **Created**: `src/components/Icon.tsx` - Centralized icon component
✅ **Updated**: Key components (Header, SettingsScreen, ChangePasswordScreen, etc.)

## Icon Mapping

| Old Ionicons | New Icon Name | Lucide Component |
|-------------|---------------|------------------|
| `home` / `home-outline` | `home` | Home |
| `person` / `person-outline` | `person` | User |
| `settings` / `settings-outline` | `settings` | Settings |
| `notifications` / `notifications-outline` | `notifications` | Bell |
| `search` / `search-outline` | `search` | Search |
| `chevron-back` | `chevron-left` | ChevronLeft |
| `chevron-forward` | `chevron-right` | ChevronRight |
| `arrow-back` | `arrow-left` | ArrowLeft |
| `eye` / `eye-outline` | `eye` | Eye |
| `eye-off` / `eye-off-outline` | `eye-off` | EyeOff |
| `camera` / `camera-outline` | `camera` | Camera |
| `checkmark` / `checkmark-circle` | `check` / `check-circle` | Check / CheckCircle |
| `close` / `close-circle` | `close` / `close-circle` | X / XCircle |
| `lock-closed` / `lock-closed-outline` | `lock` | Lock |
| `mail` / `mail-outline` | `mail` | Mail |
| `call` / `call-outline` | `phone` | Phone |
| `people` / `people-outline` | `users` | Users |
| `business` / `business-outline` | `business` | Building2 |
| `add` / `add-outline` | `add` | Plus |
| `create` / `create-outline` | `edit` | Edit |
| `trash` / `trash-outline` | `trash` | Trash2 |
| `ellipsis-vertical` | `more` | MoreVertical |
| `log-out` / `log-out-outline` | `logout` | LogOut |
| `globe` / `globe-outline` | `globe` | Globe |
| `shield` / `shield-outline` | `shield` | Shield |
| `alert-circle` | `alert` | AlertCircle |
| `information-circle` | `info` | Info |
| `card` / `card-outline` | `card` | CreditCard |
| `bus` / `bus-outline` | `bus` | Bus |
| `map` / `map-outline` | `map` | Map |
| `bar-chart` / `bar-chart-outline` | `chart` | BarChart3 |

## Usage

### Old Way (Ionicons)
```tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="home-outline" size={24} color="#000" />
```

### New Way (Our Icon Component)
```tsx
import { Icon } from '../components/Icon';

<Icon name="home" size={24} color="#000" />
```

## Benefits

1. **Reliability**: Lucide icons are more stable and well-maintained
2. **Consistency**: All icons follow the same design system
3. **Type Safety**: TypeScript support with proper icon name validation
4. **Performance**: Better tree-shaking and smaller bundle size
5. **No Font Loading Issues**: SVG-based icons load instantly

## Remaining Files to Update

Run this search to find remaining Ionicons usage:
```bash
grep -r "from '@expo/vector-icons'" src/
```

## Quick Replace Pattern

1. Replace import: `import { Ionicons } from '@expo/vector-icons';` → `import { Icon } from '../components/Icon';`
2. Replace usage: `<Ionicons name="icon-name" size={24} color="#000" />` → `<Icon name="icon-name" size={24} color="#000" />`
3. Update icon names using the mapping table above

## Testing

Use the `IconTest` component to verify icons are working:
```tsx
import { IconTest } from '../components/IconTest';

// Add to any screen temporarily
<IconTest />
```