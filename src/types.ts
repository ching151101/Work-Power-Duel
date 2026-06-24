export interface LanguageStrings {
  title: string;
  subtitle: string;
  startBattle: string;
  physicsGuide: string;
  playAgain: string;
  p1Name: string;
  p2Name: string;
  vs: string;
  score: string;
  timer: string;
  secondsShort: string;
  workDone: string;
  neckAndNeck: string;
  physicsLab: string;
  liveCalculator: string;
  force: string;
  distance: string;
  mass: string;
  height: string;
  time: string;
  keyFactsTitle: string;
  keyFact1: string;
  keyFact2: string;
  keyFact3: string;
  hintBtn: string;
  translateBtn: string;
  skipBtn: string;
  skipConfirmTitle: string;
  skipConfirmBody: string;
  yesSkip: string;
  cancel: string;
  winsDuel: string;
  totalScore: string;
  questionsCorrect: string;
  skippedCount: string;
  hintsUsedCount: string;
  resultsSummary: string;
  draw: string;
  // Events
  eventTitle: string;
  eventGravityBoost: string;
  eventHeavyLoad: string;
  eventTailWind: string;
  eventFreezeRound: string;
  eventBonusMaterial: string;
  eventPowerCut: string;
  eventPrecision: string;
  eventEnergySurge: string;
}

