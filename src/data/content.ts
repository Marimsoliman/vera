/**
 * ────────────────────────────────────────────────────────────────
 *  VÉRA — SITE CONTENT
 * ────────────────────────────────────────────────────────────────
 *  All copy below is placeholder editorial. Replace names, stats,
 *  distances and contact details with final project information.
 * ────────────────────────────────────────────────────────────────
 */

export const NAV_LINKS = [
  { label: "PROJECT", target: "#project" },
  { label: "VISION", target: "#vision" },
  { label: "RESIDENCES", target: "#residences" },
  { label: "AMENITIES", target: "#amenities" },
  { label: "LOCATION", target: "#location" },
  { label: "CONTACT", target: "#contact" },
] as const;

export const VISION_STATS = [
  { value: "420", unit: "ACRES", label: "ONE CONTINUOUS DISTRICT" },
  { value: "65", unit: "%", label: "GIVEN BACK TO LANDSCAPE" },
  { value: "01", unit: "LINE", label: "FROM WHICH IT ALL RISES" },
] as const;

export interface Residence {
  index: string;
  name: string;
  image: string;
  description: string;
  meta: string;
}

export const RESIDENCES: Residence[] = [
  {
    index: "R.01",
    name: "THE VILLAS",
    image: "/img/residence-villas.jpg",
    description:
      "Grounded pavilions of stone and glass — private gardens, still water and rooms that open to the dusk.",
    meta: "3 – 5 BEDROOMS · PRIVATE GARDENS",
  },
  {
    index: "R.02",
    name: "SKY APARTMENTS",
    image: "/img/residence-sky.jpg",
    description:
      "Elevated living above the district — floor-to-ceiling horizons, composed in warm ivory and quiet light.",
    meta: "1 – 4 BEDROOMS · FROM LEVEL 12",
  },
  {
    index: "R.03",
    name: "THE SIGNATURE RESIDENCES",
    image: "/img/residence-signature.jpg",
    description:
      "A limited series of double-height residences at the crown of the tower — VÉRA's most considered address.",
    meta: "BY PRIVATE ENQUIRY · LEVELS 40 – 44",
  },
];

export interface Amenity {
  index: string;
  name: string;
  image: string;
  description: string;
}

export const AMENITIES: Amenity[] = [
  {
    index: "A.01",
    name: "THE CLUBHOUSE",
    image: "/img/amenity-clubhouse.jpg",
    description: "A private members' house at the heart of the district — fireside lounges, a residents' library and dining beneath vaulted stone.",
  },
  {
    index: "A.02",
    name: "LANDSCAPED GARDENS",
    image: "/img/amenity-gardens.jpg",
    description: "Eleven hectares of sculpted landscape — olive walks, reflecting pools and shaded paths composed for the golden hour.",
  },
  {
    index: "A.03",
    name: "WELLNESS & SPA",
    image: "/img/amenity-wellness.jpg",
    description: "Thermal suites, a 25-metre still-water pool and treatment rooms carved from travertine — restoration as a daily ritual.",
  },
  {
    index: "A.04",
    name: "COMMUNITY SPACES",
    image: "/img/amenity-community.jpg",
    description: "Plazas, terraces and pavilion lawns — an architecture of gathering, open from first coffee to last light.",
  },
];

export const LOCATION = {
  coordinates: "25.0772° N — 55.1396° E",
  district: "DISTRICT 01 — WATERFRONT QUARTER",
  distances: [
    { place: "DOWNTOWN / FINANCIAL DISTRICT", time: "12 MIN" },
    { place: "INTERNATIONAL AIRPORT", time: "25 MIN" },
    { place: "MARINA & WATERFRONT", time: "08 MIN" },
    { place: "CULTURAL QUARTER", time: "10 MIN" },
  ],
};

export const CONTACT = {
  email: "enquiries@vera-developments.com",
  phone: "+971 4 000 0000",
  address: "VÉRA SALES PAVILION — DISTRICT 01",
};
