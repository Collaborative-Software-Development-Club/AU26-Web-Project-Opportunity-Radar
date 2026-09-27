export type FieldError = { field: string; message: string };

export class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly details: FieldError[] = []) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: FieldError[]) => new HttpError(400, message, details);
export const notFound = (message: string) => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
export const unprocessable = (message: string) => new HttpError(422, message);
