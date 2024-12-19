export class DataAlreadyExistsError extends Error {
  constructor() {
    super('Data already exists')
  }
}
