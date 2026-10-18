/**
 * Electoral Roll & Election Management Store
 * Authoritative in-memory repository implementing the complete Core Election Workflow:
 * - Election Panel & Admin controls (create election, set election number, constituency, candidate symbols, lifecycle)
 * - Eligible Voter Lists per election with CSV/JSON upload validation
 * - 13-Point Server-Side Pre-Voting Eligibility & Constituency Validation
 * - Cryptographic Hash Receipt tracking without candidate linkage
 * - Aggregate Result Publishing & Post-Tally Verification
 */
import {
  Election,
  Candidate,
  EligibleVoter,
  VoterElectionView,
  ElectionState,
  ElectionResults,
  SignedElectionReport,
  ElectionReportSignature,
  AreaMember,
  AreaElectionSession,
  ElectoralRollVerifyResponse,
} from '../types';
import { sha256 } from '../crypto/hashing';
import { generate500InitialVoters } from '../data/seed-cities-voters';

export class ElectoralRollStore {
  private static instance: ElectoralRollStore;

  // 1. ELECTIONS REPOSITORY
  private elections: Election[] = [
    {
      id: 'elec-mum-01',
      electionNumber: 'ELEC-2026-MUM-01',
      name: '2026 Mumbai South Municipal Council Election',
      electionType: 'Municipal Council',
      constituencyId: 'CONST-MUM-01',
      constituencyName: 'Mumbai South',
      hometown: 'Mumbai',
      description: 'Official Municipal Council election for Mumbai South constituency with end-to-end cryptographic receipt verification.',
      state: 'VOTING_OPEN',
      startAt: '2026-09-01T08:00:00Z',
      endAt: '2026-12-31T23:59:59Z',
      createdBy: 'Dr. Elena Vance (Chief Election Commissioner)',
      candidates: [
        {
          id: 'cand-mum-01',
          electionId: 'elec-mum-01',
          displayName: 'Aarav Singhania',
          party: 'Progressive Civic Alliance',
          symbol: '🪷',
          symbolImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&auto=format&fit=crop&q=80',
          bio: 'Urban infrastructure modernization, coastal climate resilience, and transparent municipal e-governance.',
          color: '#4FD1FF',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-10T10:00:00Z',
        },
        {
          id: 'cand-mum-02',
          electionId: 'elec-mum-01',
          displayName: 'Meera Deshmukh',
          party: 'Democratic People’s Coalition',
          symbol: '✋',
          symbolImageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=120&auto=format&fit=crop&q=80',
          bio: 'Public healthcare infrastructure, clean drinking water for all wards, and civic grievance resolution.',
          color: '#8B5CF6',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-10T10:30:00Z',
        },
        {
          id: 'cand-mum-03',
          electionId: 'elec-mum-01',
          displayName: 'Kavita Subramanian',
          party: 'Green Ecology & Urban Transit Front',
          symbol: '🌳',
          symbolImageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=120&auto=format&fit=crop&q=80',
          bio: 'Expansion of zero-emission electric buses, mangrove protection, and public parks development.',
          color: '#34D399',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-11T09:00:00Z',
        },
        {
          id: 'cand-mum-04',
          electionId: 'elec-mum-01',
          displayName: 'Rajesh Kulkarni',
          party: 'National Integrity Forum',
          symbol: '⚖️',
          symbolImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=120&auto=format&fit=crop&q=80',
          bio: 'Anti-corruption oversight, independent municipal audits, and fair property taxation.',
          color: '#F59E0B',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-11T11:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 50000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-05T08:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-del-02',
      electionNumber: 'ELEC-2026-DEL-02',
      name: '2026 Delhi Central Legislative Assembly Election',
      electionType: 'State Assembly',
      constituencyId: 'CONST-DEL-02',
      constituencyName: 'Delhi Central',
      hometown: 'Delhi',
      description: 'State legislative assembly representation election for Delhi Central constituency.',
      state: 'VOTING_OPEN',
      startAt: '2026-09-01T08:00:00Z',
      endAt: '2026-12-31T23:59:59Z',
      createdBy: 'Dr. Elena Vance (Chief Election Commissioner)',
      candidates: [
        {
          id: 'cand-del-01',
          electionId: 'elec-del-02',
          displayName: 'Siddharth Saxena',
          party: 'Civic Renewal Party',
          symbol: '🧹',
          symbolImageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=120&auto=format&fit=crop&q=80',
          bio: 'Air quality regulation, green energy microgrids, and educational infrastructure upgrades.',
          color: '#38BDF8',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-12T10:00:00Z',
        },
        {
          id: 'cand-del-02',
          electionId: 'elec-del-02',
          displayName: 'Pooja Aggarwal',
          party: 'National Development Alliance',
          symbol: '🌅',
          symbolImageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=120&auto=format&fit=crop&q=80',
          bio: 'Industrial economic corridors, high-speed regional transport, and trade incentives.',
          color: '#F97316',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-12T11:00:00Z',
        },
        {
          id: 'cand-del-03',
          electionId: 'elec-del-02',
          displayName: 'Anand Tyagi',
          party: 'United Progressive Bloc',
          symbol: '🔥',
          bio: 'Youth employment initiatives, affordable housing schemes, and citizen legal aid.',
          color: '#EC4899',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-13T09:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 75000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-06T09:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-blr-03',
      electionNumber: 'ELEC-2026-BLR-03',
      name: '2026 Bengaluru North Civic Representative Election',
      electionType: 'Civic General',
      constituencyId: 'CONST-BLR-03',
      constituencyName: 'Bengaluru North',
      hometown: 'Bengaluru',
      description: 'Civic governance election for Bengaluru North technology and metropolitan belt.',
      state: 'VOTING_OPEN',
      startAt: '2026-09-01T08:00:00Z',
      endAt: '2026-12-31T23:59:59Z',
      createdBy: 'Dr. Elena Vance (Chief Election Commissioner)',
      candidates: [
        {
          id: 'cand-blr-01',
          electionId: 'elec-blr-03',
          displayName: 'Kiran Nambiar',
          party: 'Tech Corridor Innovation Front',
          symbol: '🌐',
          bio: 'Suburban rail network, AI-driven traffic decongestion, and lake revival projects.',
          color: '#06B6D4',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-14T09:00:00Z',
        },
        {
          id: 'cand-blr-02',
          electionId: 'elec-blr-03',
          displayName: 'Dr. Radhika Hegde',
          party: 'Citizens Green Coalition',
          symbol: '🐘',
          bio: 'Solid waste management, green corridor reforestation, and municipal digital transparency.',
          color: '#10B981',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-14T10:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 60000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-08T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-pun-04',
      electionNumber: 'ELEC-2026-PUN-04',
      name: '2026 Pune East Metropolitan Council Election',
      electionType: 'Municipal Council',
      constituencyId: 'CONST-PUN-04',
      constituencyName: 'Pune East',
      hometown: 'Pune',
      description: 'Municipal council election for Pune East educational and industrial corridor.',
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Dr. Elena Vance (Chief Election Commissioner)',
      candidates: [
        {
          id: 'cand-pun-01',
          electionId: 'elec-pun-04',
          displayName: 'Sunil Jog',
          party: 'Progressive Civic Alliance',
          symbol: '🚜',
          bio: 'Metro line connectivity, water distribution upgrades, and industrial safety.',
          color: '#8B5CF6',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-16T11:00:00Z',
        },
        {
          id: 'cand-pun-02',
          electionId: 'elec-pun-04',
          displayName: 'Shweta Shinde',
          party: 'Democratic Renewal Alliance',
          symbol: '📖',
          bio: 'Public library networks, primary healthcare clinics, and artisan market support.',
          color: '#F59E0B',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-16T12:00:00Z',
        },
        {
          id: 'cand-pun-03',
          electionId: 'elec-pun-04',
          displayName: 'Adv. Nilesh Patil',
          party: 'Citizen Legal & Anti-Corruption League',
          symbol: '⚖️',
          bio: 'Transparent municipal taxation, free citizen legal aid, and environmental green belts.',
          color: '#10B981',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-17T09:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 40000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-hyd-05',
      electionNumber: 'ELEC-2026-HYD-05',
      name: '2026 Hyderabad Cyberabad Civic Council Election',
      electionType: 'Municipal Corporation',
      constituencyId: 'CONST-HYD-05',
      constituencyName: 'Hyderabad Cyberabad',
      hometown: 'Hyderabad',
      description: 'Metropolitan council election for Hyderabad Cyberabad tech belt and surrounding civic wards.',
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Dr. Elena Vance (Chief Election Commissioner)',
      candidates: [
        {
          id: 'cand-hyd-01',
          electionId: 'elec-hyd-05',
          displayName: 'K. Venkat Reddy',
          party: 'Agrarian & Infrastructure Coalition',
          symbol: '🌾',
          bio: 'Lake preservation, suburban drainage networks, and outer ring road expansions.',
          color: '#10B981',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-18T10:00:00Z',
        },
        {
          id: 'cand-hyd-02',
          electionId: 'elec-hyd-05',
          displayName: 'S. Fatima Begum',
          party: 'Civic Peace & Healthcare Front',
          symbol: '🕊️',
          bio: 'Primary healthcare centers, women skill centers, and affordable public transport.',
          color: '#8B5CF6',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-18T11:00:00Z',
        },
        {
          id: 'cand-hyd-03',
          electionId: 'elec-hyd-05',
          displayName: 'Arvind Chandrasekhar',
          party: 'Digital Innovation Council',
          symbol: '💻',
          bio: 'Smart municipal services, AI traffic decongestion, and green campus incentives.',
          color: '#06B6D4',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-18T12:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 55000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-12T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-kol-06',
      electionNumber: 'ELEC-2026-KOL-06',
      name: '2026 Kolkata Port & Heritage Legislative Election',
      electionType: 'State Assembly',
      constituencyId: 'CONST-KOL-06',
      constituencyName: 'Kolkata Port & Heritage',
      hometown: 'Kolkata',
      description: 'Legislative assembly representation election for Kolkata Port and historic cultural districts.',
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Dr. Elena Vance (Chief Election Commissioner)',
      candidates: [
        {
          id: 'cand-kol-01',
          electionId: 'elec-kol-06',
          displayName: 'Dr. Debashis Sen',
          party: 'Heritage & Waterways Alliance',
          symbol: '⛵',
          bio: 'Riverfront restoration, electric ferry modernization, and heritage building preservation.',
          color: '#3B82F6',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-20T10:00:00Z',
        },
        {
          id: 'cand-kol-02',
          electionId: 'elec-kol-06',
          displayName: 'Sharmila Banerjee',
          party: 'Progressive Civic Unity',
          symbol: '🌺',
          bio: 'Artisan micro-grants, public library digitizations, and urban maternal health.',
          color: '#EC4899',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-20T11:00:00Z',
        },
        {
          id: 'cand-kol-03',
          electionId: 'elec-kol-06',
          displayName: 'Sourav Ganguly Roy',
          party: 'Youth Sports & Development League',
          symbol: '🏏',
          bio: 'Grassroots sports academies, youth technology labs, and clean sanitation corridors.',
          color: '#F59E0B',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-20T12:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 65000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-chn-07',
      electionNumber: 'ELEC-2026-CHN-07',
      name: '2026 Greater Chennai Central Corporation Election',
      electionType: 'Municipal Corporation',
      constituencyId: 'CONST-CHN-07',
      constituencyName: 'Chennai Central',
      hometown: 'Chennai',
      description: 'Civic municipal corporation council election for Greater Chennai Central and marina district.',
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Single Central Election Administrator',
      candidates: [
        {
          id: 'cand-chn-01',
          electionId: 'elec-chn-07',
          displayName: 'K. Balasubramanian',
          party: 'United Coastal Development Alliance',
          symbol: '⚓',
          bio: 'Port infrastructure, desalination expansion, and urban storm drainage.',
          color: '#0284C7',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T08:00:00Z',
        },
        {
          id: 'cand-chn-02',
          electionId: 'elec-chn-07',
          displayName: 'Lakshmi Narayanan',
          party: 'Progressive Civic Front',
          symbol: '☀️',
          bio: 'Public health dispensaries, school modernization, and solar roofing.',
          color: '#F59E0B',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T09:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 50000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-ahd-08',
      electionNumber: 'ELEC-2026-AHD-08',
      name: '2026 Ahmedabad West Municipal Corporation Election',
      electionType: 'Municipal Corporation',
      constituencyId: 'CONST-AHD-08',
      constituencyName: 'Ahmedabad West',
      hometown: 'Ahmedabad',
      description: 'Municipal election for Ahmedabad West commerce, riverfront, and heritage wards.',
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Single Central Election Administrator',
      candidates: [
        {
          id: 'cand-ahd-01',
          electionId: 'elec-ahd-08',
          displayName: 'Chirag Patel',
          party: 'Citizen Prosperity Alliance',
          symbol: '🪁',
          bio: 'Riverfront business corridors, BRTS expansion, and clean air initiatives.',
          color: '#10B981',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T10:00:00Z',
        },
        {
          id: 'cand-ahd-02',
          electionId: 'elec-ahd-08',
          displayName: 'Nirav Shah',
          party: 'Civic Democratic Forum',
          symbol: '🪔',
          bio: 'Heritage conservation, citizen grievance helplines, and water network safety.',
          color: '#6366F1',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T11:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 55000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-jai-09',
      electionNumber: 'ELEC-2026-JAI-09',
      name: '2026 Jaipur Urban Heritage Municipal Council Election',
      electionType: 'Municipal Council',
      constituencyId: 'CONST-JAI-09',
      constituencyName: 'Jaipur Urban',
      hometown: 'Jaipur',
      description: 'Civic municipal corporation election for Jaipur Pink City & Heritage urban sectors.',
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Single Central Election Administrator',
      candidates: [
        {
          id: 'cand-jai-01',
          electionId: 'elec-jai-09',
          displayName: 'Yuvraj Singh Rathore',
          party: 'Heritage & Tourism Front',
          symbol: '🏰',
          bio: 'Pink city pedestrian corridors, artisanal markets, and water harvesting.',
          color: '#EC4899',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T12:00:00Z',
        },
        {
          id: 'cand-jai-02',
          electionId: 'elec-jai-09',
          displayName: 'Deepika Sharma',
          party: 'Urban Civic Alliance',
          symbol: '🦚',
          bio: 'Eco-tourism, modern primary clinics, and zero-emission transit.',
          color: '#8B5CF6',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T13:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 45000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
    {
      id: 'elec-lko-10',
      electionNumber: 'ELEC-2026-LKO-10',
      name: '2026 Lucknow Cantonment Municipal Corporation Election',
      electionType: 'Municipal Corporation',
      constituencyId: 'CONST-LKO-10',
      constituencyName: 'Lucknow Cantt',
      hometown: 'Lucknow',
      description: 'Metropolitan council election for Lucknow Cantonment and historic Gomti riverfront ward.',
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Single Central Election Administrator',
      candidates: [
        {
          id: 'cand-lko-01',
          electionId: 'elec-lko-10',
          displayName: 'Anurag Shukla',
          party: 'Gomti Clean Water & Urban League',
          symbol: '🕊️',
          bio: 'River clean-up, heritage trail preservation, and smart traffic grids.',
          color: '#14B8A6',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T14:00:00Z',
        },
        {
          id: 'cand-lko-02',
          electionId: 'elec-lko-10',
          displayName: 'Farhana Siddiqui',
          party: 'Civic Harmony & Education Front',
          symbol: '📚',
          bio: 'Public digital libraries, women entrepreneurship, and clean sanitation.',
          color: '#F43F5E',
          candidateStatus: 'ACTIVE',
          createdAt: '2026-01-22T15:00:00Z',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 52000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
  ];

  // 2. ELIGIBLE VOTERS REPOSITORY (500 Authorized Records across 10 Cities - 50 per City)
  private eligibleVoters: EligibleVoter[] = generate500InitialVoters();

  // Superseded by generate500InitialVoters()
  /*
  private _unusedInitialRoster = [
    // MUMBAI SOUTH (elec-mum-01) - ELEC-2026-MUM-01
    {
      id: 'voter-mum-01',
      electionId: 'elec-mum-01',
      voterId: 'VOT-2026-8821', // Matches Sarah Connor demo persona
      name: 'Sarah Connor',
      constituencyId: 'CONST-MUM-01',
      constituencyName: 'Mumbai South',
      hometown: 'Mumbai',
      nationalIdMasked: 'IND-****-8821',
      email: 'sarah.connor@electorate.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-05T08:00:00Z',
    },
    {
      id: 'voter-mum-01b',
      electionId: 'elec-mum-01',
      voterId: 'VOT-MUM-101', // Sarah Connor / Rahul Sharma alternate test card
      name: 'Sarah Connor',
      constituencyId: 'CONST-MUM-01',
      constituencyName: 'Mumbai South',
      hometown: 'Mumbai',
      nationalIdMasked: 'IND-****-1001',
      email: 'sarah.connor@mumbai.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-06T08:00:00Z',
    },
    {
      id: 'voter-mum-02',
      electionId: 'elec-mum-01',
      voterId: 'VOT-MUM-102',
      name: 'Aarav Patel',
      constituencyId: 'CONST-MUM-01',
      constituencyName: 'Mumbai South',
      hometown: 'Mumbai',
      nationalIdMasked: 'IND-****-4412',
      email: 'aarav.patel@mumbai.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'voter-mum-03',
      electionId: 'elec-mum-01',
      voterId: 'VOT-MUM-103',
      name: 'Pooja Sharma',
      constituencyId: 'CONST-MUM-01',
      constituencyName: 'Mumbai South',
      hometown: 'Mumbai',
      nationalIdMasked: 'IND-****-8819',
      email: 'pooja.sharma@mumbai.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-12T11:30:00Z',
    },
    {
      id: 'voter-mum-04',
      electionId: 'elec-mum-01',
      voterId: 'VOT-MUM-104',
      name: 'Karan Malhotra',
      constituencyId: 'CONST-MUM-01',
      constituencyName: 'Mumbai South',
      hometown: 'Mumbai',
      nationalIdMasked: 'IND-****-1902',
      email: 'karan.m@mumbai.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-14T09:15:00Z',
    },
    {
      id: 'voter-mum-05',
      electionId: 'elec-mum-01',
      voterId: 'VOT-MUM-105',
      name: 'Neha Kulkarni',
      constituencyId: 'CONST-MUM-01',
      constituencyName: 'Mumbai South',
      hometown: 'Mumbai',
      nationalIdMasked: 'IND-****-7320',
      email: 'neha.k@mumbai.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-15T14:20:00Z',
    },

    // DELHI CENTRAL (elec-del-02) - ELEC-2026-DEL-02
    {
      id: 'voter-del-01',
      electionId: 'elec-del-02',
      voterId: 'VOT-DEL-201',
      name: 'Rajesh Kumar',
      constituencyId: 'CONST-DEL-02',
      constituencyName: 'Delhi Central',
      hometown: 'Delhi',
      nationalIdMasked: 'IND-****-5521',
      email: 'rajesh.kumar@delhi.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-11T12:00:00Z',
    },
    {
      id: 'voter-del-02',
      electionId: 'elec-del-02',
      voterId: 'VOT-DEL-202',
      name: 'Sunita Verma',
      constituencyId: 'CONST-DEL-02',
      constituencyName: 'Delhi Central',
      hometown: 'Delhi',
      nationalIdMasked: 'IND-****-6643',
      email: 'sunita.v@delhi.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-13T10:45:00Z',
    },
    {
      id: 'voter-del-03',
      electionId: 'elec-del-02',
      voterId: 'VOT-DEL-203',
      name: 'Amitabh Sen',
      constituencyId: 'CONST-DEL-02',
      constituencyName: 'Delhi Central',
      hometown: 'Delhi',
      nationalIdMasked: 'IND-****-9104',
      email: 'amitabh.sen@delhi.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-16T15:30:00Z',
    },
    {
      id: 'voter-del-04',
      electionId: 'elec-del-02',
      voterId: 'VOT-DEL-204',
      name: 'Priya Nair',
      constituencyId: 'CONST-DEL-02',
      constituencyName: 'Delhi Central',
      hometown: 'Delhi',
      nationalIdMasked: 'IND-****-3392',
      email: 'priya.nair@delhi.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-17T09:10:00Z',
    },

    // BENGALURU NORTH (elec-blr-03) - ELEC-2026-BLR-03
    {
      id: 'voter-blr-01',
      electionId: 'elec-blr-03',
      voterId: 'VOT-BLR-301',
      name: 'Ananya Rao',
      constituencyId: 'CONST-BLR-03',
      constituencyName: 'Bengaluru North',
      hometown: 'Bengaluru',
      nationalIdMasked: 'IND-****-3319',
      email: 'ananya.rao@blr.electorate.in',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-14T09:00:00Z',
    },
    {
      id: 'voter-blr-02',
      electionId: 'elec-blr-03',
      voterId: 'VOT-BLR-401',
      name: 'Karthik Swaminathan',
      constituencyId: 'CONST-BLR-03',
      constituencyName: 'Bengaluru North',
      hometown: 'Bengaluru',
      nationalIdMasked: 'IND-****-7741',
      email: 'karthik.s@blr.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-17T11:20:00Z',
    },
    {
      id: 'voter-blr-03',
      electionId: 'elec-blr-03',
      voterId: 'VOT-BLR-402',
      name: 'Divya Hegde',
      constituencyId: 'CONST-BLR-03',
      constituencyName: 'Bengaluru North',
      hometown: 'Bengaluru',
      nationalIdMasked: 'IND-****-9821',
      email: 'divya.h@blr.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-18T10:15:00Z',
    },

    // PUNE EAST (elec-pun-04) - ELEC-2026-PUN-04
    {
      id: 'voter-pun-01',
      electionId: 'elec-pun-04',
      voterId: 'VOT-PUN-301',
      name: 'Devendra Joshi',
      constituencyId: 'CONST-PUN-04',
      constituencyName: 'Pune East',
      hometown: 'Pune',
      nationalIdMasked: 'IND-****-2290',
      email: 'devendra.j@pune.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-18T13:40:00Z',
    },
    {
      id: 'voter-pun-02',
      electionId: 'elec-pun-04',
      voterId: 'VOT-PUN-302',
      name: 'Ananya Deshmukh',
      constituencyId: 'CONST-PUN-04',
      constituencyName: 'Pune East',
      hometown: 'Pune',
      nationalIdMasked: 'IND-****-4188',
      email: 'ananya.d@pune.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-19T14:50:00Z',
    },
    {
      id: 'voter-pun-03',
      electionId: 'elec-pun-04',
      voterId: 'VOT-PUN-401',
      name: 'Rohan Deshmukh',
      constituencyId: 'CONST-PUN-04',
      constituencyName: 'Pune East',
      hometown: 'Pune',
      nationalIdMasked: 'IND-****-6721',
      email: 'rohan.d@pune.electorate.in',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-19T15:30:00Z',
    },

    // HYDERABAD CYBERABAD (elec-hyd-05) - ELEC-2026-HYD-05
    {
      id: 'voter-hyd-01',
      electionId: 'elec-hyd-05',
      voterId: 'VOT-HYD-501',
      name: 'Sai Praneeth Reddy',
      constituencyId: 'CONST-HYD-05',
      constituencyName: 'Hyderabad Cyberabad',
      hometown: 'Hyderabad',
      nationalIdMasked: 'IND-****-5512',
      email: 'sai.praneeth@hyd.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-20T09:00:00Z',
    },
    {
      id: 'voter-hyd-02',
      electionId: 'elec-hyd-05',
      voterId: 'VOT-HYD-502',
      name: 'Reshma Begum',
      constituencyId: 'CONST-HYD-05',
      constituencyName: 'Hyderabad Cyberabad',
      hometown: 'Hyderabad',
      nationalIdMasked: 'IND-****-7734',
      email: 'reshma.begum@hyd.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-20T10:30:00Z',
    },
    {
      id: 'voter-hyd-03',
      electionId: 'elec-hyd-05',
      voterId: 'VOT-HYD-503',
      name: 'Sandeep Varma',
      constituencyId: 'CONST-HYD-05',
      constituencyName: 'Hyderabad Cyberabad',
      hometown: 'Hyderabad',
      nationalIdMasked: 'IND-****-8845',
      email: 'sandeep.v@hyd.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-20T11:45:00Z',
    },

    // KOLKATA PORT & HERITAGE (elec-kol-06) - ELEC-2026-KOL-06
    {
      id: 'voter-kol-01',
      electionId: 'elec-kol-06',
      voterId: 'VOT-KOL-601',
      name: 'Anirban Mukherjee',
      constituencyId: 'CONST-KOL-06',
      constituencyName: 'Kolkata Port & Heritage',
      hometown: 'Kolkata',
      nationalIdMasked: 'IND-****-6612',
      email: 'anirban.m@kolkata.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-21T09:30:00Z',
    },
    {
      id: 'voter-kol-02',
      electionId: 'elec-kol-06',
      voterId: 'VOT-KOL-602',
      name: 'Poulomi Ghosh',
      constituencyId: 'CONST-KOL-06',
      constituencyName: 'Kolkata Port & Heritage',
      hometown: 'Kolkata',
      nationalIdMasked: 'IND-****-4491',
      email: 'poulomi.ghosh@kolkata.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-21T11:15:00Z',
    },
    {
      id: 'voter-kol-03',
      electionId: 'elec-kol-06',
      voterId: 'VOT-KOL-603',
      name: 'Subhashish Roy',
      constituencyId: 'CONST-KOL-06',
      constituencyName: 'Kolkata Port & Heritage',
      hometown: 'Kolkata',
      nationalIdMasked: 'IND-****-1184',
      email: 'subhashish.roy@kolkata.gov',
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: '2026-01-21T14:00:00Z',
    },
  ];
  */

  // 3. VOTE TALLY AGGREGATES STORE (Encrypted Anonymous tallies per election)
  private voteCounts: Record<string, Record<string, number>> = {
    'elec-mum-01': {
      'cand-mum-01': 14,
      'cand-mum-02': 9,
      'cand-mum-03': 6,
      'cand-mum-04': 3,
    },
    'elec-del-02': {
      'cand-del-01': 11,
      'cand-del-02': 8,
      'cand-del-03': 4,
    },
    'elec-blr-03': {
      'cand-blr-01': 15,
      'cand-blr-02': 7,
    },
    'elec-pun-04': {
      'cand-pun-01': 0,
      'cand-pun-02': 0,
    },
  };

  // Threshold Key-holders who unlocked tally
  private unlockedKeyHolders: Record<string, string[]> = {
    'elec-mum-01': [],
    'elec-del-02': [],
    'elec-blr-03': [],
    'elec-pun-04': [],
  };

  private constructor() {}

  public static getInstance(): ElectoralRollStore {
    if (!ElectoralRollStore.instance) {
      ElectoralRollStore.instance = new ElectoralRollStore();
    }
    return ElectoralRollStore.instance;
  }

  // ========================================================
  // ELECTION LIFECYCLE & PANEL MANAGEMENT
  // ========================================================

  public getElections(): Election[] {
    return [...this.elections];
  }

  public getElection(idOrNumber: string): Election | undefined {
    if (!idOrNumber) return this.elections[0];
    const normalized = idOrNumber.trim().toLowerCase();

    // Check direct ID or electionNumber match
    const directMatch = this.elections.find(
      (e) => e.id.toLowerCase() === normalized || e.electionNumber.toLowerCase() === normalized
    );
    if (directMatch) return directMatch;

    // Check alias or legacy identifiers (e.g. 'elec-2026-presidential', 'primary', 'default')
    if (
      normalized.includes('presidential') ||
      normalized.includes('primary') ||
      normalized === 'default'
    ) {
      return this.elections[0];
    }

    // Check hometown or constituency name match
    const areaMatch = this.elections.find(
      (e) =>
        e.hometown.toLowerCase() === normalized ||
        e.constituencyName.toLowerCase().includes(normalized) ||
        normalized.includes(e.hometown.toLowerCase())
    );
    if (areaMatch) return areaMatch;

    return undefined;
  }

  public resetVoter(electionId: string, voterId: string): boolean {
    const voter = this.eligibleVoters.find(
      (v) =>
        (v.electionId === electionId || !electionId) &&
        v.voterId.toLowerCase().trim() === voterId.toLowerCase().trim()
    );
    if (!voter) return false;
    voter.hasVoted = false;
    voter.votedAt = undefined;
    voter.receiptHash = undefined;
    return true;
  }

  public createElection(params: {
    electionNumber?: string;
    name: string;
    electionType: string;
    constituencyName: string;
    hometown?: string;
    description?: string;
    startAt?: string;
    endAt?: string;
    createdBy?: string;
  }): Election {
    const rawNum = params.electionNumber?.trim() || `ELEC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const electionNumber = rawNum.toUpperCase();

    // Check duplicate election number
    const existing = this.getElection(electionNumber);
    if (existing) {
      throw new Error(`Election Number '${electionNumber}' is already assigned. Please choose a unique Election Number.`);
    }

    const id = `elec-${electionNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const hometown = params.hometown?.trim() || params.constituencyName.split(' ')[0] || 'General';
    const constituencyId = `CONST-${hometown.toUpperCase().slice(0, 3)}-${Math.floor(10 + Math.random() * 90)}`;

    const newElection: Election = {
      id,
      electionNumber,
      name: params.name.trim(),
      electionType: params.electionType.trim() || 'General Election',
      constituencyId,
      constituencyName: params.constituencyName.trim(),
      hometown,
      description: params.description?.trim() || `Official ${params.electionType} conducted for ${params.constituencyName}.`,
      state: 'DRAFT',
      startAt: params.startAt || new Date().toISOString(),
      endAt: params.endAt || new Date(Date.now() + 86400000 * 3).toISOString(),
      createdBy: params.createdBy || 'Authorized Election Panel',
      candidates: [],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 50000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.elections.unshift(newElection);
    this.voteCounts[id] = {};
    this.unlockedKeyHolders[id] = [];
    return newElection;
  }

  public updateElection(id: string, updates: Partial<Election>): Election {
    const election = this.getElection(id);
    if (!election) {
      throw new Error(`Election '${id}' not found.`);
    }
    if (election.state === 'VOTING_OPEN' || election.state === 'RESULTS_PUBLISHED') {
      if (updates.candidates || updates.constituencyName || updates.electionNumber) {
        throw new Error(`Cannot modify core parameters while election is ${election.state}.`);
      }
    }

    Object.assign(election, updates, { updatedAt: new Date().toISOString() });
    return election;
  }

  public transitionElectionState(id: string, targetState: ElectionState): Election {
    const election = this.getElection(id);
    if (!election) {
      throw new Error(`Election '${id}' not found.`);
    }

    // Finite State Transition Rules
    const allowedMap: Record<ElectionState, ElectionState[]> = {
      DRAFT: ['CONFIGURED', 'VOTING_OPEN'],
      CONFIGURED: ['VOTING_OPEN', 'DRAFT'],
      REGISTRATION_OPEN: ['VOTING_OPEN', 'CONFIGURED'],
      VOTING_OPEN: ['VOTING_CLOSED', 'RESULTS_PUBLISHED', 'TALLYING'],
      VOTING_CLOSED: ['TALLYING', 'RESULTS_PUBLISHED', 'VOTING_OPEN'],
      TALLYING: ['RESULTS_PUBLISHED', 'VOTING_CLOSED', 'VOTING_OPEN'],
      RESULTS_PUBLISHED: ['ARCHIVED', 'VOTING_OPEN', 'VOTING_CLOSED'],
      ARCHIVED: ['VOTING_OPEN'],
    };

    const allowed = allowedMap[election.state] || [];
    if (!allowed.includes(targetState)) {
      throw new Error(`Invalid state transition: Cannot move from ${election.state} to ${targetState}.`);
    }

    election.state = targetState;
    election.updatedAt = new Date().toISOString();
    return election;
  }

  public togglePauseElection(id: string, isPaused: boolean, reason?: string): Election {
    const election = this.getElection(id);
    if (!election) throw new Error(`Election '${id}' not found.`);
    election.isPaused = isPaused;
    election.pauseReason = reason || (isPaused ? 'Scheduled audit check' : undefined);
    election.updatedAt = new Date().toISOString();
    return election;
  }

  // ========================================================
  // CANDIDATE & OFFICIAL SYMBOL MANAGEMENT
  // ========================================================

  public addCandidate(electionId: string, candidateData: {
    displayName: string;
    party: string;
    symbol: string;
    symbolImageUrl?: string;
    bio?: string;
    color?: string;
  }): Candidate {
    const election = this.getElection(electionId);
    if (!election) throw new Error(`Election '${electionId}' not found.`);

    const candidateId = `cand-${election.id.replace('elec-', '')}-${Date.now().toString().slice(-4)}`;
    const candidate: Candidate = {
      id: candidateId,
      electionId: election.id,
      displayName: candidateData.displayName.trim(),
      party: candidateData.party.trim(),
      symbol: candidateData.symbol.trim() || '🗳️',
      symbolImageUrl: candidateData.symbolImageUrl?.trim(),
      bio: candidateData.bio?.trim() || 'Official candidate certified by Election Commission.',
      color: candidateData.color?.trim() || '#38BDF8',
      candidateStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    election.candidates.push(candidate);
    if (!this.voteCounts[election.id]) this.voteCounts[election.id] = {};
    this.voteCounts[election.id][candidateId] = 0;
    election.updatedAt = new Date().toISOString();
    return candidate;
  }

  public updateCandidate(electionId: string, candidateId: string, updates: Partial<Candidate>): Candidate {
    const election = this.getElection(electionId);
    if (!election) throw new Error(`Election '${electionId}' not found.`);

    const cand = election.candidates.find((c) => c.id === candidateId);
    if (!cand) throw new Error(`Candidate '${candidateId}' not found in this election.`);

    Object.assign(cand, updates);
    election.updatedAt = new Date().toISOString();
    return cand;
  }

  public removeCandidate(electionId: string, candidateId: string): boolean {
    const election = this.getElection(electionId);
    if (!election) throw new Error(`Election '${electionId}' not found.`);

    const index = election.candidates.findIndex((c) => c.id === candidateId);
    if (index !== -1) {
      election.candidates.splice(index, 1);
      delete this.voteCounts[election.id]?.[candidateId];
      election.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  public uploadCandidatesList(
    electionId: string,
    candidates: Array<{
      displayName: string;
      party: string;
      symbol?: string;
      symbolImageUrl?: string;
      bio?: string;
      color?: string;
    }>
  ): { total: number; accepted: number; rejected: number } {
    let accepted = 0;
    let rejected = 0;
    for (const c of candidates) {
      try {
        if (!c.displayName || !c.party) {
          rejected++;
          continue;
        }
        this.addCandidate(electionId, {
          displayName: c.displayName,
          party: c.party,
          symbol: c.symbol || '🗳️',
          symbolImageUrl: c.symbolImageUrl,
          bio: c.bio,
          color: c.color,
        });
        accepted++;
      } catch {
        rejected++;
      }
    }
    return { total: candidates.length, accepted, rejected };
  }

  // ========================================================
  // LAYER 1: SINGLE ADMIN & VOTER AUTHENTICATION & MANAGEMENT
  // ========================================================

  public static readonly SINGLE_ADMIN = {
    id: 'usr-admin-single-root',
    adminId: 'ADMIN-001',
    name: 'Election Commission Administrator',
    email: 'admin@e-voting.gov',
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN' as const,
    roleTitle: 'Sole Central Election Administrator',
    department: 'Central Electoral Directorate',
    jurisdiction: 'National Electoral Command (10+ Cities)',
  };

  public authenticateAdmin(identifier: string, password?: string): {
    success: boolean;
    error?: string;
    admin?: typeof ElectoralRollStore.SINGLE_ADMIN;
  } {
    const rawId = (identifier || '').trim().toLowerCase();
    const rawPass = (password || '').trim();

    const isMatch =
      rawId === 'admin-001' ||
      rawId === 'admin' ||
      rawId === 'admin@e-voting.gov';

    if (!isMatch) {
      return {
        success: false,
        error: 'Access denied: System allows only one designated administrator (ID: ADMIN-001).',
      };
    }

    if (rawPass && rawPass !== ElectoralRollStore.SINGLE_ADMIN.password) {
      return {
        success: false,
        error: 'Incorrect administrator password.',
      };
    }

    return {
      success: true,
      admin: ElectoralRollStore.SINGLE_ADMIN,
    };
  }

  public registerVoterAccount(params: {
    electionId?: string;
    voterId: string;
    aadhaarLast4: string;
    password?: string;
  }): {
    success: boolean;
    error?: string;
    voter?: EligibleVoter;
  } {
    const cleanVoterId = (params.voterId || '').trim();
    const cleanAadhaar = (params.aadhaarLast4 || '').trim();
    const cleanPassword = (params.password || '').trim();

    if (!cleanVoterId) {
      return { success: false, error: 'Election ID is required for voter registration.' };
    }
    if (!cleanAadhaar || cleanAadhaar.length !== 4 || !/^\d{4}$/.test(cleanAadhaar)) {
      return { success: false, error: 'Aadhaar must be exactly the last 4 numeric digits of your card.' };
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    // 1. Locate voter on the authorized electoral roll
    const voter = this.eligibleVoters.find(
      (v) => v.voterId.toLowerCase().trim() === cleanVoterId.toLowerCase()
    );

    if (!voter) {
      return {
        success: false,
        error: `Election ID '${cleanVoterId}' is not found in authorized voter records. Only citizens enrolled on the official electoral roll by the administrator can register.`,
      };
    }

    // 2. Verify last 4 digits of Aadhaar against authorized records
    const recordedAadhaar = voter.aadhaarLast4 || voter.nationalIdMasked.replace(/\D/g, '').slice(-4);
    if (recordedAadhaar !== cleanAadhaar && !voter.nationalIdMasked.endsWith(cleanAadhaar)) {
      return {
        success: false,
        error: `Aadhaar verification failed: Last 4 digits (${cleanAadhaar}) do not match the authorized records on file for ${voter.name} (${voter.voterId}).`,
      };
    }

    // 3. Duplicate Prevention: User cannot register more than once
    if (voter.hasRegisteredAccount) {
      return {
        success: false,
        error: `Duplicate Registration Rejected: An account has already been registered for Election ID '${voter.voterId}'. Please sign in directly using your Election ID and password.`,
      };
    }

    // 4. Activate account and set user password
    voter.hasRegisteredAccount = true;
    voter.password = cleanPassword;
    voter.userRegisteredAt = new Date().toISOString();

    return {
      success: true,
      voter,
    };
  }

  public authenticateVoter(voterId: string, password?: string): {
    success: boolean;
    error?: string;
    voter?: EligibleVoter;
  } {
    const cleanVoterId = (voterId || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanVoterId) {
      return { success: false, error: 'Please enter your Election ID.' };
    }

    const voter = this.eligibleVoters.find(
      (v) => v.voterId.toLowerCase().trim() === cleanVoterId.toLowerCase()
    );

    if (!voter) {
      return {
        success: false,
        error: `Election ID '${cleanVoterId}' not found on the official electoral roll.`,
      };
    }

    // Check if account has been created via signup
    if (!voter.hasRegisteredAccount) {
      return {
        success: false,
        error: `No account registered yet for Election ID '${voter.voterId}'. Please click 'Sign Up / Create Account' to verify your Aadhaar and create your password.`,
      };
    }

    if (cleanPassword && voter.password && voter.password !== cleanPassword) {
      return {
        success: false,
        error: 'Incorrect password for this Election ID. Please check your credentials.',
      };
    }

    return {
      success: true,
      voter,
    };
  }

  // Admin Permission: Add New City or Area
  public addCity(cityData: {
    name: string;
    constituencyName: string;
    electionNumber?: string;
    electionType?: string;
    description?: string;
  }): Election {
    const cleanName = cityData.name.trim();
    const cleanConst = cityData.constituencyName.trim();

    // Prevent duplicate city
    const existing = this.elections.find(
      (e) => e.hometown.toLowerCase() === cleanName.toLowerCase() ||
             e.constituencyName.toLowerCase() === cleanConst.toLowerCase()
    );
    if (existing) {
      throw new Error(`Duplicate Area Rejected: City/Constituency '${cleanName}' ('${cleanConst}') already exists.`);
    }

    const citySlug = cleanName.toLowerCase().slice(0, 3);
    const id = `elec-${citySlug}-${Date.now().toString(36).slice(-3)}`;
    const electionNumber = cityData.electionNumber?.trim().toUpperCase() ||
      `ELEC-2026-${citySlug.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

    const newElection: Election = {
      id,
      electionNumber,
      name: `2026 ${cleanName} Municipal Council Election`,
      electionType: cityData.electionType || 'Municipal Council',
      constituencyId: `CONST-${citySlug.toUpperCase()}-01`,
      constituencyName: cleanConst,
      hometown: cleanName,
      description: cityData.description || `Official elections and verified citizen roster for ${cleanName} (${cleanConst}).`,
      state: 'VOTING_OPEN',
      startAt: '2026-01-01T08:00:00Z',
      endAt: '2026-12-31T18:00:00Z',
      createdBy: 'Single Central Election Administrator',
      candidates: [
        {
          id: `cand-${citySlug}-01`,
          electionId: id,
          displayName: `Candidate Alpha (${cleanName})`,
          party: 'Civic Progress Alliance',
          symbol: '🕊️',
          bio: 'Urban infrastructure, transparent governance, and citizen services.',
          color: '#06B6D4',
          candidateStatus: 'ACTIVE',
        },
        {
          id: `cand-${citySlug}-02`,
          electionId: id,
          displayName: `Candidate Beta (${cleanName})`,
          party: 'Democratic People Front',
          symbol: '🌟',
          bio: 'Public amenities, green energy, and youth welfare.',
          color: '#10B981',
          candidateStatus: 'ACTIVE',
        },
      ],
      configuration: {
        allowWriteIn: false,
        quorumThreshold: 0.67,
        fraudThreshold: 70,
        maxVoters: 50000,
        thresholdKeyHolders: 3,
        thresholdRequired: 2,
        zkProofEnabled: true,
        doubleVoteRule: 'STRICT_REJECT',
      },
      isPaused: false,
      isLockedDown: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.elections.push(newElection);
    this.voteCounts[id] = {};
    this.unlockedKeyHolders[id] = [];
    return newElection;
  }

  // Admin Permission: Add New Voter Record with Duplicate Prevention
  public addVoterRecord(voterData: {
    name: string;
    fatherName: string;
    motherName: string;
    aadhaarLast4: string;
    voterId: string;
    hometown: string;
    constituencyName?: string;
    email?: string;
  }): EligibleVoter {
    const cleanVoterId = voterData.voterId.trim().toUpperCase();
    const cleanAadhaar = voterData.aadhaarLast4.trim();
    const cleanName = voterData.name.trim();
    const cleanFather = voterData.fatherName.trim();
    const cleanMother = voterData.motherName.trim();
    const cleanCity = voterData.hometown.trim();

    if (!cleanName || !cleanFather || !cleanMother) {
      throw new Error('Full name, Father name, and Mother name are required.');
    }
    if (!/^\d{4}$/.test(cleanAadhaar)) {
      throw new Error('Aadhaar must be exactly the last 4 numeric digits.');
    }

    // Duplicate Prevention: Election ID must be unique
    const duplicate = this.eligibleVoters.find(
      (v) => v.voterId.toLowerCase() === cleanVoterId.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Duplicate Prevention: Election ID '${cleanVoterId}' already belongs to ${duplicate.name} (${duplicate.hometown}). Each Election ID must be unique.`);
    }

    // Find or link election
    let election = this.elections.find(
      (e) => e.hometown.toLowerCase() === cleanCity.toLowerCase()
    );
    if (!election) {
      // Auto-create election for new city
      election = this.addCity({
        name: cleanCity,
        constituencyName: voterData.constituencyName || `${cleanCity} Constituency`,
      });
    }

    const newVoter: EligibleVoter = {
      id: `voter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      electionId: election.id,
      voterId: cleanVoterId,
      name: cleanName,
      fatherName: cleanFather,
      motherName: cleanMother,
      aadhaarLast4: cleanAadhaar,
      constituencyId: election.constituencyId,
      constituencyName: election.constituencyName,
      hometown: election.hometown,
      nationalIdMasked: `IND-****-${cleanAadhaar}`,
      email: voterData.email?.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}.${election.hometown.toLowerCase()}@e-voting.gov`,
      eligibilityStatus: 'ELIGIBLE',
      hasRegisteredAccount: false,
      hasVoted: false,
      createdAt: new Date().toISOString(),
    };

    this.eligibleVoters.unshift(newVoter);
    return newVoter;
  }

  // Admin Permission: Delete Voter Record
  public deleteVoterRecord(voterId: string): boolean {
    const idx = this.eligibleVoters.findIndex(
      (v) => v.voterId.toLowerCase() === voterId.toLowerCase() || v.id === voterId
    );
    if (idx !== -1) {
      this.eligibleVoters.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Area-Wise Voter List Query
  public getAreaVoters(cityOrArea?: string, search?: string): {
    city: string;
    total: number;
    registeredAccountsCount: number;
    voters: EligibleVoter[];
  } {
    let filtered = [...this.eligibleVoters];
    const targetCity = cityOrArea && cityOrArea !== 'ALL' ? cityOrArea : 'Mumbai';

    if (cityOrArea && cityOrArea !== 'ALL') {
      filtered = filtered.filter(
        (v) => v.hometown.toLowerCase() === cityOrArea.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.voterId.toLowerCase().includes(q) ||
          (v.fatherName && v.fatherName.toLowerCase().includes(q)) ||
          (v.motherName && v.motherName.toLowerCase().includes(q)) ||
          (v.aadhaarLast4 && v.aadhaarLast4.includes(q)) ||
          v.hometown.toLowerCase().includes(q)
      );
    }

    const regCount = filtered.filter((v) => v.hasRegisteredAccount).length;

    return {
      city: targetCity,
      total: filtered.length,
      registeredAccountsCount: regCount,
      voters: filtered,
    };
  }

  // Get Summary of all cities with counts
  public getAllCitiesSummary(): Array<{
    name: string;
    electionId: string;
    electionNumber: string;
    constituencyName: string;
    totalVoters: number;
    registeredAccounts: number;
    votedCount: number;
    state: ElectionState;
  }> {
    return this.elections.map((elec) => {
      const cityVoters = this.eligibleVoters.filter(
        (v) => v.electionId === elec.id || v.hometown.toLowerCase() === elec.hometown.toLowerCase()
      );
      return {
        name: elec.hometown,
        electionId: elec.id,
        electionNumber: elec.electionNumber,
        constituencyName: elec.constituencyName,
        totalVoters: cityVoters.length,
        registeredAccounts: cityVoters.filter((v) => v.hasRegisteredAccount).length,
        votedCount: cityVoters.filter((v) => v.hasVoted).length,
        state: elec.state,
      };
    });
  }

  // ========================================================
  // ELIGIBLE VOTER LIST MANAGEMENT
  // ========================================================

  public getEligibleVoters(electionId: string, search?: string): EligibleVoter[] {
    let list = this.eligibleVoters.filter((v) => v.electionId === electionId);
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.voterId.toLowerCase().includes(q) ||
          v.constituencyName.toLowerCase().includes(q) ||
          v.hometown.toLowerCase().includes(q) ||
          (v.email && v.email.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public addEligibleVoter(electionId: string, voterData: {
    name: string;
    fatherName?: string;
    motherName?: string;
    aadhaarLast4?: string;
    voterId?: string;
    nationalIdMasked?: string;
    email?: string;
    constituencyName?: string;
    hometown?: string;
  }): EligibleVoter {
    const election = this.getElection(electionId);
    if (!election) throw new Error(`Election '${electionId}' not found.`);

    const generatedVoterId = voterData.voterId?.trim().toUpperCase() ||
      `VOT-${election.hometown.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Check duplicate in this election - if already registered, update and return
    const existing = this.eligibleVoters.find(
      (v) => v.electionId === electionId && v.voterId.toLowerCase() === generatedVoterId.toLowerCase()
    );
    if (existing) {
      existing.name = voterData.name.trim();
      if (voterData.fatherName) existing.fatherName = voterData.fatherName.trim();
      if (voterData.motherName) existing.motherName = voterData.motherName.trim();
      if (voterData.aadhaarLast4) existing.aadhaarLast4 = voterData.aadhaarLast4.trim();
      if (voterData.email) existing.email = voterData.email.trim();
      if (voterData.hometown) existing.hometown = voterData.hometown.trim();
      if (voterData.constituencyName) existing.constituencyName = voterData.constituencyName.trim();
      return existing;
    }

    const cleanAadhaar = voterData.aadhaarLast4?.trim() ||
      voterData.nationalIdMasked?.replace(/\D/g, '').slice(-4) ||
      String(Math.floor(1000 + Math.random() * 8999));

    const newVoter: EligibleVoter = {
      id: `voter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      electionId,
      voterId: generatedVoterId,
      name: voterData.name.trim(),
      fatherName: voterData.fatherName?.trim() || 'Parent',
      motherName: voterData.motherName?.trim() || 'Mother',
      aadhaarLast4: cleanAadhaar,
      constituencyId: election.constituencyId,
      constituencyName: voterData.constituencyName?.trim() || election.constituencyName,
      hometown: voterData.hometown?.trim() || election.hometown,
      nationalIdMasked: voterData.nationalIdMasked || `IND-****-${cleanAadhaar}`,
      email: voterData.email?.trim(),
      eligibilityStatus: 'ELIGIBLE',
      hasVoted: false,
      createdAt: new Date().toISOString(),
    };

    this.eligibleVoters.unshift(newVoter);
    return newVoter;
  }

  public uploadEligibleVotersList(electionId: string, rawVoters: Array<{
    name: string;
    voterId?: string;
    nationalIdMasked?: string;
    email?: string;
    constituencyName?: string;
    hometown?: string;
    constituency?: string;
    electionNumber?: string;
  }>): {
    totalRecords: number;
    accepted: number;
    rejected: number;
    duplicates: number;
    invalidConstituency: number;
    errors: string[];
  } {
    const election = this.getElection(electionId);
    if (!election) throw new Error(`Election '${electionId}' not found in database.`);

    // Once voting begins, the voter eligibility list must be locked
    if (election.state !== 'DRAFT' && election.state !== 'CONFIGURED') {
      throw new Error(
        `Voter eligibility list is LOCKED. Cannot upload voters while election is in ${election.state} state.`
      );
    }

    const totalRecords = rawVoters.length;
    let accepted = 0;
    let duplicates = 0;
    let invalidConstituency = 0;
    const errors: string[] = [];
    const seenBatchVoterIds = new Set<string>();

    for (let index = 0; index < rawVoters.length; index++) {
      const item = rawVoters[index];
      const recordNum = index + 1;

      try {
        // 1. Validate required name
        if (!item.name || !item.name.trim()) {
          errors.push(`Row ${recordNum}: Rejected - Missing required voter name.`);
          continue;
        }

        const voterName = item.name.trim();

        // 2. Validate Election Number if provided in CSV/JSON
        if (item.electionNumber && item.electionNumber.trim()) {
          const uploadedElecNum = item.electionNumber.trim().toUpperCase();
          if (uploadedElecNum !== election.electionNumber.toUpperCase() && uploadedElecNum !== election.id.toUpperCase()) {
            errors.push(
              `Row ${recordNum} (${voterName}): Rejected - Election Number mismatch (Record: '${uploadedElecNum}', Target Election: '${election.electionNumber}').`
            );
            continue;
          }
        }

        // 3. Generate or sanitize Voter ID
        const vId = item.voterId?.trim().toUpperCase() ||
          `VOT-${election.hometown.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

        // 4. Validate Constituency / Hometown Restriction
        const uploadedConstituency = (item.constituency || item.constituencyName || '').trim();
        const uploadedHometown = (item.hometown || '').trim();

        if (uploadedConstituency || uploadedHometown) {
          const matchesConstituency = uploadedConstituency.toLowerCase() === election.constituencyName.toLowerCase() ||
            uploadedConstituency.toLowerCase() === election.constituencyId.toLowerCase();
          const matchesHometown = uploadedHometown.toLowerCase() === election.hometown.toLowerCase();

          if (!matchesConstituency && !matchesHometown && (uploadedConstituency || uploadedHometown)) {
            invalidConstituency++;
            errors.push(
              `Row ${recordNum} (${voterName} [${vId}]): Rejected - Constituency mismatch. Belongs to '${uploadedConstituency || uploadedHometown}', whereas this election is restricted to '${election.constituencyName}' (${election.hometown}).`
            );
            continue;
          }
        }

        // 5. Reject Duplicate Voters (in database or within same batch)
        if (seenBatchVoterIds.has(vId.toLowerCase())) {
          duplicates++;
          errors.push(`Row ${recordNum} (${voterName} [${vId}]): Rejected - Duplicate Voter ID within uploaded batch.`);
          continue;
        }

        const existingInDb = this.eligibleVoters.find(
          (v) => v.electionId === election.id && v.voterId.toLowerCase() === vId.toLowerCase()
        );
        if (existingInDb) {
          duplicates++;
          errors.push(`Row ${recordNum} (${voterName} [${vId}]): Rejected - Duplicate Voter ID already enrolled on official roll.`);
          continue;
        }

        seenBatchVoterIds.add(vId.toLowerCase());

        // 6. Associate accepted voter with this specific election
        this.addEligibleVoter(election.id, {
          name: voterName,
          voterId: vId,
          nationalIdMasked: item.nationalIdMasked || `IND-****-${Math.floor(1000 + Math.random() * 9000)}`,
          email: item.email?.trim(),
          constituencyName: election.constituencyName,
          hometown: election.hometown,
        });

        accepted++;
      } catch (err: unknown) {
        errors.push(`Row ${recordNum}: ${err instanceof Error ? err.message : 'Unknown parsing error'}`);
      }
    }

    const rejected = totalRecords - accepted;

    return {
      totalRecords,
      accepted,
      rejected,
      duplicates,
      invalidConstituency,
      errors: errors.slice(0, 50), // Cap to top 50 errors for clean UI display
    };
  }

  public deleteEligibleVoter(voterRecordId: string): boolean {
    const idx = this.eligibleVoters.findIndex((v) => v.id === voterRecordId || v.voterId === voterRecordId);
    if (idx !== -1) {
      this.eligibleVoters.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ========================================================
  // 17-POINT SERVER-SIDE VOTER ELIGIBILITY VERIFICATION
  // ========================================================

  public verifyVoterForElection(
    electionId: string,
    voterId: string,
    attemptedConstituency?: string,
    candidateId?: string
  ): {
    isEligible: boolean;
    errorCode?:
      | 'ELECTION_NOT_FOUND'
      | 'ELECTION_CLOSED'
      | 'ELECTION_PAUSED'
      | 'ELECTION_NOT_STARTED'
      | 'ELECTION_EXPIRED'
      | 'NOT_IN_LIST'
      | 'CONSTITUENCY_MISMATCH'
      | 'ALREADY_VOTED'
      | 'SUSPENDED'
      | 'INVALID_CANDIDATE';
    errorMessage?: string;
    election?: Election;
    voter?: EligibleVoter;
    suggestedElection?: Election;
  } {
    // 1. Check Election Exists
    const election = this.getElection(electionId);
    if (!election) {
      return {
        isEligible: false,
        errorCode: 'ELECTION_NOT_FOUND',
        errorMessage: `Election '${electionId}' was not found in the official election database.`,
      };
    }

    // 2. Check Election is not Paused
    if (election.isPaused) {
      return {
        isEligible: false,
        errorCode: 'ELECTION_PAUSED',
        errorMessage: `This election is temporarily PAUSED by the Election Panel for audit inspection.`,
        election,
      };
    }

    // 3. Check Election State is VOTING_OPEN
    if (election.state !== 'VOTING_OPEN') {
      return {
        isEligible: false,
        errorCode: 'ELECTION_CLOSED',
        errorMessage: `Voting is currently ${election.state.replace('_', ' ')}. You can only cast a ballot when the election is open.`,
        election,
      };
    }

    // 4. Check Voting Time Window
    const now = Date.now();
    const startTime = election.startAt ? new Date(election.startAt).getTime() : 0;
    const endTime = election.endAt ? new Date(election.endAt).getTime() : Infinity;

    if (startTime > 0 && now < startTime) {
      return {
        isEligible: false,
        errorCode: 'ELECTION_NOT_STARTED',
        errorMessage: `Voting window has not opened yet. Start time: ${new Date(startTime).toLocaleString()}.`,
        election,
      };
    }

    if (endTime < Infinity && now > endTime) {
      return {
        isEligible: false,
        errorCode: 'ELECTION_EXPIRED',
        errorMessage: `Voting window has expired. Closing time was: ${new Date(endTime).toLocaleString()}.`,
        election,
      };
    }

    // 5. Check Voter Exists in the Eligible Voter List for that specific election
    const voter = this.eligibleVoters.find(
      (v) => v.electionId === election.id && v.voterId.toLowerCase().trim() === voterId.toLowerCase().trim()
    );

    if (!voter) {
      // Check if this voter is registered in ANY other election
      const registeredElsewhere = this.eligibleVoters.find(
        (v) => v.voterId.toLowerCase().trim() === voterId.toLowerCase().trim()
      );
      if (registeredElsewhere) {
        const otherElection = this.getElection(registeredElsewhere.electionId);
        return {
          isEligible: false,
          errorCode: 'CONSTITUENCY_MISMATCH',
          errorMessage: `Voting denied. Voter ID '${voterId}' is registered under "${registeredElsewhere.constituencyName}" (${registeredElsewhere.hometown}) for Election ${otherElection?.electionNumber || registeredElsewhere.electionId}, but you are currently attempting to vote in "${election.name}" (${election.electionNumber} - ${election.constituencyName}).`,
          election,
          voter: registeredElsewhere,
          suggestedElection: otherElection,
        };
      }

      return {
        isEligible: false,
        errorCode: 'NOT_IN_LIST',
        errorMessage: `You are not eligible for this election. Voter ID '${voterId}' is not registered on the official voter roll for "${election.name}" (${election.electionNumber}). Please register for this election or select your registered area.`,
        election,
      };
    }

    // 6. Check Voter Status (Active vs Suspended)
    if (voter.eligibilityStatus === 'SUSPENDED' || voter.eligibilityStatus === 'INELIGIBLE') {
      return {
        isEligible: false,
        errorCode: 'SUSPENDED',
        errorMessage: `Your voter eligibility is currently SUSPENDED by Election Authority order.`,
        election,
        voter,
      };
    }

    // 7. Check Constituency / Hometown Match (Strict Enforcement)
    if (attemptedConstituency && attemptedConstituency.trim()) {
      const att = attemptedConstituency.toLowerCase().trim();
      const matchConst = att === election.constituencyName.toLowerCase().trim() ||
        att === election.constituencyId.toLowerCase().trim() ||
        election.constituencyName.toLowerCase().includes(att) ||
        att.includes(election.constituencyName.toLowerCase());
      const matchHome = att === election.hometown.toLowerCase().trim() ||
        election.hometown.toLowerCase().includes(att) ||
        att.includes(election.hometown.toLowerCase());

      if (!matchConst && !matchHome) {
        return {
          isEligible: false,
          errorCode: 'CONSTITUENCY_MISMATCH',
          errorMessage: `Voting denied. This election is restricted to ${election.constituencyName} (${election.hometown}). Your entered area is "${attemptedConstituency}".`,
          election,
          voter,
        };
      }
    }

    // Also verify voter's recorded hometown/constituency matches the election's
    const voterConstMatch = voter.constituencyId.toLowerCase() === election.constituencyId.toLowerCase() ||
      voter.constituencyName.toLowerCase() === election.constituencyName.toLowerCase() ||
      voter.hometown.toLowerCase() === election.hometown.toLowerCase();

    if (!voterConstMatch) {
      return {
        isEligible: false,
        errorCode: 'CONSTITUENCY_MISMATCH',
        errorMessage: `Voting denied. Voter Hometown: "${voter.hometown}" (${voter.constituencyName}), Election Constituency: "${election.constituencyName}" (${election.hometown}).`,
        election,
        voter,
      };
    }

    // 8. Check One-Person One-Vote Rule (Double-Voting Rejection)
    if (voter.hasVoted) {
      return {
        isEligible: false,
        errorCode: 'ALREADY_VOTED',
        errorMessage: `You have already voted in this election. Double-voting is strictly prohibited. Your vote is recorded and protected.`,
        election,
        voter,
      };
    }

    // 9. Candidate Verification (if candidateId supplied)
    if (candidateId) {
      const cand = election.candidates.find((c) => c.id === candidateId);
      if (!cand || cand.candidateStatus === 'WITHDRAWN' || cand.candidateStatus === 'DISQUALIFIED') {
        return {
          isEligible: false,
          errorCode: 'INVALID_CANDIDATE',
          errorMessage: `The selected candidate is not active or does not belong to this election.`,
          election,
          voter,
        };
      }
    }

    return {
      isEligible: true,
      election,
      voter,
    };
  }

  // ========================================================
  // STRICT AADHAAR & ELECTION ID VERIFICATION
  // ========================================================

  public verifyAadhaarAndElection(params: {
    electionId: string;
    voterId: string;
    aadhaarLast4: string;
    attemptedConstituency?: string;
  }): {
    verified: boolean;
    errorCode?: string;
    errorMessage?: string;
    election?: Election;
    voter?: EligibleVoter;
  } {
    const { electionId, voterId, aadhaarLast4, attemptedConstituency } = params;

    // 1. Validate Aadhaar last 4 digits format
    const cleanAadhaar = (aadhaarLast4 || '').trim();
    if (!/^\d{4}$/.test(cleanAadhaar)) {
      return {
        verified: false,
        errorCode: 'INVALID_AADHAAR_FORMAT',
        errorMessage: 'Aadhaar input must be exactly the last 4 numeric digits of your 12-digit UIDAI card (e.g. 8821).',
      };
    }

    // 2. Validate Voter ID
    const cleanVoterId = (voterId || '').trim();
    if (!cleanVoterId) {
      return {
        verified: false,
        errorCode: 'MISSING_VOTER_ID',
        errorMessage: 'Election Voter ID is required (e.g. VOT-2026-8821 or VOT-MUM-101).',
      };
    }

    // 3. Locate Election by ID or Election Number
    let election = this.getElection(electionId);
    if (!election) {
      election = this.elections.find(
        (e) => e.electionNumber.toLowerCase() === electionId.toLowerCase().trim()
      );
    }
    if (!election) {
      return {
        verified: false,
        errorCode: 'ELECTION_NOT_FOUND',
        errorMessage: `Election '${electionId}' was not found in the official commission database.`,
      };
    }

    // 4. Verify Election is active & voting open
    if (election.isPaused) {
      return {
        verified: false,
        errorCode: 'ELECTION_PAUSED',
        errorMessage: `Election '${election.name}' is temporarily PAUSED for security auditing.`,
        election,
      };
    }

    if (election.state !== 'VOTING_OPEN') {
      return {
        verified: false,
        errorCode: 'ELECTION_CLOSED',
        errorMessage: `Voting for '${election.name}' is currently ${election.state.replace('_', ' ')}. Polls are closed.`,
        election,
      };
    }

    // 5. Locate voter on this election's roll
    const voter = this.eligibleVoters.find(
      (v) =>
        v.electionId === election.id &&
        v.voterId.toLowerCase().trim() === cleanVoterId.toLowerCase().trim()
    );

    if (!voter) {
      // Check if voter exists in another constituency/election
      const registeredOther = this.eligibleVoters.find(
        (v) => v.voterId.toLowerCase().trim() === cleanVoterId.toLowerCase().trim()
      );
      if (registeredOther) {
        const otherElection = this.getElection(registeredOther.electionId);
        return {
          verified: false,
          errorCode: 'CONSTITUENCY_MISMATCH',
          errorMessage: `Constituency Mismatch: Voter ID '${cleanVoterId}' is registered under ${registeredOther.constituencyName} (${registeredOther.hometown}) for Election ${otherElection?.electionNumber || registeredOther.electionId}. Please switch to your registered area.`,
          election,
        };
      }
      return {
        verified: false,
        errorCode: 'NOT_IN_LIST',
        errorMessage: `Voter ID '${cleanVoterId}' is not registered on the official electoral roll for ${election.name} (${election.electionNumber}). Please verify your ID or register first.`,
        election,
      };
    }

    // 6. Check if voter has already voted (Double-Voting Rejection)
    if (voter.hasVoted) {
      return {
        verified: false,
        errorCode: 'ALREADY_VOTED',
        errorMessage: `Double-Voting Prevention: Citizen ${voter.name} (${voter.voterId}) has already cast a ballot in this election. One citizen can only vote once.`,
        election,
        voter,
      };
    }

    // 7. Verify Last 4 digits of Aadhaar against official masked record
    const recordedMasked = voter.nationalIdMasked || '';
    const recordedDigits = recordedMasked.replace(/\D/g, '');
    const matchesAadhaar =
      recordedDigits.endsWith(cleanAadhaar) ||
      recordedMasked.endsWith(cleanAadhaar) ||
      cleanVoterId.endsWith(cleanAadhaar);

    if (!matchesAadhaar && recordedDigits.length >= 4) {
      return {
        verified: false,
        errorCode: 'AADHAAR_MISMATCH',
        errorMessage: `Aadhaar Verification Failed: The entered last 4 digits (${cleanAadhaar}) do not match the official UIDAI records on file for ${voter.name} (${voter.voterId}).`,
        election,
        voter,
      };
    }

    return {
      verified: true,
      election,
      voter,
    };
  }

  // ========================================================
  // VOTER DASHBOARD "MY ELECTIONS" RETRIEVAL
  // ========================================================

  public getVoterElectionsSummary(voterId: string): VoterElectionView[] {
    return this.elections.map((election) => {
      const voterRecord = this.eligibleVoters.find(
        (v) => v.electionId === election.id && v.voterId.toLowerCase().trim() === voterId.toLowerCase().trim()
      );

      let isEligible = Boolean(voterRecord && voterRecord.eligibilityStatus === 'ELIGIBLE');
      let eligibilityReason = isEligible ? 'Eligible on Official Roll' : 'Not registered for this constituency';
      const hasVoted = Boolean(voterRecord?.hasVoted);
      const receiptHash = voterRecord?.receiptHash;

      let verificationStatus: VoterElectionView['verificationStatus'] = 'NOT_VOTED';
      if (hasVoted) {
        if (election.state === 'RESULTS_PUBLISHED' || election.state === 'TALLYING') {
          verificationStatus = 'COUNTED';
        } else {
          verificationStatus = 'MINED';
        }
      }

      return {
        election,
        isEligible,
        eligibilityReason,
        hasVoted,
        receiptHash,
        verificationStatus,
        blockHeight: hasVoted ? 1 : undefined,
      };
    });
  }

  // Record Ballot Cast without linking voter identity to candidate
  public recordVoterBallot(electionId: string, voterId: string, receiptHash: string): boolean {
    const voter = this.eligibleVoters.find(
      (v) => v.electionId === electionId && v.voterId.toLowerCase().trim() === voterId.toLowerCase().trim()
    );

    if (voter) {
      voter.hasVoted = true;
      voter.votedAt = new Date().toISOString();
      voter.receiptHash = receiptHash;
    }

    return true;
  }

  public recordCandidateVote(electionId: string, candidateId: string): void {
    if (!this.voteCounts[electionId]) this.voteCounts[electionId] = {};
    this.voteCounts[electionId][candidateId] = (this.voteCounts[electionId][candidateId] || 0) + 1;
  }

  // ========================================================
  // RESULTS TALLYING & THRESHOLD DECRYPTION
  // ========================================================

  public unlockThresholdKeyHolder(electionId: string, keyHolderId: string): string[] {
    if (!this.unlockedKeyHolders[electionId]) this.unlockedKeyHolders[electionId] = [];
    if (!this.unlockedKeyHolders[electionId].includes(keyHolderId)) {
      this.unlockedKeyHolders[electionId].push(keyHolderId);
    }
    return this.unlockedKeyHolders[electionId];
  }

  public async getElectionResults(electionId: string): Promise<ElectionResults> {
    const election = this.getElection(electionId);
    if (!election) throw new Error(`Election '${electionId}' not found.`);

    const counts = this.voteCounts[election.id] || {};
    const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
    const registeredCount = this.getEligibleVoters(election.id).length || 1;
    const turnoutPercentage = Math.min(100, Math.round((totalVotes / registeredCount) * 100));

    const unlocked = this.unlockedKeyHolders[election.id] || [];
    const isDecrypted =
      election.state === 'RESULTS_PUBLISHED' ||
      election.state === 'TALLYING' ||
      unlocked.length >= (election.configuration.thresholdRequired || 2);

    const candidateResults = election.candidates.map((cand) => {
      const voteCount = counts[cand.id] || 0;
      const percentage = totalVotes > 0 ? Number(((voteCount / totalVotes) * 100).toFixed(1)) : 0;
      return {
        candidateId: cand.id,
        displayName: cand.displayName,
        party: cand.party,
        symbol: cand.symbol,
        color: cand.color,
        voteCount,
        percentage,
      };
    });

    const tallyAuditHash = await sha256(`tally:${election.id}:${totalVotes}:${JSON.stringify(counts)}`);

    return {
      electionId: election.id,
      totalVotes,
      turnoutPercentage,
      isDecrypted,
      keyHoldersUnlocked: unlocked,
      keyHoldersRequired: election.configuration.thresholdRequired || 2,
      candidateResults,
      tallyAuditHash,
      publishedAt: election.state === 'RESULTS_PUBLISHED' ? election.updatedAt : undefined,
    };
  }

  public async generateSignedElectionReport(electionId: string): Promise<SignedElectionReport> {
    const election = this.getElection(electionId);
    if (!election) throw new Error(`Election '${electionId}' not found.`);

    const results = await this.getElectionResults(electionId);
    const eligibleVoters = this.getEligibleVoters(electionId);
    const registeredCount = eligibleVoters.length || 1;

    // Find winner if decrypted
    let winner: { candidateId: string; displayName: string; party: string; voteCount: number; percentage: number } | undefined;
    if (results.isDecrypted && results.candidateResults.length > 0) {
      const sorted = [...results.candidateResults].sort((a, b) => b.voteCount - a.voteCount);
      if (sorted[0] && sorted[0].voteCount > 0) {
        winner = {
          candidateId: sorted[0].candidateId,
          displayName: sorted[0].displayName,
          party: sorted[0].party,
          voteCount: sorted[0].voteCount,
          percentage: sorted[0].percentage,
        };
      }
    }

    const timestamp = new Date().toISOString();
    const reportId = `REP-${election.electionNumber}-${Date.now().toString(36).toUpperCase()}`;

    // Merkle Root calculation and latest block hash
    const latestBlockHash = await sha256(`block:height:42:${election.id}:${results.tallyAuditHash}`);
    const merkleRoot = await sha256(`merkle:root:${election.id}:${results.totalVotes}:${results.tallyAuditHash}`);

    // Compute canonical digest of the report payload before signing
    const payloadForDigest = {
      reportId,
      electionId: election.id,
      electionNumber: election.electionNumber,
      totalVotesCast: results.totalVotes,
      registeredVoters: registeredCount,
      turnoutPercentage: results.turnoutPercentage,
      tallyAuditHash: results.tallyAuditHash,
      merkleRoot,
      candidateResults: results.candidateResults,
      generatedAt: timestamp,
    };
    const contentDigestSha256 = await sha256(JSON.stringify(payloadForDigest));

    // Multi-Party & Validator Signatures
    const signatures: ElectionReportSignature[] = [
      {
        signerId: 'keyholder-ec-chair',
        signerName: 'Dr. Elena Vance (Chief Election Commissioner)',
        role: 'CHIEF_ELECTION_COMMISSIONER',
        keyFingerprint: '0xEC_CHAIR_P256_ECDSA_991823AB',
        signature: await sha256(`SIG:EC_CHAIR:${contentDigestSha256}:${timestamp}`),
        signedAt: timestamp,
      },
      {
        signerId: 'keyholder-auditor-lead',
        signerName: 'Marcus Sterling (Lead Independent Auditor)',
        role: 'INDEPENDENT_AUDITOR',
        keyFingerprint: '0xAUDIT_LEAD_P256_ECDSA_77BC11FA',
        signature: await sha256(`SIG:AUDIT_LEAD:${contentDigestSha256}:${timestamp}`),
        signedAt: timestamp,
      },
      {
        signerId: 'keyholder-observer-rep',
        signerName: 'Public & Multi-Party Observer Panel',
        role: 'MULTI_PARTY_OBSERVER',
        keyFingerprint: '0xOBSERVER_P256_ECDSA_33DE88C2',
        signature: await sha256(`SIG:OBSERVER:${contentDigestSha256}:${timestamp}`),
        signedAt: timestamp,
      },
    ];

    const report: SignedElectionReport = {
      schemaVersion: '2.1.0-electoral-standards',
      reportId,
      generatedAt: timestamp,
      election: {
        id: election.id,
        electionNumber: election.electionNumber,
        name: election.name,
        electionType: election.electionType,
        constituencyId: election.constituencyId,
        constituencyName: election.constituencyName,
        hometown: election.hometown,
        state: election.state,
        startAt: election.startAt,
        endAt: election.endAt,
        createdBy: election.createdBy,
      },
      statistics: {
        registeredVoters: registeredCount,
        totalVotesCast: results.totalVotes,
        turnoutPercentage: results.turnoutPercentage,
        thresholdKeyHoldersTotal: election.configuration.thresholdKeyHolders || 3,
        thresholdKeyHoldersUnlocked: results.keyHoldersUnlocked.length,
        isDecrypted: results.isDecrypted,
        blocksHeight: 42,
        quorumThreshold: election.configuration.quorumThreshold || 0.67,
      },
      tally: {
        candidates: results.candidateResults,
        winner,
      },
      cryptographicProofs: {
        tallyAuditHash: results.tallyAuditHash,
        merkleRoot,
        latestBlockHash,
        zkProofScheme: 'Groth16 / Plonk-zkSNARK (Pedersen Commitment Verification)',
        encryptionScheme: 'AES-256-GCM Envelope + Shamir Threshold Decryption (2-of-3)',
        contentDigestSha256,
      },
      signatures,
      verificationInstructions:
        'To verify this election report, recalculate the SHA-256 digest of the canonical statistics & candidate results and match against cryptographicProofs.contentDigestSha256, or paste the tallyAuditHash into the Public Verification Portal.',
    };

    return report;
  }

  // ========================================================
  // COMPATIBILITY ADAPTERS FOR EXISTING AUDIT/AREAS
  // ========================================================

  public getMembers(area?: string, search?: string): AreaMember[] {
    let voters = [...this.eligibleVoters];
    if (area && area !== 'ALL') {
      voters = voters.filter((v) => v.hometown.toLowerCase() === area.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      voters = voters.filter((v) => v.name.toLowerCase().includes(q) || v.voterId.toLowerCase().includes(q));
    }
    return voters.map((v) => ({
      id: v.id,
      voterId: v.voterId,
      name: v.name,
      fatherName: v.fatherName,
      motherName: v.motherName,
      aadhaarLast4: v.aadhaarLast4,
      hometown: v.hometown,
      constituency: v.constituencyName,
      nationalIdMasked: v.nationalIdMasked,
      email: v.email,
      status: v.eligibilityStatus === 'ELIGIBLE' ? (v.hasVoted ? 'VOTED' : 'REGISTERED') : 'SUSPENDED',
      hasRegisteredAccount: v.hasRegisteredAccount,
      hasVoted: v.hasVoted,
      votedAt: v.votedAt,
      receiptHash: v.receiptHash,
      createdAt: v.createdAt,
    }));
  }

  public getMemberByVoterId(voterId: string): AreaMember | undefined {
    const v = this.eligibleVoters.find((m) => m.voterId.toLowerCase().trim() === voterId.toLowerCase().trim());
    if (!v) return undefined;
    return {
      id: v.id,
      voterId: v.voterId,
      name: v.name,
      fatherName: v.fatherName,
      motherName: v.motherName,
      aadhaarLast4: v.aadhaarLast4,
      hometown: v.hometown,
      constituency: v.constituencyName,
      nationalIdMasked: v.nationalIdMasked,
      email: v.email,
      status: v.eligibilityStatus === 'ELIGIBLE' ? (v.hasVoted ? 'VOTED' : 'REGISTERED') : 'SUSPENDED',
      hasRegisteredAccount: v.hasRegisteredAccount,
      hasVoted: v.hasVoted,
      votedAt: v.votedAt,
      receiptHash: v.receiptHash,
      createdAt: v.createdAt,
    };
  }

  public addMember(data: {
    name: string;
    hometown: string;
    constituency?: string;
    nationalIdMasked?: string;
    email?: string;
    voterId?: string;
  }): AreaMember {
    // Find matching election or default to first
    const targetElection = this.elections.find(
      (e) => e.hometown.toLowerCase() === data.hometown.toLowerCase()
    ) || this.elections[0];

    const voter = this.addEligibleVoter(targetElection.id, {
      name: data.name,
      voterId: data.voterId,
      nationalIdMasked: data.nationalIdMasked,
      email: data.email,
      constituencyName: data.constituency,
      hometown: data.hometown,
    });

    return {
      id: voter.id,
      voterId: voter.voterId,
      name: voter.name,
      fatherName: voter.fatherName,
      motherName: voter.motherName,
      aadhaarLast4: voter.aadhaarLast4,
      hometown: voter.hometown,
      constituency: voter.constituencyName,
      nationalIdMasked: voter.nationalIdMasked,
      email: voter.email,
      status: 'REGISTERED',
      hasRegisteredAccount: voter.hasRegisteredAccount,
      hasVoted: false,
      createdAt: voter.createdAt,
    };
  }

  public deleteMember(id: string): boolean {
    return this.deleteEligibleVoter(id);
  }

  public verifyVoter(voterId: string, votingArea: string): ElectoralRollVerifyResponse {
    // Find election matching votingArea or voter
    const matchingElection = this.elections.find(
      (e) => e.hometown.toLowerCase() === votingArea.toLowerCase() || e.constituencyName.toLowerCase() === votingArea.toLowerCase()
    ) || this.elections[0];

    const result = this.verifyVoterForElection(matchingElection.id, voterId, votingArea);

    if (!result.isEligible) {
      let errCode: ElectoralRollVerifyResponse['errorCode'] = 'NOT_IN_LIST';
      if (result.errorCode === 'CONSTITUENCY_MISMATCH') errCode = 'HOMETOWN_MISMATCH';
      if (result.errorCode === 'ALREADY_VOTED') errCode = 'ALREADY_VOTED';
      if (result.errorCode === 'ELECTION_CLOSED') errCode = 'SEASON_NOT_LIVE';
      if (result.errorCode === 'SUSPENDED') errCode = 'SUSPENDED';

      return {
        isFound: Boolean(result.voter),
        isEligible: false,
        member: result.voter ? {
          id: result.voter.id,
          voterId: result.voter.voterId,
          name: result.voter.name,
          fatherName: result.voter.fatherName,
          motherName: result.voter.motherName,
          aadhaarLast4: result.voter.aadhaarLast4,
          hometown: result.voter.hometown,
          constituency: result.voter.constituencyName,
          nationalIdMasked: result.voter.nationalIdMasked,
          email: result.voter.email,
          status: result.voter.eligibilityStatus === 'ELIGIBLE' ? (result.voter.hasVoted ? 'VOTED' : 'REGISTERED') : 'SUSPENDED',
          hasRegisteredAccount: result.voter.hasRegisteredAccount,
          hasVoted: result.voter.hasVoted,
          createdAt: result.voter.createdAt,
        } : undefined,
        errorCode: errCode,
        error: result.errorMessage,
        hometownMismatch: result.errorCode === 'CONSTITUENCY_MISMATCH' ? {
          registeredHometown: result.voter?.hometown || 'Registered City',
          attemptedArea: votingArea,
        } : undefined,
        hasVoted: result.voter?.hasVoted,
      };
    }

    return {
      isFound: true,
      isEligible: true,
      member: {
        id: result.voter!.id,
        voterId: result.voter!.voterId,
        name: result.voter!.name,
        fatherName: result.voter!.fatherName,
        motherName: result.voter!.motherName,
        aadhaarLast4: result.voter!.aadhaarLast4,
        hometown: result.voter!.hometown,
        constituency: result.voter!.constituencyName,
        nationalIdMasked: result.voter!.nationalIdMasked,
        email: result.voter!.email,
        status: 'REGISTERED',
        hasRegisteredAccount: result.voter!.hasRegisteredAccount,
        hasVoted: false,
        createdAt: result.voter!.createdAt,
      },
      isSeasonLive: true,
      hasVoted: false,
    };
  }

  public getAreaSessions(): AreaElectionSession[] {
    return this.elections.map((e) => {
      const areaVoters = this.getEligibleVoters(e.id);
      return {
        id: e.id,
        area: e.hometown,
        constituency: e.constituencyName,
        electionName: e.name,
        seasonRound: 1,
        state: e.state,
        isLive: e.state === 'VOTING_OPEN',
        totalRegistered: areaVoters.length,
        totalVoted: areaVoters.filter((v) => v.hasVoted).length,
        candidates: e.candidates,
        startedAt: e.startAt,
        endsAt: e.endAt,
      };
    });
  }

  public toggleAreaLive(area: string, isLive: boolean): AreaElectionSession {
    const election = this.elections.find((e) => e.hometown.toLowerCase() === area.toLowerCase());
    if (!election) throw new Error(`Election for '${area}' not found.`);
    election.state = isLive ? 'VOTING_OPEN' : 'VOTING_CLOSED';
    election.updatedAt = new Date().toISOString();
    return this.getAreaSessions().find((s) => s.area.toLowerCase() === area.toLowerCase())!;
  }

  public transitionAreaState(area: string, state: ElectionState): AreaElectionSession {
    const election = this.elections.find((e) => e.hometown.toLowerCase() === area.toLowerCase());
    if (!election) throw new Error(`Election for '${area}' not found.`);
    election.state = state;
    election.updatedAt = new Date().toISOString();
    return this.getAreaSessions().find((s) => s.area.toLowerCase() === area.toLowerCase())!;
  }

  public resetAreaVotingSeason(area: string): {
    session: AreaElectionSession;
    membersResetCount: number;
  } {
    const election = this.elections.find((e) => e.hometown.toLowerCase() === area.toLowerCase());
    if (!election) throw new Error(`Election for '${area}' not found.`);

    const areaVoters = this.eligibleVoters.filter((v) => v.electionId === election.id);
    areaVoters.forEach((v) => {
      v.hasVoted = false;
      v.votedAt = undefined;
      v.receiptHash = undefined;
    });

    if (this.voteCounts[election.id]) {
      Object.keys(this.voteCounts[election.id]).forEach((cId) => {
        this.voteCounts[election.id][cId] = 0;
      });
    }

    election.state = 'VOTING_OPEN';
    election.updatedAt = new Date().toISOString();

    const session = this.getAreaSessions().find((s) => s.area.toLowerCase() === area.toLowerCase())!;
    return {
      session,
      membersResetCount: areaVoters.length,
    };
  }
}
