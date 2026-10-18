/**
 * Initial 10 Cities and 500 Eligible Voter Records (50 Voters per City)
 * Fully populated with:
 * - Full name
 * - Father's name
 * - Mother's name
 * - Last 4 digits of Aadhaar
 * - Full Election ID
 * - City / Area
 */
import { EligibleVoter, Election } from '../types';

export interface CityConfig {
  id: string;
  name: string; // e.g. 'Mumbai'
  electionNumber: string; // e.g. 'ELEC-2026-MUM-01'
  constituencyId: string; // e.g. 'CONST-MUM-01'
  constituencyName: string; // e.g. 'Mumbai South'
  voterPrefix: string; // e.g. 'VOT-MUM'
  baseNumber: number; // e.g. 1000
  electionType: string;
  description: string;
}

export const INITIAL_10_CITIES: CityConfig[] = [
  {
    id: 'elec-mum-01',
    name: 'Mumbai',
    electionNumber: 'ELEC-2026-MUM-01',
    constituencyId: 'CONST-MUM-01',
    constituencyName: 'Mumbai South',
    voterPrefix: 'VOT-MUM',
    baseNumber: 1000,
    electionType: 'Municipal Corporation',
    description: 'Official Municipal Council election for Mumbai South metropolitan constituency.',
  },
  {
    id: 'elec-del-02',
    name: 'Delhi',
    electionNumber: 'ELEC-2026-DEL-02',
    constituencyId: 'CONST-DEL-02',
    constituencyName: 'New Delhi Central',
    voterPrefix: 'VOT-DEL',
    baseNumber: 2000,
    electionType: 'National Capital Council',
    description: 'Legislative representation election for New Delhi Central and civic administrative zone.',
  },
  {
    id: 'elec-blr-03',
    name: 'Bengaluru',
    electionNumber: 'ELEC-2026-BLR-03',
    constituencyId: 'CONST-BLR-03',
    constituencyName: 'Bengaluru South',
    voterPrefix: 'VOT-BLR',
    baseNumber: 3000,
    electionType: 'Civic Municipal Council',
    description: 'Municipal council election for Bengaluru South innovation & residential districts.',
  },
  {
    id: 'elec-pun-04',
    name: 'Pune',
    electionNumber: 'ELEC-2026-PUN-04',
    constituencyId: 'CONST-PUN-04',
    constituencyName: 'Pune Cantonment',
    voterPrefix: 'VOT-PUN',
    baseNumber: 4000,
    electionType: 'Metropolitan Municipal Ward',
    description: 'Metropolitan council election for Pune Cantonment educational and tech corridor.',
  },
  {
    id: 'elec-hyd-05',
    name: 'Hyderabad',
    electionNumber: 'ELEC-2026-HYD-05',
    constituencyId: 'CONST-HYD-05',
    constituencyName: 'Hyderabad Cyberabad',
    voterPrefix: 'VOT-HYD',
    baseNumber: 5000,
    electionType: 'Municipal Corporation',
    description: 'Civic representative election for Hyderabad Cyberabad tech city and adjoining municipal wards.',
  },
  {
    id: 'elec-kol-06',
    name: 'Kolkata',
    electionNumber: 'ELEC-2026-KOL-06',
    constituencyId: 'CONST-KOL-06',
    constituencyName: 'Kolkata Port & Heritage',
    voterPrefix: 'VOT-KOL',
    baseNumber: 6000,
    electionType: 'State Assembly',
    description: 'Legislative assembly representation election for Kolkata Port and historic cultural districts.',
  },
  {
    id: 'elec-chn-07',
    name: 'Chennai',
    electionNumber: 'ELEC-2026-CHN-07',
    constituencyId: 'CONST-CHN-07',
    constituencyName: 'Chennai Central',
    voterPrefix: 'VOT-CHN',
    baseNumber: 7000,
    electionType: 'Municipal Corporation',
    description: 'Civic municipal corporation council election for Greater Chennai Central and marina district.',
  },
  {
    id: 'elec-ahd-08',
    name: 'Ahmedabad',
    electionNumber: 'ELEC-2026-AHD-08',
    constituencyId: 'CONST-AHD-08',
    constituencyName: 'Ahmedabad West',
    voterPrefix: 'VOT-AHD',
    baseNumber: 8000,
    electionType: 'Municipal Corporation',
    description: 'Municipal election for Ahmedabad West commerce, riverfront, and heritage wards.',
  },
  {
    id: 'elec-jai-09',
    name: 'Jaipur',
    electionNumber: 'ELEC-2026-JAI-09',
    constituencyId: 'CONST-JAI-09',
    constituencyName: 'Jaipur Urban',
    voterPrefix: 'VOT-JAI',
    baseNumber: 9000,
    electionType: 'Municipal Council',
    description: 'Civic municipal corporation election for Jaipur Pink City & Heritage urban sectors.',
  },
  {
    id: 'elec-lko-10',
    name: 'Lucknow',
    electionNumber: 'ELEC-2026-LKO-10',
    constituencyId: 'CONST-LKO-10',
    constituencyName: 'Lucknow Cantt',
    voterPrefix: 'VOT-LKO',
    baseNumber: 10000,
    electionType: 'Municipal Corporation',
    description: 'Metropolitan council election for Lucknow Cantonment and historic Gomti riverfront ward.',
  },
];

