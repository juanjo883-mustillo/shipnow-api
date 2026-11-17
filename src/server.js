const env = require('./config/env');
const logger = require('./utils/logger');
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');

function fatal(message, err) {
  logger.error(message, { message: err && err.message, stack: err && err.stack });
  setTimeout(() => process.exit(1), 500); // deja tiempo a Winston para escribir en disco
}

async function start() {
  if (env.isProduction && env.INTERNAL_API_KEY === env.DEFAULT_INTERNAL_KEY) {
    logger.warn('INTERNAL_API_KEY usa el valor por defecto: cambiala antes de exponer la API');
  }
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    logger.info(`ShipNow API escuchando en el puerto ${env.PORT}`, { environment: env.NODE_ENV });
  });

  const shutdown = (signal) => {
    logger.info(`${signal} recibido: cerrando servidor`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', { reason: reason instanceof Error ? reason.stack : String(reason) }));
process.on('uncaughtException', (err) => fatal('uncaughtException', err));

start().catch((err) => fatal('No se pudo iniciar la API', err));
