/**
 * Mexican RFC (Registro Federal de Contribuyentes) Validator
 * Supports physical persons (13 characters) and moral corporate entities (12 characters).
 * Verifies format structure, date validity, and the official check digit (dígito verificador).
 */

const CHAR_VALUES: { [key: string]: number } = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
  'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27,
  'S': 28, 'T': 29, 'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35, 'Ñ': 36,
  '&': 37, ' ': 37
};

export interface RFCValidationResult {
  isValid: boolean;
  error?: string;
  type?: 'Fisica' | 'Moral';
}

export function validateRFC(rfc: string): RFCValidationResult {
  if (!rfc) {
    return { isValid: false, error: "El RFC no puede estar vacío." };
  }

  const cleanRfc = rfc.trim().toUpperCase();

  // Check length
  if (cleanRfc.length !== 12 && cleanRfc.length !== 13) {
    return { isValid: false, error: "El RFC debe tener exactamente 12 o 13 caracteres." };
  }

  // Regex format checks
  // Physical: 4 letters, 6 numbers (YYMMDD), 3 homoclave characters
  const physicalRegex = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;
  // Moral: 3 letters, 6 numbers (YYMMDD), 3 homoclave characters
  const moralRegex = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/;

  const isPhysical = cleanRfc.length === 13;
  
  if (isPhysical && !physicalRegex.test(cleanRfc)) {
    return { isValid: false, error: "Formato de RFC físico inválido (ej. ABCD800101XXX)." };
  }
  if (!isPhysical && !moralRegex.test(cleanRfc)) {
    return { isValid: false, error: "Formato de RFC moral inválido (ej. ABC800101XXX)." };
  }

  // Validate Date part (YYMMDD)
  const dateStr = isPhysical ? cleanRfc.substring(4, 10) : cleanRfc.substring(3, 9);
  const month = parseInt(dateStr.substring(2, 4), 10);
  const day = parseInt(dateStr.substring(4, 6), 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: "Mes inválido en la fecha del RFC." };
  }
  if (day < 1 || day > 31) {
    return { isValid: false, error: "Día inválido en la fecha del RFC." };
  }

  // Check digit calculation (Dígito Verificador)
  const lastChar = cleanRfc[cleanRfc.length - 1];
  const stringToEvaluate = cleanRfc.substring(0, cleanRfc.length - 1);
  
  let sum = 0;
  const len = cleanRfc.length;

  for (let i = 0; i < stringToEvaluate.length; i++) {
    const char = stringToEvaluate[i];
    const val = CHAR_VALUES[char] !== undefined ? CHAR_VALUES[char] : 0;
    // Weight for 13 chars starts at 13 down to 2
    // Weight for 12 chars starts at 12 down to 2
    const weight = len - i;
    sum += val * weight;
  }

  const modulus = sum % 11;
  const diff = 11 - modulus;

  let expectedCheckDigit = '0';
  if (diff === 11) {
    expectedCheckDigit = '0';
  } else if (diff === 10) {
    expectedCheckDigit = 'A';
  } else {
    expectedCheckDigit = String(diff);
  }

  if (lastChar !== expectedCheckDigit) {
    return { 
      isValid: false, 
      error: `Dígito verificador inválido. Se esperaba "${expectedCheckDigit}" pero se recibió "${lastChar}".` 
    };
  }

  return {
    isValid: true,
    type: isPhysical ? 'Fisica' : 'Moral'
  };
}
