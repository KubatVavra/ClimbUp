import { useState, useEffect } from "react";

const DEFAULT_GOALS = { calories: 3000, protein: 150, carbs: 350, fat: 90 };

const DEFAULT_PROFILE = {
  weight: "", targetWeight: "", height: "", age: "", gender: "muž",
  activity: "stredne", goal: "udrzeni",
  trainingType: "", trainingsPerWeek: "", allergies: "", mealsPerDay: "",
  intermittentFasting: false, fastingWindow: "16:8",
};

const ACTIVITY_MULTIPLIERS = {
  sedavy: 1.2, lehce: 1.375, stredne: 1.55, velmi: 1.725, extremne: 1.9,
};

const ACTIVITY_LABELS = {
  sedavy: "Sedavý životní styl", lehce: "Lehce aktivní (1-3x/týden)",
  stredne: "Středně aktivní (3-5x/týden)", velmi: "Velmi aktivní (6-7x/týden)",
  extremne: "Extrémně aktivní (2x denně)",
};

const GOAL_LABELS = {
  nabirani: "Nabírání svalové hmoty", udrzeni: "Udržení váhy", hubnuti: "Hubnutí",
};

const calcBMR = (p) => {
  const w = Number(p.weight), h = Number(p.height), a = Number(p.age);
  if (!w || !h || !a) return 0;
  return p.gender === "muž"
    ? Math.round(10 * w + 6.25 * h - 5 * a + 5)
    : Math.round(10 * w + 6.25 * h - 5 * a - 161);
};

const calcGoals = (p) => {
  const bmr = calcBMR(p);
  if (!bmr) return null;
  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[p.activity] || 1.55));
  const adj = p.goal === "nabirani" ? 400 : p.goal === "hubnuti" ? -400 : 0;
  const calories = Math.round(tdee + adj);
  const w = Number(p.weight);
  const proteinPerKg = p.goal === "nabirani" ? 2.0 : p.goal === "hubnuti" ? 2.2 : 1.8;
  const protein = Math.round(w * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs: Math.max(carbs, 0), fat, bmr, tdee };
};