// Rich demographic name bank for realistic 50 voter records per city
const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rahul', 'Priya', 'Aditya', 'Sneha', 'Rohan', 'Pooja', 'Vikram', 'Neha',
  'Amit', 'Divya', 'Siddharth', 'Tanvi', 'Manish', 'Kavita', 'Sanjay', 'Ritu', 'Karan', 'Meera',
  'Deepak', 'Shweta', 'Rajesh', 'Anjali', 'Arjun', 'Sunita', 'Gaurav', 'Nandini', 'Naveen', 'Swati',
  'Abhishek', 'Aarti', 'Sachin', 'Pallavi', 'Nikhil', 'Geeta', 'Harsh', 'Isha', 'Vivek', 'Komal',
  'Pranav', 'Simran', 'Akash', 'Shruti', 'Varun', 'Roshni', 'Kunal', 'Preeti', 'Yash', 'Bhavna'
];

const LAST_NAMES: Record<string, string[]> = {
  Mumbai: ['Sharma', 'Deshmukh', 'Patil', 'Kulkarni', 'Jadhav', 'Pawar', 'More', 'Shinde', 'Chavan', 'Bhosale', 'Kamble', 'Gaikwad'],
  Delhi: ['Verma', 'Gupta', 'Malhotra', 'Kapoor', 'Bhatia', 'Arora', 'Chopra', 'Khanna', 'Saxena', 'Chawla', 'Sethi', 'Aggarwal'],
  Bengaluru: ['Hegde', 'Rao', 'Gowda', 'Shetty', 'Kumar', 'Reddy', 'Murthy', 'Nayak', 'Kamath', 'Bhat', 'Prasad', 'Acharya'],
  Pune: ['Joshi', 'Patil', 'Deshpande', 'Gokhale', 'Shinde', 'Apte', 'Bapat', 'Kulkarni', 'Jog', 'Kelkar', 'Gadgil', 'Phadke'],
  Hyderabad: ['Reddy', 'Rao', 'Varma', 'Raju', 'Chowdary', 'Naidu', 'Prasad', 'Teja', 'Krishna', 'Begum', 'Sultana', 'Shastri'],
  Kolkata: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Ghosh', 'Bose', 'Dey', 'Sen', 'Dutta', 'Ganguly', 'Roy', 'Mitra', 'Chakraborty'],
  Chennai: ['Iyer', 'Iyengar', 'Subramanian', 'Raman', 'Narayanan', 'Krishnan', 'Sundaram', 'Venkatesh', 'Balaji', 'Srinivasan', 'Mani', 'Natarajan'],
  Ahmedabad: ['Patel', 'Shah', 'Mehta', 'Parikh', 'Desai', 'Modi', 'Vora', 'Panchal', 'Trivedi', 'Solanki', 'Dave', 'Barot'],
  Jaipur: ['Singh', 'Rathore', 'Shekhawat', 'Sharma', 'Chauhan', 'Meena', 'Mishra', 'Yadav', 'Mathur', 'Agarwal', 'Purohit', 'Gehlot'],
  Lucknow: ['Shukla', 'Pandey', 'Tiwari', 'Mishra', 'Dubey', 'Srivastava', 'Tripathi', 'Yadav', 'Singh', 'Awasthi', 'Chaturvedi', 'Dixit'],
};

