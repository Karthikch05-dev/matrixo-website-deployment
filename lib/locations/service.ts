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

import { DISTRICTS, TELANGANA_DISTRICT_MAP } from './constants';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/–/g, '-') // Replace en-dash with standard hyphen
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Fallback countries if Firestore is loading or offline
const FALLBACK_COUNTRIES: Country[] = [
  { id: 'IN', name: 'India', code: 'IN' },
  { id: 'US', name: 'United States', code: 'US' },
  { id: 'UK', name: 'United Kingdom', code: 'UK' },
  { id: 'AE', name: 'United Arab Emirates', code: 'AE' },
  { id: 'AU', name: 'Australia', code: 'AU' },
  { id: 'CA', name: 'Canada', code: 'CA' },
  { id: 'DE', name: 'Germany', code: 'DE' },
  { id: 'FR', name: 'France', code: 'FR' },
  { id: 'SG', name: 'Singapore', code: 'SG' },
];

// Fallback Indian states
const FALLBACK_STATES: State[] = [
  { id: 'AP', name: 'Andhra Pradesh', country: 'IN', code: 'AP' },
  { id: 'AR', name: 'Arunachal Pradesh', country: 'IN', code: 'AR' },
  { id: 'AS', name: 'Assam', country: 'IN', code: 'AS' },
  { id: 'BR', name: 'Bihar', country: 'IN', code: 'BR' },
  { id: 'CG', name: 'Chhattisgarh', country: 'IN', code: 'CG' },
  { id: 'CH', name: 'Chandigarh', country: 'IN', code: 'CH' },
  { id: 'DL', name: 'Delhi', country: 'IN', code: 'DL' },
  { id: 'GA', name: 'Goa', country: 'IN', code: 'GA' },
  { id: 'GJ', name: 'Gujarat', country: 'IN', code: 'GJ' },
  { id: 'HR', name: 'Haryana', country: 'IN', code: 'HR' },
  { id: 'HP', name: 'Himachal Pradesh', country: 'IN', code: 'HP' },
  { id: 'JH', name: 'Jharkhand', country: 'IN', code: 'JH' },
  { id: 'JK', name: 'Jammu and Kashmir', country: 'IN', code: 'JK' },
  { id: 'KA', name: 'Karnataka', country: 'IN', code: 'KA' },
  { id: 'KL', name: 'Kerala', country: 'IN', code: 'KL' },
  { id: 'MP', name: 'Madhya Pradesh', country: 'IN', code: 'MP' },
  { id: 'MH', name: 'Maharashtra', country: 'IN', code: 'MH' },
  { id: 'MN', name: 'Manipur', country: 'IN', code: 'MN' },
  { id: 'ML', name: 'Meghalaya', country: 'IN', code: 'ML' },
  { id: 'MZ', name: 'Mizoram', country: 'IN', code: 'MZ' },
  { id: 'NL', name: 'Nagaland', country: 'IN', code: 'NL' },
  { id: 'OD', name: 'Odisha', country: 'IN', code: 'OD' },
  { id: 'PB', name: 'Punjab', country: 'IN', code: 'PB' },
  { id: 'PY', name: 'Puducherry', country: 'IN', code: 'PY' },
  { id: 'RJ', name: 'Rajasthan', country: 'IN', code: 'RJ' },
  { id: 'SK', name: 'Sikkim', country: 'IN', code: 'SK' },
  { id: 'TN', name: 'Tamil Nadu', country: 'IN', code: 'TN' },
  { id: 'TS', name: 'Telangana', country: 'IN', code: 'TS' },
  { id: 'TR', name: 'Tripura', country: 'IN', code: 'TR' },
  { id: 'UP', name: 'Uttar Pradesh', country: 'IN', code: 'UP' },
  { id: 'UK', name: 'Uttarakhand', country: 'IN', code: 'UK' },
  { id: 'WB', name: 'West Bengal', country: 'IN', code: 'WB' },
];