const QUICK_FOODS = [
  // ═══ MASO A DRŮBEŽ ═══
  { name: "Kuřecí prsa (100g)", cal: 165, p: 31, c: 0, f: 4, cat: "maso" },
  { name: "Kuřecí stehna (100g)", cal: 209, p: 26, c: 0, f: 11, cat: "maso" },
  { name: "Kuřecí křídla (100g)", cal: 203, p: 30, c: 0, f: 8, cat: "maso" },
  { name: "Vepřová panenka (100g)", cal: 143, p: 26, c: 0, f: 4, cat: "maso" },
  { name: "Vepřové kotlety (100g)", cal: 231, p: 25, c: 0, f: 14, cat: "maso" },
  { name: "Vepřový bůček (100g)", cal: 518, p: 9, c: 0, f: 53, cat: "maso" },
  { name: "Vepřová žebra (100g)", cal: 277, p: 24, c: 0, f: 20, cat: "maso" },
  { name: "Hovězí svíčková (100g)", cal: 218, p: 28, c: 0, f: 11, cat: "maso" },
  { name: "Hovězí roštěná (100g)", cal: 192, p: 27, c: 0, f: 9, cat: "maso" },
  { name: "Hovězí mleté maso (100g)", cal: 254, p: 17, c: 0, f: 20, cat: "maso" },
  { name: "Jehněčí kýta (100g)", cal: 258, p: 25, c: 0, f: 17, cat: "maso" },
  { name: "Telecí maso (100g)", cal: 172, p: 24, c: 0, f: 8, cat: "maso" },
  { name: "Krůtí prsa (100g)", cal: 135, p: 30, c: 0, f: 1, cat: "maso" },
  { name: "Kachna (100g)", cal: 337, p: 19, c: 0, f: 28, cat: "maso" },
  { name: "Slanina (100g)", cal: 541, p: 37, c: 1, f: 42, cat: "maso" },
  { name: "Šunka vařená (100g)", cal: 145, p: 21, c: 2, f: 6, cat: "maso" },
  { name: "Salám (100g)", cal: 336, p: 13, c: 2, f: 30, cat: "maso" },
  { name: "Klobása (100g)", cal: 301, p: 12, c: 2, f: 27, cat: "maso" },
  // ═══ RYBY A MOŘSKÉ PLODY ═══
  { name: "Losos (100g)", cal: 208, p: 20, c: 0, f: 13, cat: "ryby" },
  { name: "Treska (100g)", cal: 82, p: 18, c: 0, f: 1, cat: "ryby" },
  { name: "Tuňák konzervovaný (100g)", cal: 116, p: 26, c: 0, f: 1, cat: "ryby" },
  { name: "Sardinky (100g)", cal: 208, p: 25, c: 0, f: 11, cat: "ryby" },
  { name: "Makrela (100g)", cal: 205, p: 19, c: 0, f: 14, cat: "ryby" },
  { name: "Pstruh (100g)", cal: 148, p: 21, c: 0, f: 7, cat: "ryby" },
  { name: "Kapr (100g)", cal: 127, p: 18, c: 0, f: 6, cat: "ryby" },
  { name: "Krevety (100g)", cal: 99, p: 24, c: 0, f: 1, cat: "ryby" },
  { name: "Tilapie (100g)", cal: 96, p: 20, c: 0, f: 2, cat: "ryby" },
  { name: "Pangasius (100g)", cal: 92, p: 15, c: 0, f: 3, cat: "ryby" },
  // ═══ MLÉČNÉ VÝROBKY A VEJCE ═══
  { name: "Plnotučné mléko (250ml)", cal: 150, p: 8, c: 12, f: 8, cat: "mléčné" },
  { name: "Odtučněné mléko (250ml)", cal: 83, p: 8, c: 12, f: 0, cat: "mléčné" },
  { name: "Smetana ke šlehání (50ml)", cal: 170, p: 1, c: 2, f: 18, cat: "mléčné" },
  { name: "Máslo (10g)", cal: 72, p: 0, c: 0, f: 8, cat: "mléčné" },
  { name: "Jogurt bílý (150g)", cal: 92, p: 5, c: 12, f: 3, cat: "mléčné" },
  { name: "Jogurt řecký (150g)", cal: 146, p: 15, c: 6, f: 7, cat: "mléčné" },
  { name: "Kefír (250ml)", cal: 100, p: 6, c: 10, f: 4, cat: "mléčné" },
  { name: "Tvaroh (100g)", cal: 98, p: 13, c: 3, f: 4, cat: "mléčné" },
  { name: "Cottage cheese (100g)", cal: 98, p: 11, c: 3, f: 4, cat: "mléčné" },
  { name: "Eidam (30g)", cal: 105, p: 8, c: 0, f: 8, cat: "mléčné" },
  { name: "Gouda (30g)", cal: 110, p: 7, c: 1, f: 9, cat: "mléčné" },
  { name: "Parmezán (30g)", cal: 117, p: 10, c: 1, f: 8, cat: "mléčné" },
  { name: "Mozzarella (100g)", cal: 280, p: 28, c: 1, f: 17, cat: "mléčné" },
  { name: "Feta (100g)", cal: 264, p: 14, c: 4, f: 21, cat: "mléčné" },
  { name: "Vejce slepičí (1 ks)", cal: 72, p: 6, c: 0, f: 5, cat: "mléčné" },
  // ═══ OBILOVINY A PEČIVO ═══
  { name: "Celozrnný chléb (1 krajíc)", cal: 80, p: 4, c: 14, f: 1, cat: "pečivo" },
  { name: "Bílý chléb (1 krajíc)", cal: 75, p: 3, c: 14, f: 1, cat: "pečivo" },
  { name: "Bageta (100g)", cal: 270, p: 9, c: 52, f: 3, cat: "pečivo" },
  { name: "Toastový chléb (1 plátek)", cal: 65, p: 2, c: 12, f: 1, cat: "pečivo" },
  { name: "Rýže bílá vařená (150g)", cal: 195, p: 4, c: 44, f: 0, cat: "pečivo" },
  { name: "Rýže hnědá vařená (150g)", cal: 170, p: 4, c: 36, f: 1, cat: "pečivo" },
  { name: "Rýže basmati vařená (150g)", cal: 180, p: 4, c: 40, f: 0, cat: "pečivo" },
  { name: "Těstoviny vařené (150g)", cal: 220, p: 8, c: 43, f: 1, cat: "pečivo" },
  { name: "Ovesné vločky (50g)", cal: 190, p: 7, c: 33, f: 3, cat: "pečivo" },
  { name: "Müsli (50g)", cal: 195, p: 5, c: 33, f: 5, cat: "pečivo" },
  { name: "Pohanka vařená (150g)", cal: 155, p: 6, c: 33, f: 1, cat: "pečivo" },
  { name: "Quinoa vařená (150g)", cal: 180, p: 6, c: 30, f: 3, cat: "pečivo" },
  { name: "Bulgur vařený (150g)", cal: 170, p: 6, c: 34, f: 1, cat: "pečivo" },
  { name: "Kuskus vařený (150g)", cal: 176, p: 6, c: 36, f: 0, cat: "pečivo" },
  { name: "Tortilla (1 ks)", cal: 150, p: 4, c: 26, f: 4, cat: "pečivo" },
  // ═══ ZELENINA ═══
  { name: "Brokolice (100g)", cal: 34, p: 3, c: 7, f: 0, cat: "zelenina" },
  { name: "Květák (100g)", cal: 25, p: 2, c: 5, f: 0, cat: "zelenina" },
  { name: "Špenát (100g)", cal: 23, p: 3, c: 4, f: 0, cat: "zelenina" },
  { name: "Mrkev (100g)", cal: 41, p: 1, c: 10, f: 0, cat: "zelenina" },
  { name: "Paprika červená (100g)", cal: 31, p: 1, c: 6, f: 0, cat: "zelenina" },
  { name: "Rajče (100g)", cal: 18, p: 1, c: 4, f: 0, cat: "zelenina" },
  { name: "Okurka (100g)", cal: 15, p: 1, c: 4, f: 0, cat: "zelenina" },
  { name: "Cuketa (100g)", cal: 17, p: 1, c: 3, f: 0, cat: "zelenina" },
  { name: "Batáty (100g)", cal: 86, p: 2, c: 20, f: 0, cat: "zelenina" },
  { name: "Brambory (100g)", cal: 77, p: 2, c: 17, f: 0, cat: "zelenina" },
  { name: "Hrášek (100g)", cal: 81, p: 5, c: 14, f: 0, cat: "zelenina" },
  { name: "Kukuřice (100g)", cal: 86, p: 3, c: 19, f: 1, cat: "zelenina" },
  { name: "Červená řepa (100g)", cal: 43, p: 2, c: 10, f: 0, cat: "zelenina" },
  { name: "Cibule (100g)", cal: 40, p: 1, c: 9, f: 0, cat: "zelenina" },
  { name: "Česnek (10g)", cal: 15, p: 1, c: 3, f: 0, cat: "zelenina" },
  // ═══ OVOCE ═══
  { name: "Jablko (1 ks)", cal: 95, p: 0, c: 25, f: 0, cat: "ovoce" },
  { name: "Hruška (1 ks)", cal: 100, p: 1, c: 27, f: 0, cat: "ovoce" },
  { name: "Banán (1 ks)", cal: 105, p: 1, c: 27, f: 0, cat: "ovoce" },
  { name: "Pomeranč (1 ks)", cal: 62, p: 1, c: 15, f: 0, cat: "ovoce" },
  { name: "Jahody (100g)", cal: 32, p: 1, c: 8, f: 0, cat: "ovoce" },
  { name: "Maliny (100g)", cal: 52, p: 1, c: 12, f: 1, cat: "ovoce" },
  { name: "Borůvky (100g)", cal: 57, p: 1, c: 14, f: 0, cat: "ovoce" },
  { name: "Třešně (100g)", cal: 63, p: 1, c: 16, f: 0, cat: "ovoce" },
  { name: "Broskev (1 ks)", cal: 59, p: 1, c: 14, f: 0, cat: "ovoce" },
  { name: "Kiwi (1 ks)", cal: 42, p: 1, c: 10, f: 0, cat: "ovoce" },
  { name: "Avokádo (1/2 ks)", cal: 120, p: 2, c: 6, f: 11, cat: "ovoce" },
  { name: "Mango (100g)", cal: 60, p: 1, c: 15, f: 0, cat: "ovoce" },
  { name: "Ananas (100g)", cal: 50, p: 1, c: 13, f: 0, cat: "ovoce" },
  { name: "Meloun vodní (100g)", cal: 30, p: 1, c: 8, f: 0, cat: "ovoce" },
  { name: "Datle (30g)", cal: 83, p: 1, c: 22, f: 0, cat: "ovoce" },
  { name: "Fíky (30g)", cal: 74, p: 1, c: 19, f: 0, cat: "ovoce" },
  // ═══ LUŠTĚNINY, OŘECHY A SEMÍNKA ═══
  { name: "Čočka vařená (100g)", cal: 116, p: 9, c: 20, f: 0, cat: "ořechy" },
  { name: "Cizrna vařená (100g)", cal: 164, p: 9, c: 27, f: 3, cat: "ořechy" },
  { name: "Fazole červené vařené (100g)", cal: 127, p: 9, c: 23, f: 1, cat: "ořechy" },
  { name: "Tofu (100g)", cal: 76, p: 8, c: 2, f: 5, cat: "ořechy" },
  { name: "Mandle (30g)", cal: 175, p: 6, c: 5, f: 15, cat: "ořechy" },
  { name: "Vlašské ořechy (30g)", cal: 196, p: 5, c: 4, f: 20, cat: "ořechy" },
  { name: "Kešu (30g)", cal: 165, p: 5, c: 9, f: 13, cat: "ořechy" },
  { name: "Arašídy (30g)", cal: 170, p: 7, c: 5, f: 14, cat: "ořechy" },
  { name: "Arašídové máslo (20g)", cal: 120, p: 5, c: 3, f: 10, cat: "ořechy" },
  { name: "Dýňová semínka (30g)", cal: 170, p: 9, c: 3, f: 14, cat: "ořechy" },
  { name: "Slunečnicová semínka (30g)", cal: 175, p: 6, c: 6, f: 15, cat: "ořechy" },
  { name: "Chia semínka (15g)", cal: 73, p: 2, c: 6, f: 5, cat: "ořechy" },
  { name: "Lněná semínka (15g)", cal: 80, p: 3, c: 4, f: 6, cat: "ořechy" },
  // ═══ TUKY, OLEJE, OMÁČKY ═══
  { name: "Olivový olej (1 lžíce)", cal: 119, p: 0, c: 0, f: 14, cat: "tuky" },
  { name: "Kokosový olej (1 lžíce)", cal: 121, p: 0, c: 0, f: 14, cat: "tuky" },
  { name: "Med (1 lžíce)", cal: 64, p: 0, c: 17, f: 0, cat: "tuky" },
  { name: "Kečup (1 lžíce)", cal: 20, p: 0, c: 5, f: 0, cat: "tuky" },
  { name: "Majonéza (1 lžíce)", cal: 94, p: 0, c: 0, f: 10, cat: "tuky" },
  { name: "Sójová omáčka (1 lžíce)", cal: 9, p: 1, c: 1, f: 0, cat: "tuky" },
  { name: "Hořčice (1 lžíce)", cal: 10, p: 1, c: 1, f: 0, cat: "tuky" },
  { name: "Tahini (1 lžíce)", cal: 89, p: 3, c: 3, f: 8, cat: "tuky" },
  // ═══ NÁPOJE ═══
  { name: "Proteinový shake", cal: 250, p: 30, c: 20, f: 5, cat: "nápoje" },
  { name: "Gainer shake", cal: 600, p: 30, c: 90, f: 8, cat: "nápoje" },
  { name: "Smoothie (banán+ovesné+mléko)", cal: 350, p: 14, c: 55, f: 8, cat: "nápoje" },
  { name: "Mléko 500ml", cal: 250, p: 16, c: 24, f: 10, cat: "nápoje" },
  { name: "Mandlové mléko (250ml)", cal: 30, p: 1, c: 1, f: 3, cat: "nápoje" },
  { name: "Ovesné mléko (250ml)", cal: 120, p: 3, c: 16, f: 5, cat: "nápoje" },
  { name: "Pomerančový džus (250ml)", cal: 112, p: 2, c: 26, f: 0, cat: "nápoje" },
  { name: "Kokosová voda (250ml)", cal: 45, p: 2, c: 9, f: 0, cat: "nápoje" },
  { name: "Káva černá", cal: 2, p: 0, c: 0, f: 0, cat: "nápoje" },
  // ═══ POKRMY – České klasiky ═══
  { name: "Svíčková na smetaně + knedlík", cal: 680, p: 35, c: 55, f: 35, cat: "česká" },
  { name: "Vepřo knedlo zelo", cal: 750, p: 30, c: 60, f: 40, cat: "česká" },
  { name: "Hovězí guláš + chléb", cal: 520, p: 32, c: 40, f: 22, cat: "česká" },
  { name: "Smažený řízek + bramborový salát", cal: 680, p: 28, c: 45, f: 40, cat: "česká" },
  { name: "Bramborák (2 ks)", cal: 340, p: 6, c: 35, f: 18, cat: "česká" },
  { name: "Svačinový talíř", cal: 450, p: 22, c: 30, f: 26, cat: "česká" },
  { name: "Česneková polévka", cal: 180, p: 7, c: 20, f: 8, cat: "česká" },
  { name: "Kulajda", cal: 250, p: 8, c: 18, f: 16, cat: "česká" },
  { name: "Zelňačka", cal: 220, p: 10, c: 15, f: 14, cat: "česká" },
  // ═══ POKRMY – Těstoviny a rýže ═══
  { name: "Špagety Bolognese", cal: 520, p: 28, c: 62, f: 16, cat: "těstoviny" },
  { name: "Carbonara", cal: 550, p: 22, c: 55, f: 26, cat: "těstoviny" },
  { name: "Lasagne", cal: 580, p: 28, c: 40, f: 32, cat: "těstoviny" },
  { name: "Risotto (houbové/zeleninové)", cal: 420, p: 12, c: 60, f: 14, cat: "těstoviny" },
  { name: "Pad Thai", cal: 480, p: 18, c: 55, f: 20, cat: "těstoviny" },
  { name: "Fried rice", cal: 430, p: 14, c: 55, f: 16, cat: "těstoviny" },
  { name: "Mac and Cheese", cal: 500, p: 18, c: 48, f: 26, cat: "těstoviny" },
  { name: "Penne arrabbiata", cal: 400, p: 14, c: 58, f: 12, cat: "těstoviny" },
  { name: "Ramen", cal: 480, p: 22, c: 50, f: 20, cat: "těstoviny" },
  // ═══ POKRMY – Rychlé jídlo ═══
  { name: "Pizza Margherita (1/2)", cal: 540, p: 22, c: 60, f: 22, cat: "fast" },
  { name: "Hamburger", cal: 550, p: 30, c: 40, f: 30, cat: "fast" },
  { name: "Hot dog", cal: 290, p: 11, c: 24, f: 17, cat: "fast" },
  { name: "Wrap s kuřecím masem", cal: 420, p: 30, c: 40, f: 14, cat: "fast" },
  { name: "Caesar salát", cal: 380, p: 24, c: 18, f: 24, cat: "fast" },
  { name: "Shawarma / Döner kebab", cal: 550, p: 28, c: 45, f: 28, cat: "fast" },
  { name: "Quesadilla", cal: 480, p: 22, c: 38, f: 26, cat: "fast" },
  { name: "Falafel wrap", cal: 430, p: 15, c: 48, f: 20, cat: "fast" },
  { name: "Nachos s dipem", cal: 400, p: 8, c: 42, f: 22, cat: "fast" },
  // ═══ POKRMY – Saláty ═══
  { name: "Řecký salát", cal: 250, p: 8, c: 10, f: 20, cat: "saláty" },
  { name: "Caprese", cal: 280, p: 16, c: 6, f: 20, cat: "saláty" },
  { name: "Avokádový toast", cal: 280, p: 8, c: 28, f: 16, cat: "saláty" },
  { name: "Hummus s pitou", cal: 350, p: 12, c: 42, f: 15, cat: "saláty" },
  { name: "Buddha bowl", cal: 450, p: 20, c: 55, f: 16, cat: "saláty" },
  { name: "Poke bowl", cal: 480, p: 28, c: 50, f: 16, cat: "saláty" },
  // ═══ POKRMY – Snídaně ═══
  { name: "Ovesné vločky + jogurt + banán", cal: 420, p: 18, c: 65, f: 10, cat: "snídaně" },
  { name: "Vejce 3x + chleba", cal: 370, p: 24, c: 30, f: 18, cat: "snídaně" },
  { name: "Tvaroh + med + ořechy", cal: 350, p: 28, c: 32, f: 14, cat: "snídaně" },
  { name: "Míchaná vejce na másle", cal: 280, p: 18, c: 2, f: 22, cat: "snídaně" },
  { name: "Francouzský toast (2 ks)", cal: 340, p: 12, c: 36, f: 16, cat: "snídaně" },
  { name: "Americké palačinky (3 ks)", cal: 420, p: 10, c: 55, f: 18, cat: "snídaně" },
  { name: "Omeleta (šunka + sýr)", cal: 380, p: 28, c: 4, f: 28, cat: "snídaně" },
  { name: "Ovesná kaše + arašídové máslo", cal: 450, p: 16, c: 52, f: 18, cat: "snídaně" },
  { name: "Smoothie bowl", cal: 320, p: 8, c: 52, f: 10, cat: "snídaně" },
  { name: "Granola + jogurt", cal: 380, p: 14, c: 48, f: 14, cat: "snídaně" },
  { name: "Shakshuka", cal: 300, p: 16, c: 18, f: 18, cat: "snídaně" },
  // ═══ POKRMY – Grilované / pečené ═══
  { name: "Grilovaný losos + příloha", cal: 500, p: 36, c: 40, f: 18, cat: "gril" },
  { name: "Kuřecí tikka masala + rýže", cal: 580, p: 35, c: 55, f: 22, cat: "gril" },
  { name: "Pečená kuřecí stehna", cal: 380, p: 32, c: 0, f: 26, cat: "gril" },
  { name: "BBQ žebra (porce)", cal: 650, p: 35, c: 20, f: 48, cat: "gril" },
  { name: "Steak + hranolky", cal: 680, p: 42, c: 45, f: 35, cat: "gril" },
  { name: "Teriyaki kuře + rýže", cal: 520, p: 32, c: 58, f: 14, cat: "gril" },
  { name: "Tandoori kuře + naan", cal: 500, p: 34, c: 40, f: 20, cat: "gril" },
  { name: "Kuřecí řízek", cal: 350, p: 28, c: 18, f: 18, cat: "gril" },
  // ═══ POKRMY – Polévky ═══
  { name: "Kuřecí vývar s nudlemi", cal: 180, p: 12, c: 20, f: 6, cat: "polévky" },
  { name: "Minestrone", cal: 170, p: 6, c: 24, f: 5, cat: "polévky" },
  { name: "Tom Yum", cal: 200, p: 18, c: 10, f: 10, cat: "polévky" },
  { name: "Francouzská cibulačka", cal: 280, p: 10, c: 24, f: 16, cat: "polévky" },
  { name: "Chili con carne", cal: 420, p: 28, c: 35, f: 18, cat: "polévky" },
  { name: "Čočková polévka", cal: 280, p: 18, c: 38, f: 4, cat: "polévky" },
  { name: "Pho", cal: 350, p: 24, c: 40, f: 8, cat: "polévky" },
  { name: "Tom Kha Gai", cal: 320, p: 20, c: 12, f: 22, cat: "polévky" },
  // ═══ POKRMY – Vegetariánské ═══
  { name: "Vegetariánské curry + rýže", cal: 450, p: 14, c: 58, f: 18, cat: "vege" },
  { name: "Plněné papriky", cal: 320, p: 12, c: 35, f: 14, cat: "vege" },
  { name: "Zeleninové stir-fry + rýže", cal: 380, p: 10, c: 52, f: 14, cat: "vege" },
  { name: "Falafel talíř", cal: 520, p: 18, c: 55, f: 24, cat: "vege" },
  { name: "Veggie burger", cal: 380, p: 16, c: 40, f: 16, cat: "vege" },
  { name: "Tofu stir-fry", cal: 320, p: 18, c: 28, f: 16, cat: "vege" },
  { name: "Quinoa bowl", cal: 420, p: 16, c: 52, f: 16, cat: "vege" },
  // ═══ POKRMY – Světová kuchyně ═══
  { name: "Sushi set (8 ks)", cal: 380, p: 18, c: 52, f: 8, cat: "svět" },
  { name: "Tacos (3 ks)", cal: 480, p: 24, c: 42, f: 22, cat: "svět" },
  { name: "Paella (porce)", cal: 520, p: 26, c: 55, f: 18, cat: "svět" },
  { name: "Moussaka", cal: 450, p: 22, c: 28, f: 28, cat: "svět" },
  { name: "Bibimbap", cal: 500, p: 24, c: 60, f: 16, cat: "svět" },
  { name: "Butter chicken + rýže", cal: 600, p: 32, c: 55, f: 26, cat: "svět" },
  { name: "Pierogi (8 ks)", cal: 440, p: 14, c: 55, f: 18, cat: "svět" },
  // ═══ POKRMY – Dezerty ═══
  { name: "Tiramisu (porce)", cal: 450, p: 8, c: 40, f: 28, cat: "dezert" },
  { name: "Cheesecake (kousek)", cal: 400, p: 7, c: 32, f: 28, cat: "dezert" },
  { name: "Čokoládový brownie", cal: 350, p: 4, c: 40, f: 20, cat: "dezert" },
  { name: "Jablečný závin (porce)", cal: 280, p: 3, c: 38, f: 14, cat: "dezert" },
  { name: "Palačinky s džemem (2 ks)", cal: 320, p: 8, c: 48, f: 10, cat: "dezert" },
  { name: "Hořká čokoláda (30g)", cal: 170, p: 2, c: 13, f: 12, cat: "dezert" },
  { name: "Mléčná čokoláda (30g)", cal: 160, p: 2, c: 17, f: 9, cat: "dezert" },
];

