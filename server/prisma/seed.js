const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { PrismaPg } = require("@prisma/adapter-pg");
const {
  PrismaClient,
  MediaType,
  OrderStatus,
  RoleName,
} = require("@prisma/client");

function readEnvValue(key) {
  if (process.env[key]) {
    return process.env[key];
  }

  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    return "";
  }

  const content = fs.readFileSync(envPath, "utf8");
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) {
    return "";
  }

  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");
}

const connectionString = readEnvValue("DATABASE_URL");

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in server/.env");
}

const seedConfig = {
  adminEmail: readEnvValue("ADMIN_EMAIL") || "admin@admin.ru",
  adminPassword: readEnvValue("ADMIN_PASSWORD") || "admin123!",
  adminFullName: readEnvValue("ADMIN_FULL_NAME") || "Главный администратор",
  adminPhone: readEnvValue("ADMIN_PHONE") || "+7 (900) 100-00-01",
  demoUserEmail: readEnvValue("DEMO_USER_EMAIL") || "user@inclusive-shop.local",
  demoUserPassword: readEnvValue("DEMO_USER_PASSWORD") || "User123!",
  demoUserFullName:
    readEnvValue("DEMO_USER_FULL_NAME") || "Тестовый пользователь",
  demoUserPhone: readEnvValue("DEMO_USER_PHONE") || "+7 (900) 000-00-02",
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categoryDefinitions = [
  { name: "Устройства чтения", slug: "readers", sortOrder: 1 },
  { name: "Аудиоаксессуары", slug: "audio", sortOrder: 2 },
  { name: "Навигация", slug: "navigation", sortOrder: 3 },
];

const imagePools = {
  readers: [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  ],
  audio: [
    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580894908361-967195033215?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=1200&q=80",
  ],
  navigation: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  ],
};

function buildCharacteristicEntries(prefix, kind, variantIndex) {
  if (prefix === "BRAILLE") {
    return {
      "Количество ячеек": String(20 + ((variantIndex % 4) + 1) * 8),
      Подключение:
        variantIndex % 2 === 0 ? "Bluetooth / USB-C" : "USB-C / Wi-Fi",
      Автономность: `${12 + variantIndex} часов`,
    };
  }

  if (prefix === "AUDIO") {
    return {
      Автономность: `${10 + variantIndex} часов`,
      Подключение:
        variantIndex % 2 === 0 ? "Bluetooth 5.3" : "USB-C / 3.5 мм",
      "Сценарий использования":
        kind === "Микрофон" ? "Озвучка и запись" : "Музыка, подсказки и звонки",
    };
  }

  return {
    "Сценарий использования":
      kind === "BLE-метка" ? "Поиск личных вещей" : "Маршруты и передвижение",
    Автономность: `${6 + variantIndex} месяцев`,
    Защита: variantIndex % 2 === 0 ? "IP54" : "IP55",
  };
}

function createGeneratedProducts(categoryId, options) {
  const {
    prefix,
    categoryKey,
    kinds,
    models,
    suffixes,
    priceBase,
    priceStep,
    stockBase,
    descriptionLead,
    badgePrefix,
  } = options;

  const products = [];
  let cursor = 1;

  for (const kind of kinds) {
    for (const model of models) {
      for (const suffix of suffixes) {
        const sku = `${prefix}-${String(cursor).padStart(3, "0")}`;
        const variantIndex = cursor;
        const name = `${kind} ${model} ${suffix}`;
        const price =
          priceBase + cursor * priceStep + (categoryKey === "navigation" ? 490 : 0);
        const stockQty = stockBase + (cursor % 11);
        const imageUrl =
          imagePools[categoryKey][cursor % imagePools[categoryKey].length];

        products.push({
          sku,
          categoryId,
          name,
          description: `${descriptionLead} ${name} помогает в сценариях чтения, озвучивания и навигации без перегруженного интерфейса и со стабильной поддержкой accessibility-настроек.`,
          price: `${price}.00`,
          stockQty,
          badge: `${badgePrefix} ${suffix}`,
          characteristics: buildCharacteristicEntries(prefix, kind, variantIndex),
          media: [
            {
              mediaType: MediaType.IMAGE,
              fileUrl: imageUrl,
              altText: `${name} на демонстрационном фото каталога.`,
              sortOrder: 1,
            },
          ],
        });

        cursor += 1;
      }
    }
  }

  return products;
}

