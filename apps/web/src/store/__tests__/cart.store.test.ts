import { useCartStore } from "@/store/cart.store";
import type { CartLineItem } from "@/types/cart";

function buildItem(overrides: Partial<CartLineItem> = {}): CartLineItem {
  return {
    productId: "prod_1",
    variantId: null,
    slug: "iphone-16-pro",
    name: "iPhone 16 Pro",
    imageUrl: null,
    unitPrice: 1_250_000,
    currency: "NGN",
    quantity: 1,
    maxQuantity: 10,
    ...overrides,
  };
}

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds a new line item", () => {
    useCartStore.getState().addItem(buildItem());
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("merges quantities when the same product+variant is added again", () => {
    useCartStore.getState().addItem(buildItem({ quantity: 2 }));
    useCartStore.getState().addItem(buildItem({ quantity: 3 }));

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]!.quantity).toBe(5);
  });

  it("treats different variants of the same product as separate line items", () => {
    useCartStore.getState().addItem(buildItem({ variantId: "var_a" }));
    useCartStore.getState().addItem(buildItem({ variantId: "var_b" }));

    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("caps merged quantity at maxQuantity rather than exceeding available stock", () => {
    useCartStore.getState().addItem(buildItem({ quantity: 8, maxQuantity: 10 }));
    useCartStore.getState().addItem(buildItem({ quantity: 8, maxQuantity: 10 }));

    expect(useCartStore.getState().items[0]!.quantity).toBe(10);
  });

  it("removeItem removes only the matching product+variant line", () => {
    useCartStore.getState().addItem(buildItem({ productId: "prod_1" }));
    useCartStore.getState().addItem(buildItem({ productId: "prod_2" }));

    useCartStore.getState().removeItem("prod_1", null);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]!.productId).toBe("prod_2");
  });

  it("setQuantity updates the quantity of the matching line", () => {
    useCartStore.getState().addItem(buildItem({ quantity: 1 }));
    useCartStore.getState().setQuantity("prod_1", null, 4);

    expect(useCartStore.getState().items[0]!.quantity).toBe(4);
  });

  it("setQuantity caps at maxQuantity", () => {
    useCartStore.getState().addItem(buildItem({ maxQuantity: 5 }));
    useCartStore.getState().setQuantity("prod_1", null, 99);

    expect(useCartStore.getState().items[0]!.quantity).toBe(5);
  });

  it("setQuantity to 0 or below removes the line item entirely", () => {
    useCartStore.getState().addItem(buildItem());
    useCartStore.getState().setQuantity("prod_1", null, 0);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("clear empties the cart", () => {
    useCartStore.getState().addItem(buildItem());
    useCartStore.getState().clear();

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("subtotal sums unitPrice * quantity across all lines", () => {
    useCartStore.getState().addItem(buildItem({ productId: "prod_1", unitPrice: 1000, quantity: 2 }));
    useCartStore.getState().addItem(buildItem({ productId: "prod_2", unitPrice: 500, quantity: 3 }));

    expect(useCartStore.getState().subtotal()).toBe(1000 * 2 + 500 * 3);
  });

  it("totalQuantity sums quantities across all lines", () => {
    useCartStore.getState().addItem(buildItem({ productId: "prod_1", quantity: 2 }));
    useCartStore.getState().addItem(buildItem({ productId: "prod_2", quantity: 3 }));

    expect(useCartStore.getState().totalQuantity()).toBe(5);
  });
});
