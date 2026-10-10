// Add Telangana colleges to Firestore
// Run: node /tmp/add-telangana-colleges.js

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('C:/Users/ASUS/AppData/Local/Temp/serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// First ensure the district "medchal-malkajgiri" exists
// Check existing district IDs from the Telangana state
const colleges = [
  {
    id: 'ace-eng-college',
    name: 'ACE Engineering College',
    normalizedName: 'ace engineering college',
    city: 'Ghatkesar',
    state: 'telangana',
    district: 'medchal-malkajgiri',
    country: 'india',
    address: 'Ankushapur, Ghatkesar, Medchal-Malkajgiri',
    postalCode: '501301',
    approved: true,
  },
  {
    id: 'vbit',
    name: 'Vignana Bharathi Institute of Technology (VBIT)',
    normalizedName: 'vignana bharathi institute of technology vbit',
    city: 'Ghatkesar',
    state: 'telangana',
    district: 'medchal-malkajgiri',
    country: 'india',
    address: 'Aushapur, Ghatkesar, Medchal-Malkajgiri',
    postalCode: '501301',
    approved: true,
  },
  {
    id: 'kprit',
    name: 'KP Reddy Institute of Technology (KPRIT)',
    normalizedName: 'kp reddy institute of technology kprit',
    city: 'Ghatkesar',
    state: 'telangana',
    district: 'medchal-malkajgiri',
    country: 'india',
    address: 'Konakanchi, Ghatkesar, Medchal-Malkajgiri',
    postalCode: '501301',
    approved: true,
  },
  {
    id: 'anurag-university',
    name: 'Anurag University',
    normalizedName: 'anurag university',
    city: 'Ghatkesar',
    state: 'telangana',
    district: 'medchal-malkajgiri',
    country: 'india',
    address: 'Venkatapur, Ghatkesar, Medchal-Malkajgiri',
    postalCode: '501301',
    approved: true,
  },
  {
    id: 'snist',
    name: 'Sreenidhi Institute of Science and Technology (SNIST)',
    normalizedName: 'sreenidhi institute of science and technology snist',
    city: 'Ghatkesar',
    state: 'telangana',
    district: 'medchal-malkajgiri',
    country: 'india',
    address: 'Yamnampet, Ghatkesar, Medchal-Malkajgiri',
    postalCode: '501301',
    approved: true,
  },
  {
    id: 'samskruthi-eng-college',
    name: 'Samskruthi College of Engineering and Technology',
    normalizedName: 'samskruthi college of engineering and technology',
    city: 'Ghatkesar',
    state: 'telangana',
    district: 'medchal-malkajgiri',
    country: 'india',
    address: 'Kondapur, Ghatkesar, Medchal-Malkajgiri',
    postalCode: '501301',
    approved: true,
  },
  {
    id: 'nnrg',
    name: 'Nalla Narasimha Reddy Education Society Group of Institutions (NNRG)',
    normalizedName: 'nalla narasimha reddy education society group of institutions nnrg',
    city: 'Ghatkesar',
    state: 'telangana',
    district: 'medchal-malkajgiri',
    country: 'india',
    address: 'Chowdariguda, Ghatkesar, Medchal-Malkajgiri',
    postalCode: '501301',
    approved: true,
  },
];

async function addColleges() {
  console.log('Starting: Adding Telangana colleges...\n');

  // First check if medchal-malkajgiri district exists, if not create it
  const districtRef = db.collection('districts').doc('medchal-malkajgiri');
  const districtSnap = await districtRef.get();
  
  if (!districtSnap.exists) {
    console.log('Creating Medchal-Malkajgiri district...');
    await districtRef.set({
      id: 'medchal-malkajgiri',
      name: 'Medchal-Malkajgiri',
      state: 'telangana',
      country: 'india',
      code: 'MDCL',
    });
    console.log('  ✓ District created\n');
  } else {
    console.log('  ✓ Medchal-Malkajgiri district already exists\n');
  }

  // Also verify the Telangana state exists
  const stateRef = db.collection('states').doc('telangana');
  const stateSnap = await stateRef.get();
  if (!stateSnap.exists) {
    console.log('Creating Telangana state...');
    await stateRef.set({
      id: 'telangana',
      name: 'Telangana',
      country: 'india',
      code: 'TS',
    });
    console.log('  ✓ Telangana state created\n');
  }

  // Verify India country exists
  const countryRef = db.collection('countries').doc('india');
  const countrySnap = await countryRef.get();
  if (!countrySnap.exists) {
    console.log('Creating India country...');
    await countryRef.set({
      id: 'india',
      name: 'India',
      code: 'IN',
    });
    console.log('  ✓ India country created\n');
  }

  // Add colleges
  for (const college of colleges) {
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
    console.log(`  ✓ ${college.name}`);
  }

  console.log(`\n✅ Added ${colleges.length} colleges in Medchal-Malkajgiri, Telangana`);
  process.exit(0);
}

addColleges().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
