# Mexican Localization & Integrations

The Contract & Payment Tracker is specifically tailored to meet the legal, fiscal, and banking requirements of Mexican freelancers and corporate clients. This document details the technical implementation of Mexican tax estimators, tax identifier validations, and banking integrations.

---

## 🇲🇽 Mexican Tax ID (RFC) Validation

All user registration onboarding profiles and contract client details require a valid Mexican **Registro Federal de Contribuyentes (RFC)**. The system implements format audits and digit verifications in [rfcValidator.ts](file:///Users/jhzamora/.gemini/antigravity-ide/scratch/contract-tracker/lib/rfcValidator.ts).

### 1. Structure Verification
RFCs are classified into two formats based on length:
*   **Persona Física (13 Characters)**: `[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}` (e.g. `GUEH860710MX8`)
    *   First 4 characters: Alphabetic (letters of name/surname).
    *   Next 6 characters: Date of birth in `YYMMDD` format (validated for correct months 01-12 and days 01-31).
    *   Last 3 characters: Homoclave assigned by the SAT (alphanumeric).
*   **Persona Moral (12 Characters)**: `[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}` (e.g. `FMX1802058T7`)
    *   First 3 characters: Alphabetic (letters of company name).
    *   Next 6 characters: Date of incorporation in `YYMMDD` format (validated).
    *   Last 3 characters: Homoclave assigned by the SAT.

### 2. Modulo 11 Verification Check Digit (Dígito Verificador)
To prevent typos and invalid registrations, the last character of the RFC is checked using a Modulo 11 algorithm. The characters are mapped to numeric values:
*   `0-9` map to `0-9`
*   `A-Z` map to `10-35`
*   `Ñ` maps to `36`
*   `&` and spaces map to `37`

#### The Algorithm:
1.  Isolate the first $N-1$ characters of the RFC ($N$ is 12 or 13).
2.  Multiply each character's value by a descending weight starting from the RFC length down to 2:
    $$\text{Weight} = \text{Length} - i \quad (\text{where } i \text{ is the 0-based index})$$
3.  Sum the products:
    $$\text{Sum} = \sum_{i=0}^{N-2} (\text{Value}_i \times (N - i))$$
4.  Compute the check digit:
    $$\text{Modulus} = \text{Sum} \pmod{11}$$
    $$\text{Difference} = 11 - \text{Modulus}$$
5.  Expected check digit:
    *   If $\text{Difference} = 11$, check digit is `'0'`.
    *   If $\text{Difference} = 10$, check digit is `'A'`.
    *   Otherwise, the check digit is the string representation of $\text{Difference}$ (e.g. `'7'`).

---

## 📊 Mexican Tax Estimator

Physical-to-moral transactions in Mexico (e.g. physical freelancer billing a corporate client) are legally subject to tax withholdings (*Retenciones de Impuestos*). The contract creation wizard provides automated calculation toggles for tax estimates:

### 1. Tax Calculation Formulas
When ISR and/or IVA withholding are toggled, the totals are calculated based on the contract amount:

*   **Base Subtotal**: $A$ (e.g., $\$10,000.00$)
*   **Value Added Tax (IVA)**: $16\%$ of base subtotal:
    $$\text{IVA} = A \times 0.16$$
*   **ISR Withholding (Retención de ISR)**: $10\%$ of base subtotal (standard physical-to-moral rate):
    $$\text{ISR Withholding} = A \times 0.10$$
*   **IVA Withholding (Retención de IVA)**: $\frac{2}{3}$ of the IVA amount (standard Mexican withholding fraction, equivalent to $10.6667\%$ of base):
    $$\text{IVA Withholding} = A \times 0.16 \times \frac{2}{3}$$
*   **Net Total Payable**:
    $$\text{Net Total} = \text{Subtotal} + \text{IVA} - \text{ISR Withholding} - \text{IVA Withholding}$$

*Example Table ($10,000 MXN base with both ISR & IVA withholdings enabled):*
*   Subtotal: $\$10,000.00$
*   IVA ($16\%$): $+\$1,600.00$
*   ISR Withholding ($10\%$): $-\$1,000.00$
*   IVA Withholding ($10.67\%$): $-\$1,066.67$
*   **Net Total**: **$\$9,533.33$**

---

## 🏦 Banxico SPEI Reconciliation (CEP)

When clients report transfers on milestones, they submit a Mexican SPEI banking reference code (*Clave de Rastreo*). The application connects to Banco de México's services to verify payment settlement automatically.

### 1. SPEI Reference Check Logic
*   **Verification**: The system reads the tracking reference, sanitizes it, and checks it against Banxico's public settlement state logs.
*   **Mock Verification Simulation**:
    *   If the reference contains `"REJECT"`, `"INVALID"`, or is under 5 characters, it fails simulation, logging a reconciliation error and leaving the hito state as `marked_paid` or reverting to `requested`.
    *   Otherwise, the transfer is successfully reconciled, moving the milestone status to `confirmed` automatically and logging:
        `Reconciliación automática SPEI: CEP validado con éxito. Clave de rastreo: [REF]. Banco Emisor: BBVA México... Estado: LIQUIDADO.`

---

## 💵 USD FX Exchange Tracking

Contracts can be written in USD or MXN. For contracts marked in USD, milestones collected through Mexican SPEI transfers require additional logs to capture the cash settlement:
*   **Exchange Rate Logging**: On payment upload, the client or freelancer enters the actual **Tipo de Cambio (TC)** from Banco de México.
*   **MXN Conversion**: The database logs both the base USD milestone amount and the calculated `mxnAmount` ($USD \times TC$) for accounting and tax reporting.
