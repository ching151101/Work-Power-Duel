import { Question, QuestionType } from "./types";

function generateOptions(answer: number): number[] {
  const optionsSet = new Set<number>();
  optionsSet.add(answer);

  // Generate mistake-based or offset decoy options
  if (answer % 2 === 0 && answer / 2 > 0) {
    optionsSet.add(answer / 2);
  }
  optionsSet.add(answer * 2);

  // Plausible additions/subtractions based on answer magnitude
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(answer, 1))));
  const variations = [
    mag,
    mag * 2,
    mag / 2,
    mag * 5,
    mag / 5,
  ].filter(v => v >= 1 && v < answer);

  if (variations.length === 0) {
    variations.push(5, 10, 15, 20);
  }

  let attempts = 0;
  while (optionsSet.size < 4 && attempts < 150) {
    attempts++;
    const v = Math.round(variations[Math.floor(Math.random() * variations.length)]);
    const sign = Math.random() > 0.5 ? 1 : -1;
    const opt = answer + sign * v;
    if (opt > 0 && opt !== answer) {
      optionsSet.add(opt);
    }
  }

  // absolute fallbacks if we still don't have 4 unique options
  let fallbackOffset = 1;
  while (optionsSet.size < 4) {
    const sign = Math.random() > 0.5 ? 1 : -1;
    const opt = answer + sign * fallbackOffset;
    if (opt > 0 && opt !== answer) {
      optionsSet.add(opt);
    }
    fallbackOffset++;
  }

  // Return shuffled array
  return Array.from(optionsSet).sort(() => Math.random() - 0.5);
}

export function generateQuestion(type?: QuestionType): Question {
  // If no type provided, pick one of the 6 randomly
  const activeType = type || (Math.floor(Math.random() * 6) + 1) as QuestionType;

  let formulaHint = "";
  let textEn = "";
  let textMn = "";
  let answer = 0;
  let unit = "";

  switch (activeType) {
    case QuestionType.WorkCalculation: {
      // W = F * d
      const F = (Math.floor(Math.random() * 10) + 1) * 20; // 20, 40, ..., 200 N
      const d = Math.floor(Math.random() * 12) + 2; // 2 to 13 m
      answer = F * d;
      unit = "J";
      formulaHint = "W = F × d";
      textEn = `Push a heavy tool chest with a force of ${F} N over a distance of ${d} m. What is the Work done?`;
      textMn = `Хүнд багажны хайрцгийг ${F} Н хүчээр ${d} м зайд түлхэв. Гүйцэтгэсэн ажлыг олно уу?`;
      break;
    }

    case QuestionType.ForceCalculation: {
      // F = W / d
      const d = Math.floor(Math.random() * 10) + 2; // 2 to 11 m
      const F = (Math.floor(Math.random() * 15) + 3) * 10; // 30 to 170 N
      answer = F;
      const W = F * d;
      unit = "N";
      formulaHint = "W = F × d  →  F = W ÷ d";
      textEn = `Work done on a metal crate is ${W} J over a displacement of ${d} m. Find the applied horizontal Force.`;
      textMn = `Төмөр хайрцгийг түлхэхэд гүйцэтгэсэн ажил нь ${W} Ж бөгөөд шилжсэн зай нь ${d} м байв. Үйлчилсэн хэвтээ хүчний хэмжээг олно уу.`;
      break;
    }

    case QuestionType.PowerCalculation: {
      // P = W / t
      const t = Math.floor(Math.random() * 8) + 3; // 3 to 10 seconds
      const P = (Math.floor(Math.random() * 12) + 2) * 10; // 20 to 130 W
      answer = P;
      const W = P * t;
      unit = "W";
      formulaHint = "P = W ÷ t";
      textEn = `A small electric winch performs ${W} J of Work in ${t} seconds. What is its Power output?`;
      textMn = `Жижиг цахилгаан өргөгч эргүүлэг ${W} Ж ажлыг ${t} секундэд хийж гүйцэтгэв. Түүний чадлыг олно уу.`;
      break;
    }

    case QuestionType.TimeCalculation: {
      // t = W / P
      const t = Math.floor(Math.random() * 9) + 4; // 4 to 12 seconds
      const P = (Math.floor(Math.random() * 10) + 2) * 15; // 30 to 165 W
      answer = t;
      const W = P * t;
      unit = "s";
      formulaHint = "P = W ÷ t  →  t = W ÷ P";
      textEn = `A crane with a Power rating of ${P} W does ${W} J of Work lifting steel bars. How much Time did it take?`;
      textMn = `${P} Вт чадалтай кран ган турууг өргөхдөө ${W} Ж ажил гүйцэтгэв. Үүнд хэдэн секунд зарцуулсан бэ?`;
      break;
    }

    case QuestionType.LiftingWork: {
      // W = m * g * h (g = 10)
      const m = (Math.floor(Math.random() * 10) + 1) * 15; // 15 to 150 kg
      const h = Math.floor(Math.random() * 12) + 2; // 2 to 13 m
      const g = 10;
      answer = m * g * h;
      unit = "J";
      formulaHint = "W = m × g × h  (g = 10 m/s²)";
      textEn = `An engineer lifts a ${m} kg concrete block straight up to a high platform at a height of ${h} m. Find the lifting Work (g = 10 m/s²).`;
      textMn = `Инженер ${m} кг масстай бетон блокийг ${h} м өндөртэй тавцан руу эгц дээш өргөв. Өргөхөд хийсэн ажлыг олно уу (g = 10 м/с²).`;
      break;
    }

    case QuestionType.LiftingPower: {
      // P = m * g * h / t
      // Let's choose t first, then make m a multiple of t to keep everything integer-based.
      const t = [2, 4, 5, 8, 10][Math.floor(Math.random() * 5)];
      const k = Math.floor(Math.random() * 6) + 2; // 2 to 7
      const m = k * t * 10; // m is a multiple of t, e.g. 2*4*10 = 80 kg
      const h = Math.floor(Math.random() * 8) + 2; // 2 to 9 m
      const g = 10;
      answer = (m * g * h) / t;
      unit = "W";
      formulaHint = "P = W ÷ t  where  W = m × g × h";
      textEn = `A heavy engine with a mass of ${m} kg is hoisted to a height of ${h} m in ${t} seconds. Calculate the lifting Power required (g = 10 m/s²).`;
      textMn = `${m} кг масстай хүнд хөдөлгүүрийг ${h} м өндөрт ${t} секундийн дотор өргөв. Шаардагдах өргөх чадлыг тооцоолно уу (g = 10 м/с²).`;
      break;
    }
  }

  const options = generateOptions(answer);

  return {
    type: activeType,
    formulaHint,
    textEn,
    textMn,
    answer,
    options,
    unit
  };
}