// Build all 33 unique Telangana districts
const uniqueDistrictMap = new Map<string, District>();
for (const d of Object.values(TELANGANA_DISTRICT_MAP)) {
  if (!uniqueDistrictMap.has(d.id)) {
    uniqueDistrictMap.set(d.id, {
      id: d.id,
      name: d.name,
      state: 'TS',
      country: 'IN',
      code: d.code,
    });
  }
}
const ALL_TELANGANA_DISTRICTS: District[] = Array.from(uniqueDistrictMap.values()).sort((a, b) =>
  a.name.localeCompare(b.name)
);

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
    let countries: Country[] = [];
    let states: State[] = [];
    let districts: District[] = [];
    let colleges: College[] = [];

    if (db) {
      // Load countries
      const countriesSnap = await getDocs(collection(db, 'countries'));
      countries = countriesSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Country[];

      // Load states
      const statesSnap = await getDocs(collection(db, 'states'));
      states = statesSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as State[];

      // Load districts
      const districtsSnap = await getDocs(collection(db, 'districts'));
      districts = districtsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as District[];

      // Load colleges
      const collegesSnap = await getDocs(collection(db, 'colleges'));
      colleges = collegesSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as College[];
    }

    // Merge fallback data if Firestore returned empty
    if (countries.length === 0) {
      countries = FALLBACK_COUNTRIES;
    }
    if (states.length === 0) {
      states = FALLBACK_STATES;
    }

    cachedLocations = { countries, states, districts, colleges };
    return cachedLocations;
  } catch (error) {
    console.error('Error initializing locations from Firestore:', error);
    // Fallback to built-in datasets
    cachedLocations = {
      countries: FALLBACK_COUNTRIES,
      states: FALLBACK_STATES,
      districts: ALL_TELANGANA_DISTRICTS,
      colleges: [],
    };
    return cachedLocations;
  }
}

// Helper to resolve district identifier to canonical district ID
function resolveCanonicalDistrictId(input: string): string {
  const normalized = input.trim().toLowerCase();

  // Check against Telangana map
  for (const [key, info] of Object.entries(TELANGANA_DISTRICT_MAP)) {
    if (
      info.id.toLowerCase() === normalized ||
      key.toLowerCase() === normalized ||
      slugify(key) === normalized ||
      info.code.toLowerCase() === normalized
    ) {
      return info.id;
    }
  }

  // Handle known aliases
  if (normalized === 'ts-med' || normalized === 'medchal' || normalized === 'medchal-malkajgiri') return 'TS-MED';
  if (normalized === 'ts-hyd' || normalized === 'hyderabad' || normalized === 'tg-hy') return 'TS-HYD';
  if (normalized === 'ts-ran' || normalized === 'rangareddy' || normalized === 'ranga-reddy') return 'TS-RAN';
  if (normalized === 'ts-war' || normalized === 'warangal') return 'TS-WAR';
  if (normalized === 'ts-kar' || normalized === 'karimnagar') return 'TS-KAR';
  if (normalized === 'ts-niz' || normalized === 'nizamabad') return 'TS-NIZ';
  if (normalized === 'ts-adi' || normalized === 'adilabad') return 'TS-ADI';
  if (normalized === 'ts-kha' || normalized === 'khammam') return 'TS-KHA';
  if (normalized === 'ts-mah' || normalized === 'mahbubnagar' || normalized === 'mahabubnagar') return 'TS-MAH';
  if (normalized === 'ts-nal' || normalized === 'nalgonda') return 'TS-NAL';
  if (normalized === 'ts-san' || normalized === 'sangareddy') return 'TS-SAN';
  if (normalized === 'ts-sid' || normalized === 'siddipet') return 'TS-SID';

  return input.trim();
}

// Get all countries
export async function getCountries(): Promise<Country[]> {
  const locations = await initializeLocations();
  return locations.countries.sort((a, b) => a.name.localeCompare(b.name));
}

