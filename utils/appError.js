export default class AppError extends Error {
  constructor(message, code = "INTERNAL_SERVER_ERROR", status = 500, originalError = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.originalError = originalError;
  }
}
