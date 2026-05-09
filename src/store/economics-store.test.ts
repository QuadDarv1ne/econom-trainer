import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getLevelFromXP,
  getLevelTitle,
  getLevelColor,
  getModuleInteractionCount,
  MODULE_XP,
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
    expect(getLevelTitle(1)).toBe("Новичок");
    expect(getLevelTitle(2)).toBe("Студент");
    expect(getLevelTitle(3)).toBe("Бакалавр");
    expect(getLevelTitle(5)).toBe("Магистр");
    expect(getLevelTitle(7)).toBe("Аспирант");
    expect(getLevelTitle(10)).toBe("Доцент");
    expect(getLevelTitle(15)).toBe("Профессор");
    expect(getLevelTitle(20)).toBe("Академик");
    expect(getLevelTitle(25)).toBe("Академик");
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

    (localStorage.getItem as any).mockReturnValue(mockData);

    const stored = localStorage.getItem("economics-trainer-data");
    expect(stored).toBe(mockData);
    expect(JSON.parse(stored!).totalXP).toBe(150);
  });
});
