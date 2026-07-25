import { useCompareStore } from "@/store/compare.store";

describe("useCompareStore", () => {
  beforeEach(() => {
    useCompareStore.setState({ productIds: [] });
  });

  it("toggle adds a product that isn't in the list", () => {
    useCompareStore.getState().toggle("prod_1");
    expect(useCompareStore.getState().productIds).toEqual(["prod_1"]);
  });

  it("toggle removes a product that's already in the list", () => {
    useCompareStore.getState().toggle("prod_1");
    useCompareStore.getState().toggle("prod_1");
    expect(useCompareStore.getState().productIds).toEqual([]);
  });

  it("caps the list at 4 products, per the PRD's compare-page spec", () => {
    useCompareStore.getState().toggle("prod_1");
    useCompareStore.getState().toggle("prod_2");
    useCompareStore.getState().toggle("prod_3");
    useCompareStore.getState().toggle("prod_4");
    useCompareStore.getState().toggle("prod_5"); // should be ignored — already full

    expect(useCompareStore.getState().productIds).toEqual(["prod_1", "prod_2", "prod_3", "prod_4"]);
  });

  it("isFull() reports true only once 4 products are selected", () => {
    expect(useCompareStore.getState().isFull()).toBe(false);
    for (const id of ["prod_1", "prod_2", "prod_3", "prod_4"]) {
      useCompareStore.getState().toggle(id);
    }
    expect(useCompareStore.getState().isFull()).toBe(true);
  });

  it("removing a product while full frees a slot for a new one", () => {
    for (const id of ["prod_1", "prod_2", "prod_3", "prod_4"]) {
      useCompareStore.getState().toggle(id);
    }
    useCompareStore.getState().toggle("prod_1"); // remove
    useCompareStore.getState().toggle("prod_5"); // now fits

    expect(useCompareStore.getState().productIds).toEqual(["prod_2", "prod_3", "prod_4", "prod_5"]);
  });

  it("clear() empties the list", () => {
    useCompareStore.getState().toggle("prod_1");
    useCompareStore.getState().clear();
    expect(useCompareStore.getState().productIds).toEqual([]);
  });
});
