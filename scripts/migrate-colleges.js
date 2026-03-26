// ============================================================
// College Migration Script
// Maps free-text college names to normalized college IDs
// Run once: node migrate-colleges.js
// ============================================================

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Fuzzy matching function
function fuzzyMatch(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0; // Perfect match

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Calculate Levenshtein similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function migrateColleges() {
  console.log('Starting college migration...');

  try {
    // Get all colleges
    const collegesSnap = await db.collection('colleges').get();
    const colleges = [];
    collegesSnap.forEach(doc => {
      colleges.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Loaded ${colleges.length} colleges from database`);

    // Get all users
    const usersSnap = await db.collection('UserProfiles').get();
    console.log(`Found ${usersSnap.size} users to migrate`);

    const uniqueCollegeNames = new Set();
    const collegeMapping = {};

    // First pass: collect unique college names
    usersSnap.forEach(doc => {
      const userData = doc.data();
      if (userData.college) {
        uniqueCollegeNames.add(userData.college);
      }
    });

    console.log(`\nFound ${uniqueCollegeNames.size} unique college names`);

    // Second pass: find best matches
    for (const collegeName of uniqueCollegeNames) {
      let bestMatch = null;
      let bestScore = 0;

      for (const college of colleges) {
        const score = fuzzyMatch(collegeName, college.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = college.id;
        }
      }

      if (bestScore >= 0.6) { // 60% threshold
        collegeMapping[collegeName] = {
          collegeId: bestMatch,
          collegeName: colleges.find(c => c.id === bestMatch)?.name,
          confidence: bestScore,
          status: 'auto',
        };
        console.log(
          `✓ "${collegeName}" → "${collegeMapping[collegeName].collegeName}" (${(bestScore * 100).toFixed(1)}%)`
        );
      } else {
        collegeMapping[collegeName] = {
          collegeId: null,
          collegeName: null,
          confidence: bestScore,
          status: 'manual',
        };
        console.log(`⚠ "${collegeName}" - Need manual review (${(bestScore * 100).toFixed(1)}%)`);
      }
    }

    // Third pass: update users
    console.log('\nUpdating user profiles...');
    let updated = 0;
    let failed = 0;
    let manual = 0;

    for (const [collegeName, mapping] of Object.entries(collegeMapping)) {
      if (mapping.status === 'manual') {
        manual++;
        console.log(`⚠ Skipped "${collegeName}" - requires manual assignment`);
        continue;
      }

      if (!mapping.collegeId) continue;

      const userQuery = await db
        .collection('UserProfiles')
        .where('college', '==', collegeName)
        .get();

      for (const userDoc of userQuery.docs) {
        try {
          const userData = userDoc.data();
          // Skip users who already have collegeId assigned
          if (userData.collegeId) {
            console.log(`⊘ User ${userDoc.id} already has collegeId, skipping`);
            continue;
          }

          await userDoc.ref.update({
            collegeId: mapping.collegeId,
            // Don't delete 'college' yet - keep for reference during transition
          });
          updated++;
        } catch (error) {
          console.error(`Failed to update user ${userDoc.id}:`, error);
          failed++;
        }
      }
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`Updated: ${updated} users`);
    console.log(`Failed: ${failed} users`);
    console.log(`Manual Review Needed: ${manual} college names`);
    console.log('\n✓ Migration complete!');
    console.log('Note: You can safely delete the "college" field from UserProfiles later');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateColleges();
