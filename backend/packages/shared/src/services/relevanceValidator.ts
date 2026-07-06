const VIETNAMESE_DIACRITICS: Record<string, string> = {
  à: "a",
  á: "a",
  ả: "a",
  ã: "a",
  ạ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ẳ: "a",
  ẵ: "a",
  ặ: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ẩ: "a",
  ẫ: "a",
  ậ: "a",
  è: "e",
  é: "e",
  ẻ: "e",
  ẽ: "e",
  ẹ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ể: "e",
  ễ: "e",
  ệ: "e",
  ì: "i",
  í: "i",
  ỉ: "i",
  ĩ: "i",
  ị: "i",
  ò: "o",
  ó: "o",
  ỏ: "o",
  õ: "o",
  ọ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ổ: "o",
  ỗ: "o",
  ộ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ở: "o",
  ỡ: "o",
  ợ: "o",
  ù: "u",
  ú: "u",
  ủ: "u",
  ũ: "u",
  ụ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ử: "u",
  ữ: "u",
  ự: "u",
  ỳ: "y",
  ý: "y",
  ỷ: "y",
  ỹ: "y",
  ỵ: "y",
  đ: "d",
};

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(
      /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g,
      (ch) => VIETNAMESE_DIACRITICS[ch] ?? ch,
    );
}

export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,;]+/)
      .filter((t) => t.length > 0),
  );
}

function _buildUserTokens(userIngredients: string[]): Set<string> {
  const tokens = new Set<string>();
  for (const ingredient of userIngredients) {
    const normalized = normalizeIngredientName(ingredient);
    for (const token of tokenize(normalized)) {
      tokens.add(token);
    }
  }
  return tokens;
}

export function buildDishIngredientTokens(
  ingredients: { name: string }[],
): Set<string> {
  const tokens = new Set<string>();
  for (const ingredient of ingredients) {
    const normalized = normalizeIngredientName(ingredient.name);
    for (const token of tokenize(normalized)) {
      tokens.add(token);
    }
  }
  return tokens;
}

export interface OverlapResult {
  hasOverlap: boolean;
  matchPercentage: number;
}

const DIACRITIC_PATTERN =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/;

function hasDiacritics(text: string): boolean {
  return DIACRITIC_PATTERN.test(text);
}

function normalizeDiacriticsChar(ch: string): string {
  return VIETNAMESE_DIACRITICS[ch] ?? ch;
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter((t) => t.length > 0);
}

function isSubphrase(
  needleTokens: string[],
  haystackTokens: string[],
): boolean {
  if (needleTokens.length === 0) return true;
  if (needleTokens.length > haystackTokens.length) return false;
  for (let i = 0; i <= haystackTokens.length - needleTokens.length; i++) {
    let match = true;
    for (let j = 0; j < needleTokens.length; j++) {
      if (needleTokens[j] !== haystackTokens[i + j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

function diacriticsCompatible(
  userOriginal: string,
  dishIngredientName: string,
): boolean {
  const userFirstWord = userOriginal
    .trim()
    .toLowerCase()
    .split(/[\s,;]+/)[0];
  const dishFirstWord = dishIngredientName
    .trim()
    .toLowerCase()
    .split(/[\s,;]+/)[0];
  if (userFirstWord === undefined || dishFirstWord === undefined) return true;
  if (!hasDiacritics(userFirstWord) || !hasDiacritics(dishFirstWord))
    return true;
  for (
    let k = 0;
    k < Math.min(userFirstWord.length, dishFirstWord.length);
    k++
  ) {
    const uc = userFirstWord[k];
    const dc = dishFirstWord[k];
    if (uc === undefined || dc === undefined) break;
    if (normalizeDiacriticsChar(uc) !== normalizeDiacriticsChar(dc)) break;
    if (uc !== dc) return false;
  }
  return true;
}

function hasIngredientMatch(
  userIngredient: string,
  dishIngredient: { name: string },
  userTokenList: string[],
  dishTokenList: string[],
): boolean {
  const forward = isSubphrase(userTokenList, dishTokenList);
  const backward = isSubphrase(dishTokenList, userTokenList);
  if (!forward && !backward) return false;
  if (userTokenList.length === 1) {
    return diacriticsCompatible(userIngredient, dishIngredient.name);
  }
  return true;
}

export function computeOverlap(
  userIngredients: string[],
  dishIngredients: { name: string }[],
): OverlapResult {
  if (userIngredients.length === 0) {
    return { hasOverlap: true, matchPercentage: 100 };
  }

  if (dishIngredients.length === 0) {
    return { hasOverlap: false, matchPercentage: 0 };
  }

  const normalizedUser = userIngredients.map(normalizeIngredientName);
  const normalizedDish = dishIngredients.map((i) =>
    normalizeIngredientName(i.name),
  );

  const userTokenLists = normalizedUser.map(tokenizeWords);
  const dishTokenLists = normalizedDish.map(tokenizeWords);

  let matchedCount = 0;
  for (let i = 0; i < userIngredients.length; i++) {
    const hasMatch = dishIngredients.some((_, j) =>
      hasIngredientMatch(
        userIngredients[i] ?? "",
        dishIngredients[j] ?? { name: "" },
        userTokenLists[i] ?? [],
        dishTokenLists[j] ?? [],
      ),
    );
    if (hasMatch) {
      matchedCount++;
    }
  }

  const matchPercentage = Math.round(
    (matchedCount / userIngredients.length) * 100,
  );

  return { hasOverlap: matchedCount > 0, matchPercentage };
}
