import Agent from "../model/agent.model";

/**
 * Generate a random discount code in format XX-#### (e.g. AB-7485)
 */
const generateCode = (): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";

  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];

  const d1 = digits[Math.floor(Math.random() * digits.length)];
  const d2 = digits[Math.floor(Math.random() * digits.length)];
  const d3 = digits[Math.floor(Math.random() * digits.length)];
  const d4 = digits[Math.floor(Math.random() * digits.length)];

  return `${l1}${l2}-${d1}${d2}${d3}${d4}`;
};

/**
 * Generate a unique discount code that does not already exist on any Agent.
 */
export const generateUniqueDiscountCode = async (): Promise<string> => {
  const MAX_TRIES = 20;

  for (let i = 0; i < MAX_TRIES; i++) {
    const code = generateCode();
    const existing = await Agent.findOne({ discountCodeCoupon: code }).lean();
    if (!existing) return code;
  }

  // Fallback – very unlikely to hit
  return generateCode();
};


