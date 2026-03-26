// ============================================================
// Add AP & TS Tier 2-5 Colleges Script
// Adds comprehensive list of colleges from Andhra Pradesh and Telangana
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

// Comprehensive list of AP & TS colleges (Tier 2-5)
const apTsColleges = [
  // Andhra Pradesh - Visakhapatnam
  { id: "gitam-vis-001", name: "GITAM University", normalizedName: "gitam university visakhapatnam", city: "Visakhapatnam", state: "AP", district: "AP-VIS", country: "IN", address: "Rushikonda", postalCode: "530045", approved: true },
  { id: "au-vis-001", name: "Andhra University College of Engineering", normalizedName: "andhra university visakhapatnam", city: "Visakhapatnam", state: "AP", district: "AP-VIS", country: "IN", address: "Waltair", postalCode: "530003", approved: true },
  { id: "anits-vis-001", name: "Anil Neerukonda Institute of Technology and Sciences", normalizedName: "anits visakhapatnam", city: "Visakhapatnam", state: "AP", district: "AP-VIS", country: "IN", address: "Sangivalasa", postalCode: "531162", approved: true },
  { id: "gvpcoe-vis-001", name: "Gayatri Vidya Parishad College of Engineering", normalizedName: "gvp college visakhapatnam", city: "Visakhapatnam", state: "AP", district: "AP-VIS", country: "IN", address: "Madhurawada", postalCode: "530048", approved: true },
  { id: "vignan-vis-001", name: "Vignan's Institute of Information Technology", normalizedName: "vignan viit visakhapatnam", city: "Visakhapatnam", state: "AP", district: "AP-VIS", country: "IN", address: "Duvvada", postalCode: "530049", approved: true },

  // Andhra Pradesh - Vijayawada
  { id: "klu-vij-001", name: "KL University", normalizedName: "kl university vijayawada", city: "Vijayawada", state: "AP", district: "AP-VIJ", country: "IN", address: "Green Fields, Vaddeswaram", postalCode: "522502", approved: true },
  { id: "vrsec-vij-001", name: "Velagapudi Ramakrishna Siddhartha Engineering College", normalizedName: "vr siddhartha vijayawada", city: "Vijayawada", state: "AP", district: "AP-VIJ", country: "IN", address: "Kanuru", postalCode: "520007", approved: true },
  { id: "pvpsit-vij-001", name: "PVP Siddhartha Institute of Technology", normalizedName: "pvp siddhartha vijayawada", city: "Vijayawada", state: "AP", district: "AP-VIJ", country: "IN", address: "Kanuru", postalCode: "520007", approved: true },
  { id: "srkr-vij-001", name: "SRKR Engineering College", normalizedName: "srkr engineering college vijayawada", city: "Vijayawada", state: "AP", district: "AP-VIJ", country: "IN", address: "Bhimavaram", postalCode: "534204", approved: true },
  { id: "jntuk-vij-001", name: "JNTU Kakinada", normalizedName: "jntuk kakinada", city: "Kakinada", "state": "AP", district: "AP-KAK", country: "IN", address: "Kakinada", postalCode: "533003", approved: true },

  // Andhra Pradesh - Guntur
  { id: "vit-gun-001", name: "Vignan's Institute of Technology and Science", normalizedName: "vignan institute guntur", city: "Guntur", state: "AP", district: "AP-GUN", country: "IN", address: "Deshmukhi", postalCode: "508284", approved: true },
  { id: "rvrjc-gun-001", name: "RVR & JC College of Engineering", normalizedName: "rvr jc college guntur", city: "Guntur", state: "AP", district: "AP-GUN", country: "IN", address: "Chowdavaram", postalCode: "522019", approved: true },

  // Andhra Pradesh - Tirupati
  { id: "svuni-tir-001", name: "Sri Venkateswara University", normalizedName: "sv university tirupati", city: "Tirupati", state: "AP", district: "AP-TIR", country: "IN", address: "Alipiri Road", postalCode: "517502", approved: true },
  { id: "svce-tir-001", name: "Sri Venkateswara College of Engineering", normalizedName: "svce tirupati", city: "Tirupati", state: "AP", district: "AP-TIR", country: "IN", address: "RVS Nagar", postalCode: "517507", approved: true },

  // Andhra Pradesh - Rajahmundry
  { id: "ucek-raj-001", name: "University College of Engineering Kakinada", normalizedName: "ucek jntuk rajahmundry", city: "Rajahmundry", state: "AP", district: "AP-RAJ", country: "IN", address: "Kakinada", postalCode: "533003", approved: true },
  { id: "siet-raj-001", name: "Sasi Institute of Technology and Engineering", normalizedName: "siet rajahmundry", city: "Rajahmundry", state: "AP", district: "AP-RAJ", country: "IN", address: "Tadepalligudem", postalCode: "534101", approved: true },
  { id: "raghu-raj-001", name: "Raghu Engineering College", normalizedName: "raghu engineering rajahmundry", city: "Rajahmundry", state: "AP", district: "AP-RAJ", country: "IN", address: "Visakhapatnam", postalCode: "531162", approved: true },

  // Andhra Pradesh - Anantapur
  { id: "jntua-ana-001", name: "JNTUA College of Engineering Anantapur", normalizedName: "jntua anantapur", city: "Anantapur", state: "AP", district: "AP-ANA", country: "IN", address: "Ananthapuramu", postalCode: "515002", approved: true },

  // Andhra Pradesh - Chittoor
  { id: "gmrit-chi-001", name: "GMR Institute of Technology", normalizedName: "gmrit chittoor", city: "Srikakulam", state: "AP", district: "AP-SRI", country: "IN", address: "Rajam", postalCode: "532127", approved: true },
  { id: "mvgr-chi-001", name: "MVGR College of Engineering", normalizedName: "mvgr college chittoor", city: "Chittoor", state: "AP", district: "AP-CHI", country: "IN", address: "Vizianagaram", postalCode: "535005", approved: true },

  // Telangana - Hyderabad
  { id: "gri-hyd-001", name: "Gokaraju Rangaraju Institute of Engineering and Technology", normalizedName: "griet hyderabad", city: "Hyderabad", state: "TS", district: "TS-HYD", country: "IN", address: "Bachupally", postalCode: "500090", approved: true },
  { id: "vnrvjiet-hyd-001", name: "VNR Vignana Jyothi Institute of Engineering and Technology", normalizedName: "vnr vjiet hyderabad", city: "Hyderabad", state: "TS", district: "TS-HYD", country: "IN", address: "Bachupally", postalCode: "500090", approved: true },
  { id: "cmrcet-hyd-001", name: "CMR College of Engineering and Technology", normalizedName: "cmr college hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Kandlakoya", postalCode: "501401", approved: true },
  { id: "cmrit-hyd-001", name: "CMR Institute of Technology", normalizedName: "cmrit hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Medchal", postalCode: "501401", approved: true },
  { id: "iare-hyd-001", name: "Institute of Aeronautical Engineering", normalizedName: "iare hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Dundigal", postalCode: "500043", approved: true },
  { id: "mrec-hyd-001", name: "Malla Reddy Engineering College", normalizedName: "mrec hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Maisammaguda", postalCode: "500100", approved: true },
  { id: "mrcet-hyd-001", name: "Malla Reddy College of Engineering and Technology", normalizedName: "mrcet hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Maisammaguda", postalCode: "500100", approved: true },
  { id: "bvrit-hyd-001", name: "BV Raju Institute of Technology", normalizedName: "bvrit hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Narsapur", postalCode: "502313", approved: true },
  { id: "tkr-hyd-001", name: "TKR College of Engineering and Technology", normalizedName: "tkr college hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Meerpet", postalCode: "500097", approved: true },
  { id: "vardhaman-hyd-001", name: "Vardhaman College of Engineering", normalizedName: "vardhaman college hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Shamshabad", postalCode: "501218", approved: true },
  { id: "srec-hyd-001", name: "SR Engineering College", normalizedName: "sr engineering college hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Warangal Highway", postalCode: "500003", approved: true },
  { id: "aurora-hyd-001", name: "Aurora's Engineering College", normalizedName: "aurora engineering college hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Bhongir", postalCode: "508116", approved: true },
  { id: "acoe-hyd-001", name: "Aurora's Scientific Technological and Research Academy", normalizedName: "aurora scientific hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Ghatkesar", postalCode: "500088", approved: true },
  { id: "stmartin-hyd-001", name: "St. Martin's Engineering College", normalizedName: "st martin engineering hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Dhulapally", postalCode: "500100", approved: true },
  { id: "anurag-hyd-001", name: "Anurag Group of Institutions", normalizedName: "anurag hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Venkatapur", postalCode: "500088", approved: true },
  { id: "mec-hyd-001", name: "Methodist College of Engineering and Technology", normalizedName: "methodist college hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Abids", postalCode: "500001", approved: true },
  { id: "sreyas-hyd-001", name: "Sreyas Institute of Engineering and Technology", normalizedName: "sreyas hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Rangareddy", postalCode: "501510", approved: true },
  { id: "jbiet-hyd-001", name: "JB Institute of Engineering and Technology", normalizedName: "jbiet hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Moinabad", postalCode: "500075", approved: true },
  { id: "cmrit2-hyd-001", name: "CMR Technical Campus", normalizedName: "cmr technical campus hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Kandlakoya", postalCode: "501401", approved: true },
  { id: "ace-hyd-001", name: "ACE Engineering College", normalizedName: "ace engineering college hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Ghatkesar", postalCode: "501301", approved: true },
  { id: "guru-hyd-001", name: "Guru Nanak Institutions Technical Campus", normalizedName: "guru nanak hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Ibrahimpatnam", postalCode: "501506", approved: true },
  { id: "bril-hyd-001", name: "Brilliant Grammar School Educational Society's Group of Institutions", normalizedName: "brilliant grammar hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Abdullapurmet", postalCode: "501505", approved: true },
  { id: "nishitha-hyd-001", name: "Nishitha College of Engineering and Technology", normalizedName: "nishitha hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Turkayamjal", postalCode: "501510", approved: true },
  { id: "newton-hyd-001", name: "Newton's Institute of Engineering", normalizedName: "newton institute hyderabad", city: "Hyderabad", state: "TS", district: "TS-MED", country: "IN", address: "Macherla", postalCode: "500100", approved: true },
  { id: "mjcet-hyd-001", name: "Muffakham Jah College of Engineering and Technology", normalizedName: "mjcet hyderabad", city: "Hyderabad", state: "TS", district: "TS-HYD", country: "IN", address: "Banjara Hills", postalCode: "500034", approved: true },
  { id: "deccan-hyd-001", name: "Deccan College of Engineering and Technology", normalizedName: "deccan college hyderabad", city: "Hyderabad", state: "TS", district: "TS-HYD", country: "IN", address: "Darussalam", postalCode: "500001", approved: true },
  { id: "mgit2-hyd-001", name: "MGIT", normalizedName: "mgit hyderabad", city: "Hyderabad", state: "TS", district: "TS-RAN", country: "IN", address: "Gandipet", postalCode: "500075", approved: true },

  // Telangana - Warangal
  { id: "kitsw-war-001", name: "Kakatiya Institute of Technology and Science", normalizedName: "kits warangal", city: "Warangal", state: "TS", district: "TS-WAR", country: "IN", address: "Warangal", postalCode: "506015", approved: true },
  { id: "srit-war-001", name: "SR Institute of Technology", normalizedName: "srit warangal", city: "Warangal", state: "TS", district: "TS-WAR", country: "IN", address: "Ananthagiri", postalCode: "506371", approved: true },
  { id: "vit-war-001", name: "Vaagdevi Institute of Technology and Science", normalizedName: "vaagdevi warangal", city: "Warangal", state: "TS", district: "TS-WAR", country: "IN", address: "Proddatur", postalCode: "506005", approved: true },

  // Telangana - Karimnagar
  { id: "jntuhcej-kar-001", name: "JNTUH College of Engineering Jagitial", normalizedName: "jntuh jagitial", city: "Karimnagar", state: "TS", district: "TS-KAR", country: "IN", address: "Jagitial", postalCode: "505501", approved: true },
  { id: "sreenidhi-kar-001", name: "Sai Spurthi Institute of Technology", normalizedName: "sai spurthi karimnagar", city: "Karimnagar", state: "TS", district: "TS-KAR", country: "IN", address: "Sathupally", postalCode: "507303", approved: true },

  // Telangana - Nizamabad
  { id: "jntuhcen-niz-001", name: "JNTUH College of Engineering Nizamabad", normalizedName: "jntuh nizamabad", city: "Nizamabad", state: "TS", district: "TS-NIZ", country: "IN", address: "Nizamabad", postalCode: "503003", approved: true },
];

async function addApTsColleges() {
  console.log('🎓 Adding AP & TS Tier 2-5 Colleges...\n');

  try {
    let added = 0;
    let skipped = 0;

    for (const college of apTsColleges) {
      // Check if college already exists
      const existingDoc = await db.collection('colleges').doc(college.id).get();

      if (existingDoc.exists) {
        console.log(`⊘ Skipped: ${college.name} (already exists)`);
        skipped++;
        continue;
      }

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
        createdBy: 'admin-seed-script-ap-ts',
      };

      await db.collection('colleges').doc(college.id).set(collegeData);
      console.log(`✓ Added: ${college.name}`);
      added++;
    }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`✅ COLLEGES ADDED`);
    console.log(`═══════════════════════════════════════`);
    console.log(`Total Colleges: ${apTsColleges.length}`);
    console.log(`Added: ${added}`);
    console.log(`Skipped (already exist): ${skipped}`);
    console.log(`\n🎉 AP & TS colleges database updated!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add colleges:', error);
    process.exit(1);
  }
}

addApTsColleges();
