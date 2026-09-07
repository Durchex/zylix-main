import "server-only";

/**
 * Postgres's `contains` / `equals` with `mode: "insensitive"` has no operator
 * equivalent in Mongo — the closest match is a case-insensitive regex. User
 * input reaches these filters directly (the catalog's `?search=` and `?brand=`
 * parameters), so the input is escaped first: an unescaped `(` is a syntax
 * error and a pattern like `(a+)+$` is a ReDoS against the database process,
 * not just this request.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive "contains", the analogue of Prisma's insensitive `contains`. */
export function containsInsensitive(value: string): RegExp {
  return new RegExp(escapeRegex(value), "i");
}

/** Case-insensitive exact match, the analogue of insensitive `equals`. */
export function equalsInsensitive(value: string): RegExp {
  return new RegExp(`^${escapeRegex(value)}$`, "i");
}
