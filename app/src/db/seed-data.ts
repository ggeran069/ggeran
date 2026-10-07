/**
 * Seed content — transcribed from the Hugo site (photo/site/content/*), reusing
 * the existing Unsplash sample URLs. Used two ways:
 *   1. `npm run db:seed` inserts these into Neon.
 *   2. `lib/data.ts` falls back to these when DATABASE_URL is unset, so the
 *      site renders locally with no database.
 */

export type Project = {
  slug: string;
  title: string;
  year: number | null;
  date: string | null;
  ref: string | null;
  category: string | null;
  location: string | null;
  medium: string | null;
  dimensions: string | null;
  edition: string | null;
  availability: string | null;
  series: string | null;
  featured: boolean;
  weight: number;
  image: string | null;
  gallery: string[];
  body: string | null;
};

export type Publication = {
  slug: string;
  title: string;
  year: number | null;
  date: string | null;
  ref: string | null;
  category: string | null;
  publisher: string | null;
  author: string | null;
  isbn: string | null;
  pages: string | null;
  format: string | null;
  edition: string | null;
  image: string | null;
  gallery: string[];
  body: string | null;
};

export type NewsItem = {
  slug: string;
  title: string;
  date: string | null;
  summary: string | null;
  image: string | null;
  body: string | null;
};

