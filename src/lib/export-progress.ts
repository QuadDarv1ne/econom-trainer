/**
 * Utility functions for exporting progress data
 */

import { useEconomicsStore, getLevelTitle, getModuleDisplayName, computeQuizAndFinanceStats, type EconomicsState } from '@/store/economics-store'
import type { QuizResult, GDPResult, FinanceResult, ElasticityResult, ModuleInteraction, DailyChallenge } from '@/store/economics-store'
import { getLevelFromXP } from '@/lib/xp-utils'
import { getCurrentLocale, t } from '@/lib/i18n'

export interface ExportData {
  totalXP: number
  level: number
  levelTitle: string
  moduleInteractions: Record<string, number>
  totalSessions: number
  quizStats: { correct: number; total: number; accuracy: number }
  financeStats: { correct: number; total: number; accuracy: number }
  currentStreak: number
  longestStreak: number
  dailyChallengesCompleted: number
  achievementsUnlocked: number
  gdpCalculations: number
  elasticityCalculations: number
  createdAt: string
  lastUpdated: string
}

/**
 * Escape a value for CSV output. Protects against CSV formula injection
 * by prefixing dangerous characters. Wraps in quotes and doubles internal quotes.
 */
function escapeCsvValue(value: string | number): string {
  const str = String(value);
  const dangerousPrefixes = ['=', '+', '-', '@'] as const;
  const startsWithDangerous = dangerousPrefixes.some(prefix => str.startsWith(prefix));
  const needsQuoting = startsWithDangerous || str.includes(',') || str.includes('"') || str.includes('\n');

  if (needsQuoting) {
    const escaped = str.replace(/"/g, '""');
    // Prepend tab to neutralize formula injection while keeping value readable
    return startsWithDangerous ? `"\t${escaped}"` : `"${escaped}"`;
  }
  return str;
}

/**
 * Export progress data to CSV format
 */
export function exportToCSV(): string {
  const state = useEconomicsStore.getState()
  const level = getLevelFromXP(state.totalXP)
  const timestamp = new Date().toISOString()
  const locale = getCurrentLocale()

  // Header
  let csv = `${escapeCsvValue(t('export.csv.metric', locale))},${escapeCsvValue(t('export.csv.value', locale))}\n`

  // Basic stats
  csv += `${escapeCsvValue(t('export.csv.totalXP', locale))},${escapeCsvValue(state.totalXP)}\n`
  csv += `${escapeCsvValue(t('export.csv.level', locale))},${escapeCsvValue(level.level)}\n`
  csv += `${escapeCsvValue(t('export.csv.levelName', locale))},${escapeCsvValue(getLevelTitle(level.level))}\n`
  csv += `${escapeCsvValue(t('export.csv.interactions', locale))},${escapeCsvValue(state.moduleInteractions.length)}\n`
  csv += `${escapeCsvValue(t('export.csv.created', locale))},${escapeCsvValue(timestamp)}\n`
  csv += `\n`

  // Module interactions
  csv += `${escapeCsvValue(t('export.csv.module', locale))},${escapeCsvValue(t('export.csv.interactions', locale))}\n`
  const moduleCounts: Record<string, number> = {}
  state.moduleInteractions.forEach((interaction) => {
    moduleCounts[interaction.moduleId] = (moduleCounts[interaction.moduleId] || 0) + 1
  })
  Object.entries(moduleCounts).forEach(([module, count]) => {
    csv += `${escapeCsvValue(getModuleDisplayName(module, locale))},${escapeCsvValue(count)}\n`
  })
  csv += `\n`

  // Quiz and finance stats (shared calculation)
  const { quizCorrect, quizTotal, financeCorrect, financeTotal } = computeQuizAndFinanceStats(state.quizResults, state.financeResults)

  csv += `${escapeCsvValue(t('export.csv.quizResults', locale))},${escapeCsvValue(quizCorrect)}\n`
  csv += `${escapeCsvValue(t('export.csv.quizTotalQuestions', locale))},${escapeCsvValue(quizTotal)}\n`
  csv += `${escapeCsvValue(t('export.csv.financeTasksCorrect', locale))},${escapeCsvValue(financeCorrect)}\n`
  csv += `${escapeCsvValue(t('export.csv.financeTasksTotal', locale))},${escapeCsvValue(financeTotal)}\n`
  csv += `${escapeCsvValue(t('export.csv.currentStreak', locale))},${escapeCsvValue(state.streakState.currentStreak)}\n`
  csv += `${escapeCsvValue(t('export.csv.longestStreak', locale))},${escapeCsvValue(state.streakState.longestStreak)}\n`
  csv += `${escapeCsvValue(t('export.csv.dailyChallenges', locale))},${escapeCsvValue(state.dailyChallenges.length)}\n`
  csv += `${escapeCsvValue(t('export.csv.achievements', locale))},${escapeCsvValue(state.unlockedAchievements.length)}\n`
  csv += `${escapeCsvValue(t('export.csv.gdpCalculations', locale))},${escapeCsvValue(state.gdpResults.length)}\n`
  csv += `${escapeCsvValue(t('export.csv.elasticityCalculations', locale))},${escapeCsvValue(state.elasticityResults.length)}\n`

  return csv
}

/**
 * Export progress data to JSON format
 */
export function exportToJSON(): string {
  const state = useEconomicsStore.getState()
  const level = getLevelFromXP(state.totalXP)
  const timestamp = new Date().toISOString()

  const { quizCorrect, quizTotal, financeCorrect, financeTotal } = computeQuizAndFinanceStats(state.quizResults, state.financeResults)

  // Convert module interactions array to counts per module
  const moduleCounts: Record<string, number> = {}
  state.moduleInteractions.forEach((interaction) => {
    moduleCounts[interaction.moduleId] = (moduleCounts[interaction.moduleId] || 0) + 1
  })

  const data: ExportData = {
    totalXP: state.totalXP,
    level: level.level,
    levelTitle: getLevelTitle(level.level),
    moduleInteractions: moduleCounts,
    totalSessions: state.quizResults.length + state.gdpResults.length + state.financeResults.length + state.elasticityResults.length,
    quizStats: {
      correct: quizCorrect,
      total: quizTotal,
      accuracy: quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0,
    },
    financeStats: {
      correct: financeCorrect,
      total: financeTotal,
      accuracy: financeTotal > 0 ? Math.round((financeCorrect / financeTotal) * 100) : 0,
    },
    currentStreak: state.streakState.currentStreak,
    longestStreak: state.streakState.longestStreak,
    dailyChallengesCompleted: state.dailyChallenges.length,
    achievementsUnlocked: state.unlockedAchievements.length,
    gdpCalculations: state.gdpResults.length,
    elasticityCalculations: state.elasticityResults.length,
    createdAt: timestamp,
    lastUpdated: timestamp,
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Download file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('downloadFile: not available in server environment')
    return
  }
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  try {
    link.click()
  } finally {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export progress to CSV and trigger download
 */
export function downloadProgressCSV() {
  const csv = exportToCSV()
  const timestamp = new Date().toISOString().split('T')[0]
  downloadFile(csv, `economy-progress-${timestamp}.csv`, 'text/csv')
}

/**
 * Export progress to JSON and trigger download
 */
export function downloadProgressJSON() {
  const json = exportToJSON()
  const timestamp = new Date().toISOString().split('T')[0]
  downloadFile(json, `economy-progress-${timestamp}.json`, 'application/json')
}

/**
 * Validate and import progress data from a JSON string.
 * Throws on failure so errors can be properly caught by callers.
 */
export function importProgressFromJSON(jsonString: string): void {
  if (typeof window === 'undefined') {
    throw new Error('Import is not available in server environment')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON format')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid progress data: expected a JSON object')
  }

  const data = parsed as Record<string, unknown>

  // Validate required fields
  if (typeof data.totalXP !== 'number' || data.totalXP < 0) {
    throw new Error('Invalid progress data: totalXP must be a non-negative number')
  }

  // Validate arrays
  const arrayFields = ['quizResults', 'gdpResults', 'financeResults', 'elasticityResults', 'moduleInteractions', 'dailyChallenges'] as const
  for (const field of arrayFields) {
    if (field in data && !Array.isArray(data[field])) {
      throw new Error(`Invalid progress data: ${field} must be an array`)
    }
  }

  // Validate streakState
  if ('streakState' in data) {
    const streak = data.streakState
    if (!streak || typeof streak !== 'object' ||
        typeof (streak as Record<string, unknown>).currentStreak !== 'number' ||
        typeof (streak as Record<string, unknown>).longestStreak !== 'number') {
      throw new Error('Invalid progress data: streakState must contain currentStreak and longestStreak')
    }
  }

  // Build imported data BEFORE resetting progress
  const state = useEconomicsStore.getState()

  // Validate array elements have at least basic expected structure
  function validateArrayItems(arr: unknown[], requiredKeys: string[]): unknown[] {
    return arr.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Record<string, unknown>;
      return requiredKeys.every((key) => key in obj);
    });
  }

  const importedData: Partial<EconomicsState> = {
    quizResults: validateArrayItems(Array.isArray(data.quizResults) ? data.quizResults : [], ['id', 'topic', 'score', 'total', 'date']) as QuizResult[],
    gdpResults: validateArrayItems(Array.isArray(data.gdpResults) ? data.gdpResults : [], ['nominalGDP']) as GDPResult[],
    financeResults: validateArrayItems(Array.isArray(data.financeResults) ? data.financeResults : [], ['id', 'problemType', 'correct', 'date']) as FinanceResult[],
    elasticityResults: validateArrayItems(Array.isArray(data.elasticityResults) ? data.elasticityResults : [], ['id', 'elasticityType', 'value', 'date']) as ElasticityResult[],
    moduleInteractions: validateArrayItems(Array.isArray(data.moduleInteractions) ? data.moduleInteractions : [], ['moduleId', 'xpEarned']) as ModuleInteraction[],
    unlockedAchievements: (data.unlockedAchievements as string[] | undefined)?.filter((id) => typeof id === 'string') ?? [],
    totalXP: data.totalXP as number,
    dailyChallenges: validateArrayItems(Array.isArray(data.dailyChallenges) ? data.dailyChallenges : [], ['date']) as DailyChallenge[],
    streakState: (data.streakState as typeof state.streakState | undefined) ?? { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
  }

  // Now reset and import atomically
  state.resetProgress()
  useEconomicsStore.setState(importedData)
}

/**
 * Open file picker and import progress from selected JSON file.
 * Returns a Promise that resolves on success or rejects on failure.
 */
export function importProgressFromFile(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('importProgressFromFile: not available in server environment')
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.style.display = 'none'

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input)
      }
    }

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        cleanup()
        reject(new Error('No file selected'))
        return
      }

      try {
        const text = await file.text()
        importProgressFromJSON(text)
        resolve()
      } catch (err) {
        reject(err)
      } finally {
        cleanup()
      }
    }

    document.body.appendChild(input)
    input.click()

    // Clean up if the file picker is dismissed without selection
    setTimeout(() => {
      if (!input.files?.length && document.body.contains(input)) {
        cleanup()
      }
    }, 60000)
  })
}
