export type MonthKey = `${number}-${number}`;

export interface CollectionOrder {
  id: string;
  clientId: string;
  materialId: string;
  month: MonthKey;
  kilograms: number;
}

export interface CollectionRequest {
  clientId: string;
  materialId: string;
  month: MonthKey;
  kilograms: number;
}

export interface Decision {
  allowed: boolean;
  code: string;
  reason: string;
}

const allowed = (code: string, reason: string): Decision => ({ allowed: true, code, reason });
const denied = (code: string, reason: string): Decision => ({ allowed: false, code, reason });

export function evaluateCollectionRequest(
  history: readonly CollectionOrder[],
  request: CollectionRequest,
): Decision {
  if (!Number.isFinite(request.kilograms) || request.kilograms <= 0) {
    return denied("INVALID_WEIGHT", "Weight must be a positive finite number.");
  }

  const monthlyClientOrders = history.filter(
    (order) => order.clientId === request.clientId && order.month === request.month,
  );
  if (monthlyClientOrders.length >= 10) {
    return denied("MONTHLY_ORDER_LIMIT", "A client can place at most ten collection orders per month.");
  }

  const sameMaterialWeight = monthlyClientOrders
    .filter((order) => order.materialId === request.materialId)
    .reduce((total, order) => total + order.kilograms, 0);
  if (sameMaterialWeight + request.kilograms > 100) {
    return denied(
      "MONTHLY_MATERIAL_WEIGHT_LIMIT",
      "A client can request at most 100 kg of the same material per month.",
    );
  }

  return allowed("COLLECTION_ACCEPTED", "Collection request respects monthly operational limits.");
}

export interface DispatchRequest {
  companyMaterialId: string;
  requestedMaterialId: string;
  availableKilograms: number;
  dispatchKilograms: number;
}

export function evaluateDispatch(request: DispatchRequest): Decision {
  if (request.companyMaterialId !== request.requestedMaterialId) {
    return denied("COMPANY_MATERIAL_MISMATCH", "A partner company accepts only its configured material.");
  }
  if (request.availableKilograms < 100) {
    return denied("MINIMUM_STOCK_NOT_REACHED", "Dispatch opens only when the deposit has at least 100 kg.");
  }
  if (!Number.isFinite(request.dispatchKilograms) || request.dispatchKilograms <= 0) {
    return denied("INVALID_DISPATCH_WEIGHT", "Dispatch weight must be a positive finite number.");
  }
  if (request.dispatchKilograms > request.availableKilograms) {
    return denied("INSUFFICIENT_STOCK", "A dispatch cannot consume more material than is available.");
  }
  return allowed("DISPATCH_ACCEPTED", "Dispatch respects partner specialization and stock constraints.");
}

export type Role = "GESTOR" | "OPERADOR" | "CONSULTA";

export function evaluateReceipt(
  actorRole: Role,
  collectionCode: string,
  receivedCodes: ReadonlySet<string>,
  kilograms: number,
): Decision {
  if (actorRole !== "GESTOR") {
    return denied("ROLE_NOT_ALLOWED", "Only a manager can register material receipt.");
  }
  if (collectionCode.trim().length === 0 || receivedCodes.has(collectionCode)) {
    return denied("DUPLICATE_COLLECTION_CODE", "A collection code must be non-empty and unique.");
  }
  if (!Number.isFinite(kilograms) || kilograms <= 0) {
    return denied("INVALID_RECEIPT_WEIGHT", "Receipt weight must be a positive finite number.");
  }
  return allowed("RECEIPT_ACCEPTED", "Receipt is authorized and uniquely identified.");
}

export interface MaterialMovement {
  materialId: string;
  kilograms: number;
}

export function projectStock(
  receipts: readonly MaterialMovement[],
  dispatches: readonly MaterialMovement[],
): ReadonlyMap<string, number> {
  const stock = new Map<string, number>();
  for (const receipt of receipts) {
    stock.set(receipt.materialId, (stock.get(receipt.materialId) ?? 0) + receipt.kilograms);
  }
  for (const dispatch of dispatches) {
    stock.set(dispatch.materialId, (stock.get(dispatch.materialId) ?? 0) - dispatch.kilograms);
  }
  return stock;
}
