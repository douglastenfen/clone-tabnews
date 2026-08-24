import database from "infra/database.js";
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import controller from "infra/controller";

const router = createRouter();

router.get(withDatabaseClient(getHandler));
router.post(withDatabaseClient(postHandler));

export default router.handler(controller.errorHandlers);

function withDatabaseClient(handler) {
  return async function (request, response) {
    const dbClient = await database.getNewClient();

    try {
      await handler(request, response, dbClient);
    } finally {
      await dbClient.end();
    }
  };
}

async function getHandler(request, response, dbClient) {
  const defaultMigrationOptions = {
    dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
  };

  const pendingMigrations = await migrationRunner(defaultMigrationOptions);

  response.status(200).json(pendingMigrations);
}

async function postHandler(request, response, dbClient) {
  const defaultMigrationOptions = {
    dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
  };

  const migratedMigrations = await migrationRunner({
    ...defaultMigrationOptions,
    dryRun: false,
  });

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  return response.status(200).json(migratedMigrations);
}