const img = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&fit=crop&crop=entropy`;

export const seedProjects: Project[] = [
  {
    slug: "the-grid",
    title: "The Grid",
    year: 2024,
    date: "2024-10-12",
    ref: "G-2024-001",
    category: "Architecture",
    location: "Düsseldorf, Germany",
    medium: "archival pigment print",
    dimensions: "180 × 220 cm",
    edition: "3 of 7 + 2 AP",
    availability: "for-sale",
    series: "Architecture",
    featured: true,
    weight: 1,
    image: img("1480714378408-67cf0d13bc1b", 2000),
    gallery: [img("1496564203457-11bb12075d90", 1600), img("1472289065668-ce650ac443d2", 1600)],
    body: "An exploration into the rigid geometry of urban planning. How the intersection of verticality and repetition creates a rhythm that demands objective distance from the viewer.\n\nThe series examines the skeletal truth of modern environments — vast logistical architectures whose scale only resolves when the human element is removed from the frame.",
  },
  {
    slug: "the-distance",
    title: "The Distance",
    year: 2023,
    date: "2023-09-28",
    ref: "G-2023-002",
    category: "Landscape",
    location: "Atacama, Chile",
    medium: "archival pigment print",
    dimensions: "150 × 200 cm",
    edition: "Unique",
    availability: "sold",
    series: "Landscapes",
    featured: true,
    weight: 2,
    image: img("1506905925346-21bda4d32df4", 2000),
    gallery: [img("1419242902214-272b3f66ee7a", 1600), img("1502082553048-f009c37129b9", 1600)],
    body: "Removing the human element from the frame to reveal the atmospheric neutrality of the landscape. A study on void space and the clarity that distance provides.\n\nCaptured at the solar fields of the Atacama — thousands of panels arranged in perfect concentric geometry, reflecting a pale and indifferent sky.",
  },
  {
    slug: "rhein-ii",
    title: "Rhein II",
    year: 1993,
    date: "1993-01-01",
    ref: "G-1993-018",
    category: "Landscape",
    location: "Germany",
    medium: "Chromogenic color print",
    dimensions: "190 × 360 cm",
    edition: "6 of 6 + 2 AP",
    availability: "sold",
    series: "Landscapes",
    featured: false,
    weight: 3,
    image: img("1469474968028-56623f02e42e", 2000),
    gallery: [img("1447752875215-b2761acb3c5d", 1600), img("1433086966358-54859d0ed716", 1600)],
    body: "A strictly minimalist stratification of the river into horizontal bands. The composition removes incident and reduces the landscape to an almost abstract, objective register — water between flat green embankments beneath an overcast sky.",
  },
  {
    slug: "board-of-trade",
    title: "Board of Trade",
    year: 2007,
    date: "2007-01-01",
    ref: "G-2007-005",
    category: "Architecture",
    location: "Chicago, USA",
    medium: "C-print under plexiglass",
    dimensions: "185 × 240 cm",
    edition: "4 of 6 + 1 AP",
    availability: "for-sale",
    series: "Stock Exchanges",
    featured: false,
    weight: 4,
    image: img("1500530855697-b586d89ba3ee", 2000),
    gallery: [img("1472214103451-9374bd1c798e", 1600), img("1426604966848-d7adac402bff", 1600)],
    body: "Thousands of traders in coloured jackets captured in a structured swarm, composed from multiple viewpoints into a seamless, omniscient perspective where every detail holds focus. The trading floor becomes a pattern of colour and motion against dark architecture.",
  },
];

export const seedPublications: Publication[] = [
  {
    slug: "catalogue-raisonne",
    title: "Catalogue Raisonné",
    year: 2020,
    date: "2020-03-15",
    ref: "P-2020-001",
    category: "Monograph",
    publisher: "Steidl, Göttingen",
    author: "George Geranios",
    isbn: "978-3-96999-123-4",
    pages: "320 pages",
    format: "Hardcover, 24 × 30 cm",
    edition: "First Edition",
    image: img("1441974231531-c6227db76b6e", 1500),
    gallery: [img("1454496522488-7a8e488e8606", 1600), img("1493863641943-9b68992a8d07", 1600)],
    body: "A comprehensive catalogue raisonné chronicling four decades of work. The volume documents all primary photographs produced between 1980 and 2020, arranged in systematic chronological order, with full provenance, exhibition history, and bibliographic references for each entry.\n\nEssays by leading curators situate the practice within the broader history of large-format photography and the documentary tradition.",
  },
  {
    slug: "landscapes",
    title: "Landscapes",
    year: 2015,
    date: "2015-09-01",
    ref: "P-2015-002",
    category: "Monograph",
    publisher: "Hatje Cantz, Berlin",
    author: "George Geranios",
    isbn: "978-3-7757-4000-0",
    pages: "248 pages",
    format: "Hardcover, 28 × 35 cm",
    edition: "First Edition",
    image: img("1418065460487-3e41a6c84dc5", 1500),
    gallery: [img("1444723121867-7a241cacace9", 1600), img("1517677208171-0bc6725a3e60", 1600)],
    body: "A focused volume gathering the landscape work produced between 1989 and 2015 — from alpine passes and glacial valleys to the engineered landscapes of solar fields and industrial agriculture. The sequence traces a sustained study of distance, scale, and the geometry of the inhabited earth.",
  },
];

export const seedNews: NewsItem[] = [
  {
    slug: "structural-integrity-and-the-grid",
    title: "Structural Integrity and the Grid",
    date: "2023-10-12",
    summary:
      "An exploration into the rigid geometry of urban planning and the rhythm of repetition.",
    image: null,
    body: "An exploration into the rigid geometry of urban planning. How the intersection of verticality and repetition creates a rhythm that demands objective distance from the viewer.\n\nThe grid is not merely a compositional device but an ideological one — a way of imposing legibility onto spaces that would otherwise resist it.",
  },
  {
    slug: "the-architecture-of-silence",
    title: "The Architecture of Silence",
    date: "2023-09-28",
    summary:
      "Removing the human element to reveal the skeletal truth of our environments.",
    image: null,
    body: "Removing the human element from the frame to reveal the skeletal truth of our environments. A study on void space and atmospheric neutrality.\n\nThe gallery void becomes its own subject: a space so emptied of incident that the architecture itself must carry the entire weight of meaning.",
  },
];

export type SiteContent = {
  contactEmail: string | null;
  contactInstagramUrl: string | null;
  contactInstagramHandle: string | null;
  contactIntro: string | null;
  aboutPortrait: string | null;
  aboutBio: string | null;
  aboutExhibitions: string | null;
  availableHeading: string | null;
  availableIntro: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  navProjectsLabel: string | null;
  navAvailableLabel: string | null;
  navAboutLabel: string | null;
  navContactLabel: string | null;
  navShowPublications: boolean;
  navShowNews: boolean;
  projectCategories: string | null;
  navExtraLinks: string | null;
};

/** Default site-wide content. Mirrors the previously-hardcoded page literals so
 *  the no-DB site renders identically. */
export const seedSiteContent: SiteContent = {
  contactEmail: "studio@example.com",
  contactInstagramUrl: "https://instagram.com/",
  contactInstagramHandle: "@georgegeranios",
  contactIntro: "For print sales, exhibition requests, and press enquiries.",
  aboutPortrait:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&q=80&fit=crop",
  aboutBio:
    "Based in Düsseldorf, the photographer has spent three decades documenting the systems and structures that define the contemporary landscape — from stock exchanges and factory floors to solar fields and emptied galleries.\n\nThe work is characterised by an extreme distance: a vantage point high enough that the individual dissolves into pattern, and the scale of human activity becomes legible only as geometry.",
  aboutExhibitions:
    "2023 — Kunstmuseum, Basel\n2021 — Hayward Gallery, London\n2019 — Museum of Modern Art, New York",
  availableHeading: "Available Works",
  availableIntro:
    "For pricing, provenance, and condition reports, please contact the studio directly.",
  heroTitle: null,
  heroSubtitle: null,
  navProjectsLabel: "Projects",
  navAvailableLabel: "Available Works/Prints",
  navAboutLabel: "Biography",
  navContactLabel: "Contact",
  navShowPublications: false,
  navShowNews: false,
  projectCategories: "Architecture\nLandscape\nMusic\nSeries",
  navExtraLinks: null,
};
