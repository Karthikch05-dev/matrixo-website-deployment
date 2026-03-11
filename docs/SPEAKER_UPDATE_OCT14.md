# Speaker Update - October 14, 2025

## ✅ Santhosh Sobhan Removed - "Revealing Soon" Placeholder Active

### Changes Made:

#### 1. **Speakers List** (Already Correct)
- **Talk 9** slot shows: "Revealing Soon"
- Placeholder text: "Speaker Announcement Coming Soon"
- Bio: "We're excited to announce this incredible speaker soon. Stay tuned for an inspiring talk that will challenge your perspectives and ignite new ideas!"
- Image: Empty (no image shown)
- `revealingSoon: true` flag set

#### 2. **Schedule/Agenda** (Updated)
- **Before:** `"Talk 9"` with description `"TBA"`
- **After:** `"Talk 9: Revealing Soon"` with description `"Speaker announcement coming soon"`

---

## Current Speaker Lineup (TEDxKPRIT 2025):

1. ✅ **Talk 1:** Rohit Tiwari - Sr. Director, Dewan India (10:00 AM)
2. ✅ **Talk 2:** Dr. A M Reddy - Founder, Dr. Care Homeopathy (10:20 AM)
3. ✅ **Talk 3:** Hema Thakur - Author (10:40 AM)
4. ✅ **Talk 4:** Dr. Sairam Atluri - Founder & CEO, Tulsi Therapeutics (11:10 AM)
5. ✅ **Talk 5:** Ramya Parashar - COO, MiQ's Bangalore Center of Excellence (11:30 AM)
6. ✅ **Talk 6:** Sreekanth Erepalli - Managing Director, Gluni Healthcare (11:50 AM)
7. ✅ **Talk 7:** Dr. Divya Raj - MD, Neo Institute of Medical Sciences (12:10 PM)
8. ✅ **Talk 8:** Sagar K Chandra - Director (1:40 PM)
9. 🔄 **Talk 9:** **Revealing Soon** - Speaker announcement coming soon (2:00 PM)
10. ✅ **Talk 10:** Dr. Ravi Dasari - President, Jasper Industries (2:20 PM)
11. ✅ **Talk 11:** Dr. Deepak Mashru - Asst. Professor, NFSU (2:40 PM)
12. ✅ **Talk 12:** Nithya Rajendran - Indian Classical Vocalist (3:00 PM)

---

## What Users Will See:

### On Speakers Section:
- A placeholder card showing:
  - **Name:** "Revealing Soon"
  - **Title:** "Speaker Announcement Coming Soon"
  - **Bio:** Teaser message about upcoming announcement
  - **No image** or a placeholder graphic
  - Styled differently to indicate it's a "coming soon" entry

### On Schedule/Agenda:
- **2:00 PM** - Talk 9: Revealing Soon
- **Description:** Speaker announcement coming soon

---

## When Ready to Add New Speaker:

Replace the "Revealing Soon" entry in `data/events.json` with:

```json
{
  "name": "New Speaker Name",
  "title": "Their Professional Title",
  "designation": "Their Role/Company",
  "topic": "Talk 9",
  "bio": "Full biography here...",
  "image": "https://tedxkprit.in/speakers-images/newspeaker.jpg",
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/...",
    "instagram": "https://instagram.com/...",
    "website": "https://..."
  }
}
```

And update the agenda entry:
```json
{ "time": "2:00 PM", "title": "Talk 9: Speaker Name", "speaker": "Speaker Name", "designation": "Role/Company" }
```

---

## ✅ Status: Complete

- ❌ Santhosh Sobhan: Removed (never was in system)
- ✅ Talk 9 Slot: Set to "Revealing Soon"
- ✅ Schedule: Updated to show "Revealing Soon"
- ✅ All other speakers: Intact and correct

The website now properly displays "Coming Soon" for Talk 9 in both the speakers section and the event schedule.
