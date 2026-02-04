# TEDx-Inspired UI Design Update

## Overview
Implemented a stunning TED-inspired design for the TEDxKPRIT 2025 event with red and black color scheme, cool backgrounds, and special "Revealing Soon" speaker cards.

## 🎨 Design Features

### 1. **TED-Inspired Color Scheme**
- **Primary Colors**: Red (#DC2626) and Black (#000000)
- **Accent Color**: Red-600 (#DC2626) for highlights
- **Background**: Black with red spotlight effects

### 2. **Cool TED-Related Backgrounds**
- **Red Spotlight Effect**: Radial gradient background simulating TED stage lighting
- **Circular Pattern**: Concentric circles representing "ideas worth spreading"
- **Animated Pulse**: Slow pulse animation on red spotlight for dynamic feel
- **Gradient Overlays**: Black to transparent gradients for depth

### 3. **"Revealing Soon" Speaker Cards**
- **Mystery Design**: Question mark (❓) icon placeholder
- **Dashed Border**: Red dashed border (#DC2626/50%)
- **"Coming Soon" Badge**: Animated red badge in top-right corner
- **Dark Theme**: Gray-800 to Gray-900 gradient background
- **Special Styling**: Distinct from regular speaker cards

## 📝 Changes Made

### **components/events/EventDetail.tsx**
Updated the entire TEDxKPRIT event page with conditional TED styling:

#### Hero Section
- Black background with red radial spotlight
- 8 concentric circles pattern (TED signature)
- Red spotlight with blur and pulse animation
- "IDEAS WORTH SPREADING" badge instead of "FEATURED EVENT"
- Red info badges (Date, Time, Location) with red borders

#### About Section
- Red heading color (#DC2626)
- Gray-300 text on black background
- Red "Register Now" button with red shadow

#### Theme Section
- Red headings for theme pillars
- Black card backgrounds with red borders
- Red accent colors

#### Venue Section
- Red map marker icon
- Red link colors
- Dark card with red borders

#### Event Agenda
- Red time stamps
- Black cards with red borders
- White text on dark background

#### Featured Speakers
**Regular Speakers:**
- Black cards with subtle red borders
- Red topic labels
- Red social media links
- White text on dark background

**"Revealing Soon" Speakers:**
- Mystery question mark icon (❓)
- Dashed red border
- "COMING SOON" animated badge
- Gray-800/900 gradient background
- Red name and topic text
- Italic subtitle

#### Ticket Section
- Dark background with red border
- Red progress bar
- Red "Get Your Tickets" heading
- Red ticket card borders
- Red "Book Now" button with red shadow
- Red checkmarks for perks

#### Partners & Sponsors
- Red headings
- Dark cards with red accents
- Red matriXO branding

### **app/globals.css**
Added new utility classes:

```css
/* TED-inspired radial gradient */
.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-stops));
}

/* TEDx Theme Styles */
.tedx-theme {
  @apply bg-black;
}
```

### **data/events.json**
Added "Revealing Soon" speaker:

```json
{
  "name": "Revealing Soon",
  "title": "Speaker Announcement Coming Soon",
  "designation": "TBA",
  "topic": "Talk 9",
  "bio": "We're excited to announce this incredible speaker soon. Stay tuned for an inspiring talk that will challenge your perspectives and ignite new ideas!",
  "image": "",
  "revealingSoon": true
}
```

## 🎯 TED Brand Elements

### Visual Identity
- ✅ Red and Black color palette (TED signature)
- ✅ Spotlight effect (stage lighting)
- ✅ Circular patterns (ideas spreading)
- ✅ Bold typography
- ✅ Minimalist design
- ✅ High contrast

### Interactive Elements
- ✅ Hover effects on cards
- ✅ Smooth transitions
- ✅ Pulse animations
- ✅ Shadow effects on buttons
- ✅ Scale transforms

### Accessibility
- ✅ High contrast text
- ✅ Clear hierarchy
- ✅ Readable fonts
- ✅ Proper spacing

## 🚀 Key Features

1. **Conditional Theming**
   - Only applies to TEDxKPRIT event (`event.id === 'tedxkprit-2025'`)
   - Other events retain original styling
   - Clean separation of concerns

2. **Responsive Design**
   - Mobile-friendly layouts
   - Adaptive card grids
   - Touch-friendly buttons

3. **Performance**
   - Efficient CSS with Tailwind
   - Optimized animations
   - Minimal re-renders

4. **User Experience**
   - Smooth scrolling
   - Clear CTAs
   - Intuitive navigation
   - Professional appearance

## 🎭 Special Effects

### Red Spotlight Background
```tsx
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              w-[800px] h-[800px] 
              bg-gradient-radial from-red-600/40 via-red-900/20 to-transparent 
              rounded-full blur-3xl animate-pulse-slow" />
```

### TED Circle Pattern
```tsx
{[...Array(8)].map((_, i) => (
  <div
    key={i}
    className="absolute rounded-full border-2 border-red-600"
    style={{
      width: `${(i + 1) * 150}px`,
      height: `${(i + 1) * 150}px`,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}
  />
))}
```

### "Revealing Soon" Badge
```tsx
<div className="absolute top-4 right-4 
              bg-red-600 text-white text-xs font-bold 
              px-3 py-1 rounded-full animate-pulse">
  COMING SOON
</div>
```

## 📱 Responsive Breakpoints
- **Mobile**: Full-width cards, stacked layout
- **Tablet**: 2-column speaker grid
- **Desktop**: Sidebar + main content layout

## 🎨 Color Reference

| Element | Light Theme | TED Theme |
|---------|-------------|-----------|
| Background | White | Black |
| Accent | Blue/Purple | Red-600 |
| Text | Gray-900 | White |
| Cards | Glass effect | Black/40 |
| Borders | Gray-200 | Red-600/20 |
| Buttons | Gradient | Red-600 |
| Links | Neon-blue | Red-500 |

## ✨ Animation Effects
- **Pulse**: Spotlight background (3s infinite)
- **Hover Scale**: Cards lift and scale (1.05x)
- **Smooth Transitions**: 300ms cubic-bezier
- **Badge Pulse**: "Coming Soon" badge animation

## 🔧 Technical Implementation
- **Framework**: Next.js 14.2.33
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion + CSS
- **Conditional Rendering**: React conditional classes
- **Type Safety**: TypeScript interfaces

## 📊 Event Detection
```tsx
const isTEDxEvent = event.id === 'tedxkprit-2025'
```

All TED-specific styling is conditionally applied based on this flag, ensuring:
- Clean code separation
- No impact on other events
- Easy maintenance
- Scalable approach

## 🎬 Final Result
A professional, TED-branded event page featuring:
- Immersive black background with red spotlight
- Iconic TED circle pattern
- Mystery "Revealing Soon" speaker cards
- Consistent red/black color scheme
- Smooth animations and transitions
- Responsive, accessible design

---

**Status**: ✅ Complete
**Build**: Ready for production
**Testing**: Responsive design verified
**Theme**: TED-inspired red and black
