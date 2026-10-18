package com.sovereign.democracy.config;

import com.sovereign.democracy.entity.*;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.enums.Role;
import com.sovereign.democracy.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AreaRepository areaRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final UserAccountRepository userAccountRepository;
    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(AreaRepository areaRepository,
                      VoterRecordRepository voterRecordRepository,
                      UserAccountRepository userAccountRepository,
                      ElectionRepository electionRepository,
                      CandidateRepository candidateRepository,
                      PasswordEncoder passwordEncoder) {
        this.areaRepository = areaRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.userAccountRepository = userAccountRepository;
        this.electionRepository = electionRepository;
        this.candidateRepository = candidateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking Sovereign Democracy initial seed data...");

        // 1. Seed Single Administrator
        if (!userAccountRepository.existsByUsernameIgnoreCase("ADMIN-001")) {
            UserAccount admin = new UserAccount(
                    "ADMIN-001",
                    passwordEncoder.encode("admin123"),
                    Role.ADMIN,
                    null
            );
            userAccountRepository.save(admin);
            log.info("Created single root administrator: ADMIN-001 (Role: ADMIN)");
        }

        // 2. Seed 10 Demonstration Areas
        List<AreaConfig> areaConfigs = get10DemonstrationAreas();
        for (AreaConfig ac : areaConfigs) {
            Area area = areaRepository.findByAreaCodeIgnoreCase(ac.areaCode)
                    .orElseGet(() -> areaRepository.save(new Area(
                            ac.areaCode, ac.name, ac.constituencyName, ac.electionType, ac.description
                    )));

            // 3. Seed 50 Voter Records per Area (500 records total)
            long currentCount = voterRecordRepository.countByArea(area);
            if (currentCount < 50) {
                List<VoterRecord> records = generateSyntheticVoters(area, ac.voterPrefix, ac.baseNumber, 50);
                voterRecordRepository.saveAll(records);
                log.info("Seeded 50 voter records for area: {} (Total records: 50)", area.getName());
            }
        }

        // 4. Seed Demonstration Elections & Candidates across all 10 cities
        List<ElectionSeedConfig> electionSeeds = get10CityElectionSeeds();
        for (ElectionSeedConfig esc : electionSeeds) {
            Area area = areaRepository.findByAreaCodeIgnoreCase(esc.areaCode).orElse(null);
            if (area == null) continue;

            Election election = electionRepository.findByElectionCodeIgnoreCase(esc.electionCode)
                    .orElseGet(() -> {
                        Election newElec = new Election(
                                esc.electionCode,
                                esc.name,
                                esc.electionType,
                                area,
                                LocalDateTime.now().minusDays(1),
                                LocalDateTime.now().plusDays(7)
                        );
                        newElec.setStatus(ElectionStatus.OPEN);
                        return electionRepository.save(newElec);
                    });

            // Ensure status is OPEN (active)
            if (election.getStatus() == ElectionStatus.CONFIGURED) {
                election.setStatus(ElectionStatus.OPEN);
                election = electionRepository.save(election);
            }

            // Seed candidates for this election
            for (CandidateSeed cs : esc.candidates) {
                if (!candidateRepository.existsByElectionAndCandidateCodeIgnoreCase(election, cs.code)) {
                    candidateRepository.save(new Candidate(cs.code, election, cs.name, cs.party, cs.symbol, null, cs.bio));
                }
            }
            log.info("Verified active OPEN election {} for area {} with candidates", esc.electionCode, area.getName());
        }

        log.info("Seed check complete. Total Areas: {}, Total Voter Records: {}, Total Elections: {}, Total Candidates: {}, Admin Accounts: {}",
                areaRepository.count(), voterRecordRepository.count(), electionRepository.count(), candidateRepository.count(), userAccountRepository.countByRole(Role.ADMIN));
    }

    private static class CandidateSeed {
        String code;
        String name;
        String party;
        String symbol;
        String bio;

        CandidateSeed(String code, String name, String party, String symbol, String bio) {
            this.code = code;
            this.name = name;
            this.party = party;
            this.symbol = symbol;
            this.bio = bio;
        }
    }

    private static class ElectionSeedConfig {
        String areaCode;
        String electionCode;
        String name;
        String electionType;
        List<CandidateSeed> candidates;

        ElectionSeedConfig(String areaCode, String electionCode, String name, String electionType, List<CandidateSeed> candidates) {
            this.areaCode = areaCode;
            this.electionCode = electionCode;
            this.name = name;
            this.electionType = electionType;
            this.candidates = candidates;
        }
    }

    private List<ElectionSeedConfig> get10CityElectionSeeds() {
        return List.of(
                new ElectionSeedConfig("AREA-MUM", "ELEC-2026-MUM-01", "Mumbai South Municipal Corporation General Election 2026", "Municipal Corporation", List.of(
                        new CandidateSeed("CAND-MUM-01", "Rahul Patil", "Progressive Democratic Alliance", "Rising Sun ☀️", "Advocating for civic modernization, green transportation, and municipal digitisation."),
                        new CandidateSeed("CAND-MUM-02", "Sunita Deshmukh", "National Citizens Coalition", "Flaming Torch 🔥", "Focus on quality municipal healthcare, primary education, and fiscal transparency."),
                        new CandidateSeed("CAND-MUM-03", "Amit Kulkarni", "Lok Swaraj Party", "Scales of Justice ⚖️", "Reforming zoning laws, municipal accountability, and environmental resilience.")
                )),
                new ElectionSeedConfig("AREA-DEL", "ELEC-2026-DEL-02", "Delhi Central Legislative Assembly By-Election 2026", "Legislative Assembly", List.of(
                        new CandidateSeed("CAND-DEL-01", "Rajesh Kumar", "Jan Kalyan Party", "Banyan Tree 🌳", "Committed to pollution mitigation, reliable clean water, and civic infrastructure."),
                        new CandidateSeed("CAND-DEL-02", "Pooja Verma", "Democratic Voice Movement", "Book of Knowledge 📖", "Focusing on youth skill development, public safety, and transparent administrative governance."),
                        new CandidateSeed("CAND-DEL-03", "Vikram Malhotra", "Rashtriya Vikas Front", "Electric Engine 🚂", "Advancing high-speed urban transit, clean energy, and industrial technology corridors.")
                )),
                new ElectionSeedConfig("AREA-BLR", "ELEC-2026-BLR-03", "Bengaluru South Civic Municipal Council Election 2026", "Civic Municipal Council", List.of(
                        new CandidateSeed("CAND-BLR-01", "Karthik Venkatesh", "Tech & Green Alliance", "Glowing Bulb 💡", "Smart traffic management, civic lake restoration, and innovation hubs."),
                        new CandidateSeed("CAND-BLR-02", "Deepa Krishnan", "Citizens United Forum", "Lotus Blossom 🪷", "Affordable municipal housing, public parks, and civic sanitation.")
                )),
                new ElectionSeedConfig("AREA-PUN", "ELEC-2026-PUN-04", "Pune Metropolitan Ward Council Election 2026", "Municipal Corporation", List.of(
                        new CandidateSeed("CAND-PUN-01", "Siddharth Joshi", "Maharashtra Vikas Aghadi", "Bow and Arrow 🏹", "Public transit expansion, IT corridor civic infrastructure, and waste management."),
                        new CandidateSeed("CAND-PUN-02", "Neha Kulkarni", "Jan Seva Morcha", "Earthy Clay Pot 🏺", "Clean drinking water access, school modernization, and green open zones.")
                )),
                new ElectionSeedConfig("AREA-HYD", "ELEC-2026-HYD-05", "Greater Hyderabad Municipal Corporation Poll 2026", "Municipal Corporation", List.of(
                        new CandidateSeed("CAND-HYD-01", "Mohammed Asif", "Deccan Peoples Front", "Flying Kite 🪁", "Urban renewal in heritage areas, hospital expansion, and flyovers."),
                        new CandidateSeed("CAND-HYD-02", "Srinivas Rao", "Telangana Pragathi Party", "Speeding Car 🚗", "Tech corridor integration, storm water drain networks, and renewable power.")
                )),
                new ElectionSeedConfig("AREA-KOL", "ELEC-2026-KOL-06", "Kolkata Municipal Heritage Ward Election 2026", "Municipal Corporation", List.of(
                        new CandidateSeed("CAND-KOL-01", "Sourav Banerjee", "Bengal Democratic Front", "Conch Shell 🐚", "Preservation of heritage wards, riverfront cleanliness, and street lighting."),
                        new CandidateSeed("CAND-KOL-02", "Mousumi Roy", "All India People's Coalition", "Twin Flowers 🌸", "Ward health clinics, digital municipality services, and subsidized canteen systems.")
                )),
                new ElectionSeedConfig("AREA-CHN", "ELEC-2026-CHN-07", "Greater Chennai Corporation Central Poll 2026", "Corporation Council", List.of(
                        new CandidateSeed("CAND-CHN-01", "Anand Natarajan", "Dravida Munnetra Forum", "Rising Sun ☀️", "Coastal flood defence, modern desalination plants, and public library upgrades."),
                        new CandidateSeed("CAND-CHN-02", "Lakshmi Raman", "Tamil Nadu Janatha Party", "Two Leaves 🍃", "Women self-help groups, community centers, and underground drainage networks.")
                )),
                new ElectionSeedConfig("AREA-AMD", "ELEC-2026-AMD-08", "Ahmedabad Municipal Corporation Civic Poll 2026", "Municipal Corporation", List.of(
                        new CandidateSeed("CAND-AMD-01", "Bhavin Patel", "Gujarat Vikas Parishad", "Spindle Wheel 🎡", "Industrial corridor development, BRTS expansion, and water filtration."),
                        new CandidateSeed("CAND-AMD-02", "Rupal Shah", "Civic Welfare Action Party", "Gentle Dove 🕊️", "Air quality monitoring, urban forestry, and zero-tax benefits for green buildings.")
                )),
                new ElectionSeedConfig("AREA-JAI", "ELEC-2026-JAI-09", "Jaipur Municipal Heritage Ward Council Election 2026", "Municipal Council", List.of(
                        new CandidateSeed("CAND-JAI-01", "Digvijay Singh Rathore", "Rajasthan Lok Morcha", "Galloping Horse 🐎", "Promoting handicraft bazaars, pink city conservation, and solar illumination."),
                        new CandidateSeed("CAND-JAI-02", "Anjali Meena", "United Citizens Front", "Open Hand ✋", "Tourist safety, water harvesting systems, and youth sports academies.")
                )),
                new ElectionSeedConfig("AREA-LKO", "ELEC-2026-LKO-10", "Lucknow Municipal Corporation Central Zone Poll 2026", "Municipal Corporation", List.of(
                        new CandidateSeed("CAND-LKO-01", "Harshvardhan Tiwari", "Awadh Vikas Manch", "Royal Elephant 🐘", "Gomti riverfront enhancement, heritage lighting, and metro connectivity."),
                        new CandidateSeed("CAND-LKO-02", "Farhana Begum", "Janata Ekta Party", "Luminous Lantern 🏮", "Women skill centers, community sanitation, and local bazaar infrastructure.")
                ))
        );
    }

    private static class AreaConfig {
        String areaCode;
        String name;
        String constituencyName;
        String electionType;
        String description;
        String voterPrefix;
        int baseNumber;

        AreaConfig(String areaCode, String name, String constituencyName, String electionType, String description, String voterPrefix, int baseNumber) {
            this.areaCode = areaCode;
            this.name = name;
            this.constituencyName = constituencyName;
            this.electionType = electionType;
            this.description = description;
            this.voterPrefix = voterPrefix;
            this.baseNumber = baseNumber;
        }
    }

    private List<AreaConfig> get10DemonstrationAreas() {
        return List.of(
                new AreaConfig("AREA-MUM", "Mumbai", "Mumbai South", "Municipal Corporation", "Municipal Council election for Mumbai South metropolitan zone", "VOT-MUM", 1000),
                new AreaConfig("AREA-DEL", "Delhi", "New Delhi Central", "National Capital Council", "Legislative representation for New Delhi Central zone", "VOT-DEL", 2000),
                new AreaConfig("AREA-BLR", "Bengaluru", "Bengaluru South", "Civic Municipal Council", "Municipal council for Bengaluru South innovation districts", "VOT-BLR", 3000),
                new AreaConfig("AREA-PUN", "Pune", "Pune Metropolitan East", "Municipal Corporation", "Pune metropolitan municipal ward election", "VOT-PUN", 4000),
                new AreaConfig("AREA-HYD", "Hyderabad", "Hyderabad Old City & Cyber", "Municipal Corporation", "Greater Hyderabad civic body council elections", "VOT-HYD", 5000),
                new AreaConfig("AREA-KOL", "Kolkata", "Kolkata North Heritage", "Municipal Corporation", "Kolkata municipal corporation heritage ward election", "VOT-KOL", 6000),
                new AreaConfig("AREA-CHN", "Chennai", "Chennai Central Urban", "Corporation Council", "Greater Chennai corporation central civic poll", "VOT-CHN", 7000),
                new AreaConfig("AREA-AMD", "Ahmedabad", "Ahmedabad West Industrial", "Municipal Corporation", "Ahmedabad municipal corporation civic representation", "VOT-AMD", 8000),
                new AreaConfig("AREA-JAI", "Jaipur", "Jaipur City Heritage Ward", "Municipal Council", "Jaipur municipal heritage and royal ward council", "VOT-JAI", 9000),
                new AreaConfig("AREA-LKO", "Lucknow", "Lucknow Central Awadh", "Municipal Corporation", "Lucknow municipal corporation central zone poll", "VOT-LKO", 10000)
        );
    }

    private List<VoterRecord> generateSyntheticVoters(Area area, String prefix, int baseNumber, int count) {
        String[] firstNames = {
                "Aarav", "Ananya", "Rahul", "Priya", "Aditya", "Sneha", "Vikram", "Neha", "Rohan", "Pooja",
                "Arjun", "Kavya", "Siddharth", "Isha", "Kunal", "Tanvi", "Varun", "Riya", "Gaurav", "Divya",
                "Manish", "Shreya", "Akash", "Anushka", "Nikhil", "Simran", "Amit", "Meera", "Deepak", "Swati",
                "Harsh", "Bhavna", "Karan", "Payal", "Sameer", "Komal", "Rajesh", "Sunita", "Suresh", "Geeta",
                "Manoj", "Alka", "Pradeep", "Anita", "Ramesh", "Kiran", "Sanjay", "Rekha", "Dinesh", "Usha"
        };
        String[] lastNames = {
                "Sharma", "Patel", "Verma", "Deshmukh", "Jadhav", "Kulkarni", "Mehta", "Reddy", "Nair", "Iyer",
                "Singh", "Gupta", "Banerjee", "Chatterjee", "Mishra", "Pandey", "Chauhan", "Rao", "Pillai", "Das"
        };
        String[] fathers = {"Ramesh", "Suresh", "Mahesh", "Rajendra", "Narendra", "Dharmendra", "Ashok", "Vijay", "Anil", "Sunil"};
        String[] mothers = {"Sunita", "Anita", "Geeta", "Seema", "Rekha", "Shobha", "Kamla", "Vimla", "Kavita", "Saroj"};

        List<VoterRecord> voters = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            String voterId = prefix + "-" + (baseNumber + i);
            String fn = firstNames[(i - 1) % firstNames.length];
            String ln = lastNames[((baseNumber / 1000) + i) % lastNames.length];
            String fullName = fn + " " + ln;
            String fatherName = fathers[(i * 3) % fathers.length] + " " + ln;
            String motherName = mothers[(i * 2) % mothers.length] + " " + ln;
            // Generate a 4-digit numeric string for Aadhaar
            int aadhaarVal = 1000 + ((baseNumber + i * 17) % 8999);
            String aadhaarLast4 = String.format("%04d", aadhaarVal);

            voters.add(new VoterRecord(voterId, fullName, fatherName, motherName, aadhaarLast4, area));
        }
        return voters;
    }
}
