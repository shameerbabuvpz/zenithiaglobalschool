import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Image paths for the default content. These files are committed under
 * `public/` so they are served as static assets in every environment
 * (local and production). The URLs are stored on the database rows so the
 * public pages render real images instead of placeholders.
 */
const FACILITY_IMAGES: Record<string, string> = {
  "Modern Classrooms": "/facilities/modern-classrooms.png",
  "Science & Computer Labs": "/facilities/science-computer-labs.png",
  "Library & Resource Centre": "/facilities/library-resource-centre.png",
  "Sports & Playground": "/facilities/sports-playground.png",
  "Arts & Activity Rooms": "/facilities/arts-activity-rooms.png",
  "Safe Transport": "/facilities/safe-transport.png",
};

// 2026-27 calendar programs with their committed branded images.
const PROGRAMS: {
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
}[] = [
  { title: "School Reopens after Summer Vacation", date: "2026-06-01", location: "Main Campus", description: "We warmly welcome all our students back for the new academic year after the summer break. A fresh start full of learning, friendships and new goals.", image: "/programs/school-reopens-after-summer-vacation.webp" },
  { title: "World Environment Day", date: "2026-06-05", location: "School Campus", description: "Students celebrate World Environment Day by planting saplings and pledging to protect nature, building awareness about a greener, cleaner future.", image: "/programs/world-environment-day.webp" },
  { title: "World Blood Donor Day & Malarvadi Programme", date: "2026-06-14", location: "School Auditorium", description: "An awareness day on the importance of voluntary blood donation, along with Malarvadi Bala Sangham activities that nurture creativity and social values in children.", image: "/programs/world-blood-donor-day-malarvadi-programme.webp" },
  { title: "National Reading Day", date: "2026-06-19", location: "Library & Resource Centre", description: "Marking Reading Day in honour of P. N. Panicker, we celebrate the joy of reading with library activities that inspire a lifelong love of books.", image: "/programs/national-reading-day.webp" },
  { title: "International Yoga Day", date: "2026-06-21", location: "School Grounds", description: "Students and teachers come together for a yoga session promoting physical fitness, mindfulness and inner balance on International Yoga Day.", image: "/programs/international-yoga-day.webp" },
  { title: "Muharram – Holiday", date: "2026-06-25", location: "Holiday", description: "The school remains closed in observance of Muharram. We wish peace and reflection to all members of the Zenithia family.", image: "/programs/muharram-holiday.webp" },
  { title: "International Anti-Drug Day & Malarvadi Programme", date: "2026-06-26", location: "School Auditorium", description: "An awareness programme against drug abuse, empowering students to make healthy choices, combined with Malarvadi activities that build confidence and character.", image: "/programs/international-anti-drug-day-malarvadi-programme.webp" },
  { title: "National Doctors' Day", date: "2026-07-01", location: "School Campus", description: "We honour the dedication of doctors and healthcare workers. Students learn about medicine and gratitude through engaging activities and role-play.", image: "/programs/national-doctors-day.webp" },
  { title: "Basheer Day", date: "2026-07-05", location: "School Auditorium", description: "A literary tribute to the legendary Malayalam writer Vaikom Muhammad Basheer, celebrating his stories and the timeless beauty of language and literature.", image: "/programs/basheer-day.webp" },
  { title: "International Moon Day", date: "2026-07-20", location: "School Grounds", description: "Celebrating humankind's journey to the Moon, students explore space and astronomy through stargazing, models and interactive science activities.", image: "/programs/international-moon-day.webp" },
  { title: "Hiroshima Day", date: "2026-08-06", location: "School Auditorium", description: "On Hiroshima Day, students reflect on the value of peace and non-violence, releasing paper cranes and pledging to build a more compassionate world.", image: "/programs/hiroshima-day.webp" },
  { title: "Quit India Day", date: "2026-08-08", location: "School Grounds", description: "Commemorating the Quit India Movement, students remember the freedom struggle with patriotic songs, speeches and a proud tricolour salute.", image: "/programs/quit-india-day.webp" },
  { title: "Nagasaki Day", date: "2026-08-09", location: "School Auditorium", description: "Observing Nagasaki Day, our students renew their commitment to peace and harmony through reflection, art and a candle of hope for the world.", image: "/programs/nagasaki-day.webp" },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@zenithia.net").toLowerCase();
  const pin = process.env.ADMIN_PIN || "345678";
  const passwordHash = await bcrypt.hash(pin, 10);

  // 1. Admin user (login is by 6-digit PIN)
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Administrator" },
  });
  console.log(`✔ Admin user ready: ${email} (PIN login)`);

  // 2. Site settings
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      schoolName: "Zenithia Global School",
      tagline: "Excellence. Leadership. Success.",
      heroTitle:
        "Zenithia leads you toward excellence, leadership, and success.",
      heroSubtitle:
        "A future-ready global school nurturing knowledge, discipline and confidence in every child.",
      heroImageUrl: "/brand/banner-2.png",
      aboutTitle: "About Zenithia Global School",
      aboutBody:
        "Zenithia Global School is a future-ready institution committed to academic excellence and holistic development. We blend a rigorous, globally-benchmarked curriculum with strong values, modern facilities and caring mentorship.\n\nFrom early years to higher grades, our students grow into confident, compassionate and capable individuals — ready to lead and succeed in a changing world.",
      visionBody:
        "To be a globally respected institution that empowers every learner to reach their highest potential with knowledge, character and confidence.",
      missionBody:
        "To deliver holistic, value-based education through innovative teaching, modern facilities and a caring community that nurtures lifelong learners and future leaders.",
      address: "",
      phone: "",
      email: "",
      statStudents: "100+",
      statTeachers: "10+",
      statYears: "7+",
      statAwards: "2+",
    },
  });
  console.log("✔ Site settings ready");

  // 3. Features
  const featureCount = await prisma.feature.count();
  if (featureCount === 0) {
    await prisma.feature.createMany({
      data: [
        { title: "Globally-Benchmarked Curriculum", description: "A rigorous, future-ready curriculum that builds strong academic foundations.", icon: "📘", order: 1 },
        { title: "Expert & Caring Educators", description: "Qualified teachers who mentor every child with attention and care.", icon: "👩\u200d🏫", order: 2 },
        { title: "Safe & Secure Campus", description: "A secure, well-monitored environment where students feel at home.", icon: "🛡", order: 3 },
        { title: "Sports & Co-Curricular", description: "A wide range of sports, arts and activities for all-round growth.", icon: "⚽", order: 4 },
        { title: "Smart Digital Classrooms", description: "Technology-enabled learning that makes lessons engaging and effective.", icon: "💻", order: 5 },
        { title: "Values & Leadership", description: "Discipline, empathy and leadership woven into everyday learning.", icon: "🌟", order: 6 },
      ],
    });
    console.log("✔ Sample features added");
  }

  // 4. Facilities
  const facilityCount = await prisma.facility.count();
  if (facilityCount === 0) {
    await prisma.facility.createMany({
      data: [
        { title: "Modern Classrooms", description: "Spacious, well-lit and digitally-equipped classrooms designed for focused, interactive learning.", icon: "🏫", order: 1, imageUrl: FACILITY_IMAGES["Modern Classrooms"] },
        { title: "Science & Computer Labs", description: "Fully-equipped laboratories that encourage hands-on experiments and digital skills.", icon: "🔬", order: 2, imageUrl: FACILITY_IMAGES["Science & Computer Labs"] },
        { title: "Library & Resource Centre", description: "A rich collection of books and resources to nurture a lifelong love of reading.", icon: "📚", order: 3, imageUrl: FACILITY_IMAGES["Library & Resource Centre"] },
        { title: "Sports & Playground", description: "Expansive grounds and courts for athletics, games and physical fitness.", icon: "🏆", order: 4, imageUrl: FACILITY_IMAGES["Sports & Playground"] },
        { title: "Arts & Activity Rooms", description: "Dedicated spaces for music, dance, art and creative expression.", icon: "🎨", order: 5, imageUrl: FACILITY_IMAGES["Arts & Activity Rooms"] },
        { title: "Safe Transport", description: "Reliable, GPS-enabled school transport with trained staff for student safety.", icon: "🚌", order: 6, imageUrl: FACILITY_IMAGES["Safe Transport"] },
      ],
    });
    console.log("✔ Sample facilities added");
  }

  // Backfill facility images for any existing rows that are missing one
  // (e.g. databases seeded before images were included).
  for (const [title, imageUrl] of Object.entries(FACILITY_IMAGES)) {
    await prisma.facility.updateMany({
      where: { title, imageUrl: null },
      data: { imageUrl },
    });
  }
  console.log("✔ Facility images ensured");

  // 5. Programs (2026-27 calendar with branded images)
  for (const p of PROGRAMS) {
    const existing = await prisma.program.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.program.create({
        data: {
          title: p.title,
          description: p.description,
          date: new Date(`${p.date}T00:00:00.000Z`),
          location: p.location,
          imageUrl: p.image,
        },
      });
    } else if (!existing.imageUrl) {
      await prisma.program.update({
        where: { id: existing.id },
        data: { imageUrl: p.image },
      });
    }
  }
  console.log("✔ Programs ensured (with images)");

  console.log("\n🎉 Seed complete.");
  console.log(`   Admin login PIN: ${pin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
