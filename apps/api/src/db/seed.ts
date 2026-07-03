import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import { hashPassword } from '../lib/password.js';
import {
  stores,
  users,
  categories,
  locations,
  products,
  productBarcodes,
  countSessions,
  countLines,
  storeSettings,
  auditEvents,
} from './schema.js';
import { EntityType, AuditAction } from '@shopcount/types';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log('Seeding ShopCount database...');

  const [store] = await db
    .insert(stores)
    .values({
      name: 'Desi Mart Neighborhood Store',
      code: 'DESI-001',
      address: '123 Main Street, Jersey City, NJ',
    })
    .onConflictDoNothing()
    .returning();

  let storeId: string;
  if (store) {
    storeId = store.id;
  } else {
    const existing = await db.select().from(stores).limit(1);
    storeId = existing[0]!.id;
  }

  const passwordHash = await hashPassword('password123');

  const seedUsers = [
    { email: 'owner@desimart.com', name: 'Raj Patel', role: 'owner' as const },
    { email: 'manager@desimart.com', name: 'Priya Sharma', role: 'manager' as const },
    { email: 'staff@desimart.com', name: 'Amit Kumar', role: 'staff' as const },
    { email: 'staff2@desimart.com', name: 'Sneha Reddy', role: 'staff' as const },
  ];

  const insertedUsers = [];
  for (const u of seedUsers) {
    const [user] = await db
      .insert(users)
      .values({ ...u, storeId, passwordHash })
      .onConflictDoNothing()
      .returning();
    if (user) insertedUsers.push(user);
  }

  const allUsers = insertedUsers.length
    ? insertedUsers
    : await db.select().from(users).where(eq(users.storeId, storeId));
  const managerUser = allUsers.find((u) => u.role === 'manager') ?? allUsers[0];
  const staffUser = allUsers.find((u) => u.role === 'staff') ?? allUsers[0];

  const categoryData = [
    { name: 'Rice & Grains', slug: 'rice-grains', restrictedCategory: false, sortOrder: 1 },
    { name: 'Flour & Atta', slug: 'flour-atta', restrictedCategory: false, sortOrder: 2 },
    { name: 'Dals & Lentils', slug: 'dals-lentils', restrictedCategory: false, sortOrder: 3 },
    { name: 'Spices & Masalas', slug: 'spices-masalas', restrictedCategory: false, sortOrder: 4 },
    { name: 'Frozen Snacks', slug: 'frozen-snacks', restrictedCategory: false, sortOrder: 5 },
    { name: 'Soft Drinks', slug: 'soft-drinks', restrictedCategory: false, sortOrder: 6 },
    { name: 'Alcohol', slug: 'alcohol', restrictedCategory: true, sortOrder: 7 },
    { name: 'Tobacco', slug: 'tobacco', restrictedCategory: true, sortOrder: 8 },
  ];

  const insertedCategories = [];
  for (const c of categoryData) {
    const [cat] = await db
      .insert(categories)
      .values({ ...c, storeId })
      .onConflictDoNothing()
      .returning();
    if (cat) insertedCategories.push(cat);
  }

  const catMap = Object.fromEntries(insertedCategories.map((c) => [c.slug, c.id]));

  const locationData = [
    { name: 'Front Shelf', code: 'FRONT', sortOrder: 1 },
    { name: 'Back Room', code: 'BACK', sortOrder: 2 },
    { name: 'Freezer', code: 'FREEZER', sortOrder: 3 },
    { name: 'Tobacco Counter', code: 'TOBACCO', sortOrder: 4 },
    { name: 'Liquor Shelf', code: 'LIQUOR', sortOrder: 5 },
    { name: 'Cashier Area', code: 'CASHIER', sortOrder: 6 },
  ];

  const insertedLocations = [];
  for (const l of locationData) {
    const [loc] = await db
      .insert(locations)
      .values({ ...l, storeId })
      .onConflictDoNothing()
      .returning();
    if (loc) insertedLocations.push(loc);
  }

  const locMap = Object.fromEntries(insertedLocations.map((l) => [l.code, l.id]));

  const productData = [
    { sku: 'RICE-001', name: 'Basmati Rice 10lb', category: 'rice-grains', brand: 'Royal', unitType: 'pack' as const, barcode: '8901234567001', expectedQty: 24, reorderLevel: 6 },
    { sku: 'RICE-002', name: 'Sona Masoori Rice 20lb', category: 'rice-grains', brand: 'Laxmi', unitType: 'pack' as const, barcode: '8901234567002', expectedQty: 18, reorderLevel: 4 },
    { sku: 'ATTA-001', name: 'Aashirvaad Atta 10kg', category: 'flour-atta', brand: 'Aashirvaad', unitType: 'pack' as const, barcode: '8901234567010', expectedQty: 30, reorderLevel: 8 },
    { sku: 'ATTA-002', name: 'Pillsbury Chakki Atta 20lb', category: 'flour-atta', brand: 'Pillsbury', unitType: 'pack' as const, barcode: '8901234567011', expectedQty: 15, reorderLevel: 5 },
    { sku: 'DAL-001', name: 'Toor Dal 4lb', category: 'dals-lentils', brand: 'SWAD', unitType: 'pack' as const, barcode: '8901234567020', expectedQty: 20, reorderLevel: 6 },
    { sku: 'DAL-002', name: 'Moong Dal 2lb', category: 'dals-lentils', brand: 'Deep', unitType: 'pack' as const, barcode: '8901234567021', expectedQty: 25, reorderLevel: 8 },
    { sku: 'DAL-003', name: 'Chana Dal 4lb', category: 'dals-lentils', brand: 'SWAD', unitType: 'pack' as const, barcode: '8901234567022', expectedQty: 16, reorderLevel: 5 },
    { sku: 'MAS-001', name: 'MDH Garam Masala 100g', category: 'spices-masalas', brand: 'MDH', unitType: 'pouch' as const, barcode: '8901234567030', expectedQty: 40, reorderLevel: 10 },
    { sku: 'MAS-002', name: 'Shan Biryani Masala', category: 'spices-masalas', brand: 'Shan', unitType: 'pouch' as const, barcode: '8901234567031', expectedQty: 35, reorderLevel: 10 },
    { sku: 'MAS-003', name: 'Everest Tikka Masala', category: 'spices-masalas', brand: 'Everest', unitType: 'pouch' as const, barcode: '8901234567032', expectedQty: 28, reorderLevel: 8 },
    { sku: 'FRZ-001', name: 'Haldiram Samosa 12pc', category: 'frozen-snacks', brand: 'Haldiram', unitType: 'pack' as const, barcode: '8901234567040', expectedQty: 12, reorderLevel: 4 },
    { sku: 'FRZ-002', name: 'Deep Punjabi Samosa', category: 'frozen-snacks', brand: 'Deep', unitType: 'pack' as const, barcode: '8901234567041', expectedQty: 10, reorderLevel: 3 },
    { sku: 'DRK-001', name: 'Thums Up 2L', category: 'soft-drinks', brand: 'Coca-Cola', unitType: 'bottle' as const, barcode: '8901234567050', expectedQty: 24, reorderLevel: 8 },
    { sku: 'DRK-002', name: 'Limca 2L', category: 'soft-drinks', brand: 'Coca-Cola', unitType: 'bottle' as const, barcode: '8901234567051', expectedQty: 18, reorderLevel: 6 },
    { sku: 'DRK-003', name: 'Mango Lassi 1L', category: 'soft-drinks', brand: 'Nanak', unitType: 'bottle' as const, barcode: '8901234567052', expectedQty: 8, reorderLevel: 4 },
    { sku: 'ALC-001', name: 'Kingfisher Premium 6pk', category: 'alcohol', brand: 'Kingfisher', unitType: 'pack' as const, barcode: '8901234567060', expectedQty: 48, reorderLevel: 12, restrictedType: 'alcohol' as const },
    { sku: 'ALC-002', name: 'Corona Extra 6pk', category: 'alcohol', brand: 'Corona', unitType: 'pack' as const, barcode: '8901234567061', expectedQty: 36, reorderLevel: 10, restrictedType: 'alcohol' as const },
    { sku: 'ALC-003', name: 'Smirnoff Vodka 750ml', category: 'alcohol', brand: 'Smirnoff', unitType: 'bottle' as const, barcode: '8901234567062', expectedQty: 24, reorderLevel: 6, restrictedType: 'alcohol' as const },
    { sku: 'TOB-001', name: 'Marlboro Red Pack', category: 'tobacco', brand: 'Marlboro', unitType: 'pack' as const, barcode: '8901234567070', expectedQty: 60, reorderLevel: 15, restrictedType: 'tobacco' as const },
    { sku: 'TOB-002', name: 'Camel Blue Pack', category: 'tobacco', brand: 'Camel', unitType: 'pack' as const, barcode: '8901234567071', expectedQty: 45, reorderLevel: 12, restrictedType: 'tobacco' as const },
  ];

  const insertedProducts = [];
  for (const p of productData) {
    const isRestricted = p.restrictedType !== undefined;
    const [product] = await db
      .insert(products)
      .values({
        storeId,
        sku: p.sku,
        name: p.name,
        categoryId: catMap[p.category],
        brand: p.brand,
        unitType: p.unitType,
        barcodePrimary: p.barcode,
        restrictedCategory: isRestricted,
        restrictedType: p.restrictedType ?? 'none',
        expectedQty: p.expectedQty,
        reorderLevel: p.reorderLevel,
      })
      .onConflictDoNothing()
      .returning();

    if (product) {
      insertedProducts.push(product);
      await db.insert(productBarcodes).values({
        productId: product.id,
        barcode: p.barcode,
        isPrimary: true,
      }).onConflictDoNothing();

      // Add alternate barcode for some items
      if (p.sku === 'RICE-001') {
        await db.insert(productBarcodes).values({
          productId: product.id,
          barcode: '8901234567999',
          isPrimary: false,
        }).onConflictDoNothing();
      }
    }
  }

  const [session] = await db
    .insert(countSessions)
    .values({
      storeId,
      sessionName: 'Weekly Full Count - July',
      countType: 'full',
      status: 'in_progress',
      createdBy: staffUser!.id,
      assignedTo: [staffUser!.id, managerUser!.id],
      categoryIds: Object.values(catMap),
      locationIds: Object.values(locMap),
      startedAt: new Date(),
      notes: 'End of month full store count',
    })
    .returning();

  const sampleProducts = insertedProducts.slice(0, 8);
  for (let i = 0; i < sampleProducts.length; i++) {
    const product = sampleProducts[i];
    const locationId = insertedLocations[i % insertedLocations.length].id;
    const countedQty = product.expectedQty + (i % 3 === 0 ? -2 : i % 3 === 1 ? 0 : 1);
    const varianceQty = countedQty - product.expectedQty;

    await db.insert(countLines).values({
      sessionId: session.id,
      productId: product.id,
      locationId,
      expectedQty: product.expectedQty,
      countedQty,
      varianceQty,
      variancePercent: product.expectedQty ? (varianceQty / product.expectedQty) * 100 : 0,
      enteredBy: staffUser!.id,
      enteredAt: new Date(),
      requiresApproval: product.restrictedCategory && varianceQty !== 0,
    });
  }

  const [reviewSession] = await db
    .insert(countSessions)
    .values({
      storeId,
      sessionName: 'Liquor Spot Check',
      countType: 'spot',
      status: 'review',
      createdBy: managerUser!.id,
      assignedTo: [staffUser!.id],
      categoryIds: [catMap['alcohol']],
      locationIds: [locMap['LIQUOR']],
      startedAt: new Date(Date.now() - 86400000),
      submittedAt: new Date(),
    })
    .returning();

  const alcoholProducts = insertedProducts.filter((p) => p.restrictedType === 'alcohol');
  for (const product of alcoholProducts) {
    const countedQty = product.expectedQty - 3;
    await db.insert(countLines).values({
      sessionId: reviewSession.id,
      productId: product.id,
      locationId: locMap['LIQUOR'],
      expectedQty: product.expectedQty,
      countedQty,
      varianceQty: countedQty - product.expectedQty,
      variancePercent: ((countedQty - product.expectedQty) / product.expectedQty) * 100,
      enteredBy: staffUser!.id,
      enteredAt: new Date(),
      requiresApproval: true,
      reasonCode: 'unknown_shrink',
    });
  }

  await db.insert(storeSettings).values({ storeId }).onConflictDoNothing();

  if (managerUser && staffUser) {
    await db.insert(auditEvents).values([
      {
        entityType: EntityType.COUNT_SESSION,
        entityId: session.id,
        action: AuditAction.SESSION_CREATED,
        userId: staffUser.id,
        newValue: { sessionName: session.sessionName },
      },
      {
        entityType: EntityType.COUNT_LINE,
        entityId: reviewSession.id,
        action: AuditAction.LINE_COUNTED,
        userId: staffUser.id,
        newValue: { note: 'Liquor spot check complete' },
      },
      {
        entityType: EntityType.PRODUCT,
        entityId: insertedProducts[0]?.id ?? storeId,
        action: AuditAction.PRODUCT_UPDATED,
        userId: managerUser.id,
        newValue: { action: 'seed', sku: insertedProducts[0]?.sku },
      },
    ]);
  }

  console.log('Seed complete!');
  console.log('\nDemo credentials (password: password123):');
  console.log('  Owner:   owner@desimart.com');
  console.log('  Manager: manager@desimart.com');
  console.log('  Staff:   staff@desimart.com');
  console.log(`\nStore ID: ${storeId}`);

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
