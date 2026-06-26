import type { Request, Response } from "express";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  getPreferences,
  getProfile,
  updateAddress,
  updatePreferences,
  updateProfile,
} from "./profile.service";

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 */
export async function getProfileController(req: Request, res: Response): Promise<void> {
  const data = await getProfile(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/profile:
 *   put:
 *     tags: [Profile]
 *     summary: Update profile
 *     security:
 *       - bearerAuth: []
 */
export async function updateProfileController(req: Request, res: Response): Promise<void> {
  const data = await updateProfile(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/profile/addresses:
 *   get:
 *     tags: [Profile]
 *     summary: List saved addresses
 *     security:
 *       - bearerAuth: []
 */
export async function getAddressesController(req: Request, res: Response): Promise<void> {
  const data = await getAddresses(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/profile/addresses:
 *   post:
 *     tags: [Profile]
 *     summary: Add a new address
 *     security:
 *       - bearerAuth: []
 */
export async function createAddressController(req: Request, res: Response): Promise<void> {
  const data = await createAddress(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/profile/addresses/{id}:
 *   put:
 *     tags: [Profile]
 *     summary: Update an address
 *     security:
 *       - bearerAuth: []
 */
export async function updateAddressController(req: Request, res: Response): Promise<void> {
  const data = await updateAddress(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/profile/addresses/{id}:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete an address
 *     security:
 *       - bearerAuth: []
 */
export async function deleteAddressController(req: Request, res: Response): Promise<void> {
  const data = await deleteAddress(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/profile/preferences:
 *   get:
 *     tags: [Profile]
 *     summary: Get user preferences
 *     security:
 *       - bearerAuth: []
 */
export async function getPreferencesController(req: Request, res: Response): Promise<void> {
  const data = await getPreferences(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/profile/preferences:
 *   put:
 *     tags: [Profile]
 *     summary: Update user preferences
 *     security:
 *       - bearerAuth: []
 */
export async function updatePreferencesController(req: Request, res: Response): Promise<void> {
  const data = await updatePreferences(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}
