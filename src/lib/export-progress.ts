/**
 * Utility functions for exporting progress data
 */

import { useEconomicsStore, getLevelFromXP, getLevelTitle } from '@/store/economics-store'

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

  // Header
  let csv = 'Метрика,Значение\n'

  // Basic stats
  csv += `Общий XP,${state.totalXP}\n`
  csv += `Уровень,${level.level}\n`
  csv += `Название уровня,${getLevelTitle(level.level)}\n`
  csv += `Всего взаимодействий,${state.moduleInteractions.length}\n`
  csv += `Дата создания,${timestamp}\n`
  csv += `\n`

  // Module interactions
  csv += 'Модуль,Взаимодействия\n'
  Object.entries(state.moduleInteractions).forEach(([module, count]) => {
    csv += `"${module}",${count}\n`
  })
  csv += `\n`

  // Quiz and finance stats
  const quizCorrect = state.quizResults.reduce((sum, r) => sum + r.score, 0)
  const quizTotal = state.quizResults.reduce((sum, r) => sum + r.total, 0)
  const financeCorrect = state.financeResults.filter((r) => r.correct).length
  const financeTotal = state.financeResults.length

  csv += `Квиз правильных ответов,${quizCorrect}\n`
  csv += `Квиз всего вопросов,${quizTotal}\n`
  csv += `Финансы правильных ответов,${financeCorrect}\n`
  csv += `Финансы всего задач,${financeTotal}\n`

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
