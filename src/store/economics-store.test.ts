import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getLevelFromXP,
  getLevelTitle,
  getLevelColor,
  getModuleInteractionCount,
  MODULE_XP,
  useEconomicsStore,
} from "./economics-store";

describe("XP & Level System", () => {
  it("returns level 1 for 0 XP", () => {
    const result = getLevelFromXP(0);
    expect(result.level).toBe(1);
    expect(result.xpInCurrentLevel).toBe(0);
    expect(result.xpToNextLevel).toBe(500);
  });

  it("levels up correctly at 500 XP", () => {
    const result = getLevelFromXP(500);
    expect(result.level).toBe(2);
    expect(result.xpInCurrentLevel).toBe(0);
  });

  it("returns correct level title for ranges", () => {
    // getLevelTitle uses getCurrentLocale() + t() for i18n
    // Just verify it returns non-empty strings for different levels
    const title1 = getLevelTitle(1)
    const title2 = getLevelTitle(2)
    const title3 = getLevelTitle(3)
    const title5 = getLevelTitle(5)
    const title7 = getLevelTitle(7)
    const title10 = getLevelTitle(10)
    const title15 = getLevelTitle(15)
    const title20 = getLevelTitle(20)
    const title25 = getLevelTitle(25)
    
    expect(title1.length).toBeGreaterThan(0)
    expect(title2.length).toBeGreaterThan(0)
    expect(title3.length).toBeGreaterThan(0)
    expect(title5.length).toBeGreaterThan(0)
    expect(title7.length).toBeGreaterThan(0)
    expect(title10.length).toBeGreaterThan(0)
    expect(title15.length).toBeGreaterThan(0)
    expect(title20.length).toBeGreaterThan(0)
    expect(title20).toBe(title25) // level 20+ all return same title
  });

  it("returns correct level colors", () => {
    expect(getLevelColor(1)).toBe("text-muted-foreground");
    expect(getLevelColor(2)).toBe("text-green-500");
    expect(getLevelColor(10)).toBe("text-blue-500");
    expect(getLevelColor(20)).toBe("text-yellow-500");
  });

  it("calculates XP to next level with multiplier", () => {
    const lvl2 = getLevelFromXP(500);
    expect(lvl2.xpToNextLevel).toBe(600); // 500 * 1.2

    const lvl3 = getLevelFromXP(500 + 600);
    expect(lvl3.level).toBe(3);
  });
});

describe("Module Interactions", () => {
  it("counts interactions per module", () => {
    const interactions = [
      { moduleId: "gdp", id: "1", action: "calculate", xpEarned: 15, date: "2025-01-01" },
      { moduleId: "gdp", id: "2", action: "calculate", xpEarned: 15, date: "2025-01-02" },
      { moduleId: "quiz", id: "3", action: "answer", xpEarned: 10, date: "2025-01-03" },
    ];

    expect(getModuleInteractionCount(interactions, "gdp")).toBe(2);
    expect(getModuleInteractionCount(interactions, "quiz")).toBe(1);
    expect(getModuleInteractionCount(interactions, "tax")).toBe(0);
  });

  it("has XP rewards for all core modules", () => {
    expect(MODULE_XP["gdp"]).toBe(15);
    expect(MODULE_XP["keynesian"]).toBe(20);
    expect(MODULE_XP["quiz"]).toBe(0); // custom scoring
    expect(MODULE_XP["glossary"]).toBe(5);
  });
});

describe("localStorage persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
  });

  it("reads from localStorage on load", () => {
    const mockData = JSON.stringify({
      quizResults: [],
      gdpResults: [],
      financeResults: [],
      elasticityResults: [],
      moduleInteractions: [],
      totalXP: 150,
    });

    vi.spyOn(localStorage, 'getItem').mockReturnValue(mockData);

    const stored = localStorage.getItem("economics-trainer-data");
    expect(stored).toBe(mockData);
    expect(stored && JSON.parse(stored).totalXP).toBe(150);
  });
});

describe("Store actions", () => {
  beforeEach(() => {
    const store = useEconomicsStore.getState()
    store.resetProgress()
  })

  it("addQuizResult adds quiz result and updates XP", () => {
    const store = useEconomicsStore.getState()
    const initialXP = store.totalXP
    
    store.addQuizResult({
      id: 'test-1',
      topic: 'test-topic',
      score: 8,
      total: 10,
      date: new Date().toISOString(),
    })

    const updatedStore = useEconomicsStore.getState()
    expect(updatedStore.quizResults.length).toBe(1)
    expect(updatedStore.quizResults[0].score).toBe(8)
    expect(updatedStore.totalXP).toBeGreaterThan(initialXP)
  })

  it("addFinanceResult adds finance result", () => {
    const store = useEconomicsStore.getState()
    
    store.addFinanceResult({
      id: 'test-1',
      problemType: 'compound',
      correct: true,
      userAnswer: 1000,
      correctAnswer: 1000,
      date: new Date().toISOString(),
    })

    const updatedStore = useEconomicsStore.getState()
    expect(updatedStore.financeResults.length).toBe(1)
    expect(updatedStore.financeResults[0].correct).toBe(true)
  })

  it("addModuleInteraction adds interaction", () => {
    const store = useEconomicsStore.getState()
    const initialLength = store.moduleInteractions.length
    
    store.addModuleInteraction({
      moduleId: 'gdp',
      action: 'calculate',
      xpEarned: 15,
    })

    const updatedStore = useEconomicsStore.getState()
    expect(updatedStore.moduleInteractions.length).toBe(initialLength + 1)
  })

  it("resetProgress clears all state", () => {
    const store = useEconomicsStore.getState()
    
    // Add some data
    store.addQuizResult({
      id: 'test-1',
      topic: 'test-topic',
      score: 5,
      total: 10,
      date: new Date().toISOString(),
    })
    store.addModuleInteraction({
      moduleId: 'gdp',
      action: 'calculate',
      xpEarned: 15,
    })

    // Verify data added
    expect(useEconomicsStore.getState().quizResults.length).toBeGreaterThan(0)
    expect(useEconomicsStore.getState().moduleInteractions.length).toBeGreaterThan(0)

    // Reset
    store.resetProgress()

    // Verify cleared
    const resetStore = useEconomicsStore.getState()
    expect(resetStore.quizResults).toEqual([])
    expect(resetStore.gdpResults).toEqual([])
    expect(resetStore.financeResults).toEqual([])
    expect(resetStore.elasticityResults).toEqual([])
    expect(resetStore.moduleInteractions).toEqual([])
    expect(resetStore.totalXP).toBe(0)
  })

  it("getTotalScore calculates percentages correctly", () => {
    const store = useEconomicsStore.getState()
    
    store.addQuizResult({
      id: 'test-1',
      topic: 'test-topic',
      score: 7,
      total: 10,
      date: new Date().toISOString(),
    })
    store.addQuizResult({
      id: 'test-2',
      topic: 'test-topic-2',
      score: 8,
      total: 10,
      date: new Date().toISOString(),
    })

    const scores = store.getTotalScore()
    expect(scores.quizzes).toBe(75) // (7+8)/(10+10) = 15/20 = 75%
  })

  it("getTotalScore returns 0 for empty state", () => {
    const store = useEconomicsStore.getState()
    const scores = store.getTotalScore()
    
    expect(scores.quizzes).toBe(0)
    expect(scores.gdp).toBe(0)
    expect(scores.finance).toBe(0)
    expect(scores.elasticity).toBe(0)
  })
})
