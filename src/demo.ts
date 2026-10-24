import {
  evaluateCollectionRequest,
  evaluateDispatch,
  evaluateReceipt,
  projectStock,
  type CollectionOrder,
} from "./domain";

const history: CollectionOrder[] = [
  { id: "order-1", clientId: "client-a", materialId: "paper", month: "2026-10", kilograms: 65 },
];

console.log(evaluateCollectionRequest(history, {
  clientId: "client-a",
  materialId: "paper",
  month: "2026-10",
  kilograms: 35,
}));

console.log(evaluateDispatch({
  companyMaterialId: "paper",
  requestedMaterialId: "paper",
  availableKilograms: 140,
  dispatchKilograms: 120,
}));

console.log(evaluateReceipt("GESTOR", "collection-42", new Set(), 18));
console.log(projectStock(
  [{ materialId: "paper", kilograms: 140 }],
  [{ materialId: "paper", kilograms: 120 }],
));
