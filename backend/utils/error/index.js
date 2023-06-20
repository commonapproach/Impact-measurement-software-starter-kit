class NotImplementedError extends Error {
  constructor(name = 'Unset') {
    super(`${name} is not implemented.`);
  }
}

class Server400Error extends Error {
  constructor(message) {
    super(message);
    console.error(message);
    this.statusCode = 400;
  }
}

module.exports = {
  NotImplementedError, Server400Error
}