const FATHER_FIRST_NAMES = [
  'Ramesh', 'Suresh', 'Dinesh', 'Mahesh', 'Rajendra', 'Vijay', 'Ashok', 'Anil', 'Sunil', 'Kailash',
  'Jagdish', 'Satish', 'Prakash', 'Mohan', 'Subhash', 'Narendra', 'Devendra', 'Gopal', 'Hari', 'Shyam'
];

const MOTHER_FIRST_NAMES = [
  'Sunita', 'Geeta', 'Sushma', 'Usha', 'Kamla', 'Shanti', 'Saroj', 'Kusum', 'Laxmi', 'Rekha',
  'Meena', 'Pushpa', 'Manju', 'Asha', 'Seema', 'Vimla', 'Indira', 'Radha', 'Sharda', 'Savita'
];

/**
 * Deterministically build 50 eligible voter records for each of the 10 cities
 * Grand total: 500 voter records
 */
export function generate500InitialVoters(): EligibleVoter[] {
  const voters: EligibleVoter[] = [];

  for (const city of INITIAL_10_CITIES) {
    const citySurnames = LAST_NAMES[city.name] || LAST_NAMES['Mumbai'];

    for (let i = 1; i <= 50; i++) {
      const numCode = city.baseNumber + i;
      const voterId = `${city.voterPrefix}-${numCode}`;
      const fName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
      const lName = citySurnames[(i - 1) % citySurnames.length];
      const fatherFName = FATHER_FIRST_NAMES[(i * 3) % FATHER_FIRST_NAMES.length];
      const motherFName = MOTHER_FIRST_NAMES[(i * 7) % MOTHER_FIRST_NAMES.length];

      const fullName = `${fName} ${lName}`;
      const fatherName = `${fatherFName} ${lName}`;
      const motherName = `${motherFName} ${lName}`;

      // Unique 4-digit Aadhaar last 4
      const aadhaarLast4 = String(1000 + ((city.baseNumber / 100 + i * 17) % 8999)).slice(-4).padStart(4, '0');
      const nationalIdMasked = `IND-****-${aadhaarLast4}`;

      // Pre-register first 3 voters in each city with default password 'pass123' for instant testing
      const isPreRegistered = i <= 3;
      const defaultPassword = isPreRegistered ? 'pass123' : undefined;

      voters.push({
        id: `voter-${city.name.toLowerCase().slice(0, 3)}-${String(i).padStart(3, '0')}`,
        electionId: city.id,
        voterId,
        name: fullName,
        fatherName,
        motherName,
        aadhaarLast4,
        constituencyId: city.constituencyId,
        constituencyName: city.constituencyName,
        hometown: city.name,
        nationalIdMasked,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}.${city.name.toLowerCase()}@e-voting.gov`,
        eligibilityStatus: 'ELIGIBLE',
        hasRegisteredAccount: isPreRegistered,
        password: defaultPassword,
        userRegisteredAt: isPreRegistered ? '2026-01-15T10:00:00Z' : undefined,
        hasVoted: false,
        createdAt: '2026-01-01T08:00:00Z',
      });
    }
  }

  // Ensure Sarah Connor is preserved at VOT-MUM-1001 for test compatibility
  const sarahIndex = voters.findIndex((v) => v.voterId === 'VOT-MUM-1001');
  if (sarahIndex !== -1) {
    voters[sarahIndex].name = 'Sarah Connor';
    voters[sarahIndex].fatherName = 'John Connor Sr.';
    voters[sarahIndex].motherName = 'Mary Connor';
    voters[sarahIndex].aadhaarLast4 = '8821';
    voters[sarahIndex].nationalIdMasked = 'IND-****-8821';
    voters[sarahIndex].hasRegisteredAccount = true;
    voters[sarahIndex].password = 'pass123';
  }

  return voters;
}
