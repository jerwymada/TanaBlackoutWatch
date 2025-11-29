# Design Guidelines - Power Outage Tracking Application

## Design Approach
**Reference-Based**: Inspired by StatusPage.io and GitHub Status interfaces, known for their clarity in presenting real-time service states. The design prioritizes immediate visual comprehension of power outage status across neighborhoods with a timeline-focused layout.

## Core Design Elements

### Typography
- **Primary Font**: Roboto or Inter from Google Fonts
- **Hierarchy**:
  - H1 (App Title): 24px/font-semibold (mobile), 32px (desktop)
  - H2 (Neighborhood Names): 18px/font-medium
  - Body Text: 14px/font-normal
  - Timeline Labels: 12px/font-medium
  - Tooltips: 13px/font-normal

### Color System (User-Specified)
- **Primary (Outage)**: #E74C3C (red) - indicates power outages
- **Secondary (Active)**: #27AE60 (green) - indicates active power
- **Background**: #F8F9FA (light gray)
- **Text**: #2C3E50 (dark blue)
- **Accent**: #F39C12 (orange) - attention/warnings
- **Favorites**: #FFD700 (gold) - favorite star indicator

### Layout System
**Mobile-First Approach** with these spacing primitives:
- Base mobile padding: `p-3` (12px)
- Card spacing: `gap-3` and `space-y-3`
- Section padding: `py-4` (mobile), `py-6` (desktop)
- Touch target minimum: 44px height for all interactive elements

### Component Library

#### 1. Timeline Component
- Horizontal scrollable timeline showing 24-hour periods
- Each hour slot: minimum 60px width for touch targets
- Visual indicators: Red blocks for outages, empty/green for active power
- Sticky header for hour labels during scroll
- Smooth scroll behavior with snap points

#### 2. Neighborhood Cards
- Card-based layout with rounded corners (`rounded-lg`)
- Each card displays: Neighborhood name, favorite star button, current status
- Visual status bar showing outage timeline
- Shadow on hover: `hover:shadow-md transition-shadow`
- Grid layout: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)

#### 3. Filter Controls
- Dropdown/select for neighborhood filtering
- Time range selector for hour filtering
- Compact filter bar with clear visual separation
- Filter chips showing active filters with remove option

#### 4. Favorite System
- Gold star icon (#FFD700) for favorited neighborhoods
- Outlined star for non-favorited
- 44px minimum touch target for star button
- Favorites appear at top of list with subtle golden border accent

#### 5. Tooltips
- Appear on hover (desktop) and long-press (mobile)
- Display: Hour + Neighborhood name
- Dark background with white text for contrast
- Small arrow pointer to target element
- Fade-in animation (200ms)

#### 6. Status Indicators
- Clear visual blocks: Red (#E74C3C) for outages, Green (#27AE60) for active
- Consistent sizing across timeline and cards
- Border radius: `rounded` for visual consistency

### Interaction Patterns
- Horizontal scroll for timeline (no vertical scroll within timeline)
- Tap to favorite/unfavorite neighborhoods
- Smooth transitions (200-300ms) for state changes
- Loading states with subtle pulse animation
- Empty states with helpful messaging

### Responsive Breakpoints
- Mobile: < 768px (base styles)
- Tablet: 768px - 1024px (md:)
- Desktop: > 1024px (lg:)

### Accessibility
- Minimum contrast ratios: 4.5:1 for text, 3:1 for UI components
- All interactive elements: 44px minimum touch target
- Clear focus indicators for keyboard navigation
- ARIA labels for timeline slots and status indicators
- Screen reader announcements for outage updates

## Images
No hero images or decorative imagery needed. This is a utility-focused application prioritizing data visualization and quick information access. All visuals are functional (icons, status indicators, and timeline blocks).