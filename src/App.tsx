import React, { useState, useEffect, useRef } from "react";
import { 
  strings, 
  Question, 
  QuestionType, 
  PlayerState, 
  ActiveEvent, 
  LanguageStrings 
} from "./types";
import { generateQuestion } from "./questionGenerator";
import { 
  Trophy, 
  Pause, 
  Play, 
  RotateCcw, 
  HelpCircle, 
  BookOpen, 
  Home, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Flame, 
  Zap, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

export default function App() {
  // Global App Language: 'en' | 'mn'
  const [lang, setLang] = useState<"en" | "mn">("en");
  
  // Game Screen Flow: 'menu' | 'battle' | 'winner'
  const [view, setView] = useState<"menu" | "battle" | "winner">("menu");
  
  // General Game Settings
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds game duration
  const [physicsGuideOpen, setPhysicsGuideOpen] = useState(false);

  // Player States
  const [p1, setP1] = useState<PlayerState>({
    name: "Player 1",
    score: 0,
    work: 0,
    questionsCorrect: 0,
    skipped: 0,
    hintsUsed: 0,
    currentQuestion: generateQuestion(),
    questionTimeStart: Date.now(),
    hintVisible: false,
    translateVisible: false,
  });

  const [p2, setP2] = useState<PlayerState>({
    name: "Player 2",
    score: 0,
    work: 0,
    questionsCorrect: 0,
    skipped: 0,
    hintsUsed: 0,
    currentQuestion: generateQuestion(),
    questionTimeStart: Date.now(),
    hintVisible: false,
    translateVisible: false,
  });

  // Skip Question Confirmation Modal State
  const [skipModal, setSkipModal] = useState<{
    isOpen: boolean;
    player: "p1" | "p2" | null;
  }>({ isOpen: false, player: null });

  // Physics Lab Live Values
  const [labForce, setLabForce] = useState(250); // 50 to 500 N
  const [labDistance, setLabDistance] = useState(10); // 1 to 20 m
  const [labTime, setLabTime] = useState(5); // 1 to 30 s
  const [labMass, setLabMass] = useState(80); // 10 to 200 kg
  const [labHeight, setLabHeight] = useState(10); // 1 to 20 m

  // Random Events State
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [eventBannerVisible, setEventBannerVisible] = useState(false);
  const [nextEventIn, setNextEventIn] = useState(22); // Random events trigger every 20-25 seconds

  // Score Badge Feedbacks (Floating Popups)
  const [floatingPoints, setFloatingPoints] = useState<
    Array<{ id: number; player: "p1" | "p2"; text: string; colorClass: string }>
  >([]);
  const floatingIdCounter = useRef(0);

  // Trigger floating scores
  const triggerFloatingScore = (player: "p1" | "p2", amount: number, isPositive: boolean) => {
    const id = floatingIdCounter.current++;
    const text = isPositive ? `+${amount}` : `-${Math.abs(amount)}`;
    const colorClass = isPositive ? "text-emerald-400 font-bold" : "text-rose-500 font-bold";
    
    setFloatingPoints((prev) => [...prev, { id, player, text, colorClass }]);
    setTimeout(() => {
      setFloatingPoints((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Canvas ref for Crane Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ref for Crate smooth heights
  const p1CrateYRef = useRef(300);
  const p2CrateYRef = useRef(300);

  // Ref for Center Demo Crane live animation & sync state
  const physicsDemoRef = useRef({
    F: 250,
    d: 10,
    t: 5,
    m: 80,
    h: 10,
    
    // Target metrics
    targetArmLength: 90,
    targetCrateY: 200,
    targetCrateW: 20,
    targetCrateH: 14,
    targetCableWidth: 2,
    targetCableColor: "#cbd5e1",
    targetHeightRatio: 0.5,
    targetPowerAngle: Math.PI + Math.PI / 2,
    
    // Current visual states (lerped each frame)
    currentArmLength: 90,
    currentCrateY: 200,
    currentCrateW: 20,
    currentCrateH: 14,
    currentCableWidth: 2,
    currentCableColor: "#cbd5e1",
    currentPowerAngle: Math.PI + Math.PI / 2,
  });

  // Synchronize React slider states to physicsDemoRef targets
  useEffect(() => {
    const demo = physicsDemoRef.current;
    demo.F = labForce;
    demo.d = labDistance;
    demo.t = labTime;
    demo.m = labMass;
    demo.h = labHeight;

    // Cable thickness/color based on Force (F)
    demo.targetCableWidth = labForce > 300 ? 4 : 2;
    demo.targetCableColor = labForce > 300 ? "#ef4444" : "#cbd5e1";

    // Arm length based on Distance (d) (maps 1-20m to 40px-140px)
    demo.targetArmLength = 40 + ((labDistance - 1) / 19) * 100;

    // Crate width/height based on Mass (m) (maps 10-200kg to 12x10px - 32x22px)
    const mRatio = (labMass - 10) / 190;
    demo.targetCrateW = 12 + mRatio * 20;
    demo.targetCrateH = 10 + mRatio * 12;

    // Height ratio based on Height (h) (maps 1-20m to 0-1)
    demo.targetHeightRatio = (labHeight - 1) / 19;

    // Needle angle for Power speedometer (maps 0-500W to 180deg semicircle)
    const computedW = labForce * labDistance;
    const computedP = computedW / labTime;
    const Pmax = 500;
    const pRatio = Math.min(computedP / Pmax, 1.0);
    demo.targetPowerAngle = Math.PI + pRatio * Math.PI;
  }, [labForce, labDistance, labTime, labMass, labHeight]);

  // Active strings shorthand
  const currentStrings: LanguageStrings = strings[lang];

  // Confetti particles for Winner Screen
  const [confetti, setConfetti] = useState<
    Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number }>
  >([]);

  // Start the Game
  const handleStartGame = (name1: string, name2: string) => {
    setP1({
      name: name1.trim() || "Player 1",
      score: 0,
      work: 0,
      questionsCorrect: 0,
      skipped: 0,
      hintsUsed: 0,
      currentQuestion: generateQuestion(),
      questionTimeStart: Date.now(),
      hintVisible: false,
      translateVisible: false,
    });
    setP2({
      name: name2.trim() || "Player 2",
      score: 0,
      work: 0,
      questionsCorrect: 0,
      skipped: 0,
      hintsUsed: 0,
      currentQuestion: generateQuestion(),
      questionTimeStart: Date.now(),
      hintVisible: false,
      translateVisible: false,
    });
    setTimeLeft(90);
    setIsPaused(false);
    setActiveEvent(null);
    setEventBannerVisible(false);
    setNextEventIn(22);
    setView("battle");
  };

  // Skip Modal handlers
  const openSkipModal = (player: "p1" | "p2") => {
    setSkipModal({ isOpen: true, player });
  };

  const confirmSkip = () => {
    const player = skipModal.player;
    if (!player) return;

    const penalty = -500;
    if (player === "p1") {
      setP1((prev) => ({
        ...prev,
        score: Math.max(0, prev.score + penalty),
        skipped: prev.skipped + 1,
        currentQuestion: generateQuestion(),
        questionTimeStart: Date.now(),
        hintVisible: false,
        translateVisible: false,
      }));
      triggerFloatingScore("p1", penalty, false);
    } else {
      setP2((prev) => ({
        ...prev,
        score: Math.max(0, prev.score + penalty),
        skipped: prev.skipped + 1,
        currentQuestion: generateQuestion(),
        questionTimeStart: Date.now(),
        hintVisible: false,
        translateVisible: false,
      }));
      triggerFloatingScore("p2", penalty, false);
    }

    setSkipModal({ isOpen: false, player: null });
  };

  // Hint activation
  const handleUseHint = (player: "p1" | "p2") => {
    const penalty = -200;
    if (player === "p1") {
      if (p1.hintVisible) return;
      setP1((prev) => ({
        ...prev,
        score: Math.max(0, prev.score + penalty),
        hintsUsed: prev.hintsUsed + 1,
        hintVisible: true,
      }));
      triggerFloatingScore("p1", penalty, false);
    } else {
      if (p2.hintVisible) return;
      setP2((prev) => ({
        ...prev,
        score: Math.max(0, prev.score + penalty),
        hintsUsed: prev.hintsUsed + 1,
        hintVisible: true,
      }));
      triggerFloatingScore("p2", penalty, false);
    }
  };

  // Translation Toggle
  const handleToggleTranslate = (player: "p1" | "p2") => {
    if (player === "p1") {
      setP1((prev) => ({ ...prev, translateVisible: !prev.translateVisible }));
    } else {
      setP2((prev) => ({ ...prev, translateVisible: !prev.translateVisible }));
    }
  };

  // Answer handler
  const handleAnswer = (player: "p1" | "p2", selectedIdx: number) => {
    const pState = player === "p1" ? p1 : p2;
    const isCorrect = pState.currentQuestion.options[selectedIdx] === pState.currentQuestion.answer;

    if (isCorrect) {
      // Calculate Time Bonus
      const elapsed = (Date.now() - pState.questionTimeStart) / 1000;
      let timeBonus = 0;
      if (elapsed <= 5) timeBonus = 500;
      else if (elapsed <= 10) timeBonus = 400;
      else if (elapsed <= 20) timeBonus = 200;
      else if (elapsed <= 30) timeBonus = 100;

      // Event modifier: Power Cut (Time bonuses halved)
      if (activeEvent && activeEvent.effectId === 6) {
        timeBonus = Math.round(timeBonus / 2);
      }

      // Event modifier: Precision Round (+600 for answers in 5s)
      let precisionBonus = 0;
      if (activeEvent && activeEvent.effectId === 7 && elapsed <= 5) {
        precisionBonus = 600;
      }

      // Event modifier: Bonus Material (+800 pts)
      let materialBonus = 0;
      if (activeEvent && activeEvent.effectId === 5) {
        materialBonus = 800;
        // Turn off material event immediately after use
        setActiveEvent(null);
      }

      const pointsScored = 1000 + timeBonus + precisionBonus + materialBonus;

      // Work gained
      let workGained = 500 + Math.floor(Math.random() * 1000);
      // Event modifier: Gravity Boost (lifting work scores x2)
      if (activeEvent && activeEvent.effectId === 1) {
        workGained *= 2;
      }

      if (player === "p1") {
        setP1((prev) => ({
          ...prev,
          score: prev.score + pointsScored,
          work: prev.work + workGained,
          questionsCorrect: prev.questionsCorrect + 1,
          currentQuestion: generateQuestion(),
          questionTimeStart: Date.now(),
          hintVisible: false,
          translateVisible: false,
        }));
        triggerFloatingScore("p1", pointsScored, true);
      } else {
        setP2((prev) => ({
          ...prev,
          score: prev.score + pointsScored,
          work: prev.work + workGained,
          questionsCorrect: prev.questionsCorrect + 1,
          currentQuestion: generateQuestion(),
          questionTimeStart: Date.now(),
          hintVisible: false,
          translateVisible: false,
        }));
        triggerFloatingScore("p2", pointsScored, true);
      }
    } else {
      // Incorrect Answer
      let penalty = -150;

      // Event modifier: Heavy Load (Wrong penalty x2)
      if (activeEvent && activeEvent.effectId === 2) {
        penalty = -300;
      }

      // Event modifier: Freeze Round (Opponent wrong answer gets extra -150)
      let freezePenalty = 0;
      if (activeEvent && activeEvent.effectId === 4) {
        freezePenalty = -150;
      }

      const totalPenalty = penalty + freezePenalty;

      if (player === "p1") {
        setP1((prev) => ({
          ...prev,
          score: Math.max(0, prev.score + totalPenalty),
        }));
        triggerFloatingScore("p1", totalPenalty, false);
      } else {
        setP2((prev) => ({
          ...prev,
          score: Math.max(0, prev.score + totalPenalty),
        }));
        triggerFloatingScore("p2", totalPenalty, false);
      }

      // Add a slight haptic shake feedback by selecting button (handled with temporary animate-shake in CSS)
      const btn = document.getElementById(`${player}-opt-${selectedIdx}`);
      if (btn) {
        btn.classList.add("animate-shake", "border-rose-600");
        setTimeout(() => {
          btn.classList.remove("animate-shake", "border-rose-600");
        }, 500);
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== "battle" || isPaused || skipModal.isOpen) return;
      const key = e.key.toLowerCase();

      // P1: Q (0), W (1), E (2), R (3)
      const p1Keys = ["q", "w", "e", "r"];
      const p1Index = p1Keys.indexOf(key);
      if (p1Index !== -1) {
        handleAnswer("p1", p1Index);
      }

      // P2: U (0), I (1), O (2), P (3)
      const p2Keys = ["u", "i", "o", "p"];
      const p2Index = p2Keys.indexOf(key);
      if (p2Index !== -1) {
        handleAnswer("p2", p2Index);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, isPaused, p1, p2, activeEvent, skipModal]);

  // Main Timer loop
  useEffect(() => {
    if (view !== "battle" || isPaused) return;

    const interval = setInterval(() => {
      // Game countdown
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setView("winner");
          return 0;
        }
        return prev - 1;
      });

      // Active Event countdown
      if (activeEvent) {
        setActiveEvent((prev) => {
          if (!prev) return null;
          if (prev.durationLeft <= 1) return null;
          return { ...prev, durationLeft: prev.durationLeft - 1 };
        });
      }

      // Event trigger countdown
      setNextEventIn((prev) => {
        if (prev <= 1) {
          // Trigger a new random event!
          fireRandomEvent();
          return 20 + Math.floor(Math.random() * 6); // 20-25 seconds next
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [view, isPaused, activeEvent]);

  // Fire Random Event
  const fireRandomEvent = () => {
    const eventsList = [
      {
        id: 1,
        name: "Gravity Boost",
        bannerTextEn: "⚡ GRAVITY BOOST! — Lifting Work scores ×2 for 10 seconds!",
        bannerTextMn: "⚡ ТАТАЛЦЛЫН ӨСӨЛТ! — Дараагийн 10 секундэд өргөх ажилд 2 дахин оноо өгнө!",
        duration: 10,
        effectId: 1
      },
      {
        id: 2,
        name: "Heavy Load",
        bannerTextEn: "🪨 HEAVY LOAD! — Wrong answer penalty ×2 for 10 seconds!",
        bannerTextMn: "🪨 ХҮНД АЧАА! — Буруу хариулбал 10 секундийн турш 2 дахин их торгуультай!",
        duration: 10,
        effectId: 2
      },
      {
        id: 3,
        name: "Tail Wind",
        bannerTextEn: "🌬️ TAIL WIND! — Both cranes speed up — +300 pts each!",
        bannerTextMn: "🌬️ СҮҮЛИЙН САЛХИ! — Хоёр краны хурд нэмэгдэж, тус бүр +300 оноо!",
        duration: 0,
        effectId: 3
      },
      {
        id: 4,
        name: "Freeze Round",
        bannerTextEn: "❄️ FREEZE ROUND! — Opponent gets +1 extra penalty on next wrong answer!",
        bannerTextMn: "❄️ ЦЭРВҮҮ ҮЕ! — Дараагийн буруу хариултанд өрсөлдөгч нэмэлт торгууль авна!",
        duration: 10,
        effectId: 4
      },
      {
        id: 5,
        name: "Bonus Material",
        bannerTextEn: "🏗️ BONUS MATERIAL! — Next correct answer = +800 pts!",
        bannerTextMn: "🏗️ НЭМЭЛТ МАТЕРИАЛ! — Дараагийн зөв хариулт = нэмэлт +800 оноо!",
        duration: 10,
        effectId: 5
      },
      {
        id: 6,
        name: "Power Cut",
        bannerTextEn: "⚙️ POWER CUT! — Time bonuses halved for 10 seconds!",
        bannerTextMn: "⚙️ ЦАХИЛГААН ТАСАЛДАЛ! — Хугацааны урамшуулал 10 секундийн турш таллагдана!",
        duration: 10,
        effectId: 6
      },
      {
        id: 7,
        name: "Precision Round",
        bannerTextEn: "🎯 PRECISION ROUND! — Answer in 5 seconds for +600 extra!",
        bannerTextMn: "🎯 НАРИЙН ҮЕ! — 5 секундэд амжиж хариулбал нэмэлт +600 оноо!",
        duration: 10,
        effectId: 7
      },
      {
        id: 8,
        name: "Energy Surge",
        bannerTextEn: "🔋 ENERGY SURGE! — Both scores +10% right now!",
        bannerTextMn: "🔋 ЭРЧИМ ХҮЧНИЙ ДЭЛБЭРЭЛТ! — Хоёр тоглогчийн оноо 10%-иар шууд өсөв!",
        duration: 0,
        effectId: 8
      }
    ];

    const randomEv = eventsList[Math.floor(Math.random() * eventsList.length)];
    
    // Apply instant events
    if (randomEv.effectId === 3) {
      // Tail Wind
      setP1((prev) => ({ ...prev, score: prev.score + 300 }));
      setP2((prev) => ({ ...prev, score: prev.score + 300 }));
      triggerFloatingScore("p1", 300, true);
      triggerFloatingScore("p2", 300, true);
    } else if (randomEv.effectId === 8) {
      // Energy Surge
      setP1((prev) => {
        const bonus = Math.round(prev.score * 0.1);
        triggerFloatingScore("p1", bonus, true);
        return { ...prev, score: prev.score + bonus };
      });
      setP2((prev) => {
        const bonus = Math.round(prev.score * 0.1);
        triggerFloatingScore("p2", bonus, true);
        return { ...prev, score: prev.score + bonus };
      });
    }

    setActiveEvent({
      id: randomEv.id,
      name: randomEv.name,
      bannerTextEn: randomEv.bannerTextEn,
      bannerTextMn: randomEv.bannerTextMn,
      durationLeft: randomEv.duration,
      effectId: randomEv.effectId,
    });

    // Show slide banner
    setEventBannerVisible(true);
    setTimeout(() => {
      setEventBannerVisible(false);
    }, 4000);
  };

  // Canvas Animation loop for Cranes
  useEffect(() => {
    if (view !== "battle") return;

    let animFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle responsive sizing on resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || 1024;
        canvas.height = canvas.parentElement?.clientHeight || 360;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    let angle = 0; // For gentle rope swinging

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Smoothly interpolate physicsDemo properties
      const demo = physicsDemoRef.current;
      demo.currentArmLength += (demo.targetArmLength - demo.currentArmLength) * 0.1;
      demo.currentCableWidth += (demo.targetCableWidth - demo.currentCableWidth) * 0.1;
      demo.currentCableColor = demo.targetCableColor;
      demo.currentCrateW += (demo.targetCrateW - demo.currentCrateW) * 0.1;
      demo.currentCrateH += (demo.targetCrateH - demo.currentCrateH) * 0.1;
      demo.currentPowerAngle += (demo.targetPowerAngle - demo.currentPowerAngle) * 0.1;

      const demoCraneBottomY = h - 10;
      const demoCraneBoomY = 35;
      const demoMinCrateY = demoCraneBoomY + 40;
      const demoMaxCrateY = demoCraneBottomY - 45;
      const demoTargetCrateY = demoMaxCrateY - demo.targetHeightRatio * (demoMaxCrateY - demoMinCrateY);
      
      // Speed is proportional to 1/t (lower t = faster movement, higher t = slower movement)
      const speedFactor = 0.4 / demo.t;
      demo.currentCrateY += (demoTargetCrateY - demo.currentCrateY) * speedFactor;

      // 1. Draw Deep Sky Blue/Black Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, "#0b1120");
      skyGrad.addColorStop(1, "#17223b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 30; i++) {
        const starX = (Math.sin(i * 142) * 0.5 + 0.5) * w;
        const starY = (Math.cos(i * 592) * 0.5 + 0.5) * (h - 80);
        ctx.beginPath();
        ctx.arc(starX, starY, Math.random() > 0.5 ? 1.5 : 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Construction Site Background Grid lines & Silhouette Buildings
      ctx.fillStyle = "rgba(10, 15, 30, 0.45)";
      ctx.fillRect(w * 0.1, h - 160, 100, 160);
      ctx.fillRect(w * 0.25, h - 220, 140, 220);
      ctx.fillRect(w * 0.6, h - 190, 120, 190);
      ctx.fillRect(w * 0.8, h - 150, 90, 150);

      // Simple yellow/orange window squares inside silhouettes
      ctx.fillStyle = "rgba(234, 179, 8, 0.35)";
      for (let r = 0; r < 5; r++) {
        ctx.fillRect(w * 0.27 + r * 25, h - 190, 8, 8);
        ctx.fillRect(w * 0.27 + r * 25, h - 140, 8, 8);
        ctx.fillRect(w * 0.63 + r * 20, h - 160, 6, 6);
      }

      // Draw Height Background Building Silhouette next to Center Crane (X = w/2 + 65)
      const hBuildX = w / 2 + 65;
      const hBuildW = 40;
      const hBuildH = 145;
      const hBuildBottomY = h - 10;
      
      // Draw Building Base structure
      ctx.fillStyle = "rgba(15, 23, 42, 0.6)"; // slate dark building silhouette
      ctx.fillRect(hBuildX, hBuildBottomY - hBuildH, hBuildW, hBuildH);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hBuildX, hBuildBottomY - hBuildH, hBuildW, hBuildH);

      // Light up floor-by-floor as h increases (each 2m of h = 1 more window)
      const numHFloors = 10;
      const hFloorSize = hBuildH / numHFloors;
      const litFloors = Math.floor(demo.h / 2);
      
      for (let f = 0; f < numHFloors; f++) {
        const floorY = hBuildBottomY - (f + 1) * hFloorSize;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
        ctx.strokeRect(hBuildX, floorY, hBuildW, hFloorSize);
        
        if (f < litFloors) {
          // Lit floor window
          ctx.fillStyle = "rgba(250, 204, 21, 0.75)"; // gold window glow
          ctx.fillRect(hBuildX + hBuildW / 2 - 4, floorY + hFloorSize / 2 - 3, 8, 6);
        } else {
          // Dim floor window
          ctx.fillStyle = "rgba(71, 85, 105, 0.25)";
          ctx.fillRect(hBuildX + hBuildW / 2 - 4, floorY + hFloorSize / 2 - 3, 8, 6);
        }
      }

      // 4. Draw Building Under Construction for Player 1 (Amber #f59e0b)
      // Every 2000 J is 1 completed floor. Let's make 8 floors.
      const p1Floors = Math.floor(p1.work / 2000);
      const maxFloors = 8;
      const bWidth = 80;
      const bHeight = 180;
      const p1BuildX = w * 0.15 + 40;
      const buildBottomY = h - 10;

      // Draw structural scaffolding skeleton
      ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(p1BuildX, buildBottomY - bHeight, bWidth, bHeight);
      
      // Draw floor grid slots
      const floorSize = bHeight / maxFloors;
      for (let f = 0; f < maxFloors; f++) {
        const floorY = buildBottomY - (f + 1) * floorSize;
        ctx.strokeRect(p1BuildX, floorY, bWidth, floorSize);
        
        // Draw illuminated finished block if completed
        if (f < p1Floors) {
          const goldGrad = ctx.createLinearGradient(p1BuildX, floorY, p1BuildX + bWidth, floorY + floorSize);
          goldGrad.addColorStop(0, "rgba(245, 158, 11, 0.8)");
          goldGrad.addColorStop(1, "rgba(217, 119, 6, 0.85)");
          ctx.fillStyle = goldGrad;
          ctx.fillRect(p1BuildX + 2, floorY + 2, bWidth - 4, floorSize - 4);
          
          // Draw windows glow
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(p1BuildX + 15, floorY + floorSize/2 - 3, 10, 6);
          ctx.fillRect(p1BuildX + bWidth - 25, floorY + floorSize/2 - 3, 10, 6);
        } else {
          // Unfinished grey block outline
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(p1BuildX + 2, floorY + 2, bWidth - 4, floorSize - 4);
        }
      }
      // Label for floors
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`FL: ${Math.min(p1Floors, maxFloors)}/${maxFloors}`, p1BuildX + 10, buildBottomY - bHeight - 8);

      // 5. Draw Building Under Construction for Player 2 (Sky Blue #38bdf8)
      const p2Floors = Math.floor(p2.work / 2000);
      const p2BuildX = w * 0.85 - 120;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.strokeRect(p2BuildX, buildBottomY - bHeight, bWidth, bHeight);

      for (let f = 0; f < maxFloors; f++) {
        const floorY = buildBottomY - (f + 1) * floorSize;
        ctx.strokeRect(p2BuildX, floorY, bWidth, floorSize);

        if (f < p2Floors) {
          const skyGrad = ctx.createLinearGradient(p2BuildX, floorY, p2BuildX + bWidth, floorY + floorSize);
          skyGrad.addColorStop(0, "rgba(56, 189, 248, 0.8)");
          skyGrad.addColorStop(1, "rgba(2, 132, 199, 0.85)");
          ctx.fillStyle = skyGrad;
          ctx.fillRect(p2BuildX + 2, floorY + 2, bWidth - 4, floorSize - 4);

          // Windows glow
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(p2BuildX + 15, floorY + floorSize/2 - 3, 10, 6);
          ctx.fillRect(p2BuildX + bWidth - 25, floorY + floorSize/2 - 3, 10, 6);
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(p2BuildX + 2, floorY + 2, bWidth - 4, floorSize - 4);
        }
      }
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`FL: ${Math.min(p2Floors, maxFloors)}/${maxFloors}`, p2BuildX + 10, buildBottomY - bHeight - 8);


      // 6. DRAW PLAYER 1 CRANE (Left Side - Amber)
      const p1CraneX = 40;
      const craneHeight = h - 60;
      const boomLength = w * 0.35; // Extending right
      const boomHeightY = 50;
      
      // Crane Tower
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p1CraneX, h - 10);
      ctx.lineTo(p1CraneX, boomHeightY);
      ctx.stroke();

      // Lattice cross lines on P1 tower
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let ty = boomHeightY + 15; ty < h - 10; ty += 20) {
        ctx.moveTo(p1CraneX - 3, ty);
        ctx.lineTo(p1CraneX + 3, ty + 10);
        ctx.moveTo(p1CraneX + 3, ty);
        ctx.lineTo(p1CraneX - 3, ty + 10);
      }
      ctx.stroke();

      // Horizontal jib (boom)
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p1CraneX - 15, boomHeightY);
      ctx.lineTo(p1CraneX + boomLength, boomHeightY);
      ctx.stroke();

      // Trolley on the boom (fixed position near middle of the jib)
      const p1TrolleyX = p1CraneX + boomLength * 0.75;
      ctx.fillStyle = "#d97706";
      ctx.fillRect(p1TrolleyX - 8, boomHeightY - 3, 16, 7);

      // Crate Target height Y - moves from base to top depending on Work (J)
      // Cap work at 16000 J (8 floors)
      const maxWorkLimit = 16000;
      const workRatio1 = Math.min(p1.work / maxWorkLimit, 1.0);
      const minCrateY = boomHeightY + 40;
      const maxCrateY = h - 45;
      // Target Y
      const p1TargetCrateY = maxCrateY - workRatio1 * (maxCrateY - minCrateY);
      // Smooth interpolation
      p1CrateYRef.current += (p1TargetCrateY - p1CrateYRef.current) * 0.1;

      // Draw cable
      ctx.strokeStyle = labForce > 300 ? "#ef4444" : "#94a3b8";
      ctx.lineWidth = labForce > 300 ? 4 : 1.5;
      angle += 0.02;
      const swingOffset = Math.sin(angle) * 1.5; // slight cable swing
      ctx.beginPath();
      ctx.moveTo(p1TrolleyX, boomHeightY + 4);
      ctx.lineTo(p1TrolleyX + swingOffset, p1CrateYRef.current);
      ctx.stroke();

      // Floating Force (F) label on Player 1 cable
      ctx.fillStyle = labForce > 300 ? "#fca5a5" : "#94a3b8";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`F = ${labForce}N`, p1TrolleyX + 15, (boomHeightY + 4 + p1CrateYRef.current) / 2);

      // Draw Crate Container
      const crateW = 34;
      const crateH = 22;
      const cx1 = p1TrolleyX + swingOffset - crateW / 2;
      const cy1 = p1CrateYRef.current;
      
      // Draw container box with borders and diagonal strap lines
      ctx.fillStyle = "#b45309";
      ctx.fillRect(cx1, cy1, crateW, crateH);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx1, cy1, crateW, crateH);
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(cx1 + crateW, cy1 + crateH);
      ctx.moveTo(cx1 + crateW, cy1);
      ctx.lineTo(cx1, cy1 + crateH);
      ctx.stroke();


      // 6.5 DRAW CENTER DEMO CRANE (White/Gray, Center)
      const demoCraneX = w / 2;

      // Crane Tower
      ctx.strokeStyle = "#475569"; // slate dark grey base
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(demoCraneX, h - 10);
      ctx.lineTo(demoCraneX, demoCraneBoomY);
      ctx.stroke();

      // Lattice cross lines on Demo tower
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let ty = demoCraneBoomY + 15; ty < h - 10; ty += 15) {
        ctx.moveTo(demoCraneX - 4, ty);
        ctx.lineTo(demoCraneX + 4, ty + 8);
        ctx.moveTo(demoCraneX + 4, ty);
        ctx.lineTo(demoCraneX - 4, ty + 8);
      }
      ctx.stroke();

      // Horizontal boom (jib) extending right
      ctx.strokeStyle = "#cbd5e1"; // slate light grey/white
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(demoCraneX - 25, demoCraneBoomY);
      ctx.lineTo(demoCraneX + demo.currentArmLength, demoCraneBoomY);
      ctx.stroke();

      // Cab / Operator box on Center Crane
      ctx.fillStyle = "#64748b";
      ctx.fillRect(demoCraneX - 12, demoCraneBoomY - 12, 12, 12);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(demoCraneX - 12, demoCraneBoomY - 12, 12, 12);
      // Small yellow cab light
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(demoCraneX - 10, demoCraneBoomY - 10, 4, 4);

      // Trolley on Demo boom
      const demoTrolleyX = demoCraneX + demo.currentArmLength;
      ctx.fillStyle = "#475569";
      ctx.fillRect(demoTrolleyX - 10, demoCraneBoomY - 3, 20, 8);

      // Dashed horizontal line showing target height on canvas
      const targetHeightY = demoTargetCrateY;

      // Dashed line for height target
      ctx.save();
      ctx.setLineDash([4, 4]);
      // Line color matches height: green (low h < 7) -> amber (mid h < 14) -> red (high)
      let heightLineColor = "#10b981"; // green
      if (demo.h >= 14) {
        heightLineColor = "#ef4444"; // red
      } else if (demo.h >= 7) {
        heightLineColor = "#f59e0b"; // amber
      }
      ctx.strokeStyle = heightLineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(demoTrolleyX - 40, targetHeightY);
      ctx.lineTo(demoTrolleyX + 60, targetHeightY);
      ctx.stroke();
      ctx.restore();

      // Height label next to dashed line
      ctx.fillStyle = heightLineColor;
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`h = ${demo.h}m`, demoTrolleyX + 65, targetHeightY + 3);

      // Draw cable
      ctx.strokeStyle = demo.currentCableColor;
      ctx.lineWidth = demo.currentCableWidth;
      ctx.beginPath();
      ctx.moveTo(demoTrolleyX, demoCraneBoomY + 4);
      ctx.lineTo(demoTrolleyX, demo.currentCrateY);
      ctx.stroke();

      // Floating Force (F) label on cable
      ctx.fillStyle = demo.currentCableColor === "#ef4444" ? "#fca5a5" : "#cbd5e1";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`F = ${demo.F}N`, demoTrolleyX + 2, (demoCraneBoomY + demo.currentCrateY) / 2);

      // Draw Demo Crate Container
      // Color gets darker/more orange as mass increases
      const mWeightRatio = (demo.m - 10) / 190;
      const red = Math.round(251 - mWeightRatio * (251 - 154));
      const green = Math.round(191 - mWeightRatio * (191 - 52));
      const blue = Math.round(36 - mWeightRatio * (36 - 18));
      const crateBgColor = `rgb(${red}, ${green}, ${blue})`;

      const cxDemo = demoTrolleyX - demo.currentCrateW / 2;
      const cyDemo = demo.currentCrateY;
      ctx.fillStyle = crateBgColor;
      ctx.fillRect(cxDemo, cyDemo, demo.currentCrateW, demo.currentCrateH);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cxDemo, cyDemo, demo.currentCrateW, demo.currentCrateH);
      ctx.beginPath();
      ctx.moveTo(cxDemo, cyDemo);
      ctx.lineTo(cxDemo + demo.currentCrateW, cyDemo + demo.currentCrateH);
      ctx.moveTo(cxDemo + demo.currentCrateW, cyDemo);
      ctx.lineTo(cxDemo, cyDemo + demo.currentCrateH);
      ctx.stroke();

      // Distance label tracking along arm tip
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`d = ${demo.d}m`, demoCraneX + demo.currentArmLength, demoCraneBoomY - 6);

      // Mini floating labels for W and P above/near the crate
      ctx.fillStyle = "#fbbf24"; // work amber
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`W = ${demo.F * demo.d}J`, cxDemo - 6, cyDemo + 8);
      ctx.fillStyle = "#38bdf8"; // power sky
      ctx.fillText(`P = ${Math.round(((demo.F * demo.d) / demo.t) * 10) / 10}W`, cxDemo - 6, cyDemo + 18);

      // Speedometer Arc (Power Indicator under Demo Crane)
      const speedoY = h - 22;
      const speedoR = 26;
      ctx.save();
      // Red zone (0 - 60 deg)
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(demoCraneX, speedoY, speedoR, Math.PI, Math.PI + Math.PI / 3);
      ctx.stroke();

      // Yellow zone (60 - 120 deg)
      ctx.strokeStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(demoCraneX, speedoY, speedoR, Math.PI + Math.PI / 3, Math.PI + (Math.PI * 2) / 3);
      ctx.stroke();

      // Green zone (120 - 180 deg)
      ctx.strokeStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(demoCraneX, speedoY, speedoR, Math.PI + (Math.PI * 2) / 3, Math.PI + Math.PI);
      ctx.stroke();

      // Draw needle
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(demoCraneX, speedoY);
      ctx.lineTo(
        demoCraneX + Math.cos(demo.currentPowerAngle) * (speedoR - 2),
        speedoY + Math.sin(demo.currentPowerAngle) * (speedoR - 2)
      );
      ctx.stroke();

      // Needle center dot
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(demoCraneX, speedoY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Speedometer value label below
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      const liveP = Math.round(((demo.F * demo.d) / demo.t) * 10) / 10;
      ctx.fillText(`P = ${liveP}W`, demoCraneX, speedoY + 11);
      ctx.restore();


      // 7. DRAW PLAYER 2 CRANE (Right Side - Sky Blue)
      const p2CraneX = w - 40;
      const p2BoomLength = w * 0.35; // Extending left
      
      // Crane Tower
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p2CraneX, h - 10);
      ctx.lineTo(p2CraneX, boomHeightY);
      ctx.stroke();

      // Lattice cross lines on P2 tower
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let ty = boomHeightY + 15; ty < h - 10; ty += 20) {
        ctx.moveTo(p2CraneX - 3, ty);
        ctx.lineTo(p2CraneX + 3, ty + 10);
        ctx.moveTo(p2CraneX + 3, ty);
        ctx.lineTo(p2CraneX - 3, ty + 10);
      }
      ctx.stroke();

      // Horizontal boom
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p2CraneX + 15, boomHeightY);
      ctx.lineTo(p2CraneX - p2BoomLength, boomHeightY);
      ctx.stroke();

      // Trolley on P2 boom
      const p2TrolleyX = p2CraneX - p2BoomLength * 0.75;
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(p2TrolleyX - 8, boomHeightY - 3, 16, 7);

      // Crate Target Y
      const workRatio2 = Math.min(p2.work / maxWorkLimit, 1.0);
      const p2TargetCrateY = maxCrateY - workRatio2 * (maxCrateY - minCrateY);
      p2CrateYRef.current += (p2TargetCrateY - p2CrateYRef.current) * 0.1;

      // Draw cable
      ctx.strokeStyle = labForce > 300 ? "#ef4444" : "#94a3b8";
      ctx.lineWidth = labForce > 300 ? 4 : 1.5;
      const swingOffsetP2 = Math.cos(angle) * 1.5;
      ctx.beginPath();
      ctx.moveTo(p2TrolleyX, boomHeightY + 4);
      ctx.lineTo(p2TrolleyX + swingOffsetP2, p2CrateYRef.current);
      ctx.stroke();

      // Floating Force (F) label on Player 2 cable
      ctx.fillStyle = labForce > 300 ? "#fca5a5" : "#94a3b8";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`F = ${labForce}N`, p2TrolleyX - 15, (boomHeightY + 4 + p2CrateYRef.current) / 2);

      // Draw P2 Crate Container
      const cx2 = p2TrolleyX + swingOffsetP2 - crateW / 2;
      const cy2 = p2CrateYRef.current;
      ctx.fillStyle = "#0369a1";
      ctx.fillRect(cx2, cy2, crateW, crateH);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx2, cy2, crateW, crateH);
      ctx.beginPath();
      ctx.moveTo(cx2, cy2);
      ctx.lineTo(cx2 + crateW, cy2 + crateH);
      ctx.moveTo(cx2 + crateW, cy2);
      ctx.lineTo(cx2, cy2 + crateH);
      ctx.stroke();


      // 8. Draw Neck-and-Neck alert on canvas center
      // Only show if both players have done at least some work
      if (Math.abs(p1.work - p2.work) <= 200 && p1.work > 0 && p2.work > 0) {
        ctx.fillStyle = "rgba(24a, 204, 21, 0.1)";
        ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
        ctx.lineWidth = 1;
        const panelWidth = 240;
        const panelHeight = 40;
        ctx.fillRect(w / 2 - panelWidth / 2, 20, panelWidth, panelHeight);
        ctx.strokeRect(w / 2 - panelWidth / 2, 20, panelWidth, panelHeight);

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 13px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(currentStrings.neckAndNeck, w / 2, 45);
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [view, p1.work, p2.work, lang]);

  // Physics Panel Live Calculations
  const computedWork = labForce * labDistance;
  const computedPower = Math.round((computedWork / labTime) * 10) / 10;
  const computedLiftingWork = labMass * 10 * labHeight;

  // Render Confetti particles on the Winner screen
  useEffect(() => {
    if (view !== "winner") return;

    // Generate initial particles
    const initialParticles = Array.from({ length: 70 }).map(() => ({
      x: Math.random() * 800,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      color: ["#f59e0b", "#38bdf8", "#10b981", "#ec4899", "#8b5cf6", "#facc15"][
        Math.floor(Math.random() * 6)
      ],
      size: Math.random() * 6 + 4,
    }));
    setConfetti(initialParticles);

    const interval = setInterval(() => {
      setConfetti((prev) =>
        prev.map((p) => {
          let ny = p.y + p.vy;
          let nx = p.x + p.vx;
          // Recycle if falling off screen
          if (ny > 800) {
            ny = -20;
            nx = Math.random() * 800;
          }
          return { ...p, x: nx, y: ny };
        })
      );
    }, 30);

    return () => clearInterval(interval);
  }, [view]);

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 font-sans flex flex-col relative select-none">
      
      {/* GLOBAL FIXED LANGUAGE TOGGLE */}
      <button
        id="global-lang-toggle"
        onClick={() => setLang((prev) => (prev === "en" ? "mn" : "en"))}
        className="fixed top-4 right-4 z-50 bg-[#141417]/95 border border-stone-800 hover:border-stone-500 hover:text-white text-stone-300 px-4 py-2 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer"
      >
        <span className="text-sm">🌐</span>
        <span>{lang === "en" ? "Монгол" : "English"}</span>
      </button>

      {/* ----------------- MENU / START SCREEN ----------------- */}
      {view === "menu" && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-5xl mx-auto w-full z-10">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-md uppercase">
              {currentStrings.title}
            </h1>
            <p className="text-stone-400 mt-3 text-xs sm:text-sm tracking-widest font-mono uppercase">
              🚀 {currentStrings.subtitle}
            </p>
          </div>

          {/* Bento-Grid Parent Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
            
            {/* Player Setup Bento Box (Left) */}
            <div className="lg:col-span-7 bg-[#111114]/80 backdrop-blur-md border border-stone-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-stone-500 tracking-wider mb-5 border-b border-stone-800/60 pb-2">
                  👥 CRANE DUEL REGISTRATION
                </h3>
                
                <div className="space-y-4">
                  {/* Player 1 Bento Cell */}
                  <div className="bg-gradient-to-br from-amber-500/[0.02] to-stone-900/30 border border-amber-500/15 p-4 rounded-2xl focus-within:border-amber-500/40 focus-within:shadow-[0_0_15px_rgba(251,191,36,0.05)] transition-all duration-300">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 mb-1.5">
                      🟡 {currentStrings.p1Name} <span className="text-stone-500 font-normal">(Q / W / E / R keys)</span>
                    </label>
                    <input
                      id="p1-name-input"
                      type="text"
                      maxLength={14}
                      value={p1.name}
                      onChange={(e) => setP1((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#161619] border border-stone-850 focus:border-amber-500/50 focus:outline-none rounded-xl px-4 py-2.5 text-stone-100 text-sm font-semibold transition-all"
                      placeholder="Crane Rival 1"
                    />
                  </div>

                  {/* VS divider */}
                  <div className="flex justify-center items-center py-1">
                    <span className="text-[10px] text-stone-600 font-mono font-extrabold tracking-widest bg-stone-900 border border-stone-850 px-3 py-1 rounded-full">— {currentStrings.vs} —</span>
                  </div>

                  {/* Player 2 Bento Cell */}
                  <div className="bg-gradient-to-br from-sky-500/[0.02] to-stone-900/30 border border-sky-500/15 p-4 rounded-2xl focus-within:border-sky-500/40 focus-within:shadow-[0_0_15px_rgba(56,189,248,0.05)] transition-all duration-300">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 mb-1.5">
                      🔵 {currentStrings.p2Name} <span className="text-stone-500 font-normal">(U / I / O / P keys)</span>
                    </label>
                    <input
                      id="p2-name-input"
                      type="text"
                      maxLength={14}
                      value={p2.name}
                      onChange={(e) => setP2((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#161619] border border-stone-850 focus:border-sky-500/50 focus:outline-none rounded-xl px-4 py-2.5 text-stone-100 text-sm font-semibold transition-all"
                      placeholder="Crane Rival 2"
                    />
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                id="start-battle-button"
                onClick={() => handleStartGame(p1.name, p2.name)}
                className="w-full mt-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-stone-950 font-display font-black py-4 px-6 rounded-2xl shadow-[0_4px_20px_rgba(245,158,11,0.25)] tracking-wider uppercase transition-all duration-200 transform active:scale-95 text-center block cursor-pointer text-sm sm:text-base"
              >
                {currentStrings.startBattle}
              </button>
            </div>

            {/* Physics Interactive Guide Bento Box (Right) */}
            <div className="lg:col-span-5 bg-[#111114]/80 backdrop-blur-md border border-stone-800/80 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col justify-between">
              <div>
                <button
                  id="physics-guide-toggle"
                  onClick={() => setPhysicsGuideOpen(!physicsGuideOpen)}
                  className="w-full text-left flex justify-between items-center border-b border-stone-800/60 pb-3 mb-4 cursor-pointer group"
                >
                  <span className="font-display font-black text-stone-300 text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 group-hover:text-white transition-colors">
                    {currentStrings.physicsGuide}
                  </span>
                  {physicsGuideOpen ? (
                    <ChevronUp size={16} className="text-stone-500 group-hover:text-white" />
                  ) : (
                    <ChevronDown size={16} className="text-stone-500 group-hover:text-white" />
                  )}
                </button>

                {/* Sub bento containers inside guide */}
                {physicsGuideOpen ? (
                  <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                    {/* formula card 1 */}
                    <div className="bg-stone-950/50 p-4 rounded-2xl border border-amber-500/15 shadow-sm transition-all hover:bg-stone-950/85">
                      <h4 className="font-mono text-amber-500 font-extrabold text-sm mb-1">W = F × d</h4>
                      <p className="text-stone-300 text-xs mb-1.5 leading-relaxed font-medium">
                        <strong>Work (Ажил)</strong>: Force multiplied by the distance traveled. Measured in Joules (J).
                      </p>
                      <div className="text-[10px] font-mono text-stone-500 bg-stone-900/50 p-1.5 rounded border border-stone-800/30">
                        Example: 100 N Force × 5 meters = 500 J of Work.
                      </div>
                    </div>

                    {/* formula card 2 */}
                    <div className="bg-stone-950/50 p-4 rounded-2xl border border-sky-500/15 shadow-sm transition-all hover:bg-stone-950/85">
                      <h4 className="font-mono text-sky-400 font-extrabold text-sm mb-1">P = W ÷ t</h4>
                      <p className="text-stone-300 text-xs mb-1.5 leading-relaxed font-medium">
                        <strong>Power (Чадал)</strong>: The rate of doing work. Work divided by the time taken. Measured in Watts (W).
                      </p>
                      <div className="text-[10px] font-mono text-stone-500 bg-stone-900/50 p-1.5 rounded border border-stone-800/30">
                        Example: 500 J done in 5 seconds = 100 W of Power.
                      </div>
                    </div>

                    {/* formula card 3 */}
                    <div className="bg-stone-950/50 p-4 rounded-2xl border border-emerald-500/15 shadow-sm transition-all hover:bg-stone-950/85">
                      <h4 className="font-mono text-emerald-400 font-extrabold text-sm mb-1">W = m × g × h (g = 10)</h4>
                      <p className="text-stone-300 text-xs mb-1.5 leading-relaxed font-medium">
                        <strong>Lifting Work (Өргөх ажил)</strong>: Raising mass (m) against gravity (g) to height (h). Measured in Joules (J).
                      </p>
                      <div className="text-[10px] font-mono text-stone-500 bg-stone-900/50 p-1.5 rounded border border-stone-800/30">
                        Example: Lift 50 kg by 4 meters = 50 × 10 × 4 = 2000 J of Work.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-stone-500">
                    <BookOpen size={40} className="mb-3 opacity-40 text-stone-400 animate-pulse" />
                    <p className="text-xs font-mono font-semibold uppercase tracking-wider">{lang === "en" ? "FORMULA REFERENCE GUIDE" : "ФИЗИКИЙН ТОМЪЁОНУУД"}</p>
                    <p className="text-[11px] text-stone-600 mt-1 max-w-[200px]">{lang === "en" ? "Click to expand the formula library" : "Энд дарж томьёо харах боломжтой"}</p>
                  </div>
                )}
              </div>

              {/* Educational Tag */}
              <div className="mt-4 pt-3 border-t border-stone-800/50 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                <span>GRADE 9–13 PHYSICS</span>
                <span>W = F×d • P = W/t</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- GAME / BATTLE SCREEN ----------------- */}
      {view === "battle" && (
        <div className="flex-grow flex flex-col h-screen overflow-hidden p-3 sm:p-4 gap-3 md:gap-4 relative">
          
          {/* 1. TOP BAR BENTO CARD */}
          <div className="bg-[#111115]/90 border border-stone-800/80 px-4 sm:px-6 py-3 rounded-2xl md:rounded-3xl shadow-lg z-10 flex items-center justify-between">
            
            {/* P1 Score Badge */}
            <div className="flex items-center gap-3 relative">
              <div className="text-left">
                <div className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  {p1.name}
                </div>
                <div id="p1-score-display" className="text-xl sm:text-2xl font-display font-black text-amber-500 flex items-center gap-1">
                  <span>{p1.score}</span>
                  <span className="text-[9px] text-stone-500 font-mono font-bold tracking-normal">PTS</span>
                </div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-1 rounded-xl text-center hidden sm:block shadow-sm">
                <div className="text-[9px] text-amber-400/80 font-bold uppercase">{currentStrings.workDone}</div>
                <div className="text-xs font-mono font-bold text-amber-400">{p1.work} J</div>
              </div>
              {/* Floating points render */}
              <div className="absolute left-12 -bottom-6 pointer-events-none z-30">
                {floatingPoints
                  .filter((fp) => fp.player === "p1")
                  .map((fp) => (
                    <div key={fp.id} className={`${fp.colorClass} animate-bounce text-sm absolute font-black font-mono`}>
                      {fp.text}
                    </div>
                  ))}
              </div>
            </div>

            {/* Center Control Panel */}
            <div className="flex items-center gap-2 sm:gap-4 bg-stone-950/80 border border-stone-800/50 p-1 rounded-2xl">
              <button
                id="game-pause-button"
                onClick={() => setIsPaused(!isPaused)}
                className="bg-[#141417] border border-stone-800/80 hover:border-stone-500 p-2 rounded-xl text-stone-300 hover:text-white transition-all cursor-pointer"
                title="Pause Game"
              >
                {isPaused ? <Play size={15} /> : <Pause size={15} />}
              </button>

              <div className="text-center px-3 sm:px-4 py-0.5 flex flex-col items-center min-w-[75px] sm:min-w-[95px]">
                <div className="text-[8px] text-stone-500 uppercase tracking-widest font-mono font-bold">{currentStrings.timer}</div>
                <div id="countdown-timer" className="text-base sm:text-lg font-mono font-black text-stone-100 flex items-center gap-1">
                  {timeLeft} <span className="text-[10px] text-stone-400 font-normal">{currentStrings.secondsShort}</span>
                </div>
              </div>

              <button
                id="quit-home-button"
                onClick={() => {
                  if (confirm("Quit this battle and return to menu?")) {
                    setView("menu");
                  }
                }}
                className="bg-[#141417] border border-stone-800/80 hover:border-stone-500 p-2 rounded-xl text-stone-300 hover:text-white transition-all cursor-pointer"
                title="Home"
              >
                <Home size={15} />
              </button>
            </div>

            {/* P2 Score Badge */}
            <div className="flex items-center gap-3 relative text-right">
              <div className="bg-sky-500/5 border border-sky-500/20 px-3 py-1 rounded-xl text-center hidden sm:block shadow-sm">
                <div className="text-[9px] text-sky-400/80 font-bold uppercase">{currentStrings.workDone}</div>
                <div className="text-xs font-mono font-bold text-sky-400">{p2.work} J</div>
              </div>
              <div>
                <div className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wide flex items-center justify-end gap-1.5">
                  {p2.name}
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                </div>
                <div id="p2-score-display" className="text-xl sm:text-2xl font-display font-black text-sky-400 flex items-center justify-end gap-1">
                  <span>{p2.score}</span>
                  <span className="text-[9px] text-stone-500 font-mono font-bold tracking-normal">PTS</span>
                </div>
              </div>
              {/* Floating points render */}
              <div className="absolute right-12 -bottom-6 pointer-events-none z-30">
                {floatingPoints
                  .filter((fp) => fp.player === "p2")
                  .map((fp) => (
                    <div key={fp.id} className={`${fp.colorClass} animate-bounce text-sm absolute font-black font-mono`}>
                      {fp.text}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 2. SHARED CRANE CANVAS BENTO BLOCK */}
          <div className="relative flex-1 bg-[#090a0f] flex flex-col justify-end min-h-[220px] rounded-2xl md:rounded-3xl border border-stone-850 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden mx-1">
            
            {/* WORK COMPARISON PROGRESS BAR INSIDE CANVAS */}
            <div className="absolute top-3 left-4 right-4 z-20 flex flex-col gap-1 pointer-events-none bg-stone-950/75 backdrop-blur-md border border-stone-800/50 p-2.5 rounded-xl max-w-lg mx-auto">
              <div className="flex justify-between text-[9px] sm:text-[10px] text-stone-400 font-mono tracking-wide">
                <span className="text-amber-500 font-extrabold">🟡 {p1.name}: {p1.work} J</span>
                <span className="text-sky-400 font-extrabold">{p2.name}: {p2.work} J 🔵</span>
              </div>
              <div className="h-2.5 w-full bg-stone-900 border border-stone-800/80 rounded-full overflow-hidden flex relative">
                {/* Player 1 Filled Part */}
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-350"
                  style={{ width: `${(p1.work / Math.max(p1.work + p2.work, 1)) * 100}%` }}
                />
                {/* White divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white opacity-40 transform -translate-x-1/2 z-10" />
                {/* Player 2 Filled Part */}
                <div 
                  className="h-full bg-gradient-to-l from-sky-600 to-sky-400 transition-all duration-350 ml-auto"
                  style={{ width: `${(p2.work / Math.max(p1.work + p2.work, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Random Event Slidedown Banner */}
            {activeEvent && (
              <div 
                className={`absolute top-0 left-0 right-0 bg-amber-400 text-stone-950 py-3 px-4 z-30 text-center font-display font-black text-xs sm:text-sm uppercase tracking-wide shadow-xl transition-all duration-300 ${
                  eventBannerVisible ? "translate-y-0" : "-translate-y-full"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap size={16} className="animate-bounce text-stone-950 fill-stone-950" />
                  <span>{lang === "en" ? activeEvent.bannerTextEn : activeEvent.bannerTextMn}</span>
                  {activeEvent.durationLeft > 0 && (
                    <span className="bg-stone-950 text-amber-400 text-[9px] px-2 py-0.5 rounded ml-2 font-mono font-bold">
                      {activeEvent.durationLeft}S LEFT
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ACTUAL CANVAS ELEMENT */}
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* 3. THREE-COLUMN PANEL GRID (BENTO SYSTEM) */}
          <div className="flex flex-col lg:flex-row gap-4 h-[42%] overflow-y-auto w-full pb-1">
            
            {/* COLUMN 1: PLAYER 1 PANEL (35% width) */}
            <div className="w-full lg:w-[35%] bento-card-amber rounded-3xl p-4 md:p-5 flex flex-col justify-between shadow-lg relative h-full">
              {isPaused ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 py-12">
                  <Pause size={32} className="mb-2 opacity-30 text-amber-500" />
                  <span className="text-xs font-mono tracking-widest uppercase font-bold text-stone-400">GAME PAUSED</span>
                </div>
              ) : (
                <>
                  {/* Question Header & Body */}
                  <div>
                    <div className="bg-stone-950/45 border border-stone-800/70 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800/40">
                        <span className="text-[10px] font-mono font-black text-amber-500 tracking-wider">
                          🟡 {p1.name.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/15">
                          {p1.currentQuestion.formulaHint}
                        </span>
                      </div>

                      {/* Question text */}
                      <div className="min-h-[50px] overflow-y-auto">
                        <p className="text-xs sm:text-sm font-semibold leading-relaxed text-stone-200">
                          {lang === "en" ? p1.currentQuestion.textEn : p1.currentQuestion.textMn}
                        </p>
                        
                        {/* Bilingual subtitle view if toggled */}
                        {p1.translateVisible && (
                          <p className="text-[11px] text-stone-400 mt-2 border-l-2 border-stone-700 pl-2 italic">
                            {lang === "en" ? p1.currentQuestion.textMn : p1.currentQuestion.textEn}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Options (2x2 grid) */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {p1.currentQuestion.options.map((opt, idx) => {
                        const keyLabels = ["Q", "W", "E", "R"];
                        return (
                          <button
                            key={idx}
                            id={`p1-opt-${idx}`}
                            onClick={() => handleAnswer("p1", idx)}
                            className="bg-[#141417]/95 border border-stone-800/80 hover:border-amber-500 hover:bg-amber-500/[0.02] text-stone-100 p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative group text-center min-h-[64px] shadow-sm"
                          >
                            <span className="absolute left-2 top-2 text-[8px] font-mono font-black bg-[#1b1b20] text-stone-500 border border-stone-800 px-1.5 py-0.5 rounded-md group-hover:bg-amber-500 group-hover:text-stone-950 group-hover:border-amber-400 transition-all">
                              {keyLabels[idx]}
                            </span>
                            <span className="text-sm font-black font-mono text-stone-200 mt-1">
                              {opt}
                            </span>
                            <span className="text-[9px] text-stone-500 font-mono font-bold uppercase tracking-wider">
                              {p1.currentQuestion.unit}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Hint Box */}
                    {p1.hintVisible && (
                      <div className="mt-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-[11px] p-2.5 rounded-xl leading-relaxed">
                        💡 <strong>Hint:</strong> Use <strong>{p1.currentQuestion.formulaHint}</strong>. Correct value lies between {Math.round(p1.currentQuestion.answer * 0.4)} and {Math.round(p1.currentQuestion.answer * 2.2)} {p1.currentQuestion.unit}.
                      </div>
                    )}
                  </div>

                  {/* Auxiliary Buttons */}
                  <div className="flex items-center gap-2 mt-4 border-t border-stone-800/50 pt-3">
                    <button
                      id="p1-hint-btn"
                      disabled={p1.hintVisible}
                      onClick={() => handleUseHint("p1")}
                      className={`flex-1 font-mono text-[9px] sm:text-[10px] font-bold py-2 px-1 rounded-xl border text-center cursor-pointer transition-all ${
                        p1.hintVisible
                          ? "bg-stone-950/50 border-stone-800/80 text-stone-600 cursor-not-allowed"
                          : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400"
                      }`}
                    >
                      {currentStrings.hintBtn}
                    </button>

                    <button
                      id="p1-translate-btn"
                      onClick={() => handleToggleTranslate("p1")}
                      className="flex-1 font-mono text-[9px] sm:text-[10px] font-bold bg-[#141417] border border-stone-800 hover:border-stone-750 text-stone-300 py-2 px-1 rounded-xl text-center cursor-pointer transition-all"
                    >
                      {currentStrings.translateBtn}
                    </button>

                    <button
                      id="p1-skip-btn"
                      onClick={() => openSkipModal("p1")}
                      className="flex-1 font-mono text-[9px] sm:text-[10px] font-bold bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-900/50 text-rose-400 py-2 px-1 rounded-xl text-center cursor-pointer transition-all"
                    >
                      {currentStrings.skipBtn}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* COLUMN 2: PHYSICS CONTROL PANEL (30% width) */}
            <div className="w-full lg:w-[30%] bento-card-teal rounded-3xl p-4 md:p-5 flex flex-col justify-between shadow-lg h-full overflow-y-auto">
              <div>
                {/* Header */}
                <div className="border-b border-teal-500/20 pb-2 mb-4 text-center">
                  <div className="text-xs font-display font-black text-teal-400 tracking-wider uppercase">
                    {currentStrings.physicsLab}
                  </div>
                  <div className="text-[9px] text-teal-500/70 font-mono">
                    {currentStrings.liveCalculator}
                  </div>
                </div>

                {/* Section 1 - Work Calculator (W = F * d) */}
                <div className="bg-stone-950/40 border border-stone-800/50 rounded-2xl p-3 mb-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-stone-300 font-mono font-bold">W = F × d</span>
                    <span className="text-amber-500 font-mono font-bold uppercase text-[9px]">Work (Amber)</span>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                      <span>{currentStrings.force}: <strong className="text-stone-300">{labForce} N</strong></span>
                      <span>{currentStrings.distance}: <strong className="text-stone-300">{labDistance} m</strong></span>
                    </div>
                    <input
                      id="physics-slider-force"
                      type="range"
                      min={50}
                      max={500}
                      step={10}
                      value={labForce}
                      onChange={(e) => setLabForce(Number(e.target.value))}
                      className="w-full bento-slider accent-amber-500 cursor-pointer"
                    />
                    <input
                      id="physics-slider-distance"
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={labDistance}
                      onChange={(e) => setLabDistance(Number(e.target.value))}
                      className="w-full bento-slider accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Formula substitution box */}
                  <div className="bg-stone-950/80 p-2 rounded-xl border border-stone-850 font-mono text-[9px] text-stone-400">
                    <div>W = F × d</div>
                    <div>W = {labForce} N × {labDistance} m</div>
                    <div className="text-amber-500 font-bold mt-0.5">W = {computedWork} J</div>
                  </div>

                  {/* Animated amber bar */}
                  <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-200" 
                      style={{ width: `${Math.min((computedWork / 10000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Section 2 - Power Calculator (P = W / t) */}
                <div className="bg-stone-950/40 border border-stone-800/50 rounded-2xl p-3 mb-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-stone-300 font-mono font-bold">P = W ÷ t</span>
                    <span className="text-sky-400 font-mono font-bold uppercase text-[9px]">Power (Sky Blue)</span>
                  </div>

                  {/* Time Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                      <span>{currentStrings.time}: <strong className="text-stone-300">{labTime} s</strong></span>
                    </div>
                    <input
                      id="physics-slider-time"
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={labTime}
                      onChange={(e) => setLabTime(Number(e.target.value))}
                      className="w-full bento-slider accent-sky-400 cursor-pointer"
                    />
                  </div>

                  {/* Formula substitution */}
                  <div className="bg-stone-950/80 p-2 rounded-xl border border-stone-850 font-mono text-[9px] text-stone-400">
                    <div>P = W ÷ t</div>
                    <div>P = {computedWork} J ÷ {labTime} s</div>
                    <div className="text-sky-400 font-bold mt-0.5">P = {computedPower} W</div>
                  </div>

                  {/* Animated sky blue bar */}
                  <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-400 transition-all duration-200" 
                      style={{ width: `${Math.min((computedPower / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Section 3 - Lifting Work Calculator (W = mgh) */}
                <div className="bg-stone-950/40 border border-stone-800/50 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-stone-300 font-mono font-bold">W = m × g × h (g = 10)</span>
                    <span className="text-emerald-400 font-mono font-bold uppercase text-[9px]">Lifting Work (Green)</span>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                      <span>{currentStrings.mass}: <strong className="text-stone-300">{labMass} kg</strong></span>
                      <span>{currentStrings.height}: <strong className="text-stone-300">{labHeight} m</strong></span>
                    </div>
                    <input
                      id="physics-slider-mass"
                      type="range"
                      min={10}
                      max={200}
                      step={10}
                      value={labMass}
                      onChange={(e) => setLabMass(Number(e.target.value))}
                      className="w-full bento-slider accent-emerald-500 cursor-pointer"
                    />
                    <input
                      id="physics-slider-height"
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={labHeight}
                      onChange={(e) => setLabHeight(Number(e.target.value))}
                      className="w-full bento-slider accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Substitution */}
                  <div className="bg-stone-950/80 p-2 rounded-xl border border-stone-850 font-mono text-[9px] text-stone-400">
                    <div>W = m × g × h</div>
                    <div>W = {labMass} kg × 10 × {labHeight} m</div>
                    <div className="text-emerald-400 font-bold mt-0.5">W = {computedLiftingWork} J</div>
                  </div>

                  {/* Animated green bar */}
                  <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-200" 
                      style={{ width: `${Math.min((computedLiftingWork / 40000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4 - Key Relationships Labels */}
              <div className="mt-4 pt-3 border-t border-teal-500/10">
                <div className="bg-teal-500/5 p-2.5 rounded-xl border border-teal-500/10">
                  <div className="text-[10px] font-display font-black text-teal-400 mb-1 flex items-center gap-1">
                    {currentStrings.keyFactsTitle}
                  </div>
                  <ul className="space-y-1 text-[9px] text-stone-400 list-disc pl-3 font-semibold font-mono">
                    <li>{currentStrings.keyFact1}</li>
                    <li>{currentStrings.keyFact2}</li>
                    <li>{currentStrings.keyFact3}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* COLUMN 3: PLAYER 2 PANEL (35% width) */}
            <div className="w-full lg:w-[35%] bento-card-sky rounded-3xl p-4 md:p-5 flex flex-col justify-between shadow-lg relative h-full">
              {isPaused ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 py-12">
                  <Pause size={32} className="mb-2 opacity-30 text-sky-400" />
                  <span className="text-xs font-mono tracking-widest uppercase font-bold text-stone-400">GAME PAUSED</span>
                </div>
              ) : (
                <>
                  {/* Question Header & Body */}
                  <div>
                    <div className="bg-stone-950/45 border border-stone-800/70 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800/40">
                        <span className="text-[10px] font-mono font-black text-sky-400 tracking-wider">
                          🔵 {p2.name.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-lg border border-sky-500/15">
                          {p2.currentQuestion.formulaHint}
                        </span>
                      </div>

                      {/* Question text */}
                      <div className="min-h-[50px] overflow-y-auto">
                        <p className="text-xs sm:text-sm font-semibold leading-relaxed text-stone-200">
                          {lang === "en" ? p2.currentQuestion.textEn : p2.currentQuestion.textMn}
                        </p>
                        
                        {/* Bilingual subtitle view if toggled */}
                        {p2.translateVisible && (
                          <p className="text-[11px] text-stone-400 mt-2 border-l-2 border-stone-700 pl-2 italic">
                            {lang === "en" ? p2.currentQuestion.textMn : p2.currentQuestion.textEn}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Options (2x2 grid) */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {p2.currentQuestion.options.map((opt, idx) => {
                        const keyLabels = ["U", "I", "O", "P"];
                        return (
                          <button
                            key={idx}
                            id={`p2-opt-${idx}`}
                            onClick={() => handleAnswer("p2", idx)}
                            className="bg-[#141417]/95 border border-stone-800/80 hover:border-sky-500 hover:bg-sky-500/[0.02] text-stone-100 p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative group text-center min-h-[64px] shadow-sm"
                          >
                            <span className="absolute left-2 top-2 text-[8px] font-mono font-black bg-[#1b1b20] text-stone-500 border border-stone-800 px-1.5 py-0.5 rounded-md group-hover:bg-sky-500 group-hover:text-stone-950 group-hover:border-sky-400 transition-all">
                              {keyLabels[idx]}
                            </span>
                            <span className="text-sm font-black font-mono text-stone-200 mt-1">
                              {opt}
                            </span>
                            <span className="text-[9px] text-stone-500 font-mono font-bold uppercase tracking-wider">
                              {p2.currentQuestion.unit}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Hint Box */}
                    {p2.hintVisible && (
                      <div className="mt-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] sm:text-[11px] p-2.5 rounded-xl leading-relaxed">
                        💡 <strong>Hint:</strong> Use <strong>{p2.currentQuestion.formulaHint}</strong>. Correct value lies between {Math.round(p2.currentQuestion.answer * 0.4)} and {Math.round(p2.currentQuestion.answer * 2.2)} {p2.currentQuestion.unit}.
                      </div>
                    )}
                  </div>

                  {/* Auxiliary Buttons */}
                  <div className="flex items-center gap-2 mt-4 border-t border-stone-800/50 pt-3">
                    <button
                      id="p2-hint-btn"
                      disabled={p2.hintVisible}
                      onClick={() => handleUseHint("p2")}
                      className={`flex-1 font-mono text-[9px] sm:text-[10px] font-bold py-2 px-1 rounded-xl border text-center cursor-pointer transition-all ${
                        p2.hintVisible
                          ? "bg-stone-950/50 border-stone-800/80 text-stone-600 cursor-not-allowed"
                          : "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-400"
                      }`}
                    >
                      {currentStrings.hintBtn}
                    </button>

                    <button
                      id="p2-translate-btn"
                      onClick={() => handleToggleTranslate("p2")}
                      className="flex-1 font-mono text-[9px] sm:text-[10px] font-bold bg-[#141417] border border-stone-800 hover:border-stone-750 text-stone-300 py-2 px-1 rounded-xl text-center cursor-pointer transition-all"
                    >
                      {currentStrings.translateBtn}
                    </button>

                    <button
                      id="p2-skip-btn"
                      onClick={() => openSkipModal("p2")}
                      className="flex-1 font-mono text-[9px] sm:text-[10px] font-bold bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-900/50 text-rose-400 py-2 px-1 rounded-xl text-center cursor-pointer transition-all"
                    >
                      {currentStrings.skipBtn}
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* SKIP CONFIRMATION MODAL */}
          {skipModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
              <div className="bg-[#111114] border border-stone-800/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
                <h3 className="text-lg font-display font-black text-stone-100 mb-2 uppercase tracking-tight">
                  {currentStrings.skipConfirmTitle}
                </h3>
                <p className="text-stone-400 text-xs sm:text-sm mb-6 leading-relaxed">
                  {currentStrings.skipConfirmBody}
                </p>
                <div className="flex gap-3">
                  <button
                    id="skip-confirm-yes"
                    onClick={confirmSkip}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-stone-950 font-display font-black py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer text-center uppercase"
                  >
                    {currentStrings.yesSkip}
                  </button>
                  <button
                    id="skip-confirm-cancel"
                    onClick={() => setSkipModal({ isOpen: false, player: null })}
                    className="flex-1 bg-[#1a191c] hover:bg-[#202025] border border-stone-800 text-stone-300 font-display font-black py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer text-center uppercase"
                  >
                    {currentStrings.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ----------------- WINNER / RESULTS SCREEN ----------------- */}
      {view === "winner" && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 max-w-4xl mx-auto w-full relative">
          
          {/* Confetti particles container */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {confetti.map((p, idx) => (
              <div
                key={idx}
                className="absolute rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: 0.8,
                  transform: `translateY(${p.y}px)`,
                }}
              />
            ))}
          </div>

          <div className="text-center mb-8 z-10">
            <div className="inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/20 p-5 rounded-full mb-4 animate-bounce">
              <Trophy size={48} className="text-amber-500 fill-amber-500/10" />
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black uppercase bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 bg-clip-text text-transparent tracking-tight">
              {p1.score === p2.score
                ? currentStrings.draw
                : p1.score > p2.score
                ? `${p1.name}`
                : `${p2.name}`}
            </h2>
            
            {p1.score !== p2.score && (
              <p className="text-stone-400 font-mono font-bold tracking-widest text-xs sm:text-sm uppercase mt-1">
                🏆 {currentStrings.winsDuel}
              </p>
            )}
          </div>

          {/* Results Bento grid layout summary */}
          <div className="w-full max-w-md bg-[#111114]/95 border border-stone-800/80 rounded-3xl p-6 shadow-2xl z-10 mb-8 space-y-6">
            <h3 className="text-xs font-mono font-black text-center tracking-widest text-stone-500 uppercase border-b border-stone-800/50 pb-2">
              {currentStrings.resultsSummary}
            </h3>

            <div className="space-y-3.5">
              {/* Headings */}
              <div className="grid grid-cols-3 text-center text-[9px] font-mono text-stone-500 font-black uppercase pb-1">
                <span className="text-left pl-2">STATISTIC</span>
                <span className="text-amber-500">{p1.name.toUpperCase()}</span>
                <span className="text-sky-400">{p2.name.toUpperCase()}</span>
              </div>

              {/* Total Score */}
              <div className="grid grid-cols-3 text-center items-center py-2.5 px-1 bg-stone-950/40 rounded-xl border border-stone-850">
                <span className="text-[10px] text-stone-400 font-bold uppercase font-mono text-left pl-2">Total Score</span>
                <span className="text-sm font-mono font-black text-amber-500">{p1.score}</span>
                <span className="text-sm font-mono font-black text-sky-400">{p2.score}</span>
              </div>

              {/* Crane Work */}
              <div className="grid grid-cols-3 text-center items-center py-2.5 px-1 bg-stone-950/40 rounded-xl border border-stone-850">
                <span className="text-[10px] text-stone-400 font-bold uppercase font-mono text-left pl-2">Work Generated</span>
                <span className="text-sm font-mono font-black text-amber-500">{p1.work} J</span>
                <span className="text-sm font-mono font-black text-sky-400">{p2.work} J</span>
              </div>

              {/* Correct Answers */}
              <div className="grid grid-cols-3 text-center items-center py-2.5 px-1 bg-stone-950/40 rounded-xl border border-stone-850">
                <span className="text-[10px] text-stone-400 font-bold uppercase font-mono text-left pl-2">Correct Answers</span>
                <span className="text-sm font-mono font-black text-stone-200">{p1.questionsCorrect}</span>
                <span className="text-sm font-mono font-black text-stone-200">{p2.questionsCorrect}</span>
              </div>

              {/* Skipped */}
              <div className="grid grid-cols-3 text-center items-center py-2.5 px-1 bg-stone-950/40 rounded-xl border border-stone-850">
                <span className="text-[10px] text-stone-400 font-bold uppercase font-mono text-left pl-2">Skipped</span>
                <span className="text-sm font-mono font-black text-stone-400">{p1.skipped}</span>
                <span className="text-sm font-mono font-black text-stone-400">{p2.skipped}</span>
              </div>

              {/* Hints Used */}
              <div className="grid grid-cols-3 text-center items-center py-2.5 px-1 bg-stone-950/40 rounded-xl border border-stone-850">
                <span className="text-[10px] text-stone-400 font-bold uppercase font-mono text-left pl-2">Hints Used</span>
                <span className="text-sm font-mono font-black text-stone-400">{p1.hintsUsed}</span>
                <span className="text-sm font-mono font-black text-stone-400">{p2.hintsUsed}</span>
              </div>
            </div>

            <button
              id="play-again-button"
              onClick={() => setView("menu")}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-display font-black py-3.5 px-4 rounded-xl shadow-lg tracking-wider uppercase transition-all duration-200 transform active:scale-95 text-center block cursor-pointer text-sm"
            >
              {currentStrings.playAgain}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
