// Single source of truth for all site copy.
// Mirrors the information published on starpassstone.net (Starpass Stone LTD).

export const company = {
  name: "Starpass Stone",
  legalName: "Starpass Limited",
  founded: 1998,
  tagline: "Natural stone in design",
  email: "starpass.it@gmail.com",
  whatsapp: "380674052765",
  guide: { name: "Petro Rudenko", role: "Your personal guide to choosing a stone" },
  address: "77 Camden Street Lower, Dublin 2, D02 XE80",
  mapsUrl:
    "https://www.google.com/maps/place/77+Camden+Street+Lower,+Dublin+2,+D02+XE80",
  phones: [
    { label: "Ireland", value: "+353 (85) 202 1268", href: "tel:+353852021268" },
    { label: "Italy", value: "+39 (32) 9395 8013", href: "tel:+393293958013" },
    {
      label: "WhatsApp",
      value: "+380 (67) 405 2765",
      href: "https://wa.me/380674052765",
    },
  ],
};

export const nav = [
  { id: "design", label: "Design" },
  { id: "products", label: "Products" },
  { id: "hamam", label: "Hamams" },
  { id: "sauna", label: "Saunas" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export const categories = [
  "Fireplaces",
  "Hamams",
  "Saunas",
  "Table tops",
  "Bathrooms",
  "Stone",
];

export const design = {
  title: "Development of design projects & construction",
  points: [
    "We carry out individual design projects with further author's support.",
    "Natural stone in the interior — selection and support at all stages of order fulfillment.",
    "Development of interiors, facades, fireplaces and floors with full author supervision.",
  ],
};

export const stones = [
  {
    name: "Calacatta",
    note: "Italian marble · luminous white with bold veining",
    color: "#e9e6df",
    accent: "#b9a98f",
  },
  {
    name: "Sadolit Blue",
    note: "Deep blue quartzite · dramatic movement",
    color: "#2a3a52",
    accent: "#5a7fb0",
  },
  {
    name: "Ukrainian Labradorite",
    note: "Black granite · iridescent flecks",
    color: "#14181c",
    accent: "#3d6b6e",
  },
  {
    name: "Nero Marquina",
    note: "Spanish black marble · crisp white veins",
    color: "#16161a",
    accent: "#8a8a93",
  },
  {
    name: "Onyx",
    note: "Translucent stone · backlit elegance",
    color: "#caa66a",
    accent: "#e9c98c",
  },
];

export const products = [
  {
    title: "Marble columns",
    desc: "Hand-finished columns and architectural elements in solid natural stone.",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  },
  {
    title: "Stone bathrooms",
    desc: "Full bathroom suites — vanities, basins, walls and floors in matched stone.",
    img: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80",
  },
  {
    title: "Staircases",
    desc: "Solid and cladded stone stairs engineered for a lifetime of use.",
    img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
  },
  {
    title: "Table tops",
    desc: "Kitchen worktops and tables cut from a single book-matched slab.",
    img: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200&q=80",
  },
  {
    title: "Fireplaces",
    desc: "Bespoke mantels and surrounds — classic to contemporary.",
    img: "https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?w=1200&q=80",
  },
  {
    title: "Electric & bio fireplaces",
    desc: "Flueless electric and bio-ethanol fireplaces framed in stone.",
    img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80",
  },
  {
    title: "Outdoor BBQ",
    desc: "Stone barbecue zones and summer kitchens built to last outdoors.",
    img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80",
  },
  {
    title: "Average cost & guidance",
    desc: "Transparent estimates and instructions before any work begins.",
    img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80",
  },
];

export const hamam = {
  heading: "What is a Hammam?",
  subheading: "Peculiarities of the Turkish bath",
  health: {
    title: "Hammam — health benefits",
    body: "The Turkish bath is good for your health and at the same time lets you fully relax and rest. It benefits the blood vessels, skin and respiratory system, has a calming effect and relieves stress. A hammam is often chosen by those for whom a sauna or Russian banya is not suitable — there are no high temperatures, and therefore no contraindications. It is more than washing and relaxation: the hammam is a whole ritual, a culture of its own. Its popularity keeps growing, and more and more people want their own hammam at home.",
  },
  construction: {
    title: "Hammam construction",
    body: "We build Turkish baths for private and commercial use. Working closely with the client, we deliver a high-quality result that will serve you for decades, using premium materials and advanced equipment. Entrust the construction of your Turkish bath to professionals.",
  },
  portfolio: [
    "Mosaic in hammam",
    "Hammam in mosaic with ergonomic benches",
    "Hammam in marble",
  ],
  equipment: [
    "Steam generator EOS STEAMROCK PREMIUM — 9.0 / 12.0 / 15.0 / 18.0 kW",
    "Steam generator Sawo STN-120 DFP SST",
  ],
};

export const sauna = {
  heading: "Saunas",
  subheading: "What is a sauna?",
  body: "The sauna comes from the modern Finnish sauna and is now common all over the world. It can be built inside an apartment block, in a basement, in a townhouse or a cottage — a separate room, an extension, or a standalone building on the plot. Saunas are common in gyms, most often as a dry-air sauna: it helps people lose excess weight faster while keeping a comfortable temperature for everyone and preventing overheating.",
  portfolio: [
    "Finnish steam room",
    "Finnish steam — salt & bench lighting",
    "Senior rooms",
    "Humpback bench layout",
  ],
  services: ["Sauna equipment", "Production", "Engineering solutions"],
};

export const about = {
  title: "Starpass Stone",
  body: "Since 1998, Starpass Stone has been opening its doors to its customers. Over many years of experience we have established ourselves as a reliable partner and a high-level professional. Our main profile is the production and selection of natural stone for the customer, and the manufacture of natural-stone products of any style and degree of complexity — fireplaces, barbecues and countertops. We develop interior design, facades, fireplaces and floors with full author's support. Today Starpass Stone provides a complete range of services — from measurements to turnkey works and ongoing maintenance.",
  stats: [
    { value: "1998", label: "Working since" },
    { value: "25+", label: "Years of craft" },
    { value: "100%", label: "Natural stone" },
    { value: "A→Z", label: "Turnkey service" },
  ],
};
