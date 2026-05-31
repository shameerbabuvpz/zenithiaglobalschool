import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
        { title: "Modern Classrooms", description: "Spacious, well-lit and digitally-equipped classrooms designed for focused, interactive learning.", icon: "🏫", order: 1 },
        { title: "Science & Computer Labs", description: "Fully-equipped laboratories that encourage hands-on experiments and digital skills.", icon: "🔬", order: 2 },
        { title: "Library & Resource Centre", description: "A rich collection of books and resources to nurture a lifelong love of reading.", icon: "📚", order: 3 },
        { title: "Sports & Playground", description: "Expansive grounds and courts for athletics, games and physical fitness.", icon: "🏆", order: 4 },
        { title: "Arts & Activity Rooms", description: "Dedicated spaces for music, dance, art and creative expression.", icon: "🎨", order: 5 },
        { title: "Safe Transport", description: "Reliable, GPS-enabled school transport with trained staff for student safety.", icon: "🚌", order: 6 },
      ],
    });
    console.log("✔ Sample facilities added");
  }

  // 5. Programs
  const programCount = await prisma.program.count();
  if (programCount === 0) {
    await prisma.program.createMany({
      data: [
        { title: "Annual Day Celebration", description: "A grand showcase of student talent through music, dance and drama.", location: "School Auditorium" },
        { title: "Admissions Open House", description: "Visit our campus, meet our teachers and explore life at Zenithia.", location: "Main Campus" },
        { title: "Science & Innovation Fair", description: "Students present creative projects and experiments across grades.", location: "Science Block" },
      ],
    });
    console.log("✔ Sample programs added");
  }

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
