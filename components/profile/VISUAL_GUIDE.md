# 📸 Profile UI System - Visual Component Guide

## 🎯 Component Hierarchy

```
ProfileCard (Complete Solution)
    │
    ├── CoverImage (Banner)
    │   ├── ImageCropper (Crop Modal)
    │   └── imageUtils.compressImage()
    │
    └── ProfileImage (Circular Photo)
        ├── ImageCropper (Crop Modal)
        └── imageUtils.compressImage()

ImageUploader (Standalone)
    ├── ImageCropper (Crop Modal)
    └── imageUtils.compressImage()
```

---

## 📐 Layout Structure

```
┌────────────────────────────────────────────────┐
│                                                │
│         COVER IMAGE (3:1 ratio)                │  ← CoverImage.tsx
│         Full width banner                      │    • Hover: Edit overlay
│                                                │    • Click: Upload & crop
└────────────────────────────────────────────────┘
         ╱╲                                         
        │  │  ← Profile Image                      ← ProfileImage.tsx
        │  │     (Circular, overlaps cover)          • Size: sm/md/lg/xl
        └──┘                                          • Hover: Edit icon
                                                      • Click: Upload & crop
    ┌──────────────┐
    │  Alex Johnson │                              ← User Info
    │  @alexj       │                                (Part of ProfileCard)
    └──────────────┘
    Bio text here...
    📍 Location  ✉️ Email
```

---

## 🎨 Component Props Quick Reference

### ProfileCard
```typescript
<ProfileCard
  user={{
    name: string;
    username: string;
    bio?: string;
    location?: string;
    email?: string;
    website?: string;
    profileImage?: string;
    coverImage?: string;
  }}
  isOwnProfile={boolean}         // Show edit buttons
  onProfileUpdate={(updates) => void}
/>
```

### CoverImage
```typescript
<CoverImage
  coverImageUrl={string}         // Current cover URL
  onImageChange={(file) => void} // Upload handler
  isEditable={boolean}           // Enable editing
  className={string}             // Additional styles
/>
```

### ProfileImage
```typescript
<ProfileImage
  profileImageUrl={string}
  onImageChange={(file) => void}
  isEditable={boolean}
  size="sm" | "md" | "lg" | "xl" // 80, 112, 128, 160 px
  userName={string}              // For alt text
  className={string}
/>
```

### ImageCropper
```typescript
<ImageCropper
  imageSrc={string}              // Data URL
  aspectRatio={number}           // 3 (cover), 1 (profile)
  cropShape="rect" | "round"
  title={string}
  onCropComplete={(blob) => void}
  onCancel={() => void}
/>
```

### ImageUploader
```typescript
<ImageUploader
  onUpload={(file) => Promise<string>}  // Returns URL
  aspectRatio={number}                  // Optional crop ratio
  maxSizeKB={number}                    // Default: 100
  cropShape="rect" | "round"
  label={string}
  existingImage={string}
  maxWidth={number}
  maxHeight={number}
/>
```

---

## 🔄 Upload Flow Diagram

```
User clicks edit button
    ↓
File input triggered
    ↓
User selects image (max 10MB)
    ↓
Validation (type, size)
    ↓
Convert to Data URL
    ↓
┌─────────────────────┐
│  ImageCropper       │
│  • Drag to move     │
│  • Zoom slider      │
│  • Live preview     │
└─────────────────────┘
    ↓
User clicks "Apply Crop"
    ↓
Create cropped blob
    ↓
┌─────────────────────┐
│  Compression        │
│  • Resize to max    │
│  • Convert to JPEG  │
│  • Reduce quality   │
│  • Until ≤100KB     │
└─────────────────────┘
    ↓
Convert blob to File
    ↓
Show preview (local)
    ↓
Upload to server/Firebase
    ↓
Get download URL
    ↓
Update state & UI
    ↓
✅ Complete!
```

---

## 🎯 Image Specifications

| Type | Aspect Ratio | Max Dimensions | Target Size | Format |
|------|-------------|----------------|-------------|--------|
| **Cover** | 3:1 | 1200 × 400 | ≤100KB | JPEG |
| **Profile** | 1:1 | 400 × 400 | ≤100KB | JPEG |
| **Custom** | Any | Configurable | ≤100KB | JPEG |

---

## 🔧 Compression Algorithm

