# Team Photos Setup Guide

## How to Add LinkedIn Profile Photos to Team Page

Since LinkedIn doesn't allow automated photo fetching, here's the manual process:

### Step 1: Download Photos from LinkedIn

1. **Shiva Ganesh Talikota**
   - Go to: https://linkedin.com/in/shivaganesht
   - Right-click on profile photo → Save Image As
   - Save as: `shiva.jpg`

2. **Kishan Sai Vutukuri**
   - Go to: https://www.linkedin.com/in/kishan-sai-vutukuri/
   - Right-click on profile photo → Save Image As
   - Save as: `kishan.jpg`

3. **Jatin Jangir**
   - Go to: https://www.linkedin.com/in/astro-jatin-jangir-0287a6228
   - Right-click on profile photo → Save Image As
   - Save as: `jatin.jpg`

### Step 2: Add Photos to Project

1. Create the team folder if it doesn't exist:
   ```powershell
   New-Item -Path ".\public\team" -ItemType Directory -Force
   ```

2. Move the downloaded photos:
   ```powershell
   Move-Item "C:\Users\shiva\Downloads\shiva.jpg" ".\public\team\shiva.jpg"
   Move-Item "C:\Users\shiva\Downloads\kishan.jpg" ".\public\team\kishan.jpg"
   Move-Item "C:\Users\shiva\Downloads\jatin.jpg" ".\public\team\jatin.jpg"
   ```

### Step 3: I'll Update the Code

Once you have the photos in `public/team/`, the website will automatically use them instead of the initials!

---

## Alternative: Quick Setup with Profile Image URLs

If you have direct image URLs from LinkedIn (after logging in), you can provide them and I'll update the code immediately.

Example:
```
Shiva: https://media.licdn.com/dms/image/...
Kishan: https://media.licdn.com/dms/image/...
Jatin: https://media.licdn.com/dms/image/...
```

**Note:** LinkedIn image URLs are temporary and require authentication, so downloading is recommended.

---

## Current Status

The team page is already configured to use:
- `/team/shiva.jpg`
- `/team/kishan.jpg`
- `/team/jatin.jpg`

Just add the photos to `public/team/` folder!
