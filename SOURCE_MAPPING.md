# Source mapping

| Historical behavior | New deterministic boundary | Test evidence |
|---|---|---|
| Maximum ten collection orders per client/month | `evaluateCollectionRequest` | eleventh-order test |
| Maximum 100 kg of one material per client/month | `evaluateCollectionRequest` | 100 kg boundary and 101 kg rejection |
| Dispatch only after deposit reaches 100 kg | `evaluateDispatch` | minimum-stock rejection |
| One material specialization per partner | `evaluateDispatch` | partner-material mismatch |
| Only a manager registers receipt | `evaluateReceipt` | role rejection |
| Collection identifier must be unique | `evaluateReceipt` | duplicate-code rejection |
| Stock equals receipts minus dispatches | `projectStock` | per-material projection |

The mapping is behavioral, not a line-by-line extraction. This prevents legacy UI coupling and avoids copying personal-looking fixtures.
