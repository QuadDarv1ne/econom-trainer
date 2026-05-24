'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { useEconomicsStore, getLevelTitle, getModuleDisplayName } from '@/store/economics-store'
import { downloadProgressCSV, downloadProgressJSON, importProgressFromFile } from '@/lib/export-progress'
import { useI18n } from '@/lib/i18n-provider'
import { getCurrentLocale, t, toLocale } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Download, Upload, Copy, Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { COPY_FEEDBACK_MS } from '@/lib/constants'

export function exportProgressToPDF() {
  const doc = new jsPDF()
  const progress = useEconomicsStore.getState().getFullProgress()
  const locale = getCurrentLocale()
  const now = new Date().toLocaleString(toLocale(locale))

  // Header
  doc.setFillColor(34, 197, 94)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(t('export.pdf.title', locale), 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(t('export.pdf.reportTitle', locale), 105, 30, { align: 'center' })

  // User info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.text(`${t('export.pdf.generatedDate', locale)}: ${now}`, 14, 48)

  // Level info
  const levelTitle = getLevelTitle(progress.level)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`${t('export.csv.level', locale)} ${progress.level}: ${levelTitle}`, 14, 58)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`${t('export.csv.totalXP', locale)}: ${progress.totalXP.toLocaleString(toLocale(locale))} XP`, 14, 65)
  doc.text(`${t('progress.sessions', locale)}: ${progress.totalSessions}`, 14, 71)

  // Statistics table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(t('export.pdf.moduleStats', locale), 14, 85)

  const statsData = [
    [t('module.quiz.title', locale), `${progress.quizStats.accuracy}%`, `${progress.quizStats.correct}/${progress.quizStats.total}`],
    [t('module.finance.title', locale), `${progress.financeStats.accuracy}%`, `${progress.financeStats.correct}/${progress.financeStats.total}`],
    [t('module.gdp.title', locale), '-', `${progress.gdpCount}`],
    [t('module.elasticity.title', locale), '-', `${progress.elasticityCount}`],
  ]

  // @ts-expect-error - jspdf-autotable adds this method dynamically
  doc.autoTable({
    startY: 90,
    head: [[t('export.pdf.tableHeaders.module', locale), t('export.pdf.tableHeaders.accuracy', locale), t('export.pdf.tableHeaders.solved', locale)]],
    body: statsData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 10 },
  })

  interface AutoTableResult { finalY: number }
  const firstTable = (doc as unknown as { lastAutoTable?: AutoTableResult }).lastAutoTable
  let finalY = firstTable ? firstTable.finalY + 10 : 130

  // Module breakdown
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(t('export.pdf.moduleActivity', locale), 14, finalY)

  const moduleData = Object.entries(progress.moduleCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([moduleId, count]) => [
      getModuleDisplayName(moduleId, locale),
      count.toString(),
    ])

  if (moduleData.length > 0) {
    // @ts-expect-error - jspdf-autotable adds this method dynamically
    doc.autoTable({
      startY: finalY + 5,
      head: [[t('export.pdf.tableHeaders.module', locale), t('export.pdf.tableHeaders.interactions', locale)]],
      body: moduleData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 40, halign: 'center' } },
    })
  }

  const secondTable = (doc as unknown as { lastAutoTable?: AutoTableResult }).lastAutoTable
  finalY = secondTable ? secondTable.finalY + 15 : finalY + 40

  // Achievements section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(t('export.pdf.achievements', locale), 14, finalY)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const achievementsText = [
    `• ${t('progress.title', locale)}: ${levelTitle}`,
    `• ${t('export.csv.totalXP', locale)}: ${progress.totalXP.toLocaleString(toLocale(locale))} XP`,
    `• ${t('progress.sessions', locale)}: ${progress.totalSessions}`,
    `• ${t('export.csv.quizAccuracy', locale)}: ${progress.quizStats.accuracy}%`,
    `• ${t('finance.accuracy', locale)}: ${progress.financeStats.accuracy}%`,
    '',
    locale === 'ru' ? 'Продолжайте тренироваться, чтобы достичь новых уровней!' : 'Keep training to reach new levels!',
  ]

  let y = finalY + 8
  achievementsText.forEach((line) => {
    doc.text(line, 14, y)
    y += 7
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(t('export.pdf.title', locale), 105, 290, { align: 'center' })
  doc.text(`${t('export.pdf.generatedDate', locale)}: ${now}`, 105, 295, { align: 'center' })

  // Save
  doc.save(`economics-trainer-progress-${Date.now()}.pdf`)
}

export function exportProgressToText(): string {
  const progress = useEconomicsStore.getState().getFullProgress()
  const locale = getCurrentLocale()
  const now = new Date().toLocaleString(toLocale(locale))
  const levelTitle = getLevelTitle(progress.level)

  const activeModules = Object.entries(progress.moduleCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const title = t('export.pdf.title', locale)
  const reportTitle = t('export.pdf.reportTitle', locale)
  const levelLabel = t('export.csv.level', locale)
  const xpLabel = t('export.csv.totalXP', locale)
  const sessionsLabel = t('progress.sessions', locale)
  const statsLabel = t('export.pdf.moduleStats', locale)
  const activityLabel = t('export.pdf.moduleActivity', locale)
  const continueText = locale === 'ru' ? 'Продолжайте тренироваться!' : 'Keep training!'

  const lines = [
    `📊 ${title} — ${reportTitle}`,
    `📅 ${now}`,
    '',
    `🏆 ${levelLabel} ${progress.level}: ${levelTitle}`,
    `⭐ ${xpLabel}: ${progress.totalXP.toLocaleString(toLocale(locale))} XP`,
    `📈 ${sessionsLabel}: ${progress.totalSessions}`,
    '',
    `📋 ${statsLabel}:`,
    `• ${t('module.quiz.title', locale)}: ${progress.quizStats.accuracy}% (${progress.quizStats.correct}/${progress.quizStats.total})`,
    `• ${t('module.finance.title', locale)}: ${progress.financeStats.accuracy}% (${progress.financeStats.correct}/${progress.financeStats.total})`,
    `• ${t('module.gdp.title', locale)}: ${progress.gdpCount}`,
    `• ${t('module.elasticity.title', locale)}: ${progress.elasticityCount}`,
    '',
    `🎯 ${activityLabel}:`,
    ...activeModules.map(([id, count]) => `• ${getModuleDisplayName(id, locale)}: ${count}`),
    '',
    `${continueText} 💪`,
    'https://github.com/QuadDarv1ne/econom-trainer',
  ]

  return lines.join('\n')
}

export function ExportProgressButton() {
  const totalXP = useEconomicsStore((s) => s.totalXP)
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()

  if (totalXP === 0) {
    return null
  }

  const handleCopy = async () => {
    try {
      const text = exportProgressToText()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
      toast.success(t('export.copied'))
    } catch {
      toast.error(t('export.copyFailed') ?? 'Failed to copy to clipboard')
    }
  }

  const handleShare = async () => {
    const text = exportProgressToText()

    try {
      if (navigator.share) {
        await navigator.share({
          title: t('progress.title') + ' — ' + t('export.pdf.title'),
          text: text,
        })
        toast.success(t('export.shareSuccess'))
      } else {
        // Fallback to copy
        await handleCopy()
        toast.success(t('export.shareFallback'))
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      toast.error(t('export.shareFailed'))
    }
  }

  const handleImport = async () => {
    try {
      await importProgressFromFile()
      toast.success(t('export.importSuccess') ?? 'Progress imported successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(t('export.importFailed') ?? `Failed to import: ${message}`)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={exportProgressToPDF} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        PDF
      </Button>
      <Button onClick={() => downloadProgressCSV()} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        CSV
      </Button>
      <Button onClick={() => downloadProgressJSON()} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        JSON
      </Button>
      <Button onClick={handleImport} variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        {t('export.import') ?? 'Import'}
      </Button>
      <Button onClick={handleCopy} variant="outline" size="sm">
        {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
        {copied ? t('export.copySuccess') : t('export.copy')}
      </Button>
      <Button onClick={handleShare} variant="outline" size="sm">
        <Share2 className="h-4 w-4 mr-2" />
        {t('export.share')}
      </Button>
    </div>
  )
}