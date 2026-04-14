class ApiError extends Error {
  statusCode: number;
  errors?: any;
  stack?: string;
  success: boolean;

  constructor(statusCode: number, message: string, errors?: any, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError; 