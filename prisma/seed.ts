import {
  AnimalPersonality,
  AnimalSex,
  AnimalStatus,
  PrismaClient,
  PaymentStatus,
  ShelterMemberRole,
  SponsorshipStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding KotoXata...");

  // Migrate legacy slug from initial project name
  await prisma.shelter.updateMany({
    where: { slug: "kotokhata" },
    data: { slug: "kotoxata", name: "Котохата" },
  });

  const shelter = await prisma.shelter.upsert({
    where: { slug: "kotoxata" },
    update: { name: "Котохата" },
    create: {
      slug: "kotoxata",
      name: "Котохата",
      description:
        "Притулок для котиків, які шукають дім, любов та турботливих опікунів.",
      email: "hello@kotoxata.org",
      bankIban: "UA000000000000000000000000000",
      bankRecipient: "ГО «Котохата»",
      bankName: "Monobank",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kotoxata.org" },
    update: {},
    create: {
      email: "admin@kotoxata.org",
      fullName: "Адміністратор",
      locale: "uk",
    },
  });

  await prisma.shelterMember.upsert({
    where: {
      shelterId_userId: {
        shelterId: shelter.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      shelterId: shelter.id,
      userId: adminUser.id,
      role: ShelterMemberRole.ADMIN,
    },
  });

  const cats = [
    {
      slug: "murchyk",
      name: "Мурчик",
      sex: AnimalSex.MALE,
      status: AnimalStatus.SEEKING_HOME,
      personality: AnimalPersonality.PLAYFUL,
      description: "Грайливий рыжик, який обожнює коробки та сонечко.",
      characterTraits: "Грайливий, ласковий, цікавий",
      vaccinated: true,
      sterilized: true,
      monthlyGoal: 3000,
      minCuratorshipAmount: 500,
    },
    {
      slug: "luna",
      name: "Луна",
      sex: AnimalSex.FEMALE,
      status: AnimalStatus.PARTIALLY_FUNDED,
      personality: AnimalPersonality.SHY,
      description: "Тиха та ніжна. Потребує часу, щоб розкритися.",
      characterTraits: "Сором'язлива, спокійна",
      vaccinated: true,
      sterilized: true,
      monthlyGoal: 2500,
      minCuratorshipAmount: 500,
    },
    {
      slug: "barsik",
      name: "Барсик",
      sex: AnimalSex.MALE,
      status: AnimalStatus.SEEKING_HOME,
      personality: AnimalPersonality.CALM,
      description: "Спокійний джентльмен. Ідеальний для квартири.",
      characterTraits: "Спокійний, мудрий",
      vaccinated: true,
      sterilized: true,
      monthlyGoal: 2800,
      minCuratorshipAmount: 500,
    },
    {
      slug: "simba",
      name: "Сімба",
      sex: AnimalSex.MALE,
      status: AnimalStatus.SEEKING_HOME,
      personality: AnimalPersonality.KITTEN,
      description: "Маленьке кошеня з великими очима та огромним серцем.",
      characterTraits: "Цікавий, грайливий, маленький",
      vaccinated: false,
      sterilized: false,
      monthlyGoal: 2000,
      minCuratorshipAmount: 400,
    },
    {
      slug: "murka",
      name: "Мурка",
      sex: AnimalSex.FEMALE,
      status: AnimalStatus.SEEKING_HOME,
      personality: AnimalPersonality.SERIOUS,
      description: "Постійна мешканка притулку. Шукає дім та опікуна.",
      characterTraits: "Serious, dignified, independent",
      vaccinated: true,
      sterilized: true,
      monthlyGoal: 3500,
      minCuratorshipAmount: 500,
    },
  ];

  for (const cat of cats) {
    await prisma.animal.upsert({
      where: {
        shelterId_slug: {
          shelterId: shelter.id,
          slug: cat.slug,
        },
      },
      update: cat,
      create: {
        ...cat,
        shelterId: shelter.id,
        isPublic: true,
        location: "Котохата, Київ",
      },
    });
  }

  console.log(`✅ Seeded shelter "${shelter.name}" with ${cats.length} cats`);

  const luna = await prisma.animal.findFirst({
    where: { shelterId: shelter.id, slug: "luna" },
  });

  const demoCurator = await prisma.user.upsert({
    where: { email: "curator@kotoxata.org" },
    update: {},
    create: {
      email: "curator@kotoxata.org",
      fullName: "Демо-куратор",
      locale: "uk",
    },
  });

  if (luna) {
    const sponsorship = await prisma.sponsorship.upsert({
      where: {
        animalId_sponsorId: { animalId: luna.id, sponsorId: demoCurator.id },
      },
      update: {
        monthlyAmount: 1250,
        status: SponsorshipStatus.ACTIVE,
      },
      create: {
        animalId: luna.id,
        sponsorId: demoCurator.id,
        monthlyAmount: 1250,
        status: SponsorshipStatus.ACTIVE,
      },
    });

    await prisma.sponsorshipPayment.upsert({
      where: { id: "seed-luna-payment-1" },
      update: {},
      create: {
        id: "seed-luna-payment-1",
        sponsorshipId: sponsorship.id,
        amount: 1250,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    await prisma.curatorNote.upsert({
      where: { id: "seed-curator-note-1" },
      update: { content: "Демо-куратор Луни. Завжди вчасно переказує, любить отримувати фото." },
      create: {
        id: "seed-curator-note-1",
        shelterId: shelter.id,
        sponsorId: demoCurator.id,
        authorId: adminUser.id,
        content: "Демо-куратор Луни. Завжди вчасно переказує, любить отримувати фото.",
      },
    });
  }

  const simba = await prisma.animal.findFirst({
    where: { shelterId: shelter.id, slug: "simba" },
  });

  const pendingCurator = await prisma.user.upsert({
    where: { email: "pending@kotoxata.org" },
    update: {},
    create: {
      email: "pending@kotoxata.org",
      fullName: "Очікує підтвердження",
      locale: "uk",
    },
  });

  if (simba) {
    await prisma.sponsorship.upsert({
      where: {
        animalId_sponsorId: { animalId: simba.id, sponsorId: pendingCurator.id },
      },
      update: { status: SponsorshipStatus.PENDING, monthlyAmount: 800 },
      create: {
        animalId: simba.id,
        sponsorId: pendingCurator.id,
        monthlyAmount: 800,
        status: SponsorshipStatus.PENDING,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