// Get states for a country
export async function getStatesByCountry(country: string): Promise<State[]> {
  const locations = await initializeLocations();
  const normalizedCountry = country.toLowerCase().trim();

  // Filter states by country (supports 'IN', 'india', 'India', etc.)
  const filtered = locations.states.filter(s => {
    const sCountry = (s.country || '').toLowerCase().trim();
    return (
      sCountry === normalizedCountry ||
      (normalizedCountry === 'india' && sCountry === 'in') ||
      (normalizedCountry === 'in' && sCountry === 'india')
    );
  });

  // State codes that have active districts in the database
  const districtStateCodes = new Set(locations.districts.map(d => (d.state || '').toUpperCase()));
  // TS is the primary code for Telangana districts
  districtStateCodes.add('TS');

  // Deduplicate states by name (e.g., TS vs TG, CG vs CT, OD vs OR, UK vs UT)
  const stateMap = new Map<string, State>();
  for (const s of filtered) {
    const key = s.name.toLowerCase().trim();
    const existing = stateMap.get(key);
    if (!existing) {
      stateMap.set(key, s);
    } else {
      // Prioritize the state ID that has districts in the database (e.g. 'TS' over 'TG')
      const currentId = (s.id || s.code || '').toUpperCase();
      const existingId = (existing.id || existing.code || '').toUpperCase();
      if (districtStateCodes.has(currentId) && !districtStateCodes.has(existingId)) {
        stateMap.set(key, s);
      }
    }
  }

  return Array.from(stateMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Get districts for a state
export async function getDistrictsByState(state: string): Promise<District[]> {
  if (!state) return [];
  const locations = await initializeLocations();
  const trimmed = state.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  // Handle Telangana (matches 'TS', 'TG', 'telangana', 'Telangana')
  if (upper === 'TS' || upper === 'TG' || lower === 'telangana') {
    // Return all 33 Telangana districts with their canonical TS- IDs
    return ALL_TELANGANA_DISTRICTS;
  }

  // For other states:
  // Match state by ID, code, or name
  const stateObj = locations.states.find(
    s =>
      s.id.toUpperCase() === upper ||
      (s.code && s.code.toUpperCase() === upper) ||
      s.name.toLowerCase() === lower
  );

  const targetStateCode = stateObj ? stateObj.id.toUpperCase() : upper;

  const filtered = locations.districts.filter(d => {
    const dState = (d.state || '').toUpperCase();
    return (
      dState === targetStateCode ||
      (stateObj && d.state && d.state.toLowerCase() === stateObj.name.toLowerCase())
    );
  });

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

// Get colleges for a district
export async function getCollegesByDistrict(district: string): Promise<College[]> {
  if (!district) return [];
  const locations = await initializeLocations();
  const canonicalDistrictId = resolveCanonicalDistrictId(district);
  const normalizedInput = district.trim().toLowerCase();
  const canonicalLower = canonicalDistrictId.toLowerCase();

  const matchingColleges = locations.colleges.filter(c => {
    const cDistrict = (c.district || '').trim().toLowerCase();
    const cCanonical = resolveCanonicalDistrictId(c.district || '').toLowerCase();

    return (
      cDistrict === canonicalLower ||
      cDistrict === normalizedInput ||
      cCanonical === canonicalLower
    );
  });

  return matchingColleges.sort((a, b) => a.name.localeCompare(b.name));
}

// Search colleges by name and optional district
export async function searchColleges(
  query: string,
  district?: string
): Promise<College[]> {
  const locations = await initializeLocations();
  const normalized = query.toLowerCase().trim();

  let results = locations.colleges.filter(
    c =>
      (c.normalizedName && c.normalizedName.includes(normalized)) ||
      (c.name && c.name.toLowerCase().includes(normalized))
  );

  if (district) {
    const canonicalDistrictId = resolveCanonicalDistrictId(district);
    const normalizedInput = district.trim().toLowerCase();
    const canonicalLower = canonicalDistrictId.toLowerCase();

    results = results.filter(c => {
      const cDistrict = (c.district || '').trim().toLowerCase();
      const cCanonical = resolveCanonicalDistrictId(c.district || '').toLowerCase();
      return (
        cDistrict === canonicalLower ||
        cDistrict === normalizedInput ||
        cCanonical === canonicalLower
      );
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

// Get college by ID
export async function getCollegeById(collegeId: string): Promise<College | null> {
  const locations = await initializeLocations();
  const cached = locations.colleges.find(c => c.id === collegeId);
  if (cached) return cached;

  try {
    const docRef = doc(db, 'colleges', collegeId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: collegeId, ...docSnap.data() } as College) : null;
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