```typescript
function compressImage(file, options) {
  1. Load image
  2. Calculate new dimensions (maintain aspect ratio)
     if (width > maxWidth || height > maxHeight) {
       scale down proportionally
     }
  3. Draw to canvas
  4. Start with quality = 0.7 (or configured)
  5. Convert to JPEG blob
  6. Check size:
     if (size > targetKB && quality > 0.1) {
       quality -= 0.05
       retry step 5
     } else {
       return blob
     }
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile (< 768px) */
- Cover: Full width, 3:1
- Profile: 80px (sm) or 112px (md)
- Stack elements vertically

/* Tablet (768px - 1024px) */
- Cover: Full width, 3:1
- Profile: 128px (lg)
- Side-by-side layout

/* Desktop (> 1024px) */
- Cover: Full width, max 1200px
- Profile: 160px (xl)
- Full featured layout
```

---

## 🎨 Color Scheme

### Light Mode
```css
Background: white / gray-50
Border: gray-200 / gray-300
Text: gray-900
Hover: blue-600
```

### Dark Mode
```css
Background: gray-900 / gray-950
Border: gray-800 / gray-700
Text: white / gray-100
Hover: blue-500
```

---

## 🔥 Firebase Storage Structure

```
firebase-storage-bucket/
│
├── profile-images/
│   └── {userId}/
│       ├── 1234567890_photo.jpg
│       └── 1234567891_photo.jpg
│
└── cover-images/
    └── {userId}/
        ├── 1234567890_banner.jpg
        └── 1234567891_banner.jpg
```

---

## 📊 State Management

### ProfileCard State
```typescript
const [userData, setUserData] = useState({
  name: string,
  username: string,
  profileImage: string,  // URL
  coverImage: string     // URL
});
```

### Upload Component State
```typescript
const [isUploading, setIsUploading] = useState(false);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [cropperImage, setCropperImage] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
```

### Cropper State
```typescript
const [zoom, setZoom] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
```

---

## ⚡ Performance Optimizations

1. **Client-side Compression**
   - Reduces server bandwidth
   - Faster uploads
   - Lower storage costs

2. **Lazy Loading**
   - Images load on demand
   - Next.js Image component
   - Automatic optimization

3. **Canvas Rendering**
   - Hardware accelerated
   - High-quality smoothing
   - Fast cropping

4. **Debounced Uploads**
   - Prevents multiple uploads
   - Loading states
   - Error recovery

---

## 🎯 Accessibility Features

- **Alt Text**: Descriptive image descriptions
- **ARIA Labels**: Button labels (e.g., "Edit profile picture")
- **Keyboard Navigation**: Tab through controls
- **Focus States**: Visible focus indicators
- **Screen Reader**: Announce upload status

---

## 🔐 Security Considerations

1. **File Validation**
   ```typescript
   - Check MIME type
   - Verify file size
   - Sanitize filenames
   ```

2. **Firebase Rules**
   ```
   - Authenticate users
   - Limit file sizes
   - Restrict to user's own folder
   ```

3. **Client-side Only**
   ```
   - No server-side storage of original
   - Immediate compression
   - HTTPS only
   ```

---

## 📝 Event Flow

### Upload Event
```typescript
1. onFileSelect (user picks file)
2. validateFile (check type/size)
3. fileToDataURL (convert for preview)
4. setCropperImage (show cropper)
5. onCropComplete (user applies crop)
6. compressImage (reduce size)
7. uploadToServer (Firebase/API)
8. onSuccess (update UI)
```

### Cropper Events
```typescript
1. onMouseDown / onTouchStart (start drag)
2. onMouseMove / onTouchMove (update position)
3. onMouseUp / onTouchEnd (end drag)
4. onZoomChange (slider input)
5. onApplyCrop (create cropped blob)
```

---

## 🎉 Component Features Matrix

| Feature | ProfileCard | CoverImage | ProfileImage | ImageCropper | ImageUploader |
|---------|-------------|------------|--------------|--------------|---------------|
| Upload | ✅ | ✅ | ✅ | ❌ | ✅ |
| Crop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Compress | ✅ | ✅ | ✅ | ❌ | ✅ |
| Preview | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit | ✅ | ✅ | ✅ | ❌ | ✅ |
| Responsive | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dark Mode | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loading | ✅ | ✅ | ✅ | ✅ | ✅ |
| Errors | ✅ | ✅ | ✅ | ✅ | ✅ |

---

**Visual Guide Complete! 🎨**
