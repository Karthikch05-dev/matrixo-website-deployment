export const DISTRICTS = {
  Telangana: [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hanamkonda",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar Bhupalpally",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Komaram Bheem Asifabad",
    "Mahabubabad",
    "Mahabubnagar",
    "Mancherial",
    "Medak",
    "Medchal-Malkajgiri",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Ranga Reddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal",
    "Yadadri Bhuvanagiri"
  ]
} as const;

export interface DistrictInfo {
  id: string;
  name: string;
  code: string;
  state: string;
  country: string;
}

export const TELANGANA_DISTRICT_MAP: Record<string, DistrictInfo> = {
  "Adilabad": { id: "TS-ADI", name: "Adilabad", code: "ADI", state: "TS", country: "IN" },
  "Bhadradri Kothagudem": { id: "TS-BHA", name: "Bhadradri Kothagudem", code: "BHA", state: "TS", country: "IN" },
  "Hanamkonda": { id: "TS-HAN", name: "Hanamkonda", code: "HAN", state: "TS", country: "IN" },
  "Hyderabad": { id: "TS-HYD", name: "Hyderabad", code: "HYD", state: "TS", country: "IN" },
  "Jagtial": { id: "TS-JAG", name: "Jagtial", code: "JAG", state: "TS", country: "IN" },
  "Jangaon": { id: "TS-JAN", name: "Jangaon", code: "JAN", state: "TS", country: "IN" },
  "Jayashankar Bhupalpally": { id: "TS-JAY", name: "Jayashankar Bhupalpally", code: "JAY", state: "TS", country: "IN" },
  "Jogulamba Gadwal": { id: "TS-JOG", name: "Jogulamba Gadwal", code: "JOG", state: "TS", country: "IN" },
  "Kamareddy": { id: "TS-KAM", name: "Kamareddy", code: "KAM", state: "TS", country: "IN" },
  "Karimnagar": { id: "TS-KAR", name: "Karimnagar", code: "KAR", state: "TS", country: "IN" },
  "Khammam": { id: "TS-KHA", name: "Khammam", code: "KHA", state: "TS", country: "IN" },
  "Komaram Bheem Asifabad": { id: "TS-KOM", name: "Komaram Bheem Asifabad", code: "KOM", state: "TS", country: "IN" },
  "Mahabubabad": { id: "TS-MAB", name: "Mahabubabad", code: "MAB", state: "TS", country: "IN" },
  "Mahabubnagar": { id: "TS-MAH", name: "Mahabubnagar", code: "MAH", state: "TS", country: "IN" },
  "Mancherial": { id: "TS-MAN", name: "Mancherial", code: "MAN", state: "TS", country: "IN" },
  "Medak": { id: "TS-MDK", name: "Medak", code: "MDK", state: "TS", country: "IN" },
  "Medchal-Malkajgiri": { id: "TS-MED", name: "Medchal-Malkajgiri", code: "MED", state: "TS", country: "IN" },
  "Medchal–Malkajgiri": { id: "TS-MED", name: "Medchal-Malkajgiri", code: "MED", state: "TS", country: "IN" },
  "Mulugu": { id: "TS-MUL", name: "Mulugu", code: "MUL", state: "TS", country: "IN" },
  "Nagarkurnool": { id: "TS-NAG", name: "Nagarkurnool", code: "NAG", state: "TS", country: "IN" },
  "Nalgonda": { id: "TS-NAL", name: "Nalgonda", code: "NAL", state: "TS", country: "IN" },
  "Narayanpet": { id: "TS-NAR", name: "Narayanpet", code: "NAR", state: "TS", country: "IN" },
  "Nirmal": { id: "TS-NIR", name: "Nirmal", code: "NIR", state: "TS", country: "IN" },
  "Nizamabad": { id: "TS-NIZ", name: "Nizamabad", code: "NIZ", state: "TS", country: "IN" },
  "Peddapalli": { id: "TS-PED", name: "Peddapalli", code: "PED", state: "TS", country: "IN" },
  "Rajanna Sircilla": { id: "TS-RAJ", name: "Rajanna Sircilla", code: "RAJ", state: "TS", country: "IN" },
  "Ranga Reddy": { id: "TS-RAN", name: "Ranga Reddy", code: "RAN", state: "TS", country: "IN" },
  "Rangareddy": { id: "TS-RAN", name: "Ranga Reddy", code: "RAN", state: "TS", country: "IN" },
  "Sangareddy": { id: "TS-SAN", name: "Sangareddy", code: "SAN", state: "TS", country: "IN" },
  "Siddipet": { id: "TS-SID", name: "Siddipet", code: "SID", state: "TS", country: "IN" },
  "Suryapet": { id: "TS-SUR", name: "Suryapet", code: "SUR", state: "TS", country: "IN" },
  "Vikarabad": { id: "TS-VIK", name: "Vikarabad", code: "VIK", state: "TS", country: "IN" },
  "Wanaparthy": { id: "TS-WAN", name: "Wanaparthy", code: "WAN", state: "TS", country: "IN" },
  "Warangal": { id: "TS-WAR", name: "Warangal", code: "WAR", state: "TS", country: "IN" },
  "Yadadri Bhuvanagiri": { id: "TS-YAD", name: "Yadadri Bhuvanagiri", code: "YAD", state: "TS", country: "IN" }
};

