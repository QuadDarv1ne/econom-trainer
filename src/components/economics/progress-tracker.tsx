'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useEconomicsStore } from '@/store/economics-store'
import { ExportProgressButton } from '@/components/economics/export-progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { Trophy, Target, Flame, BarChart3, Gauge, Download } from 'lucide-react'

const COLORS = ['#22c55e', '#ef4444']

export function ProgressTracker() {
  const quizResults = useEconomicsStore((s) => s.quizResults)
  const gdpResults = useEconomicsStore((s) => s.gdpResults)
  const financeResults = useEconomicsStore((s) => s.financeResults)
  const elasticityResults = useEconomicsStore((s) => s.elasticityResults)
  const getTotalScore = useEconomicsStore((s) => s.getTotalScore)

  const scores = getTotalScore()
  const totalSessions = quizResults.length + gdpResults.length + financeResults.length + elasticityResults.length

  const quizCorrect = quizResults.reduce((sum, r) => sum + r.score, 0)
  const quizTotal = quizResults.reduce((sum, r) => sum + r.total, 0)
  const financeCorrect = financeResults.filter((r) => r.correct).length
  const financeTotal = financeResults.length

  const quizPieData = [
    { name: 'Правильные', value: quizCorrect },
    { name: 'Неправильные', value: quizTotal - quizCorrect },
  ]

  const financePieData = [
    { name: 'Правильные', value: financeCorrect },
    { name: 'Неправильные', value: financeTotal - financeCorrect },
  ]

  const quizBarData = quizResults.slice(0, 8).reverse().map((r, i) => ({
    name: `#${i + 1}`,
    score: Math.round((r.score / r.total) * 100),
  }))

  const financeLineData = financeResults.slice(0, 15).reverse().map((r, i) => ({
    name: i + 1,
    result: r.correct ? 1 : 0,
  }))

  const cumulativeCorrect = financeLineData.reduce(
    (acc, d) => {
      const last = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
      acc.push({ ...d, cumulative: last + d.result })
      return acc
    },
    [] as { name: number; result: number; cumulative: number }[]
  )

  return (
    <div className="space-y-6">
      {/* Header with export button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Прогресс тренировок</h2>
          <p className="text-sm text-muted-foreground">Статистика и аналитика ваших достижений</p>
        </div>
        <ExportProgressButton />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{totalSessions}</div>
            <div className="text-xs text-muted-foreground">Тренировок</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{scores.quizzes}%</div>
            <div className="text-xs text-muted-foreground">Квизы</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{scores.gdp}</div>
            <div className="text-xs text-muted-foreground">Расчётов ВВП</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{scores.finance}%</div>
            <div className="text-xs text-muted-foreground">Фин. задачи</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20 col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <Gauge className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
            <div className="text-2xl font-bold">{scores.elasticity}</div>
            <div className="text-xs text-muted-foreground">Эластичностей</div>
          </CardContent>
        </Card>
      </div>

      {totalSessions === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Пока нет данных</h3>
            <p className="text-muted-foreground text-sm">
              Пройдите тренировки в других модулях, чтобы увидеть здесь статистику прогресса.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quizResults.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Результаты квизов</CardTitle>
                  <CardDescription>
                    Средний балл: {scores.quizzes}% | Всего вопросов: {quizTotal}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quizPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {quizPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {quizBarData.length > 1 && (
                    <div className="h-[150px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizBarData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <Tooltip formatter={(value: number) => [`${value}%`, 'Результат']} />
                          <Bar dataKey="score" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {financeResults.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Финансовая математика</CardTitle>
                  <CardDescription>
                    Точность: {scores.finance}% | Решено: {financeTotal} задач
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {financePieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {cumulativeCorrect.length > 2 && (
                    <div className="h-[150px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cumulativeCorrect}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#22c55e"
                            strokeWidth={2}
                            name="Накопленные правильные"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {gdpResults.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">История расчётов ВВП</CardTitle>
                <CardDescription>Последние {Math.min(gdpResults.length, 5)} расчётов</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gdpResults.slice(0, 5).map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{i + 1}</Badge>
                        <span className="text-muted-foreground">
                          {new Date(r.date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span>Ном. ВВП: {r.nominalGDP.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</span>
                        <span>Реал. ВВП: {r.realGDP.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</span>
                        <Badge variant={r.inflationRate > 5 ? 'destructive' : 'secondary'}>
                          Дефлятор: {r.deflator.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
