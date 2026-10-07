type data = {
  company: string;
  title: string;
  oppType: string;
  applType: string;
  applField: string;
  appDL: string;
  paid: boolean;
  wage: number | null;
  id: number;
};

// Fictional preview data. paid and wage describe hourly employment only.
export const mockData: {
  work: data[];
  event: data[];
  financialAid: data[];
} = {
  work: [
    {
      company: "NORTHSTAR TECHNOLOGIES",
      title: "Software Engineering Intern",
      oppType: "Internship",
      applType: "Undergraduates",
      applField: "CSE Majors",
      appDL: "Nov 15, 2026",
      paid: true,
      wage: 28,
      id: 1
    },
    {
      company: "CAMPUS LEARNING CENTER",
      title: "Peer Mathematics Tutor",
      oppType: "Part-time Job",
      applType: "All Students",
      applField: "Mathematics",
      appDL: "Oct 30, 2026",
      paid: true,
      wage: 18,
      id: 2
    },
    {
      company: "GREEN HORIZONS INITIATIVE",
      title: "Community Garden Volunteer",
      oppType: "Volunteer",
      applType: "All Students",
      applField: "All Majors",
      appDL: "Nov 7, 2026",
      paid: false,
      wage: null,
      id: 3
    },
    {
      company: "RIVERBEND RESEARCH LAB",
      title: "Undergraduate Research Assistant",
      oppType: "Research",
      applType: "Undergraduates",
      applField: "Biology Majors",
      appDL: "Dec 1, 2026",
      paid: true,
      wage: 22,
      id: 4
    },
    {
      company: "BRIGHTLINE CREATIVE STUDIO",
      title: "Junior Graphic Designer",
      oppType: "Part-time Job",
      applType: "All Students",
      applField: "Design Majors",
      appDL: "Nov 25, 2026",
      paid: true,
      wage: 24,
      id: 5
    }
  ],
  event: [
    {
      company: "STUDENT DESIGN COLLECTIVE",
      title: "Design for Good Hackathon",
      oppType: "Hackathon",
      applType: "All Students",
      applField: "Design & Technology",
      appDL: "Nov 20, 2026",
      paid: false,
      wage: null,
      id: 6
    },
    {
      company: "CAMPUS CAREER NETWORK",
      title: "Fall Internship and Career Fair",
      oppType: "Career Fair",
      applType: "All Students",
      applField: "All Majors",
      appDL: "Oct 22, 2026",
      paid: false,
      wage: null,
      id: 7
    },
    {
      company: "DATA EXPLORERS CLUB",
      title: "Introduction to Data Visualization",
      oppType: "Workshop",
      applType: "Undergraduates",
      applField: "Data Science",
      appDL: "Nov 5, 2026",
      paid: false,
      wage: null,
      id: 8
    },
    {
      company: "EMERGING FOUNDERS SOCIETY",
      title: "Student Startup Pitch Night",
      oppType: "Networking",
      applType: "All Students",
      applField: "Business & Engineering",
      appDL: "Nov 12, 2026",
      paid: false,
      wage: null,
      id: 9
    },
    {
      company: "COMMUNITY HEALTH FORUM",
      title: "Public Health Research Symposium",
      oppType: "Conference",
      applType: "Graduate Students",
      applField: "Health Sciences",
      appDL: "Dec 4, 2026",
      paid: false,
      wage: null,
      id: 10
    }
  ],
  financialAid: [
    {
      company: "HORIZON SCHOLARS FOUNDATION",
      title: "First-Generation Student Scholarship",
      oppType: "Scholarship",
      applType: "First-Generation Students",
      applField: "All Majors",
      appDL: "Dec 10, 2026",
      paid: false,
      wage: null,
      id: 11
    },
    {
      company: "WOMEN IN COMPUTING ALLIANCE",
      title: "Women in Technology Scholarship",
      oppType: "Scholarship",
      applType: "Undergraduates",
      applField: "CSE Majors",
      appDL: "Nov 30, 2026",
      paid: false,
      wage: null,
      id: 12
    },
    {
      company: "CAMPUS STUDENT SUPPORT FUND",
      title: "Emergency Student Assistance Grant",
      oppType: "Emergency Grant",
      applType: "All Students",
      applField: "All Majors",
      appDL: "Oct 31, 2026",
      paid: false,
      wage: null,
      id: 13
    },
    {
      company: "GLOBAL LEARNING FOUNDATION",
      title: "Study Abroad Travel Grant",
      oppType: "Travel Grant",
      applType: "Undergraduates",
      applField: "All Majors",
      appDL: "Jan 15, 2027",
      paid: false,
      wage: null,
      id: 14
    },
    {
      company: "RIVER VALLEY GRADUATE TRUST",
      title: "Graduate Research Fellowship",
      oppType: "Fellowship",
      applType: "Graduate Students",
      applField: "STEM Majors",
      appDL: "Dec 18, 2026",
      paid: false,
      wage: null,
      id: 15
    }
  ]
};
