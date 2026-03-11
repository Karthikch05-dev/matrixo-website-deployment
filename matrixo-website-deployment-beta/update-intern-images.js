/**
 * Script to update profileImage for new interns in Firestore
 * 
 * New Interns:
 *   M-A008 - Sunkari Akshar
 *   M-A009 - Nithin Yelamati  
 *   M-A010 - Praneep Sri
 *   M-A011 - Manideep Botsa
 *
 * HOW TO USE:
 * -----------
 * Option 1: Firebase Console (Manual)
 * 1. Open: https://console.firebase.google.com/project/matrixo-in-auth/firestore
 * 2. Go to 'Employees' collection
 * 3. Find each employee document by employeeId (M-A008, M-A009, M-A010, M-A011)
 * 4. Set the 'profileImage' field to the corresponding path:
 *    - M-A008: /intern-images/M-A008.webp
 *    - M-A009: /intern-images/M-A009.webp
 *    - M-A010: /intern-images/M-A010.webp
 *    - M-A011: /intern-images/M-A011.webp
 *
 * Option 2: Run this script (requires firebase-admin)
 *   npm install firebase-admin (if not already installed)
 *   node update-intern-images.js
 */

// =============================================
// OPTION 2: Automated Firestore update
// =============================================
// Uncomment below if you have Firebase Admin SDK service account

/*
const admin = require('firebase-admin');

// Download service account key from:
// Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const newInterns = [
  { employeeId: 'M-A008', name: 'Sunkari Akshar',   profileImage: '/intern-images/M-A008.webp' },
  { employeeId: 'M-A009', name: 'Nithin Yelamati',   profileImage: '/intern-images/M-A009.webp' },
  { employeeId: 'M-A010', name: 'Praneep Sri',       profileImage: '/intern-images/M-A010.webp' },
  { employeeId: 'M-A011', name: 'Manideep Botsa',    profileImage: '/intern-images/M-A011.webp' },
];

async function updateInternImages() {
  console.log('Updating intern profile images in Firestore...\n');
  
  for (const intern of newInterns) {
    try {
      const employeesRef = db.collection('Employees');
      const snapshot = await employeesRef
        .where('employeeId', '==', intern.employeeId)
        .get();
      
      if (snapshot.empty) {
        console.log(`❌ ${intern.employeeId} (${intern.name}) - Not found in Firestore`);
        console.log(`   Make sure employee ${intern.employeeId} exists in the Employees collection`);
        continue;
      }
      
      const docRef = snapshot.docs[0].ref;
      await docRef.update({
        profileImage: intern.profileImage,
        updatedAt: admin.firestore.Timestamp.now()
      });
      
      console.log(`✅ ${intern.employeeId} (${intern.name}) - Updated profileImage to ${intern.profileImage}`);
    } catch (error) {
      console.error(`❌ ${intern.employeeId} (${intern.name}) - Error:`, error.message);
    }
  }
  
  console.log('\nDone! The team page and employee portal will now show the updated photos.');
}

updateInternImages().then(() => process.exit(0));
*/

// =============================================
// QUICK REFERENCE: Firebase Console Instructions 
// =============================================
console.log('=== Update Intern Profile Images ===\n');
console.log('Open Firebase Console:');
console.log('  https://console.firebase.google.com/project/matrixo-in-auth/firestore/data/~2FEmployees\n');
console.log('For each intern, find their document and set profileImage:\n');

const interns = [
  { id: 'M-A008', name: 'Sunkari Akshar',  image: '/intern-images/M-A008.webp' },
  { id: 'M-A009', name: 'Nithin Yelamati',  image: '/intern-images/M-A009.webp' },
  { id: 'M-A010', name: 'Praneep Sri',      image: '/intern-images/M-A010.webp' },
  { id: 'M-A011', name: 'Manideep Botsa',   image: '/intern-images/M-A011.webp' },
];

interns.forEach(i => {
  console.log(`  ${i.id} (${i.name})`);
  console.log(`    profileImage: "${i.image}"\n`);
});

console.log('Make sure the image files exist at public/intern-images/ before deploying!');
