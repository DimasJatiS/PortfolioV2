/**
 * Seed dataset — content carried over from the previous site (dimassj.vercel.app)
 * and the PRD, in the exact document shape the Sanity schemas define.
 *
 * It has two jobs:
 *   1. `pnpm seed` imports it into Sanity as the starting content.
 *   2. Until Sanity is configured (or if it is unreachable), the content layer
 *      runs the same GROQ queries against these documents, so the site never
 *      renders empty.
 *
 * Only facts that are known are recorded. Dates, case-study bodies, activities
 * and the CV file are intentionally absent; they are added in Sanity.
 *
 * This file must stay free of runtime imports so Node can execute it directly
 * for the seed script.
 */

export interface SeedDocument {
  _id: string;
  _type: string;
  [field: string]: unknown;
}

type Localized = { _type: "localeString" | "localeText"; en: string; id?: string };

const ls = (en: string, id?: string): Localized => ({ _type: "localeString", en, id });
const lt = (en: string, id?: string): Localized => ({ _type: "localeText", en, id });

const key = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ----------------------------------------------------------------------------
   Skills
---------------------------------------------------------------------------- */

type Face = "frontend-creative" | "backend-data" | "mobile-ai" | "design-collab";

const faceSkills: Record<Face, string[]> = {
  "frontend-creative": [
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "GSAP",
    "Vite",
    "three.js / R3F",
  ],
  "backend-data": [
    "Node.js",
    "PHP / Laravel",
    "Python / FastAPI",
    "PostgreSQL",
    "MongoDB",
    "Prisma",
    "SQL",
  ],
  "mobile-ai": ["Flutter", "Kotlin", "Java", "Gemini API", "Audio classification (DNN)"],
  "design-collab": [
    "Figma",
    "Photoshop",
    "Illustrator",
    "Lightroom",
    "Git",
    "Event management",
    "Cross-functional teamwork",
  ],
};

/** Used as project stack tags only; they do not appear in the skill faces. */
const stackOnlySkills = [
  "FastAPI",
  "DNN on HeAR embeddings",
  "Laravel",
  "PHP",
  "MySQL",
  "Pusher",
  "Bootstrap",
  "Sanity",
];

const skillId = (name: string) => `skill-${key(name)}`;

const skills: SeedDocument[] = [
  ...Object.entries(faceSkills).flatMap(([face, names]) =>
    names.map((name, index) => ({
      _id: skillId(name),
      _type: "skill",
      name,
      face,
      order: index + 1,
    })),
  ),
  ...stackOnlySkills.map((name, index) => ({
    _id: skillId(name),
    _type: "skill",
    name,
    order: index + 1,
  })),
];

const stack = (...names: string[]) =>
  names.map((name) => ({ _type: "reference", _ref: skillId(name), _key: key(name) }));

/* ----------------------------------------------------------------------------
   Projects
---------------------------------------------------------------------------- */

const projects: SeedDocument[] = [
  {
    _id: "project-tbxxpert",
    _type: "project",
    title: "TBXxpert",
    slug: { _type: "slug", current: "tbxxpert" },
    number: 2,
    featured: true,
    category: ["mobile", "ai"],
    summary: lt(
      "AI-powered mobile app that screens for tuberculosis from cough audio and supports patients with medication adherence tracking and emergency contact alerts.",
      "Aplikasi mobile berbasis AI yang menyaring tuberkulosis dari audio batuk dan mendampingi pasien lewat pelacakan kepatuhan minum obat serta peringatan ke kontak darurat.",
    ),
    stack: stack(
      "Flutter",
      "FastAPI",
      "PostgreSQL",
      "Gemini API",
      "DNN on HeAR embeddings",
    ),
    repoUrl: "https://github.com/AdityaZulkarnaen/TBXpert",
  },
  {
    _id: "project-ai-cv-screen",
    _type: "project",
    title: "AI CV Screen",
    slug: { _type: "slug", current: "ai-cv-screen" },
    number: 5,
    featured: true,
    category: ["ai", "web"],
    summary: lt(
      "AI-powered CV scoring system with a modular backend that evaluates candidates by skill relevance.",
      "Sistem skoring CV berbasis AI dengan backend modular yang menilai kandidat berdasarkan relevansi keahlian.",
    ),
    stack: stack("Node.js", "Gemini API", "PostgreSQL", "Prisma"),
    liveUrl: "https://ai-recruitment-screening-gdg-web.vercel.app/",
  },
  {
    _id: "project-inofa",
    _type: "project",
    title: "Inofa",
    slug: { _type: "slug", current: "inofa" },
    number: 4,
    featured: true,
    category: ["web", "mobile"],
    summary: lt(
      "Web and Android matchmaking platform with real-time chat, advanced filter and search for personalized matching, and cross-platform sync.",
      "Platform matchmaking web dan Android dengan chat real-time, filter dan pencarian lanjutan untuk pencocokan yang personal, serta sinkronisasi lintas platform.",
    ),
    stack: stack("Laravel", "Tailwind CSS", "MySQL", "Pusher"),
    repoUrl: "https://github.com/daffaadz/inofa-web-app",
  },
  {
    _id: "project-bloomarie-store",
    _type: "project",
    title: "Bloomarie Store",
    slug: { _type: "slug", current: "bloomarie-store" },
    number: 1,
    featured: false,
    category: ["web"],
    summary: lt(
      "Flower bouquet store with user authentication and third-party payment integration: product catalog, cart and order management.",
      "Toko buket bunga dengan autentikasi pengguna dan integrasi payment gateway: katalog produk, keranjang, dan manajemen pesanan.",
    ),
    stack: stack("PHP", "MySQL", "Bootstrap"),
    repoUrl: "https://github.com/DimasJatiS/UAS_PPW",
  },
  {
    _id: "project-siakad",
    _type: "project",
    title: "SIAKAD",
    slug: { _type: "slug", current: "siakad" },
    number: 3,
    featured: false,
    category: ["web"],
    summary: lt(
      "Academic information system with student profiles, tuition fee payment, library, final assignment guidance and correspondence management.",
      "Sistem informasi akademik dengan profil mahasiswa, pembayaran UKT, perpustakaan, bimbingan tugas akhir, dan manajemen persuratan.",
    ),
    stack: stack("PHP", "MySQL", "Bootstrap"),
    liveUrl: "https://fe-sia-ugn-ten.vercel.app/",
  },
  {
    _id: "project-summit",
    _type: "project",
    title: "Portfolio “Summit”",
    slug: { _type: "slug", current: "summit" },
    number: 6,
    featured: false,
    category: ["web", "creative"],
    summary: lt(
      "This website: an immersive 3D portfolio where a glass pyramid guides the scroll, built to be fast, accessible and bilingual.",
      "Website ini: portofolio 3D imersif dengan piramida kaca yang memandu scroll, dibangun agar cepat, aksesibel, dan dua bahasa.",
    ),
    stack: stack("Next.js", "three.js / R3F", "GSAP", "Sanity"),
    liveUrl: "https://dimassj.vercel.app",
  },
];

