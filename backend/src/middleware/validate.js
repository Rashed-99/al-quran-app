import { ApiError } from '../utils/ApiError.js';

// Usage: router.post('/x', validate({ body: someZodSchema }), controller)
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      next();
    } catch (err) {
      next(ApiError.badRequest('Validation failed', err.errors ?? err.message));
    }
  };
}

export default validate;
