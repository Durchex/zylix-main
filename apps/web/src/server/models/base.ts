import "server-only";
import { Schema, model, models, type Model, type SchemaOptions } from "mongoose";

/**
 * Every document is serialized to JSON with `id` (a string) rather than
 * Mongo's `_id`/`__v`. The frontend and the entire API contract were written
 * against Prisma's `id: string`, so keeping that shape means the client code,
 * its types, and the API's response bodies don't change with the database.
 */
export const baseSchemaOptions: SchemaOptions = {
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  },
};

/**
 * Mongoose throws OverwriteModelError when the same model name is compiled
 * twice, which happens on every hot reload in `next dev` and whenever two
 * route handlers in the same lambda import the module graph independently.
 * Reusing an already-registered model is the standard guard.
 */
export function defineModel<T>(name: string, schema: Schema): Model<T> {
  return (models[name] as Model<T>) ?? model<T>(name, schema);
}

/** Shorthand for the ObjectId reference fields that replace Prisma relations. */
export function ref(collection: string, options: Record<string, unknown> = {}) {
  return { type: Schema.Types.ObjectId, ref: collection, ...options };
}

/**
 * Money is stored as a double, matching what the Express/Prisma API already
 * put on the wire: Prisma's Decimal was serialized to JSON as a string and
 * every consumer ran it through Number() anyway. Values here are whole
 * kobo/cents-scale amounts under 2^53, so double precision is exact for the
 * addition and comparison the order math actually does; the rounding helper
 * in server/lib/money.ts is applied wherever a percentage is involved.
 */
export const money = { type: Number, default: 0 };
export const requiredMoney = { type: Number, required: true };
