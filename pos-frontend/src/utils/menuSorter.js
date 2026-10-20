// Exact category ranking requested by user:
// 1. Tea, 2. Coffee, 3. Mocktails, 4. Soup, 5. Tandoors, 6. Appetizers, 7. Pizza, 
// 8. Pizza addon, 9. Momo, 10. Sandwich, 11. Pasta, 12. Chinese rice, 13. Noodles, 
// 14. Chinese main course, 15. Indian rice, 16. Indian bread, 17. Veg main course, 
// 18. Non veg main course, 19. Salads, 20. Raita, 21. Biriyani

export const getCategoryRank = (name = "") => {
  const n = (name || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (n === "t e a" || n === "tea") return 1;
  if (n === "c o f f e e" || n === "coffee") return 2;
  if (n === "m o c k t a i l s" || n === "mocktails" || n === "mocktail") return 3;
  if (n === "soup" || n === "soups") return 4;
  if (n === "tandoors kebabs" || n.includes("tandoor")) return 5;
  if (n === "a p p e t i z e r" || n.includes("appetizer") || n.includes("apetier")) return 6;
  if (n === "pizza") return 7;
  if (n === "add-on pizza" || n.includes("add-on") || n.includes("addon")) return 8;
  if (n === "momo" || n === "momos") return 9;
  if (n === "sandwich") return 10;
  if (n === "pasta") return 11;
  if (n === "chinese rice") return 12;
  if (n.includes("noodle")) return 13;
  if (n.includes("chinese main")) return 14;
  if (n === "indian rice") return 15;
  if (n === "indian bread" || n.includes("bread")) return 16;
  if (n === "veg main course") return 17;
  if (n === "non veg main course" || n === "non-veg main course") return 18;
  if (n === "salad" || n === "salads") return 19;
  if (n === "raita") return 20;
  if (n === "biriyani" || n === "biryani") return 21;
  return 99;
};

// Noodle / Rice protein variant order: veg (1), egg (2), chicken (3), egg chicken (4), mixed (5)
export const getVariantRank = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("egg chicken")) return 4;
  if (n.includes("egg") && !n.includes("chicken")) return 2;
  if (n.includes("chicken")) return 3;
  if (n.includes("veg") && !n.includes("non")) return 1;
  if (n.includes("mixed") || n.includes("mix")) return 5;
  return 6;
};

// Portion rank: Half (1) comes before Full (2)
export const getPortionRank = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("half") || n.includes("(half)") || n.includes("1pic")) return 1;
  if (n.includes("full") || n.includes("(full)") || n.includes("2pic")) return 2;
  return 0;
};

// Dietary rank: Non-veg (1) comes before Veg (2)
export const getDietaryRank = (name = "") => {
  const n = name.toLowerCase();
  const nonVegKeywords = [
    "chicken", "mutton", "fish", "prawn", "egg", "murgh", 
    "kebab", "keema", "nonveg", "non-veg", "non veg"
  ];
  const isNonVeg = nonVegKeywords.some((kw) => n.includes(kw));
  if (isNonVeg) return 1;
  return 2;
};

export const getBaseDishName = (name = "") => {
  return name
    .replace(/\s*[\(\[]?(half|full|veg|nonveg|non-veg)[\)\]]?/gi, "")
    .replace(/\b(egg chicken|chicken|egg|veg|mixed|mix)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

export const sortMenuItems = (items = [], categoryName = "") => {
  const cat = (categoryName || "").toLowerCase();
  const isNoodleOrRice = cat.includes("noodle") || cat.includes("chinese rice");

  return [...items].sort((a, b) => {
    const nameA = a.name || "";
    const nameB = b.name || "";

    if (isNoodleOrRice) {
      const baseA = getBaseDishName(nameA);
      const baseB = getBaseDishName(nameB);
      if (baseA !== baseB) {
        return baseA.localeCompare(baseB);
      }
      const rankA = getVariantRank(nameA);
      const rankB = getVariantRank(nameB);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
    } else {
      const dietA = getDietaryRank(nameA);
      const dietB = getDietaryRank(nameB);
      if (dietA !== dietB) {
        return dietA - dietB;
      }
      const baseA = getBaseDishName(nameA);
      const baseB = getBaseDishName(nameB);
      if (baseA !== baseB) {
        return baseA.localeCompare(baseB);
      }
    }

    const portA = getPortionRank(nameA);
    const portB = getPortionRank(nameB);
    if (portA !== portB) {
      return portA - portB;
    }

    return nameA.localeCompare(nameB);
  });
};

export const sortMenuCategoriesAndItems = (categories = []) => {
  return [...categories]
    .sort((a, b) => {
      const rA = getCategoryRank(a.name);
      const rB = getCategoryRank(b.name);
      if (rA !== rB) return rA - rB;
      return (a.name || "").localeCompare(b.name || "");
    })
    .map((cat) => ({
      ...cat,
      items: sortMenuItems(cat.items || [], cat.name)
    }));
};
