import { describe, expect, test } from "bun:test";
import {
  evaluateCollectionRequest,
  evaluateDispatch,
  evaluateReceipt,
  projectStock,
  type CollectionOrder,
} from "../src/domain";

describe("collection policy", () => {
  test("accepts the exact 100 kg boundary", () => {
    const history: CollectionOrder[] = [
      { id: "a", clientId: "c1", materialId: "paper", month: "2026-10", kilograms: 75 },
    ];
    expect(evaluateCollectionRequest(history, {
      clientId: "c1", materialId: "paper", month: "2026-10", kilograms: 25,
    }).code).toBe("COLLECTION_ACCEPTED");
  });

  test("rejects more than 100 kg of one material in one month", () => {
    const history: CollectionOrder[] = [
      { id: "a", clientId: "c1", materialId: "glass", month: "2026-10", kilograms: 80 },
    ];
    expect(evaluateCollectionRequest(history, {
      clientId: "c1", materialId: "glass", month: "2026-10", kilograms: 21,
    }).code).toBe("MONTHLY_MATERIAL_WEIGHT_LIMIT");
  });

  test("rejects the eleventh monthly order while keeping clients isolated", () => {
    const history: CollectionOrder[] = Array.from({ length: 10 }, (_, index) => ({
      id: `o-${index}`,
      clientId: "c1",
      materialId: `material-${index}`,
      month: "2026-10" as const,
      kilograms: 1,
    }));
    history.push({ id: "other", clientId: "c2", materialId: "paper", month: "2026-10", kilograms: 99 });
    expect(evaluateCollectionRequest(history, {
      clientId: "c1", materialId: "new", month: "2026-10", kilograms: 1,
    }).code).toBe("MONTHLY_ORDER_LIMIT");
  });
});

describe("dispatch policy", () => {
  test("requires the partner material and minimum deposit stock", () => {
    expect(evaluateDispatch({
      companyMaterialId: "glass", requestedMaterialId: "paper", availableKilograms: 150, dispatchKilograms: 20,
    }).code).toBe("COMPANY_MATERIAL_MISMATCH");
    expect(evaluateDispatch({
      companyMaterialId: "paper", requestedMaterialId: "paper", availableKilograms: 99, dispatchKilograms: 20,
    }).code).toBe("MINIMUM_STOCK_NOT_REACHED");
  });

  test("does not dispatch more than available stock", () => {
    expect(evaluateDispatch({
      companyMaterialId: "paper", requestedMaterialId: "paper", availableKilograms: 120, dispatchKilograms: 121,
    }).code).toBe("INSUFFICIENT_STOCK");
  });
});

describe("receipt and reporting rules", () => {
  test("requires manager role and an unused collection code", () => {
    expect(evaluateReceipt("OPERADOR", "collect-1", new Set(), 20).code).toBe("ROLE_NOT_ALLOWED");
    expect(evaluateReceipt("GESTOR", "collect-1", new Set(["collect-1"]), 20).code)
      .toBe("DUPLICATE_COLLECTION_CODE");
    expect(evaluateReceipt("GESTOR", "collect-2", new Set(["collect-1"]), 20).allowed).toBeTrue();
  });

  test("projects stock as receipts minus dispatches per material", () => {
    const stock = projectStock(
      [{ materialId: "paper", kilograms: 130 }, { materialId: "glass", kilograms: 40 }],
      [{ materialId: "paper", kilograms: 100 }],
    );
    expect(stock.get("paper")).toBe(30);
    expect(stock.get("glass")).toBe(40);
  });
});
