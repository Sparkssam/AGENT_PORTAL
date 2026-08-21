export class BackendError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "BackendError"
    this.code = code
    this.status = status
  }
}

export class BackendNotConfiguredError extends BackendError {
  constructor(message = "Backend is not configured") {
    super("NOT_CONFIGURED", message, 503)
    this.name = "BackendNotConfiguredError"
  }
}

export class ForbiddenError extends BackendError {
  constructor(message = "Not allowed") {
    super("FORBIDDEN", message, 403)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends BackendError {
  constructor(message = "Not found") {
    super("NOT_FOUND", message, 404)
    this.name = "NotFoundError"
  }
}