/* ----------------------------------------------------------------------------
   Experience — only education is known; dates are filled in from Sanity.
---------------------------------------------------------------------------- */

const experiences: SeedDocument[] = [
  {
    _id: "experience-ugm",
    _type: "experience",
    organization: "Universitas Gadjah Mada",
    position: ls(
      "Applied Software Engineering student",
      "Mahasiswa Applied Software Engineering",
    ),
    kind: "education",
    highlights: [],
  },
];

/* ----------------------------------------------------------------------------
   Site settings (singleton)
---------------------------------------------------------------------------- */

const siteSettings: SeedDocument = {
  _id: "siteSettings",
  _type: "siteSettings",
  name: "Dimas Jati Satria",
  role: "Software Engineer",
  headline: ls("LONG LIVE LEARNER", "LONG LIVE LEARNER"),
  // *asterisks* mark the word set in the italic serif accent.
  statement: ls(
    "Software engineer turning curiosity into *crafted* products.",
    "Software engineer yang mengubah rasa ingin tahu menjadi produk yang *tergarap rapi*.",
  ),
  manifesto: [
    {
      ...ls(
        "I keep learning, because every new thing I learn changes what I can build.",
        "Aku terus belajar, karena setiap hal baru mengubah apa yang bisa kubangun.",
      ),
      _key: "l1",
    },
    {
      ...ls(
        "From AI screening apps to real-time platforms, I build across the stack.",
        "Dari aplikasi skrining berbasis AI sampai platform real-time, aku membangun di seluruh lapisan.",
      ),
      _key: "l2",
    },
    {
      ...ls(
        "Curious by default. Careful by habit.",
        "Penasaran secara alami. Teliti karena kebiasaan.",
      ),
      _key: "l3",
    },
  ],
  bioShort: lt(
    "Applied Software Engineering student at Universitas Gadjah Mada, building across web, mobile and AI.",
    "Mahasiswa Applied Software Engineering di Universitas Gadjah Mada yang membangun di web, mobile, dan AI.",
  ),
  bioLong: lt(
    "Applied Software Engineering student at Universitas Gadjah Mada with a strong interest in technology, especially Web3, renewable energy and event management. Experienced in cross-functional teamwork through roles as event organizer, cashier and technical competition leader. Skilled in problem-solving, communication and delivering practical solutions across academic and real-world environments.",
    "Mahasiswa Applied Software Engineering di Universitas Gadjah Mada dengan minat kuat pada teknologi, terutama Web3, energi terbarukan, dan event management. Berpengalaman bekerja lintas fungsi lewat peran sebagai event organizer, kasir, dan ketua tim lomba teknis. Terampil dalam pemecahan masalah, komunikasi, dan menghadirkan solusi praktis di lingkungan akademik maupun dunia nyata.",
  ),
  showAvailability: true,
  availability: { startMonth: "2027-02-01", minMonths: 4, mode: "both" },
  socials: [
    { _key: "email", platform: "email", url: "mailto:jati.satria000@gmail.com" },
    {
      _key: "linkedin",
      platform: "linkedin",
      url: "https://linkedin.com/in/dimasjatisatria",
    },
    { _key: "github", platform: "github", url: "https://github.com/DimasJatiS" },
  ],
  interests: [
    { ...ls("Web3", "Web3"), _key: "web3" },
    { ...ls("Renewable energy", "Energi terbarukan"), _key: "energy" },
    { ...ls("Event management", "Event management"), _key: "events" },
  ],
  currentlyLearning: [],
  seo: {
    title: ls("Dimas Jati Satria — Software Engineer"),
    description: lt(
      "Portfolio of Dimas Jati Satria, a software engineer building across the stack: web, mobile and AI. Long live learner.",
      "Portofolio Dimas Jati Satria, software engineer yang membangun di seluruh lapisan: web, mobile, dan AI. Long live learner.",
    ),
  },
};

/** Every seed document, ready for import or for local GROQ evaluation. */
export const seedDocuments: SeedDocument[] = [
  siteSettings,
  ...skills,
  ...projects,
  ...experiences,
];
