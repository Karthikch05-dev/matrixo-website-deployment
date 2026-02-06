/**
 * Script to update Co-Founder's email in Firestore
 * 
 * HOW TO USE:
 * -----------
 * 1. Open Firebase Console: https://console.firebase.google.com/
 * 2. Select your matriXO project
 * 3. Go to Firestore Database
 * 4. Find the 'Employees' collection
 * 5. Search for the document where:
 *    - name = "Kishan Sai Vutukuri" OR
 *    - designation = "Co-Founder" OR
 *    - employeeId contains "kishan"
 * 6. Click on that document
 * 7. Find the 'email' field
 * 8. Click the edit icon next to it
 * 9. Change the email to: kishan.matrixo@gmail.com
 * 10. Click Save
 * 
 * ALTERNATIVE METHOD - Using Firebase Admin SDK:
 * ----------------------------------------------
 * If you have Node.js and Firebase Admin SDK access:
 * 
 * 1. Make sure you have Firebase Admin credentials
 * 2. Run: node update-cofounder-email-admin.js
 * 
 * The team page will automatically show the updated email once changed in Firestore.
 */

// If you want to use this as a Node.js script with Firebase Admin SDK:
// Uncomment and configure the following:

/*
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateCofounderEmail() {
  try {
    // Query for Co-Founder
    const employeesRef = db.collection('Employees');
    const snapshot = await employeesRef
      .where('designation', '==', 'Co-Founder')
      .get();
    
    if (snapshot.empty) {
      console.log('Co-Founder not found. Trying by name...');
      
      // Try by name
      const nameSnapshot = await employeesRef
        .where('name', '==', 'Kishan Sai Vutukuri')
        .get();
      
      if (nameSnapshot.empty) {
        console.log('Employee not found. Please update manually via Firebase Console.');
        return;
      }
      
      nameSnapshot.forEach(async (doc) => {
        await doc.ref.update({
          email: 'kishan.matrixo@gmail.com'
        });
        console.log('✅ Successfully updated email for:', doc.data().name);
      });
    } else {
      snapshot.forEach(async (doc) => {
        await doc.ref.update({
          email: 'kishan.matrixo@gmail.com'
        });
        console.log('✅ Successfully updated email for:', doc.data().name);
      });
    }
  } catch (error) {
    console.error('Error updating email:', error);
  }
}

updateCofounderEmail();
*/

console.log('Please follow the manual instructions in this file to update the Co-Founder email.');
console.log('Or configure Firebase Admin SDK and uncomment the code section.');
