const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCategoryName(name) {
  return String(name || '').trim().toLowerCase();
}

function findAllowedCategory(allowedCategories, targetName) {
  return allowedCategories.find(
    (c) => normalizeCategoryName(c.name) === normalizeCategoryName(targetName)
  );
}

function addScore(scores, category, value) {
  scores[category] = (scores[category] || 0) + value;
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function scoreDescription(description, type = 'expense') {
  const text = normalizeText(description);

  const scores = {
    Food: 0,
    Travel: 0,
    Shopping: 0,
    Bills: 0,
    Salary: 0,
    Other: 0
  };

  const foodWords = [
    'food', 'lunch', 'dinner', 'breakfast', 'snack', 'snacks', 'meal',
    'restaurant', 'cafe', 'coffee', 'tea', 'pizza', 'burger', 'biryani',
    'juice', 'ice cream', 'domino', 'dominos', 'kfc', 'mcdonald',
    'swiggy', 'zomato'
  ];

  const travelWords = [
    'travel', 'trip', 'tour', 'journey', 'vacation', 'holiday',
    'flight', 'airport', 'train', 'bus', 'metro', 'cab', 'uber', 'ola',
    'auto', 'taxi', 'ticket', 'petrol', 'diesel', 'fuel', 'toll',
    'parking', 'service station'
  ];

  const shoppingWords = [
    'shopping', 'shop', 'purchase', 'purchased', 'buy', 'bought', 'buying',
    'new clothes', 'clothes', 'cloth', 'shirt', 'tshirt', 'jeans', 'dress',
    'shoes', 'sandals', 'bag', 'watch', 'kurti', 'saree',
    'phone', 'mobile', 'laptop', 'tablet', 'tv', 'fridge',
    'bike', 'car', 'scooter', 'vehicle', 'helmet', 'accessory',
    'amazon', 'flipkart', 'myntra', 'ajio', 'mall'
  ];

  const billWords = [
    'bill', 'bills', 'electricity', 'water', 'gas', 'internet', 'wifi',
    'broadband', 'recharge', 'mobile recharge', 'rent', 'emi', 'loan',
    'insurance', 'fees', 'subscription', 'netflix', 'prime', 'hotstar'
  ];

  const salaryWords = [
    'salary', 'bonus', 'payroll', 'income', 'incentive', 'stipend',
    'credited', 'salary credited', 'received salary'
  ];

  foodWords.forEach((word) => {
    if (text.includes(word)) addScore(scores, 'Food', word.includes(' ') ? 3 : 2);
  });

  travelWords.forEach((word) => {
    if (text.includes(word)) addScore(scores, 'Travel', word.includes(' ') ? 3 : 2);
  });

  shoppingWords.forEach((word) => {
    if (text.includes(word)) addScore(scores, 'Shopping', word.includes(' ') ? 3 : 2);
  });

  billWords.forEach((word) => {
    if (text.includes(word)) addScore(scores, 'Bills', word.includes(' ') ? 3 : 2);
  });

  salaryWords.forEach((word) => {
    if (text.includes(word)) addScore(scores, 'Salary', word.includes(' ') ? 3 : 2);
  });

  // Strong phrase rules
  if (/trip to|travel to|journey to|going to|vacation to|tour to/.test(text)) {
    addScore(scores, 'Travel', 5);
  }

  if (/lunch at|dinner at|breakfast at/.test(text)) {
    addScore(scores, 'Food', 5);
  }

  if (/salary credited|received salary/.test(text)) {
    addScore(scores, 'Salary', 6);
  }

  // Important: purchase/buy/new + item = Shopping
  const purchaseWords = ['purchase', 'purchased', 'buy', 'bought', 'buying', 'new'];
  const shoppingObjects = [
    'bike', 'car', 'scooter', 'vehicle', 'helmet',
    'clothes', 'dress', 'shirt', 'jeans', 'shoes', 'bag',
    'phone', 'mobile', 'laptop', 'watch'
  ];

  if (includesAny(text, purchaseWords) && includesAny(text, shoppingObjects)) {
    addScore(scores, 'Shopping', 8);
  }

  // Bike / car purchase should not become Travel by mistake
  if (
    (text.includes('bike') || text.includes('car') || text.includes('scooter')) &&
    includesAny(text, ['purchase', 'purchased', 'buy', 'bought', 'buying', 'new'])
  ) {
    addScore(scores, 'Shopping', 10);
  }

  // Bike usage / commute related should be Travel
  if (
    (text.includes('bike') || text.includes('car') || text.includes('scooter')) &&
    includesAny(text, ['petrol', 'fuel', 'service', 'repair', 'toll', 'parking'])
  ) {
    addScore(scores, 'Travel', 8);
  }

  // Income transactions should prefer Salary when applicable
  if (type === 'income') {
    addScore(scores, 'Salary', 2);
  }

  return scores;
}

function fallbackCategory(description, allowedCategories, type = 'expense') {
  const scores = scoreDescription(description, type);

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const bestCategory = ranked[0]?.[0] || 'Other';
  const bestScore = ranked[0]?.[1] || 0;

  if (type === 'income' && bestScore < 3) {
    const salaryCategory = findAllowedCategory(allowedCategories, 'Salary');
    if (salaryCategory) return salaryCategory;
  }

  if (bestScore >= 3) {
    const matched = findAllowedCategory(allowedCategories, bestCategory);
    if (matched) return matched;
  }

  return (
    findAllowedCategory(allowedCategories, 'Other') ||
    allowedCategories[0] ||
    null
  );
}

async function suggestCategoryWithGemini(description, allowedCategories, type = 'expense') {
  const deterministicMatch = fallbackCategory(description, allowedCategories, type);
  const scores = scoreDescription(description, type);
  const topScore = Math.max(...Object.values(scores));

  // Strong rule confidence => skip Gemini
  if (topScore >= 5) {
    return deterministicMatch;
  }

  if (!process.env.GEMINI_API_KEY) {
    return deterministicMatch;
  }

  const allowedNames = allowedCategories.map((c) => c.name);

  const prompt = `
Categorize this transaction into exactly one category.

Transaction type: ${type}
Description: "${description}"

Allowed categories:
${allowedNames.join(', ')}

Examples:
- "Trip to Goa" -> Travel
- "Purchase of new bike" -> Shopping
- "Buying new clothes" -> Shopping
- "Petrol for bike" -> Travel
- "Lunch at Domino's" -> Food
- "Electricity bill" -> Bills
- "Salary credited" -> Salary

Rules:
- Choose exactly one category from the allowed list.
- Use "Other" only if nothing else fits.
- Return JSON only.

{
  "category": "one allowed category"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            category: { type: 'string' }
          },
          required: ['category']
        },
        temperature: 0.1,
        maxOutputTokens: 80
      }
    });

    const raw = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(raw);

    const found = allowedCategories.find(
      (c) => normalizeCategoryName(c.name) === normalizeCategoryName(parsed.category)
    );

    return found || deterministicMatch;
  } catch (err) {
    return deterministicMatch;
  }
}

async function generateInsights(transactions, summary) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      title: 'AI Insights',
      insights: [
        `Your current balance is ₹${summary.balance}.`,
        summary.expense > summary.income
          ? 'Your expenses are higher than your income in this filtered view.'
          : 'Your spending looks controlled in this filtered view.',
        'Detailed descriptions improve AI categorization accuracy.'
      ]
    };
  }

  const compactTransactions = transactions.slice(0, 50).map((t) => ({
    amount: Number(t.amount),
    type: t.type,
    description: t.description || '',
    date: t.date,
    category: t.category?.name || ''
  }));

  const prompt = `
You are a finance assistant for an expense tracker.

Analyze these transactions and return short practical insights.

Summary:
- Income: ${summary.income}
- Expense: ${summary.expense}
- Balance: ${summary.balance}

Transactions:
${JSON.stringify(compactTransactions)}

Return JSON only:
{
  "title": "AI Insights",
  "insights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            insights: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['title', 'insights']
        },
        temperature: 0.3,
        maxOutputTokens: 300
      }
    });

    const raw = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(raw);

    return {
      title: parsed.title || 'AI Insights',
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : []
    };
  } catch (err) {
    return {
      title: 'AI Insights',
      insights: [
        'Travel and shopping usually become major variable expenses.',
        'Review repeated high-value expenses to improve budgeting.',
        'Detailed descriptions improve AI categorization accuracy.'
      ]
    };
  }
}

module.exports = {
  suggestCategoryWithGemini,
  generateInsights
};