import { Router } from 'express';
import {
  loginSchema,
  refreshTokenSchema,
  createCountSessionSchema,
  updateCountSessionSchema,
  upsertCountLineSchema,
  syncBatchSchema,
  productSearchSchema,
  barcodeLookupSchema,
  createUserSchema,
  createProductSchema,
  updateProductSchema,
} from '@shopcount/types';
import {
  createCategorySchema,
  updateCategorySchema,
  createLocationSchema,
  updateLocationSchema,
  productImportRequestSchema,
} from '@shopcount/types';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, sendSuccess, AppError } from '../lib/errors.js';
import { param } from '../lib/params.js';
import * as services from '../services/index.js';
import { UserRole } from '@shopcount/types';

const router = Router();

/**
 * @openapi
 * POST /auth/login
 * Authenticate user and receive JWT tokens
 */
router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await services.login(input);
    sendSuccess(res, result);
  }),
);

/**
 * @openapi
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/auth/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await services.refresh(refreshToken);
    sendSuccess(res, result);
  }),
);

/**
 * @openapi
 * GET /auth/me
 * Get current authenticated user
 */
router.get(
  '/auth/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await services.getMe(req.user!.id);
    sendSuccess(res, user);
  }),
);

/**
 * @openapi
 * GET /products
 * List products with search and filters
 */
router.get(
  '/products',
  authenticate,
  asyncHandler(async (req, res) => {
    const params = productSearchSchema.parse({
      ...req.query,
      storeId: req.query.storeId ?? req.user!.storeId,
    });
    if (!params.storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const result = await services.listProducts(params);
    sendSuccess(res, result);
  }),
);

/**
 * @openapi
 * GET /products/export
 * Export product master as CSV
 */
router.get(
  '/products/export',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const storeId = (req.query.storeId as string) ?? req.user!.storeId;
    if (!storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const csv = await services.exportProductsCsv(storeId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  }),
);

/**
 * @openapi
 * POST /products/import
 * Bulk import products from CSV rows (scaffold)
 */
router.post(
  '/products/import',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const input = productImportRequestSchema.parse(req.body);
    const result = await services.importProducts(
      req.user!.id,
      input,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, result);
  }),
);

/**
 * @openapi
 * POST /products
 * Create product (manager+)
 */
router.post(
  '/products',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const input = createProductSchema.parse({
      ...req.body,
      storeId: req.body.storeId ?? req.user!.storeId,
    });
    if (!input.storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const product = await services.createProduct(
      req.user!.id,
      input,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, product, 201);
  }),
);

/**
 * @openapi
 * GET /products/:id
 * Get product by ID
 */
router.get(
  '/products/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const product = await services.getProduct(param(req.params.id));
    sendSuccess(res, product);
  }),
);

/**
 * @openapi
 * PATCH /products/:id
 * Update product (manager+)
 */
router.patch(
  '/products/:id',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const updates = updateProductSchema.parse(req.body);
    const product = await services.updateProduct(
      param(req.params.id),
      req.user!.id,
      updates,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, product);
  }),
);

/**
 * @openapi
 * DELETE /products/:id
 * Soft-delete product (owner only)
 */
router.delete(
  '/products/:id',
  authenticate,
  authorize(UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const product = await services.deleteProduct(
      param(req.params.id),
      req.user!.id,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, product);
  }),
);

/**
 * @openapi
 * POST /products/lookup-barcode
 * Lookup products by barcode
 */
router.post(
  '/products/lookup-barcode',
  authenticate,
  asyncHandler(async (req, res) => {
    const { barcode, storeId } = barcodeLookupSchema.parse(req.body);
    const matches = await services.lookupBarcode(storeId, barcode);
    sendSuccess(res, matches);
  }),
);

/**
 * @openapi
 * GET /categories
 * List categories for store
 */
router.get(
  '/categories',
  authenticate,
  asyncHandler(async (req, res) => {
    const storeId = (req.query.storeId as string) ?? req.user!.storeId;
    if (!storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const categories = await services.listCategories(storeId);
    sendSuccess(res, categories);
  }),
);

router.post(
  '/categories',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const input = createCategorySchema.parse({
      ...req.body,
      storeId: req.body.storeId ?? req.user!.storeId,
    });
    if (!input.storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const category = await services.createCategory(
      req.user!.id,
      input,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, category, 201);
  }),
);

router.get(
  '/categories/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const category = await services.getCategory(param(req.params.id));
    sendSuccess(res, category);
  }),
);

router.patch(
  '/categories/:id',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const updates = updateCategorySchema.parse(req.body);
    const category = await services.updateCategory(
      param(req.params.id),
      req.user!.id,
      updates,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, category);
  }),
);

router.delete(
  '/categories/:id',
  authenticate,
  authorize(UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const result = await services.deleteCategory(
      param(req.params.id),
      req.user!.id,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, result);
  }),
);

/**
 * @openapi
 * GET /locations
 * List locations for store
 */
router.get(
  '/locations',
  authenticate,
  asyncHandler(async (req, res) => {
    const storeId = (req.query.storeId as string) ?? req.user!.storeId;
    if (!storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const locations = await services.listLocations(storeId);
    sendSuccess(res, locations);
  }),
);

router.post(
  '/locations',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const input = createLocationSchema.parse({
      ...req.body,
      storeId: req.body.storeId ?? req.user!.storeId,
    });
    if (!input.storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const location = await services.createLocation(
      req.user!.id,
      input,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, location, 201);
  }),
);

router.get(
  '/locations/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const location = await services.getLocation(param(req.params.id));
    sendSuccess(res, location);
  }),
);

