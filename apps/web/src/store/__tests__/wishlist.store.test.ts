import { useWishlistStore } from "@/store/wishlist.store";

describe("useWishlistStore", () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: [] });
  });

  it("toggle adds a product that isn't in the wishlist", () => {
    useWishlistStore.getState().toggle("prod_1");
    expect(useWishlistStore.getState().productIds).toEqual(["prod_1"]);
  });

  it("toggle removes a product that's already in the wishlist", () => {
    useWishlistStore.getState().toggle("prod_1");
    useWishlistStore.getState().toggle("prod_1");
    expect(useWishlistStore.getState().productIds).toEqual([]);
  });

  it("has() reflects the current membership", () => {
    expect(useWishlistStore.getState().has("prod_1")).toBe(false);
    useWishlistStore.getState().toggle("prod_1");
    expect(useWishlistStore.getState().has("prod_1")).toBe(true);
  });

  it("supports multiple independent products", () => {
    useWishlistStore.getState().toggle("prod_1");
    useWishlistStore.getState().toggle("prod_2");
    useWishlistStore.getState().toggle("prod_1");

    expect(useWishlistStore.getState().productIds).toEqual(["prod_2"]);
  });
});
