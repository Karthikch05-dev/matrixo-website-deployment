// ============================================================
// Seed Locations Script
// Populates Firestore with countries, states, districts, colleges
// RUN ONCE: node seed-locations.js
// ============================================================

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Firebase credentials not found at: ${serviceAccountPath}`);
  console.error('Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load seed data
const seedData = require('../data/location-seed-data.json');

async function seedLocations() {
  console.log('🌍 Starting location data seeding...\n');

  try {
    // ---- COUNTRIES ----
    console.log('📍 Seeding countries...');
    for (const country of seedData.countries) {
      await db.collection('countries').doc(country.id).set(country);
    }
    console.log(`   ✓ Seeded ${seedData.countries.length} countries\n`);

    // ---- STATES ----
    console.log('📍 Seeding states...');
    for (const state of seedData.states) {
      await db.collection('states').doc(state.id).set(state);
    }
    console.log(`   ✓ Seeded ${seedData.states.length} states\n`);

    // ---- DISTRICTS ----
    console.log('📍 Seeding districts...');
    for (const district of seedData.majorDistricts) {
      await db.collection('districts').doc(district.id).set(district);
    }
    console.log(`   ✓ Seeded ${seedData.majorDistricts.length} districts\n`);

    // ---- COLLEGES ----
    console.log('📍 Seeding colleges...');
    for (const college of seedData.sampleColleges) {
      const collegeData = {
        name: college.name,
        normalizedName: college.normalizedName,
        city: college.city,
        state: college.state,
        district: college.district,
        country: college.country,
        address: college.address,
        postalCode: college.postalCode,
        approved: college.approved,
        studentCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'admin-seed-script',
      };

      await db.collection('colleges').doc(college.id).set(collegeData);
      console.log(`   ✓ ${college.name}`);
    }
    console.log(`\n   ✓ Seeded ${seedData.sampleColleges.length} colleges\n`);

    // ---- SUMMARY ----
    console.log('═══════════════════════════════════════');
    console.log('✅ SEEDING COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`Countries: ${seedData.countries.length}`);
    console.log(`States: ${seedData.states.length}`);
    console.log(`Districts: ${seedData.majorDistricts.length}`);
    console.log(`Colleges: ${seedData.sampleColleges.length}`);
    console.log('\n🎉 Location data ready for use!');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/migrate-colleges.js');
    console.log('2. Update Firestore rules (see IMPLEMENTATION_GUIDE.md)');
    console.log('3. Test registration flow');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedLocations();