function buildCatalog(categories) {
  const readers = categories.readers.id;
  const audio = categories.audio.id;
  const navigation = categories.navigation.id;

  return [
    ...createGeneratedProducts(readers, {
      prefix: "BRAILLE",
      categoryKey: "readers",
      kinds: [
        "Портативный дисплей Брайля",
        "Электронная лупа",
        "OCR-сканер",
        "Видеоувеличитель",
      ],
      models: ["Sense", "Focus", "Vision"],
      suffixes: ["Lite", "Pro", "Max"],
      priceBase: 28990,
      priceStep: 3250,
      stockBase: 4,
      descriptionLead: "Устройство чтения и распознавания.",
      badgePrefix: "Для чтения",
    }),
    ...createGeneratedProducts(audio, {
      prefix: "AUDIO",
      categoryKey: "audio",
      kinds: ["Наушники", "Гарнитура", "Саундбар", "Микрофон"],
      models: ["Quiet", "Voice", "Clear"],
      suffixes: ["Lite", "Pro", "Max"],
      priceBase: 3490,
      priceStep: 1590,
      stockBase: 8,
      descriptionLead: "Аудиоустройство для подсказок, звонков и озвучки.",
      badgePrefix: "Для звука",
    }),
    ...createGeneratedProducts(navigation, {
      prefix: "NAVI",
      categoryKey: "navigation",
      kinds: ["GPS-навигатор", "BLE-метка", "Вибронавигатор", "Умная трость"],
      models: ["Route", "City", "Guide"],
      suffixes: ["Lite", "Pro", "Max"],
      priceBase: 4490,
      priceStep: 2190,
      stockBase: 3,
      descriptionLead: "Навигационное решение для города и помещений.",
      badgePrefix: "Для маршрутов",
    }),
  ];
}

async function clearStoreData() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.product.deleteMany();
  await prisma.accessibilitySettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.deliveryMethod.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.category.deleteMany();
}

async function upsertRoles() {
  for (const roleName of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
}

async function upsertCategories() {
  for (const category of categoryDefinitions) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const categories = await prisma.category.findMany();
  return {
    readers: categories.find((item) => item.slug === "readers"),
    audio: categories.find((item) => item.slug === "audio"),
    navigation: categories.find((item) => item.slug === "navigation"),
  };
}

async function upsertUsers() {
  const adminPasswordHash = await bcrypt.hash(seedConfig.adminPassword, 10);
  const userPasswordHash = await bcrypt.hash(seedConfig.demoUserPassword, 10);

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMIN },
  });
  const userRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.USER },
  });

  const admin = await prisma.user.create({
    data: {
      email: seedConfig.adminEmail,
      fullName: seedConfig.adminFullName,
      phone: seedConfig.adminPhone,
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      isActive: true,
      settings: {
        create: {
          fontScale: 100,
          focusHighlight: true,
        },
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      email: seedConfig.demoUserEmail,
      fullName: seedConfig.demoUserFullName,
      phone: seedConfig.demoUserPhone,
      passwordHash: userPasswordHash,
      roleId: userRole.id,
      isActive: true,
      settings: {
        create: {
          fontScale: 110,
          voiceHints: true,
        },
      },
    },
  });

  return { admin, user };
}

async function seedProducts(categories) {
  const products = buildCatalog(categories);

  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: {
        categoryId: product.categoryId,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        stockQty: product.stockQty,
        isActive: true,
        badge: product.badge,
        characteristics: product.characteristics,
      },
    });

    await prisma.productMedia.createMany({
      data: product.media.map((media) => ({
        productId: createdProduct.id,
        mediaType: media.mediaType,
        fileUrl: media.fileUrl,
        altText: media.altText,
        sortOrder: media.sortOrder,
      })),
    });
  }
}

