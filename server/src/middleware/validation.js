import { z } from 'zod';

/**
 * Express middleware generator that validates request body, query, or params with a Zod schema
 */
export function validateRequest({ body, query, params }) {
  return async (req, res, next) => {
    try {
      if (body) {
        req.body = await body.parseAsync(req.body);
      }
      if (query) {
        req.query = await query.parseAsync(req.query);
      }
      if (params) {
        req.params = await params.parseAsync(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data provided.',
          details: err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

// Common Zod schemas
export const schemas = {
  createBusiness: z.object({
    locationName: z.string().min(2, 'Business name must have at least 2 characters'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional().default('India'),
    phone: z.string().optional(),
    websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
    googleReviewUrl: z.string().url('Invalid review URL').optional().or(z.literal('')),
    category: z.string().optional(),
  }),

  syncReviews: z.object({
    businessLocationId: z.string().uuid('Invalid business ID format').optional(),
    maxResults: z.number().int().min(1).max(500).optional().default(50),
  }),

  publishReply: z.object({
    replyText: z.string().min(2, 'Reply text is required').max(4000),
    language: z.enum(['en', 'hi']).optional().default('en'),
  }),

  seoAudit: z.object({
    url: z.string().url('A valid URL (including https://) is required'),
    businessLocationId: z.string().uuid().optional(),
  }),

  keywordIdea: z.object({
    businessLocationId: z.string().uuid().optional(),
    services: z.array(z.string()).optional(),
    targetCity: z.string().optional(),
  }),
};
