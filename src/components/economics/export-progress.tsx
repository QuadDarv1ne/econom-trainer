'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { useEconomicsStore, getLevelTitle, getLevelColor } from '@/store/economics-store'
import { downloadProgressCSV, downloadProgressJSON } from '@/lib/export-progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Trophy, Calendar, Target, Zap, Copy, Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function exportProgressToPDF() {
  const doc = new jsPDF()
  const progress = useEconomicsStore.getState().getFullProgress()
  const now = new Date().toLocaleString('ru-RU')

  // Header
  doc.setFillColor(34, 197, 94)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Экономический тренажёр', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Отчёт о прогрессе`, 105, 30, { align: 'center' })

  // User info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.text(`Дата генерации: ${now}`, 14, 48)

  // Level info
  const levelTitle = getLevelTitle(progress.level)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`Уровень ${progress.level}: ${levelTitle}`, 14, 58)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Общий опыт: ${progress.totalXP.toLocaleString('ru-RU')} XP`, 14, 65)
  doc.text(`Всего сессий: ${progress.totalSessions}`, 14, 71)

  // Statistics table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Статистика по модулям', 14, 85)

  const statsData = [
    ['Квизы', `${progress.quizStats.accuracy}%`, `${progress.quizStats.correct}/${progress.quizStats.total}`],
    ['Фин. математика', `${progress.financeStats.accuracy}%`, `${progress.financeStats.correct}/${progress.financeStats.total}`],
    ['Расчёты ВВП', '-', `${progress.gdpCount}`],
    ['Эластичность', '-', `${progress.elasticityCount}`],
  ]

  // @ts-ignore - jspdf-autotable adds this
  doc.autoTable({
    startY: 90,
    head: [['Модуль', 'Точность', 'Решено']],
    body: statsData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 10 },
  })

  let finalY = (doc as any).lastAutoTable.finalY + 10

  // Module breakdown
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Активность по модулям', 14, finalY)

  const moduleNames: Record<string, string> = {
    'gdp': 'ВВП и макропоказатели',
    'supply-demand': 'Спрос и предложение',
    'elasticity': 'Калькулятор эластичности',
    'keynesian': 'Кейнсианский крест',
    'inflation': 'Калькулятор инфляции',
    'phillips': 'Кривая Филлипса',
    'lorenz': 'Кривая Лоренца и Джини',
    'is-lm': 'Модель IS-LM',
    'ppf': 'Кривая производственных возможностей',
    'costs': 'Анализ издержек фирмы',
    'comparative': 'Сравнительное преимущество',
    'breakeven': 'Точка безубыточности',
    'tax': 'Калькулятор налогов',
    'game-theory': 'Теория игр',
    'market-structures': 'Рыночные структуры',
    'currency': 'Валютный калькулятор',
    'quiz': 'Квиз по экономике',
    'finance': 'Финансовая математика',
    'glossary': 'Глоссарий терминов',
    'achievements': 'Достижения',
    'progress': 'Прогресс',
  }

  const moduleData = Object.entries(progress.moduleCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([moduleId, count]) => [
      moduleNames[moduleId] || moduleId,
      count.toString(),
    ])

  if (moduleData.length > 0) {
    // @ts-ignore
    doc.autoTable({
      startY: finalY + 5,
      head: [['Модуль', 'Взаимодействий']],
      body: moduleData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 40, halign: 'center' } },
    })
  }

  finalY = (doc as any).lastAutoTable.finalY + 15

  // Achievements section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Достижения и прогресс', 14, finalY)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const achievementsText = [
    `• Ваш текущий уровень: ${levelTitle}`,
    `• Общий опыт: ${progress.totalXP.toLocaleString('ru-RU')} XP`,
    `• Пройдено сессий: ${progress.totalSessions}`,
    `• Точность в квизах: ${progress.quizStats.accuracy}%`,
    `• Точность в финансовых задачах: ${progress.financeStats.accuracy}%`,
    '',
    'Продолжайте тренироваться, чтобы достичь новых уровней!',
  ]

  let y = finalY + 8
  achievementsText.forEach((line) => {
    doc.text(line, 14, y)
    y += 7
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Экономический тренажёр v7.0', 105, 290, { align: 'center' })
  doc.text(`Сгенерировано: ${now}`, 105, 295, { align: 'center' })

  // Save
  doc.save(`economics-trainer-progress-${Date.now()}.pdf`)
}

export function exportProgressToText(): string {
  const progress = useEconomicsStore.getState().getFullProgress()
  const now = new Date().toLocaleString('ru-RU')
  const levelTitle = getLevelTitle(progress.level)

  const moduleNames: Record<string, string> = {
    'gdp': 'ВВП и макропоказатели',
    'supply-demand': 'Спрос и предложение',
    'elasticity': 'Калькулятор эластичности',
    'keynesian': 'Кейнсианский крест',
    'inflation': 'Калькулятор инфляции',
    'phillips': 'Кривая Филлипса',
    'lorenz': 'Кривая Лоренца и Джини',
    'is-lm': 'Модель IS-LM',
    'ppf': 'Кривая производственных возможностей',
    'costs': 'Анализ издержек фирмы',
    'comparative': 'Сравнительное преимущество',
    'breakeven': 'Точка безубыточности',
    'tax': 'Калькулятор налогов',
    'game-theory': 'Теория игр',
    'market-structures': 'Рыночные структуры',
    'currency': 'Валютный калькулятор',
    'quiz': 'Квиз по экономике',
    'finance': 'Финансовая математика',
    'glossary': 'Глоссарий терминов',
    'achievements': 'Достижения',
    'progress': 'Прогресс',
  }

  const activeModules = Object.entries(progress.moduleCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const lines = [
    '📊 Экономический тренажёр — Отчёт о прогрессе',
    `📅 ${now}`,
    '',
    `🏆 Уровень ${progress.level}: ${levelTitle}`,
    `⭐ Опыт: ${progress.totalXP.toLocaleString('ru-RU')} XP`,
    `📈 Сессий: ${progress.totalSessions}`,
    '',
    '📋 Статистика:',
    `• Квизы: ${progress.quizStats.accuracy}% (${progress.quizStats.correct}/${progress.quizStats.total})`,
    `• Фин. математика: ${progress.financeStats.accuracy}% (${progress.financeStats.correct}/${progress.financeStats.total})`,
    `• Расчёты ВВП: ${progress.gdpCount}`,
    `• Эластичность: ${progress.elasticityCount}`,
    '',
    '🎯 Активность по модулям:',
    ...activeModules.map(([id, count]) => `• ${moduleNames[id] || id}: ${count}`),
    '',
    'Продолжайте тренироваться! 💪',
    'https://github.com/QuadDarv1ne/econom-trainer',
  ]

  return lines.join('\n')
}

export function ExportProgressButton() {
  const totalXP = useEconomicsStore((s) => s.totalXP)
  const [copied, setCopied] = useState(false)

  if (totalXP === 0) {
    return null
  }

  const handleCopy = async () => {
    const text = exportProgressToText()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Прогресс скопирован в буфер обмена!')
  }

  const handleShare = async () => {
    const text = exportProgressToText()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Мой прогресс — Экономический тренажёр',
          text: text,
        })
        toast.success('Поделиться успешно!')
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Не удалось поделиться')
        }
      }
    } else {
      // Fallback to copy
      await handleCopy()
      toast.success('Поделиться не доступно, прогресс скопирован')
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
      <Button onClick={handleCopy} variant="outline" size="sm">
        {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
        {copied ? 'Скопировано!' : 'Копировать'}
      </Button>
      <Button onClick={handleShare} variant="outline" size="sm">
        <Share2 className="h-4 w-4 mr-2" />
        Поделиться
      </Button>
    </div>
  )
}