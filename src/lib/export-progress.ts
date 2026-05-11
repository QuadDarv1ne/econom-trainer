/**
 * Utility functions for exporting progress data
 */

import { useEconomicsStore, getLevelFromXP, getLevelTitle } from '@/store/economics-store'
import { getCurrentLocale, t } from '@/lib/i18n'

export interface ExportData {
  totalXP: number
  level: number
  levelTitle: string
  moduleInteractions: Record<string, number>
  totalSessions: number
  quizStats: { correct: number; total: number; accuracy: number }
  financeStats: { correct: number; total: number; accuracy: number }
  createdAt: string
  lastUpdated: string
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
  let csv = `${t('export.csv.metric', locale)},${t('export.csv.value', locale)}\n`

  // Basic stats
  csv += `${t('export.csv.totalXP', locale)},${state.totalXP}\n`
  csv += `${t('export.csv.level', locale)},${level.level}\n`
  csv += `${t('export.csv.levelName', locale)},${getLevelTitle(level.level)}\n`
  csv += `${t('export.csv.interactions', locale)},${state.moduleInteractions.length}\n`
  csv += `Created,${timestamp}\n`
  csv += `\n`

  // Module interactions
  csv += `${t('export.csv.module', locale)},${t('export.csv.interactions', locale)}\n`
  const moduleCounts: Record<string, number> = {}
  state.moduleInteractions.forEach((interaction) => {
    moduleCounts[interaction.moduleId] = (moduleCounts[interaction.moduleId] || 0) + 1
  })
  Object.entries(moduleCounts).forEach(([module, count]) => {
    csv += `"${module}",${count}\n`
  })
  csv += `\n`

  // Quiz and finance stats
  const quizCorrect = state.quizResults.reduce((sum, r) => sum + r.score, 0)
  const quizTotal = state.quizResults.reduce((sum, r) => sum + r.total, 0)
  const financeCorrect = state.financeResults.filter((r) => r.correct).length
  const financeTotal = state.financeResults.length

  csv += `${t('export.csv.quizResults', locale)},${quizCorrect}\n`
  csv += `Quiz total questions,${quizTotal}\n`
  csv += `${t('export.csv.financeTasks', locale)} correct,${financeCorrect}\n`
  csv += `Finance total tasks,${financeTotal}\n`

  return csv
}

/**
 * Export progress data to JSON format
 */
export function exportToJSON(): string {
  const state = useEconomicsStore.getState()
  const level = getLevelFromXP(state.totalXP)
  const timestamp = new Date().toISOString()

  const quizCorrect = state.quizResults.reduce((sum, r) => sum + r.score, 0)
  const quizTotal = state.quizResults.reduce((sum, r) => sum + r.total, 0)
  const financeCorrect = state.financeResults.filter((r) => r.correct).length
  const financeTotal = state.financeResults.length

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
    createdAt: timestamp,
    lastUpdated: timestamp,
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Download file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