const CATEGORIES = [
  { id: "vše", label: "Vše" },
  { id: "snídaně", label: "Snídaně" },
  { id: "maso", label: "Maso" },
  { id: "ryby", label: "Ryby" },
  { id: "mléčné", label: "Mléčné" },
  { id: "pečivo", label: "Pečivo" },
  { id: "zelenina", label: "Zelenina" },
  { id: "ovoce", label: "Ovoce" },
  { id: "ořechy", label: "Luštěniny" },
  { id: "tuky", label: "Tuky" },
  { id: "nápoje", label: "Nápoje" },
  { id: "česká", label: "České" },
  { id: "těstoviny", label: "Těstoviny" },
  { id: "fast", label: "Fast food" },
  { id: "saláty", label: "Saláty" },
  { id: "gril", label: "Gril" },
  { id: "polévky", label: "Polévky" },
  { id: "vege", label: "Vege" },
  { id: "svět", label: "Svět" },
  { id: "dezert", label: "Dezerty" },
];

const localDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => localDateStr(new Date());

const THEMES = {
  dark: {
    bg: "#0A0A0C", card: "rgba(255,255,255,0.03)", cardBorder: "rgba(255,255,255,0.05)",
    text: "#fff", textSec: "rgba(255,255,255,0.85)", textMuted: "rgba(255,255,255,0.4)",
    textFaint: "rgba(255,255,255,0.25)", textGhost: "rgba(255,255,255,0.15)",
    track: "rgba(255,255,255,0.06)", inputBg: "rgba(255,255,255,0.06)", inputBorder: "rgba(255,255,255,0.08)",
    accent: "#D4AF37", accentGrad: "linear-gradient(135deg, #D4AF37, #F5D364)",
    accentBg: "rgba(212,175,55,0.15)", accentHover: "rgba(212,175,55,0.08)", btnOff: "rgba(255,255,255,0.04)",
    red: "#E53935", green: "#4CAF50", blue: "#42A5F5", greenBg: "rgba(76,175,80,0.2)",
    barGrad: "linear-gradient(180deg, rgba(212,175,55,0.4), rgba(212,175,55,0.15))",
    barFull: "linear-gradient(180deg, #4CAF50, #2E7D32)", barSel: "linear-gradient(180deg, #D4AF37, #B8942E)",
    submitBg: "linear-gradient(135deg, #D4AF37, #B8942E)", submitText: "#0A0A0C",
    redBg: "rgba(229,57,53,0.1)", toggleIcon: "☀️",
  },
  light: {
    bg: "#F5F3EE", card: "rgba(0,0,0,0.025)", cardBorder: "rgba(0,0,0,0.07)",
    text: "#1A1A1A", textSec: "rgba(0,0,0,0.78)", textMuted: "rgba(0,0,0,0.42)",
    textFaint: "rgba(0,0,0,0.28)", textGhost: "rgba(0,0,0,0.12)",
    track: "rgba(0,0,0,0.06)", inputBg: "#fff", inputBorder: "rgba(0,0,0,0.12)",
    accent: "#B8942E", accentGrad: "linear-gradient(135deg, #B8942E, #D4AF37)",
    accentBg: "rgba(184,148,46,0.12)", accentHover: "rgba(184,148,46,0.06)", btnOff: "rgba(0,0,0,0.04)",
    red: "#C62828", green: "#2E7D32", blue: "#1565C0", greenBg: "rgba(76,175,80,0.15)",
    barGrad: "linear-gradient(180deg, rgba(184,148,46,0.35), rgba(184,148,46,0.12))",
    barFull: "linear-gradient(180deg, #66BB6A, #43A047)", barSel: "linear-gradient(180deg, #D4AF37, #B8942E)",
    submitBg: "linear-gradient(135deg, #B8942E, #D4AF37)", submitText: "#fff",
    redBg: "rgba(198,40,40,0.08)", toggleIcon: "🌙",
  },
};