async function upsertMeta() {
  await prisma.deliveryMethod.createMany({
    data: [
      {
        id: 1,
        name: "Курьер",
        description: "Доставка до двери",
        price: "490.00",
        isActive: true,
      },
      {
        id: 2,
        name: "ПВЗ",
        description: "Самовывоз из пункта выдачи",
        price: "290.00",
        isActive: true,
      },
      {
        id: 3,
        name: "Экспресс",
        description: "Доставка в течение дня в крупных городах",
        price: "790.00",
        isActive: true,
      },
    ],
  });

  await prisma.paymentMethod.createMany({
    data: [
      {
        id: 1,
        name: "Банковская карта",
        description: "Онлайн-оплата на сайте",
        isActive: true,
      },
      {
        id: 2,
        name: "При получении",
        description: "Оплата после доставки",
        isActive: true,
      },
      {
        id: 3,
        name: "СБП",
        description: "Оплата через систему быстрых платежей",
        isActive: true,
      },
    ],
  });
}

async function seedReviewsAndFavorites(userId) {
  const [readerProduct, audioProduct, navigationProduct] = await Promise.all([
    prisma.product.findUniqueOrThrow({ where: { sku: "BRAILLE-001" } }),
    prisma.product.findUniqueOrThrow({ where: { sku: "AUDIO-001" } }),
    prisma.product.findUniqueOrThrow({ where: { sku: "NAVI-001" } }),
  ]);

  await prisma.review.createMany({
    data: [
      {
        productId: readerProduct.id,
        userId,
        rating: 5,
        advantages: "Тактильный отклик и удобные кнопки",
        disadvantages: "Нужно время на привыкание",
        comment:
          "Хорошо подходит для чтения карточек товара и быстрого доступа к описаниям.",
      },
      {
        productId: audioProduct.id,
        userId,
        rating: 4,
        advantages: "Чистый звук и понятные голосовые подсказки",
        disadvantages: "Хотелось бы более компактный кейс",
        comment:
          "Удобный вариант для прослушивания уведомлений и ассистивных сценариев.",
      },
      {
        productId: navigationProduct.id,
        userId,
        rating: 5,
        advantages: "Понятные сигналы и хорошая автономность",
        disadvantages: "Нужна калибровка маршрута в первый день",
        comment:
          "Для города и поездок очень удобная вещь, особенно с озвучкой маршрута.",
      },
    ],
  });

  await prisma.favorite.createMany({
    data: [
      { userId, productId: readerProduct.id },
      { userId, productId: audioProduct.id },
      { userId, productId: navigationProduct.id },
    ],
  });
}

async function seedOrderHistory(userId) {
  const [audioProduct, navigationProduct] = await Promise.all([
    prisma.product.findUniqueOrThrow({ where: { sku: "AUDIO-001" } }),
    prisma.product.findUniqueOrThrow({ where: { sku: "NAVI-001" } }),
  ]);

  await prisma.order.create({
    data: {
      userId,
      deliveryMethodId: 2,
      paymentMethodId: 1,
      status: OrderStatus.CONFIRMED,
      totalAmount: "26360.00",
      recipientName: seedConfig.demoUserFullName,
      recipientPhone: seedConfig.demoUserPhone,
      deliveryAddress: "Челябинск, пр. Ленина, 1",
      items: {
        create: [
          {
            productId: audioProduct.id,
            quantity: 1,
            unitPrice: audioProduct.price,
          },
          {
            productId: navigationProduct.id,
            quantity: 1,
            unitPrice: navigationProduct.price,
          },
        ],
      },
    },
  });
}

async function main() {
  await clearStoreData();
  await upsertRoles();
  const categories = await upsertCategories();
  const { user } = await upsertUsers();
  await upsertMeta();
  await seedProducts(categories);
  await seedReviewsAndFavorites(user.id);
  await seedOrderHistory(user.id);

  const productsCount = await prisma.product.count();
  console.log(`Seed completed successfully. Products created: ${productsCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
