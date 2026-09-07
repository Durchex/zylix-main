import "server-only";

/**
 * Single import surface for all 43 models, replacing the Prisma client's
 * `prisma.<model>` namespace. Importing from here (rather than the domain
 * files directly) also guarantees every schema is registered before a query
 * runs `populate()` against it — Mongoose resolves a `ref` by model name at
 * populate time, and a model that no route happened to import yet would
 * otherwise throw MissingSchemaError.
 */
export * from "./enums";
export * from "./user";
export * from "./catalog";
export * from "./cart";
export * from "./order";
export * from "./payment";
export * from "./wallet";
export * from "./content";