export default function CalorieTracker() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("dashboard");
  const [customForm, setCustomForm] = useState({ name: "", cal: "", p: "", c: "", f: "" });
  const [selectedDate, setSelectedDate] = useState(today());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [foodFilter, setFoodFilter] = useState("vše");
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachWater, setCoachWater] = useState("");
  const t = THEMES[theme];

  useEffect(() => {
    try { const r = localStorage.getItem("calorie-entries"); if (r) setEntries(JSON.parse(r)); } catch (e) {}
    try { const r = localStorage.getItem("calorie-theme"); if (r) setTheme(r); } catch (e) {}
    try {
      const r = localStorage.getItem("calorie-profile");
      if (r) { const p = JSON.parse(r); setProfile(p); setProfileForm(p); }
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaving(true); try { localStorage.setItem("calorie-entries", JSON.stringify(entries)); } catch (e) {} setSaving(false);
  }, [entries, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("calorie-theme", theme); } catch (e) {}
  }, [theme, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("calorie-profile", JSON.stringify(profile)); } catch (e) {}
  }, [profile, loaded]);

  const goals = calcGoals(profile) || DEFAULT_GOALS;

  const todayEntries = entries.filter((e) => e.date === selectedDate);
  const totals = todayEntries.reduce(
    (acc, e) => ({ calories: acc.calories + e.cal, protein: acc.protein + e.p, carbs: acc.carbs + e.c, fat: acc.fat + e.f }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const addEntry = (food) => {
    setEntries((prev) => [...prev, {
      id: Date.now(), date: selectedDate, name: food.name,
      cal: Number(food.cal), p: Number(food.p), c: Number(food.c), f: Number(food.f),
      time: new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
    }]);
    if (view === "add-custom") { setCustomForm({ name: "", cal: "", p: "", c: "", f: "" }); setView("dashboard"); }
  };

  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const resetDay = () => {
    if (window.confirm(`Smazat všech ${todayEntries.length} jídel pro ${selectedDate}?`)) {
      setEntries((prev) => prev.filter((e) => e.date !== selectedDate));
    }
  };
  const pct = (val, goal) => Math.min((val / goal) * 100, 100);

  const buildCoachSummary = () => {
    const g = goals;
    const goalLabel = GOAL_LABELS[profile.goal] || "Udržení váhy";
    const computed = calcGoals(profile);
    const tdee = computed ? computed.tdee : "neznámé";
    const lines = [`Cíl: ${goalLabel}`, `TDEE: ${tdee} kcal`];
    lines.push(`Cílové makra: ${g.calories} kcal, ${g.protein}g B, ${g.carbs}g S, ${g.fat}g T`);
    if (profile.weight) lines.push(`Váha: ${profile.weight} kg`);
    if (profile.age) lines.push(`Věk: ${profile.age}`);
    if (profile.gender) lines.push(`Pohlaví: ${profile.gender}`);
    if (profile.allergies) lines.push(`Alergie: ${profile.allergies}`);
    lines.push("");
    lines.push("== Jídla dnes ==");
    if (todayEntries.length === 0) {
      lines.push("(žádná jídla)");
    } else {
      todayEntries.forEach((e) => {
        lines.push(`- ${e.name}: ${e.cal} kcal, ${e.p}g B, ${e.c}g S, ${e.f}g T (${e.time})`);
      });
    }
    lines.push("");
    lines.push(`Celkem: ${totals.calories} kcal, ${totals.protein}g B, ${totals.carbs}g S, ${totals.fat}g T`);
    lines.push(`Voda: ${coachWater ? coachWater + "l" : "neuvedeno"}`);
    return lines.join("\n");
  };

  const sendCoachMessage = async (userText, isAuto = false) => {
    const newMsg = { role: "user", content: userText };
    const allMsgs = [...coachMessages, newMsg];
    if (!isAuto) setCoachMessages(allMsgs);
    setCoachLoading(true);
    try {
      const apiMessages = allMsgs.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba serveru");
      const assistantMsg = { role: "assistant", content: data.text };
      setCoachMessages([...allMsgs, assistantMsg]);
    } catch (err) {
      setCoachMessages([...allMsgs, { role: "assistant", content: `❌ ${err.message}` }]);
    } finally {
      setCoachLoading(false);
    }
  };

  const openCoach = () => {
    setCoachOpen(true);
    if (coachMessages.length === 0) {
      const summary = buildCoachSummary();
      const autoMsg = { role: "user", content: summary };
      setCoachMessages([autoMsg]);
      setCoachLoading(true);
      fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: summary }] }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setCoachMessages([autoMsg, { role: "assistant", content: data.text }]);
        })
        .catch((err) => {
          setCoachMessages([autoMsg, { role: "assistant", content: `❌ ${err.message}` }]);
        })
        .finally(() => setCoachLoading(false));
    }
  };

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = localDateStr(d);
    return { date: ds, day: d.toLocaleDateString("cs-CZ", { weekday: "short" }), cal: entries.filter((e) => e.date === ds).reduce((s, e) => s + e.cal, 0) };
  });

  const filteredFoods = QUICK_FOODS.filter(f => {
    const matchCat = foodFilter === "vše" || f.cat === foodFilter;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const CircularProgress = ({ value, max, size = 140, stroke = 10, color, label }) => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.min(value / max, 1));
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.track} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size > 100 ? 28 : 18, fontWeight: 800, color: t.text, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{value}</span>
          <span style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
        </div>
      </div>
    );
  };

  const MacroBar = ({ label, value, max, color }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}g <span style={{ color: t.textFaint }}>/ {max}g</span></span>
      </div>
      <div style={{ height: 6, background: t.track, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct(value, max)}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );

  const navBtn = (active) => ({
    padding: "10px 18px", border: "none", borderRadius: 10,
    background: active ? t.accentBg : t.btnOff, color: active ? t.accent : t.textMuted,
    fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "uppercase",
    letterSpacing: 1.2, transition: "all 0.2s", fontFamily: "'Inter', sans-serif",
  });

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: t.accent, fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3 }}>LOADING...</div>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'Inter', sans-serif",
        maxWidth: 480, margin: "0 auto", padding: "0 16px 100px", position: "relative", transition: "background 0.35s ease, color 0.35s ease" }}>

        {/* Header */}
        <div style={{ padding: "24px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, fontWeight: 400, letterSpacing: 4, margin: 0,
              color: t.text }}>LEVELUP</h1>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: t.textFaint, letterSpacing: 2, textTransform: "uppercase" }}>
              Grind Mode · {QUICK_FOODS.length} potravin & pokrmů
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saving && <span style={{ fontSize: 10, color: t.accent, opacity: 0.6 }}>●</span>}
            <button onClick={() => setView("settings")} style={{ width: 40, height: 40, borderRadius: 12,
              background: view === "settings" ? t.accentBg : t.card, border: `1px solid ${view === "settings" ? t.accent + "33" : t.cardBorder}`,
              cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}
              title="Nastavení">⚙️</button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ width: 40, height: 40, borderRadius: 12,
              background: t.card, border: `1px solid ${t.cardBorder}`, cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}
              title={theme === "dark" ? "Světlý režim" : "Tmavý režim"}>{t.toggleIcon}</button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{
              background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8,
              color: t.text, padding: "6px 10px", fontSize: 12, fontFamily: "'Inter', sans-serif" }} />
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, marginTop: 8 }}>
          {[["dashboard","📊","Přehled"],["quick-add","⚡","Jídla"],["add-custom","✏️","Vlastní"],["history","📅","Týden"]].map(([v,icon,label]) => (
            <button key={v} onClick={() => setView(v)} style={navBtn(view === v)}>{icon} {label}</button>
          ))}
        </div>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 28px", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <CircularProgress value={totals.calories} max={goals.calories} size={180} stroke={12} color={t.accent} label="kcal" />
                <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                  background: totals.calories >= goals.calories ? t.greenBg : t.track,
                  color: totals.calories >= goals.calories ? t.green : t.textMuted,
                  padding: "3px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap" }}>
                  {totals.calories >= goals.calories ? "CÍL SPLNĚN ✓" : `ZBÝVÁ ${goals.calories - totals.calories} KCAL`}
                </div>
              </div>
            </div>
            <div style={{ background: t.card, borderRadius: 16, padding: "20px 20px 10px", border: `1px solid ${t.cardBorder}`, marginBottom: 16 }}>
              <MacroBar label="Bílkoviny" value={totals.protein} max={goals.protein} color={t.red} />
              <MacroBar label="Sacharidy" value={totals.carbs} max={goals.carbs} color={t.accent} />
              <MacroBar label="Tuky" value={totals.fat} max={goals.fat} color={t.blue} />
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, margin: 0, color: t.textMuted }}>DNEŠNÍ JÍDLA</h3>
                {todayEntries.length > 0 && (
                  <button onClick={resetDay} style={{ background: t.redBg, border: "none", borderRadius: 6, color: t.red,
                    padding: "4px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>SMAZAT VŠE</button>
                )}
              </div>
              {todayEntries.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: t.textGhost, fontSize: 13 }}>Zatím nic — přidej první jídlo ⚡</div>
              ) : todayEntries.map((entry) => (
                <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", background: t.card, borderRadius: 12, marginBottom: 8, border: `1px solid ${t.cardBorder}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.textSec }}>{entry.name}</div>
                    <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>{entry.time} · {entry.p}g B · {entry.c}g S · {entry.f}g T</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: t.accent, letterSpacing: 1 }}>{entry.cal}</span>
                    <button onClick={() => removeEntry(entry.id)} style={{ background: "none", border: "none", color: t.textGhost, cursor: "pointer", fontSize: 18, padding: 0, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK ADD */}
        {view === "quick-add" && (
          <div>
            <input type="text" placeholder="🔍  Hledat potravinu nebo pokrm..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", background: t.card, border: `1px solid ${t.cardBorder}`,
                borderRadius: 12, color: t.text, fontSize: 14, fontFamily: "'Inter', sans-serif",
                outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setFoodFilter(cat.id)} style={{
                  padding: "5px 12px", borderRadius: 20, border: "none",
                  background: foodFilter === cat.id ? t.accentBg : t.btnOff,
                  color: foodFilter === cat.id ? t.accent : t.textMuted,
                  fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "uppercase",
                  letterSpacing: 1, fontFamily: "'Inter', sans-serif", transition: "all 0.2s" }}>{cat.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: t.textFaint, marginBottom: 10, letterSpacing: 1 }}>{filteredFoods.length} POLOŽEK</div>
            <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
              {filteredFoods.map((food, i) => (
                <button key={i} onClick={() => addEntry(food)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  padding: "12px 14px", background: t.card, borderRadius: 12, marginBottom: 6,
                  border: `1px solid ${t.cardBorder}`, color: t.text, cursor: "pointer", textAlign: "left",
                  transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.accentHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = t.card)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{food.name}</div>
                    <div style={{ fontSize: 10, color: t.textFaint, marginTop: 2 }}>B: {food.p}g · S: {food.c}g · T: {food.f}g</div>
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: t.accent, letterSpacing: 1, minWidth: 50, textAlign: "right" }}>{food.cal}</span>
                </button>
              ))}
              {filteredFoods.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: t.textGhost, fontSize: 13 }}>Nic nenalezeno — zkus jiný výraz</div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOM ADD */}
        {view === "add-custom" && (
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.textMuted, marginBottom: 14 }}>✏️ VLASTNÍ JÍDLO</h3>
            <div style={{ background: t.card, borderRadius: 16, padding: 20, border: `1px solid ${t.cardBorder}` }}>
              {[
                { key: "name", label: "Název jídla", type: "text", placeholder: "např. Kuřecí salát" },
                { key: "cal", label: "Kalorie (kcal)", type: "number", placeholder: "0" },
                { key: "p", label: "Bílkoviny (g)", type: "number", placeholder: "0" },
                { key: "c", label: "Sacharidy (g)", type: "number", placeholder: "0" },
                { key: "f", label: "Tuky (g)", type: "number", placeholder: "0" },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={customForm[field.key]}
                    onChange={(e) => setCustomForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                      borderRadius: 10, color: t.text, fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={() => { if (customForm.name && customForm.cal) addEntry(customForm); }}
                disabled={!customForm.name || !customForm.cal}
                style={{ width: "100%", padding: "14px", background: customForm.name && customForm.cal ? t.submitBg : t.track,
                  border: "none", borderRadius: 12, color: customForm.name && customForm.cal ? t.submitText : t.textGhost,
                  fontWeight: 800, fontSize: 13, cursor: customForm.name && customForm.cal ? "pointer" : "not-allowed",
                  letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'Inter', sans-serif", marginTop: 6 }}>PŘIDAT JÍDLO</button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {view === "history" && (
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.textMuted, marginBottom: 14 }}>📅 POSLEDNÍCH 7 DNÍ</h3>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 180, padding: "0 4px" }}>
              {weekData.map((d, i) => {
                const h = goals.calories > 0 ? (d.cal / goals.calories) * 140 : 0;
                const isToday = d.date === today(), isSelected = d.date === selectedDate;
                return (
                  <button key={i} onClick={() => { setSelectedDate(d.date); setView("dashboard"); }} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "flex-end", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.accent, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{d.cal > 0 ? d.cal : ""}</span>
                    <div style={{ width: "100%", height: Math.max(h, 4), borderRadius: 6, transition: "height 0.4s ease",
                      background: d.cal >= goals.calories ? t.barFull : isSelected ? t.barSel : t.barGrad }} />
                    <span style={{ fontSize: 10, fontWeight: isToday ? 800 : 500, color: isToday ? t.accent : t.textFaint, textTransform: "uppercase", letterSpacing: 1 }}>{d.day}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ position: "relative", marginTop: 12 }}>
              <div style={{ borderTop: `1px dashed ${t.textGhost}`, width: "100%" }} />
              <span style={{ position: "absolute", right: 0, top: -8, fontSize: 9, color: t.textFaint, letterSpacing: 1 }}>CÍL: {goals.calories} KCAL</span>
            </div>
          </div>
        )}

        {/* COACH PANEL */}
        {coachOpen && (
          <div style={{
            position: "fixed", bottom: 80, right: 16, width: 360, maxWidth: "calc(100vw - 32px)",
            maxHeight: "70vh", background: t.bg, border: `1px solid ${t.cardBorder}`,
            borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.4)", display: "flex",
            flexDirection: "column", zIndex: 1000, overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "14px 16px", borderBottom: `1px solid ${t.cardBorder}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: t.card,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>LEVELUP COACH</div>
                  <div style={{ fontSize: 9, color: t.textFaint, letterSpacing: 1.5, textTransform: "uppercase" }}>AI výživový poradce</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setCoachMessages([]); setCoachWater(""); }} style={{
                  background: t.redBg, border: "none", borderRadius: 8, color: t.red,
                  padding: "4px 10px", fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
                }}>RESET</button>
                <button onClick={() => setCoachOpen(false)} style={{
                  background: "none", border: "none", color: t.textMuted, fontSize: 20,
                  cursor: "pointer", padding: "0 4px", lineHeight: 1,
                }}>×</button>
              </div>
            </div>

            {/* Water input */}
            {coachMessages.length === 0 && (
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.cardBorder}`, background: t.card }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, display: "block" }}>
                  💧 Kolik litrů vody dnes?
                </label>
                <input type="number" step="0.1" min="0" max="10" placeholder="např. 2.5" value={coachWater}
                  onChange={(e) => setCoachWater(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8, color: t.text, fontSize: 13, fontFamily: "'Inter', sans-serif",
                    outline: "none", boxSizing: "border-box",
                  }} />
              </div>
            )}

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex",
              flexDirection: "column", gap: 10, minHeight: 120,
            }}>
              {coachMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 10px", color: t.textGhost }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    Zadej vodu a klikni <strong style={{ color: t.accent }}>ANALYZOVAT</strong>
                    <br />pro denní rozbor jídelníčku
                  </div>
                </div>
              )}
              {coachMessages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user" ? t.accentBg : t.card,
                  border: `1px solid ${msg.role === "user" ? t.accent + "33" : t.cardBorder}`,
                  fontSize: 12, lineHeight: 1.6, color: t.textSec,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {msg.role === "user" && i === 0 ? "📊 Denní souhrn odeslán" : msg.content}
                </div>
              ))}
              {coachLoading && (
                <div style={{
                  alignSelf: "flex-start", padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
                  background: t.card, border: `1px solid ${t.cardBorder}`, fontSize: 12, color: t.textMuted,
                }}>
                  <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>🤖 Analyzuji...</span>
                </div>
              )}
            </div>

            {/* Input area */}
            {coachMessages.length === 0 ? (
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.cardBorder}` }}>
                <button onClick={() => openCoach()} style={{
                  width: "100%", padding: "12px", background: t.submitBg, border: "none",
                  borderRadius: 10, color: t.submitText, fontWeight: 800, fontSize: 12,
                  cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase",
                  fontFamily: "'Inter', sans-serif",
                }}>🤖 ANALYZOVAT DNEŠNÍ DEN</button>
              </div>
            ) : (
              <div style={{
                padding: "10px 12px", borderTop: `1px solid ${t.cardBorder}`,
                display: "flex", gap: 8,
              }}>
                <input type="text" placeholder="Napiš zprávu..." value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && coachInput.trim() && !coachLoading) {
                      sendCoachMessage(coachInput.trim());
                      setCoachInput("");
                    }
                  }}
                  style={{
                    flex: 1, padding: "10px 14px", background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 10, color: t.text, fontSize: 13, fontFamily: "'Inter', sans-serif",
                    outline: "none",
                  }} />
                <button onClick={() => {
                  if (coachInput.trim() && !coachLoading) {
                    sendCoachMessage(coachInput.trim());
                    setCoachInput("");
                  }
                }} disabled={!coachInput.trim() || coachLoading} style={{
                  padding: "10px 16px", background: coachInput.trim() && !coachLoading ? t.submitBg : t.track,
                  border: "none", borderRadius: 10,
                  color: coachInput.trim() && !coachLoading ? t.submitText : t.textGhost,
                  fontWeight: 800, fontSize: 12, cursor: coachInput.trim() && !coachLoading ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif",
                }}>↑</button>
              </div>
            )}
          </div>
        )}

        {/* COACH FLOATING BUTTON */}
        <button onClick={() => { if (coachOpen) { setCoachOpen(false); } else { setCoachOpen(true); } }}
          style={{
            position: "fixed", bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28,
            background: t.accentGrad, border: "none", cursor: "pointer", fontSize: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(212,175,55,0.3)", zIndex: 999,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(212,175,55,0.45)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,175,55,0.3)"; }}
          title="LEVELUP Coach"
        >{coachOpen ? "✕" : "🤖"}</button>

        {/* SETTINGS */}
        {view === "settings" && (() => {
          const pf = profileForm;
          const upd = (key, val) => setProfileForm((prev) => ({ ...prev, [key]: val }));
          const computed = calcGoals(profileForm);
          const sectionTitle = (text) => (
            <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: t.textMuted, margin: "20px 0 10px" }}>{text}</h4>
          );
          const fieldLabel = (text) => (
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{text}</label>
          );
          const inputStyle = {
            width: "100%", padding: "10px 14px", background: t.inputBg, border: `1px solid ${t.inputBorder}`,
            borderRadius: 10, color: t.text, fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box",
          };
          const toggleBtn = (active) => ({
            flex: 1, padding: "10px 8px", borderRadius: 10, border: "none",
            background: active ? t.accentBg : t.btnOff, color: active ? t.accent : t.textMuted,
            fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase",
            letterSpacing: 1, fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
          });
          const saveProfile = () => { setProfile(profileForm); setView("dashboard"); };

          return (
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.textMuted, marginBottom: 14 }}>⚙️ NASTAVENÍ</h3>

              {/* OSOBNÍ ÚDAJE */}
              <div style={{ background: t.card, borderRadius: 16, padding: 20, border: `1px solid ${t.cardBorder}`, marginBottom: 12 }}>
                {sectionTitle("👤 OSOBNÍ ÚDAJE")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    {fieldLabel("Aktuální váha (kg)")}
                    <input type="number" min="30" max="300" step="0.1" value={pf.weight} onChange={(e) => upd("weight", e.target.value)}
                      placeholder="80" style={inputStyle} />
                  </div>
                  <div>
                    {fieldLabel("Cílová váha (kg)")}
                    <input type="number" min="30" max="300" step="0.1" value={pf.targetWeight} onChange={(e) => upd("targetWeight", e.target.value)}
                      placeholder="75" style={inputStyle} />
                  </div>
                  <div>
                    {fieldLabel("Výška (cm)")}
                    <input type="number" min="100" max="250" value={pf.height} onChange={(e) => upd("height", e.target.value)}
                      placeholder="180" style={inputStyle} />
                  </div>
                  <div>
                    {fieldLabel("Věk (roky)")}
                    <input type="number" min="10" max="120" value={pf.age} onChange={(e) => upd("age", e.target.value)}
                      placeholder="25" style={inputStyle} />
                  </div>
                </div>
                {fieldLabel("Pohlaví")}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => upd("gender", "muž")} style={toggleBtn(pf.gender === "muž")}>🚹 Muž</button>
                  <button onClick={() => upd("gender", "žena")} style={toggleBtn(pf.gender === "žena")}>🚺 Žena</button>
                </div>
              </div>

              {/* ÚROVEŇ AKTIVITY */}
              <div style={{ background: t.card, borderRadius: 16, padding: 20, border: `1px solid ${t.cardBorder}`, marginBottom: 12 }}>
                {sectionTitle("🏃 ÚROVEŇ AKTIVITY")}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => upd("activity", key)} style={{
                      padding: "12px 14px", borderRadius: 10, border: "none", textAlign: "left",
                      background: pf.activity === key ? t.accentBg : t.btnOff,
                      color: pf.activity === key ? t.accent : t.textMuted,
                      fontSize: 12, fontWeight: pf.activity === key ? 700 : 500, cursor: "pointer",
                      fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* CÍL */}
              <div style={{ background: t.card, borderRadius: 16, padding: 20, border: `1px solid ${t.cardBorder}`, marginBottom: 12 }}>
                {sectionTitle("🎯 CÍL")}
                <div style={{ display: "flex", gap: 8 }}>
                  {Object.entries(GOAL_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => upd("goal", key)} style={{
                      ...toggleBtn(pf.goal === key), flex: 1, padding: "12px 6px", fontSize: 10, lineHeight: 1.3, textAlign: "center",
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* VYPOČTENÉ HODNOTY */}
              {computed && (
                <div style={{ background: t.card, borderRadius: 16, padding: 20, border: `1px solid ${t.cardBorder}`, marginBottom: 12 }}>
                  {sectionTitle("📊 VYPOČTENÉ HODNOTY")}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      ["BMR", `${computed.bmr} kcal`],
                      ["TDEE", `${computed.tdee} kcal`],
                      ["Cíl kalorií", `${computed.calories} kcal`],
                      ["Bílkoviny", `${computed.protein}g`],
                      ["Sacharidy", `${computed.carbs}g`],
                      ["Tuky", `${computed.fat}g`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: t.btnOff, borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 9, color: t.textFaint, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: t.accent, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VOLITELNÉ ÚDAJE */}
              <div style={{ background: t.card, borderRadius: 16, padding: 20, border: `1px solid ${t.cardBorder}`, marginBottom: 12 }}>
                {sectionTitle("📝 VOLITELNÉ ÚDAJE")}
                <div style={{ marginBottom: 14 }}>
                  {fieldLabel("Typ tréninku")}
                  <input type="text" value={pf.trainingType} onChange={(e) => upd("trainingType", e.target.value)}
                    placeholder="judo, posilovna, MMA, běh..." style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    {fieldLabel("Tréninky / týden")}
                    <input type="number" min="0" max="14" value={pf.trainingsPerWeek} onChange={(e) => upd("trainingsPerWeek", e.target.value)}
                      placeholder="4" style={inputStyle} />
                  </div>
                  <div>
                    {fieldLabel("Počet jídel / den")}
                    <input type="number" min="2" max="8" value={pf.mealsPerDay} onChange={(e) => upd("mealsPerDay", e.target.value)}
                      placeholder="5" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  {fieldLabel("Alergie a dietní omezení")}
                  <input type="text" value={pf.allergies} onChange={(e) => upd("allergies", e.target.value)}
                    placeholder="bezlepková, veganská..." style={inputStyle} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  {fieldLabel("Intermittent fasting")}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => upd("intermittentFasting", !pf.intermittentFasting)} style={{
                      ...toggleBtn(pf.intermittentFasting), flex: "none", padding: "8px 16px",
                    }}>{pf.intermittentFasting ? "✓ ANO" : "NE"}</button>
                    {pf.intermittentFasting && (
                      <input type="text" value={pf.fastingWindow} onChange={(e) => upd("fastingWindow", e.target.value)}
                        placeholder="16:8" style={{ ...inputStyle, width: 100, textAlign: "center" }} />
                    )}
                  </div>
                </div>
              </div>

              {/* ULOŽIT */}
              <button onClick={saveProfile} style={{
                width: "100%", padding: "16px", background: t.submitBg, border: "none", borderRadius: 12,
                color: t.submitText, fontWeight: 800, fontSize: 14, cursor: "pointer",
                letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Inter', sans-serif", marginTop: 4,
              }}>ULOŽIT PROFIL</button>
            </div>
          );
        })()}
      </div>
    </>
  );
}