router.patch(
  '/locations/:id',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const updates = updateLocationSchema.parse(req.body);
    const location = await services.updateLocation(
      param(req.params.id),
      req.user!.id,
      updates,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, location);
  }),
);

router.delete(
  '/locations/:id',
  authenticate,
  authorize(UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const location = await services.deleteLocation(
      param(req.params.id),
      req.user!.id,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, location);
  }),
);

/**
 * @openapi
 * GET /count-sessions
 * List count sessions
 */
router.get(
  '/count-sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const storeId = (req.query.storeId as string) ?? req.user!.storeId;
    if (!storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const sessions = await services.listSessions(storeId, req.query.status as string | undefined);
    sendSuccess(res, sessions);
  }),
);

/**
 * @openapi
 * POST /count-sessions
 * Create a new count session
 */
router.post(
  '/count-sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const input = createCountSessionSchema.parse(req.body);
    const session = await services.createSession(req.user!.id, input, req.headers['x-device-id'] as string);
    sendSuccess(res, session, 201);
  }),
);

/**
 * @openapi
 * GET /count-sessions/:id
 * Get count session with progress
 */
router.get(
  '/count-sessions/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const session = await services.getSessionWithProgress(param(req.params.id));
    sendSuccess(res, session);
  }),
);

/**
 * @openapi
 * PATCH /count-sessions/:id
 * Update count session
 */
router.patch(
  '/count-sessions/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const updates = updateCountSessionSchema.parse(req.body);
    const session = await services.updateSession(
      param(req.params.id),
      req.user!.id,
      updates,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, session);
  }),
);

/**
 * @openapi
 * GET /count-sessions/:id/lines
 * Get count lines with optional variance filter
 */
router.get(
  '/count-sessions/:id/lines',
  authenticate,
  asyncHandler(async (req, res) => {
    const lines = await services.getSessionLines(param(req.params.id), req.query.filter as string | undefined);
    sendSuccess(res, lines);
  }),
);

/**
 * @openapi
 * PUT /count-sessions/:id/lines
 * Upsert a count line
 */
router.put(
  '/count-sessions/:id/lines',
  authenticate,
  asyncHandler(async (req, res) => {
    const input = upsertCountLineSchema.parse(req.body);
    const line = await services.upsertCountLine(
      param(req.params.id),
      req.user!.id,
      input,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, line);
  }),
);

/**
 * @openapi
 * POST /count-sessions/:sessionId/lines/:lineId/approve
 * Approve a count line (manager+)
 */
router.post(
  '/count-sessions/:sessionId/lines/:lineId/approve',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const line = await services.approveLine(
      param(req.params.lineId),
      req.user!.id,
      req.body.notes,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, line);
  }),
);

/**
 * @openapi
 * POST /count-sessions/:id/approve
 * Approve entire session (manager+)
 */
router.post(
  '/count-sessions/:id/approve',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const session = await services.approveSession(
      param(req.params.id),
      req.user!.id,
      req.body.notes,
      req.headers['x-device-id'] as string,
    );
    sendSuccess(res, session);
  }),
);

/**
 * @openapi
 * POST /count-sessions/:id/unresolved-scans
 * Record unresolved barcode scan
 */
router.post(
  '/count-sessions/:id/unresolved-scans',
  authenticate,
  asyncHandler(async (req, res) => {
    const scan = await services.recordUnresolvedScan({
      sessionId: param(req.params.id),
      locationId: req.body.locationId,
      barcode: req.body.barcode,
      scannedBy: req.user!.id,
    });
    sendSuccess(res, scan, 201);
  }),
);

/**
 * @openapi
 * GET /audit-events
 * List audit events
 */
router.get(
  '/audit-events',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const result = await services.getAuditHistory({
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      userId: req.query.userId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    });
    sendSuccess(res, result);
  }),
);

/**
 * @openapi
 * POST /sync/batch
 * Process offline sync queue batch
 */
router.post(
  '/sync/batch',
  authenticate,
  asyncHandler(async (req, res) => {
    const input = syncBatchSchema.parse(req.body);
    const result = await services.processSyncBatch(req.user!.id, input);
    sendSuccess(res, result);
  }),
);

/**
 * @openapi
 * GET /dashboard
 * Dashboard statistics
 */
router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req, res) => {
    const storeId = (req.query.storeId as string) ?? req.user!.storeId;
    if (!storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const stats = await services.getDashboard(storeId);
    sendSuccess(res, stats);
  }),
);

/**
 * @openapi
 * GET /reports/variance
 * Variance report by category
 */
router.get(
  '/reports/variance',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const storeId = (req.query.storeId as string) ?? req.user!.storeId;
    if (!storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const report = await services.getVarianceReport(storeId);
    sendSuccess(res, report);
  }),
);

/**
 * @openapi
 * GET /reports/low-stock
 * Low stock report
 */
router.get(
  '/reports/low-stock',
  authenticate,
  asyncHandler(async (req, res) => {
    const storeId = (req.query.storeId as string) ?? req.user!.storeId;
    if (!storeId) throw new AppError(400, 'STORE_REQUIRED', 'Store ID is required');
    const report = await services.getLowStockReport(storeId);
    sendSuccess(res, report);
  }),
);

/**
 * @openapi
 * POST /users
 * Create user (owner only)
 */
router.post(
  '/users',
  authenticate,
  authorize(UserRole.OWNER),
  asyncHandler(async (req, res) => {
    const input = createUserSchema.parse(req.body);
    const user = await services.createUser(input);
    sendSuccess(res, user, 201);
  }),
);

export default router;
