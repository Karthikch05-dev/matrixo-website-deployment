// College directory with normalized IDs and display names
export interface College {
  id: string;
  name: string;
}

export const COLLEGES: College[] = [
  { id: 'kp', name: 'KL University' },
  { id: 'vit', name: 'VIT Vellore' },
  { id: 'bits', name: 'BITS Pilani' },
  { id: 'iit-h', name: 'IIT Hyderabad' },
  { id: 'iit-m', name: 'IIT Madras' },
  { id: 'iit-b', name: 'IIT Bombay' },
  { id: 'iit-d', name: 'IIT Delhi' },
  { id: 'iit-k', name: 'IIT Kanpur' },
  { id: 'iit-kgp', name: 'IIT Kharagpur' },
  { id: 'iit-r', name: 'IIT Roorkee' },
  { id: 'iit-g', name: 'IIT Guwahati' },
  { id: 'nit-h', name: 'NIT Hyderabad' },
  { id: 'nit-r', name: 'NIT Rourkela' },
  { id: 'nit-w', name: 'NIT Warangal' },
  { id: 'nit-t', name: 'NIT Trichy' },
  { id: 'iiit-h', name: 'IIIT Hyderabad' },
  { id: 'iimc', name: 'Indian Institute of Mass Communication' },
  { id: 'delhi-u', name: 'Delhi University' },
  { id: 'jnu', name: 'Jawaharlal Nehru University' },
  { id: 'amity', name: 'Amity University' },
  { id: 'manipal', name: 'Manipal Academy of Higher Education' },
  { id: 'srm', name: 'SRM University' },
  { id: 'shiv-nadar', name: 'Shiv Nadar University' },
  { id: 'christ', name: 'Christ University' },
  { id: 'flame', name: 'FLAME University' },
  { id: 'ashoka', name: 'Ashoka University' },
  { id: 'iisc', name: 'Indian Institute of Science' },
  { id: 'upes', name: 'UPES Dehradun' },
  { id: 'other', name: 'Other' },
];

export function getCollegeName(collegeId: string): string {
  const college = COLLEGES.find(c => c.id === collegeId);
  return college?.name || collegeId;
}

export function getCollegeId(collegeName: string): string {
  const college = COLLEGES.find(c => c.name.toLowerCase() === collegeName.toLowerCase());
  return college?.id || collegeName.toLowerCase().replace(/\s+/g, '-');
}
