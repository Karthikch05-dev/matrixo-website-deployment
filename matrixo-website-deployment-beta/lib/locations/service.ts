// ============================================================
// Location & College Service
// Handles geographic hierarchy and college management
// ============================================================

import { db } from '@/lib/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Keep location data in memory for fast access
interface CachedLocations {
  countries: Country[];
  states: State[];
  districts: District[];
  colleges: College[];
}

let cachedLocations: CachedLocations | null = null;

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface State {
  id: string;
  name: string;
  country: string;
  code: string;
}

export interface District {
  id: string;
  name: string;
  state: string;
  country: string;
  code: string;
}

export interface College {
  id: string;
  name: string;
  normalizedName: string;
  city: string;
  state: string;
  district: string;
  country: string;
  address: string;
  postalCode: string;
  approved: boolean;
  studentCount?: number;
  createdAt?: any;
  createdBy?: string;
}

// Initialize location data from Firestore on demand
async function initializeLocations() {
  if (cachedLocations) return cachedLocations;

  try {
    // Load countries
    const countriesSnap = await getDocs(collection(db, 'countries'));
    const countries = countriesSnap.docs.map(d => d.data()) as Country[];

    // Load states
    const statesSnap = await getDocs(collection(db, 'states'));
    const states = statesSnap.docs.map(d => d.data()) as State[];

    // Load districts
    const districtsSnap = await getDocs(collection(db, 'districts'));
    const districts = districtsSnap.docs.map(d => d.data()) as District[];

    // Load colleges
    const collegesSnap = await getDocs(collection(db, 'colleges'));
    const colleges = collegesSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as College[];

    cachedLocations = { countries, states, districts, colleges };
    return cachedLocations;
  } catch (error) {
    console.error('Error initializing locations:', error);
    // Fallback to empty data
    return { countries: [], states: [], districts: [], colleges: [] };
  }
}

// Get all countries
export async function getCountries(): Promise<Country[]> {
  const locations = await initializeLocations();
  return locations.countries;
}

// Get states for a country
export async function getStatesByCountry(country: string): Promise<State[]> {
  const locations = await initializeLocations();
  return locations.states.filter(s => s.country === country);
}

// Get districts for a state
export async function getDistrictsByState(state: string): Promise<District[]> {
  const locations = await initializeLocations();
  return locations.districts.filter(d => d.state === state);
}

// Get colleges for a district
export async function getCollegesByDistrict(district: string): Promise<College[]> {
  const locations = await initializeLocations();
  return locations.colleges.filter(c => c.district === district).sort((a, b) => a.name.localeCompare(b.name));
}

// Search colleges by name and optional district
export async function searchColleges(
  query: string,
  district?: string
): Promise<College[]> {
  const locations = await initializeLocations();
  const normalized = query.toLowerCase().trim();

  let results = locations.colleges.filter(
    c => c.normalizedName.includes(normalized) || c.name.toLowerCase().includes(normalized)
  );

  if (district) {
    results = results.filter(c => c.district === district);
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

// Get college by ID
export async function getCollegeById(collegeId: string): Promise<College | null> {
  try {
    const docRef = doc(db, 'colleges', collegeId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: collegeId, ...docSnap.data() } as College : null;
  } catch (error) {
    console.error('Error fetching college:', error);
    return null;
  }
}

// Submit college request
export interface CollegeRequest {
  id?: string;
  collegeName: string;
  city: string;
  district: string;
  state: string;
  country: string;
  address?: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
  notes?: string;
}

export async function submitCollegeRequest(
  data: Omit<CollegeRequest, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  try {
    const collegeReqRef = collection(db, 'collegeRequests');
    const docRef = doc(collegeReqRef);

    const requestData: CollegeRequest = {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, requestData);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting college request:', error);
    throw error;
  }
}

// Get pending college requests (admin only)
export async function getPendingCollegeRequests(): Promise<(CollegeRequest & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'collegeRequests'),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as (CollegeRequest & { id: string })[];
  } catch (error) {
    console.error('Error fetching college requests:', error);
    return [];
  }
}

// Approve/Reject college request (admin only)
export async function reviewCollegeRequest(
  requestId: string,
  approved: boolean,
  adminId: string,
  adminNotes?: string
): Promise<void> {
  try {
    const reqRef = doc(db, 'collegeRequests', requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      throw new Error('Request not found');
    }

    if (approved) {
      const reqData = reqSnap.data() as CollegeRequest;

      // Create new college from request - use Firestore auto-generated ID
      const collegeDocRef = doc(collection(db, 'colleges'));
      const collegeId = collegeDocRef.id;

      const newCollege: College = {
        id: collegeId,
        name: reqData.collegeName,
        normalizedName: reqData.collegeName.toLowerCase(),
        city: reqData.city,
        district: reqData.district,
        state: reqData.state,
        country: reqData.country,
        address: reqData.address || '',
        postalCode: '',
        approved: true,
        studentCount: 0,
        createdAt: serverTimestamp(),
        createdBy: adminId,
      };

      // Save new college
      await setDoc(collegeDocRef, newCollege);

      // Update request status
      await setDoc(
        reqRef,
        {
          status: 'approved',
          reviewedAt: serverTimestamp(),
          reviewedBy: adminId,
          notes: adminNotes,
        },
        { merge: true }
      );

      // Invalidate cache
      cachedLocations = null;
    } else {
      // Just reject
      await setDoc(
        reqRef,
        {
          status: 'rejected',
          reviewedAt: serverTimestamp(),
          reviewedBy: adminId,
          notes: adminNotes,
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Error reviewing college request:', error);
    throw error;
  }
}
