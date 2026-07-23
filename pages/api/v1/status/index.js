import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const databaseVersionQuery = await database.query("SHOW server_version;");
    const databaseVersionValue = databaseVersionQuery.rows[0].server_version;

    const databaseMaxConnectionsQuery = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnectionsValue = parseInt(
      databaseMaxConnectionsQuery.rows[0].max_connections,
      10,
    );

    const databaseName = process.env.POSTGRES_DB;
    const databaseOpenedConnectionsQuery = await database.query({
      text: "SELECT count(*) FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });
    const databaseOpenedConnectionsValue = parseInt(
      databaseOpenedConnectionsQuery.rows[0].count,
      10,
    );

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersionValue,
          max_connections: databaseMaxConnectionsValue,
          opened_connections: databaseOpenedConnectionsValue,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });

    console.log("\n Erro dentro do catch do contoller:");
    console.error(publicErrorObject);

    response.status(500).json(publicErrorObject);
  }
}

export default status;
