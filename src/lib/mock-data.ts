import portrait from "@/assets/gallery-portrait.jpg";
import car from "@/assets/gallery-car.jpg";
import event from "@/assets/gallery-event.jpg";
import sunset from "@/assets/gallery-sunset.jpg";
import neon from "@/assets/gallery-neon.jpg";
import lifestyle from "@/assets/gallery-lifestyle.jpg";
import street from "@/assets/gallery-street.jpg";
import night from "@/assets/hero-night.jpg";

export const heroImage = night;

export type Photo = {
  id: string;
  src: string;
  title: string;
  category: "Portrait" | "Automotive" | "Event" | "Street" | "Lifestyle" | "Cityscape";
};

export const photos: Photo[] = [
  { id: "p1", src: portrait, title: "Vinewood Glow", category: "Portrait" },
  { id: "p2", src: car, title: "Midnight Coupe", category: "Automotive" },
  { id: "p3", src: event, title: "Maze Bank Afterparty", category: "Event" },
  { id: "p4", src: sunset, title: "Del Perro Sunset", category: "Cityscape" },
  { id: "p5", src: neon, title: "Alley Neon", category: "Street" },
  { id: "p6", src: lifestyle, title: "Vinewood Hills", category: "Lifestyle" },
  { id: "p7", src: street, title: "Diner on Route 68", category: "Street" },
  { id: "p8", src: night, title: "Downtown Drizzle", category: "Cityscape" },
  { id: "p9", src: portrait, title: "Rooftop Hour", category: "Portrait" },
  { id: "p10", src: car, title: "Custom Build #12", category: "Automotive" },
  { id: "p11", src: event, title: "Bahama Mamas Live", category: "Event" },
  { id: "p12", src: sunset, title: "Pacific Bluffs", category: "Cityscape" },
];

export type Project = {
  id: string;
  slug: string;
  title: string;
  client: string;
  date: string;
  cover: string;
  category: string;
  description: string;
  images: string[];
};

export const projects: Project[] = [
  {
    id: "pr1",
    slug: "vinewood-nights",
    title: "Vinewood Nights",
    client: "Tequi-la-la",
    date: "Mar 2026",
    cover: event,
    category: "Event",
    description:
      "An after-hours residency on the strip. We captured the energy of the crowd, the warmth of the booths, and the neon spilling out onto the boulevard.",
    images: [event, neon, night, portrait],
  },
  {
    id: "pr2",
    slug: "midnight-club-builds",
    title: "Midnight Club Builds",
    client: "LS Customs",
    date: "Feb 2026",
    cover: car,
    category: "Automotive",
    description:
      "A six-car feature for the LSC garage. Slow shutters, long alleys, and reflections of downtown on freshly waxed paint.",
    images: [car, neon, night, street],
  },
  {
    id: "pr3",
    slug: "rooftop-portraits",
    title: "Rooftop Portraits",
    client: "Eclipse Towers",
    date: "Jan 2026",
    cover: portrait,
    category: "Portrait",
    description:
      "Editorial portraits shot golden hour to blue hour above the city. Soft natural light, warm peach grading.",
    images: [portrait, sunset, lifestyle, neon],
  },
  {
    id: "pr4",
    slug: "del-perro-golden-hour",
    title: "Del Perro Golden Hour",
    client: "Sandy Shores Mag",
    date: "Dec 2025",
    cover: sunset,
    category: "Lifestyle",
    description:
      "Palm trees, pier, and the long quiet drive home. A loose, warm photo essay for an indie travel magazine.",
    images: [sunset, lifestyle, street, portrait],
  },
  {
    id: "pr5",
    slug: "route-68-diner",
    title: "Route 68 Diner",
    client: "Private",
    date: "Nov 2025",
    cover: street,
    category: "Street",
    description:
      "A roadside diner shoot at dusk. Vintage signage, warm interior windows, low cinematic contrast.",
    images: [street, neon, sunset, car],
  },
  {
    id: "pr6",
    slug: "downtown-drizzle",
    title: "Downtown Drizzle",
    client: "Self-initiated",
    date: "Oct 2025",
    cover: night,
    category: "Cityscape",
    description:
      "A rainy walk through downtown. Long reflections, signal lights, and the city quietly humming.",
    images: [night, neon, street, car],
  },
];

export type Booking = {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  status: "Pending" | "Confirmed" | "Declined";
};

export const bookings: Booking[] = [
  { id: "b1", name: "Rosa Mendez", type: "Portrait Session", date: "Jul 02, 2026", location: "Del Perro Pier", status: "Pending" },
  { id: "b2", name: "LS Customs", type: "Automotive Feature", date: "Jul 05, 2026", location: "LSC Garage, Strawberry", status: "Confirmed" },
  { id: "b3", name: "Tequi-la-la", type: "Event Coverage", date: "Jul 09, 2026", location: "Vinewood Blvd", status: "Pending" },
  { id: "b4", name: "Mason Holt", type: "Couples Shoot", date: "Jul 12, 2026", location: "Vinewood Hills", status: "Confirmed" },
  { id: "b5", name: "Eclipse Towers", type: "Editorial Portrait", date: "Jul 18, 2026", location: "Rooftop, Eclipse Tower 3", status: "Pending" },
  { id: "b6", name: "Sandy Shores Mag", type: "Travel Essay", date: "Jul 24, 2026", location: "Sandy Shores", status: "Declined" },
];

export const services = [
  {
    title: "Portraits",
    description: "Editorial-quality portrait sessions, in studio or on location.",
    price: "from $250",
  },
  {
    title: "Automotive",
    description: "Custom builds, garage features, and rolling shots after dark.",
    price: "from $400",
  },
  {
    title: "Events",
    description: "Clubs, openings, after-parties — captured cinematic and discreet.",
    price: "from $600",
  },
  {
    title: "Lifestyle & Travel",
    description: "Editorial photo essays for brands, magazines, and personal stories.",
    price: "Custom",
  },
];

export const stats = [
  { label: "Photos delivered", value: "12,480" },
  { label: "Projects this year", value: "38" },
  { label: "New bookings", value: "14" },
  { label: "Avg. response", value: "2h" },
];