export const strings: { en: LanguageStrings; mn: LanguageStrings } = {
  en: {
    title: "WORK & POWER DUEL",
    subtitle: "Construction Site Physics Battle",
    startBattle: "⚡ START BATTLE",
    physicsGuide: "📖 Physics Guide",
    playAgain: "🔁 Play Again",
    p1Name: "Player 1 Name",
    p2Name: "Player 2 Name",
    vs: "VS",
    score: "Score",
    timer: "TIME",
    secondsShort: "s",
    workDone: "Work Done",
    neckAndNeck: "⚡ NECK AND NECK!",
    physicsLab: "⚙️ PHYSICS LAB",
    liveCalculator: "Live Work & Power Calculator",
    force: "Force",
    distance: "Distance",
    mass: "Mass",
    height: "Height",
    time: "Time",
    keyFactsTitle: "📌 KEY FACTS",
    keyFact1: "More Force or Distance → More Work",
    keyFact2: "Same Work, less Time → More Power",
    keyFact3: "Higher or Heavier → More Lifting Work",
    hintBtn: "💡 Hint (-200)",
    translateBtn: "🌐 Translate",
    skipBtn: "⏭ Skip (-500)",
    skipConfirmTitle: "Skip this question?",
    skipConfirmBody: "You will lose 500 points and get a new question.",
    yesSkip: "Yes, Skip",
    cancel: "Cancel",
    winsDuel: "Wins the Work & Power Duel!",
    totalScore: "Total Score",
    questionsCorrect: "Correct Answers",
    skippedCount: "Skipped Questions",
    hintsUsedCount: "Hints Used",
    resultsSummary: "BATTLE STATISTICS",
    draw: "It's a Draw!",
    eventTitle: "🚨 RANDOM EVENT!",
    eventGravityBoost: "⚡ GRAVITY BOOST! — Lifting Work scores ×2 for 10 seconds!",
    eventHeavyLoad: "🪨 HEAVY LOAD! — Wrong answer penalty ×2 for 10 seconds!",
    eventTailWind: "🌬️ TAIL WIND! — Both cranes speed up — +300 pts each!",
    eventFreezeRound: "❄️ FREEZE ROUND! — Opponent gets +1 extra penalty on next wrong answer!",
    eventBonusMaterial: "🏗️ BONUS MATERIAL! — Next correct answer = +800 pts!",
    eventPowerCut: "⚙️ POWER CUT! — Time bonuses halved for 10 seconds!",
    eventPrecision: "🎯 PRECISION ROUND! — Answer in 5 seconds for +600 extra!",
    eventEnergySurge: "🔋 ENERGY SURGE! — Both scores +10% right now!"
  },
  mn: {
    title: "АЖИЛ БА ЧАДЛЫН ТУЛААН",
    subtitle: "Барилгын талбайн физикийн тулаан",
    startBattle: "⚡ ТУЛААНЫГ ЭХЛҮҮЛЭХ",
    physicsGuide: "📖 Физикийн гарын авлага",
    playAgain: "🔁 Дахин тоглох",
    p1Name: "Тоглогч 1-ийн нэр",
    p2Name: "Тоглогч 2-ийн нэр",
    vs: "ЭСВЭЛ",
    score: "Оноо",
    timer: "ХУГАЦАА",
    secondsShort: "сек",
    workDone: "Гүйцэтгэсэн ажил",
    neckAndNeck: "⚡ ТЭНЦҮҮ ХАМТДАА!",
    physicsLab: "⚙️ ФИЗИКИЙН ЛАБОРАТОРИ",
    liveCalculator: "Ажил ба Чадлын тооцоолуур",
    force: "Хүч",
    distance: "Зай",
    mass: "Масс",
    height: "Өндөр",
    time: "Хугацаа",
    keyFactsTitle: "📌 ГОЛ БАРИМТУУД",
    keyFact1: "Илүү хүч эсвэл илүү зай → Илүү их ажил",
    keyFact2: "Ижил ажил, бага хугацаа → Илүү их чадал",
    keyFact3: "Илүү өндөр эсвэл хүнд → Өргөх ажил ихэснэ",
    hintBtn: "💡 Дохио (-200)",
    translateBtn: "🌐 Орчуулах",
    skipBtn: "⏭ Алгасах (-500)",
    skipConfirmTitle: "Асуултыг алгасах уу?",
    skipConfirmBody: "Та 500 оноо алдаж, шинэ асуулт авах болно.",
    yesSkip: "Тийм, алгасах",
    cancel: "Цуцлах",
    winsDuel: "Ажил ба Чадлын тулаанд яллаа!",
    totalScore: "Нийт оноо",
    questionsCorrect: "Зөв хариулсан",
    skippedCount: "Алгассан асуулт",
    hintsUsedCount: "Хэрэглэсэн дохио",
    resultsSummary: "ТУЛААНЫ СТАТИСТИК",
    draw: "Тэнцлээ!",
    eventTitle: "🚨 САНСАРГҮЙ ҮЙЛ ЯВДАЛ!",
    eventGravityBoost: "⚡ ТАТАЛЦЛЫН ӨСӨЛТ! — Дараагийн 10 секундэд өргөх ажилд 2 дахин оноо өгнө!",
    eventHeavyLoad: "🪨 ХҮНД АЧАА! — Буруу хариулбал 10 секундийн турш 2 дахин их торгуультай!",
    eventTailWind: "🌬️ СҮҮЛИЙН САЛХИ! — Хоёр краны хурд нэмэгдэж, тус бүр +300 оноо!",
    eventFreezeRound: "❄️ ЦЭРВҮҮ ҮЕ! — Дараагийн буруу хариултанд өрсөлдөгч нэмэлт торгууль авна!",
    eventBonusMaterial: "🏗️ НЭМЭЛТ МАТЕРИАЛ! — Дараагийн зөв хариулт = нэмэлт +800 оноо!",
    eventPowerCut: "⚙️ ЦАХИЛГААН ТАСАЛДАЛ! — Хугацааны урамшуулал 10 секундийн турш таллагдана!",
    eventPrecision: "🎯 НАРИЙН ҮЕ! — 5 секундэд амжиж хариулбал нэмэлт +600 оноо!",
    eventEnergySurge: "🔋 ЭРЧИМ ХҮЧНИЙ ДЭЛБЭРЭЛТ! — Хоёр тоглогчийн оноо 10%-иар шууд өсөв!"
  }
};

export enum QuestionType {
  WorkCalculation = 1,     // W = F * d
  ForceCalculation = 2,    // F = W / d
  PowerCalculation = 3,    // P = W / t
  TimeCalculation = 4,     // t = W / P
  LiftingWork = 5,         // W = m * g * h
  LiftingPower = 6         // P = m * g * h / t
}

export interface Question {
  type: QuestionType;
  formulaHint: string;
  textEn: string;
  textMn: string;
  answer: number;
  options: number[];
  unit: string;
}

export interface PlayerState {
  name: string;
  score: number;
  work: number; // Cumulative work (J) for crane height
  questionsCorrect: number;
  skipped: number;
  hintsUsed: number;
  currentQuestion: Question;
  questionTimeStart: number; // timestamp ms
  hintVisible: boolean;
  translateVisible: boolean;
}

export interface ActiveEvent {
  id: number;
  name: string;
  bannerTextEn: string;
  bannerTextMn: string;
  durationLeft: number; // in seconds
  effectId: number;
}
