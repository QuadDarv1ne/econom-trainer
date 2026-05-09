'use client'

import { useState, useCallback, useMemo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Users, Swords, Info, Shield, RotateCcw } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type PDChoice = 'cooperate' | 'defect'
type PDStrategy = 'random' | 'always-defect' | 'tit-for-tat'

interface PDRound {
  playerChoice: PDChoice
  aiChoice: PDChoice
  playerPayoff: number
  aiPayoff: number
}

type BotSChoice = 'opera' | 'football'

interface BotSRound {
  player1Choice: BotSChoice
  player2Choice: BotSChoice
  player1Payoff: number
  player2Payoff: number
}

// ─── Prisoner's Dilemma Payoff ───────────────────────────────────────────────

const PD_PAYOFF: Record<PDChoice, Record<PDChoice, [number, number]>> = {
  cooperate: {
    cooperate: [-1, -1],
    defect: [-10, 0],
  },
  defect: {
    cooperate: [0, -10],
    defect: [-5, -5],
  },
}

// ─── Battle of the Sexes Payoff ──────────────────────────────────────────────

const BOTS_PAYOFF: Record<BotSChoice, Record<BotSChoice, [number, number]>> = {
  opera: {
    opera: [3, 2],
    football: [0, 0],
  },
  football: {
    opera: [0, 0],
    football: [2, 3],
  },
}

// ─── Helper: AI choice for Prisoner's Dilemma ────────────────────────────────

function getAIChoice(
  strategy: PDStrategy,
  playerHistory: PDChoice[]
): PDChoice {
  switch (strategy) {
    case 'always-defect':
      return 'defect'
    case 'tit-for-tat':
      if (playerHistory.length === 0) return 'cooperate'
      return playerHistory[playerHistory.length - 1]
    case 'random':
    default:
      return Math.random() < 0.5 ? 'cooperate' : 'defect'
  }
}

// ─── XP flag shared across all sub-games (once per session per module) ────────
let gameTheoryXpEarned = false

// ─── Main Component ──────────────────────────────────────────────────────────

export function GameTheory() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Теория игр: интерактивный модуль
          </CardTitle>
          <CardDescription>
            Исследуйте классические модели теории игр: дилемму заключённого, битву полов
            и эволюционную игру «Ястребы и Голуби». Выбирайте стратегии и наблюдайте за исходами.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="prisoner" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="prisoner" className="flex-1 min-w-[140px] text-xs sm:text-sm">
            <Swords className="h-4 w-4 mr-1" />
            Дилемма заключённого
          </TabsTrigger>
          <TabsTrigger value="battle" className="flex-1 min-w-[140px] text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1" />
            Битва полов
          </TabsTrigger>
          <TabsTrigger value="hawks" className="flex-1 min-w-[140px] text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1" />
            Ястребы и Голуби
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prisoner">
          <PrisonersDilemma />
        </TabsContent>
        <TabsContent value="battle">
          <BattleOfTheSexes />
        </TabsContent>
        <TabsContent value="hawks">
          <HawksAndDoves />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// PRISONER'S DILEMMA
// ═════════════════════════════════════════════════════════════════════════════

function PrisonersDilemma() {
  const [playerHistory, setPlayerHistory] = useState<PDChoice[]>([])
  const [rounds, setRounds] = useState<PDRound[]>([])
  const [aiStrategy, setAiStrategy] = useState<PDStrategy>('random')
  const [lastResult, setLastResult] = useState<{
    player: PDChoice
    ai: PDChoice
    playerPayoff: number
    aiPayoff: number
  } | null>(null)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const totalPlayerScore = useMemo(
    () => rounds.reduce((sum, r) => sum + r.playerPayoff, 0),
    [rounds]
  )
  const totalAIScore = useMemo(
    () => rounds.reduce((sum, r) => sum + r.aiPayoff, 0),
    [rounds]
  )

  const playRound = useCallback(
    (choice: PDChoice) => {
      const aiChoice = getAIChoice(aiStrategy, playerHistory)
      const [playerPayoff, aiPayoff] = PD_PAYOFF[choice][aiChoice]

      const newRound: PDRound = {
        playerChoice: choice,
        aiChoice,
        playerPayoff,
        aiPayoff,
      }

      setRounds((prev) => [...prev, newRound])
      setPlayerHistory((prev) => [...prev, choice])
      setLastResult({ player: choice, ai: aiChoice, playerPayoff, aiPayoff })

      if (!gameTheoryXpEarned) {
        gameTheoryXpEarned = true
        addModuleInteraction({ moduleId: 'game-theory', action: 'play', xpEarned: MODULE_XP['game-theory'] })
      }
    },
    [aiStrategy, playerHistory, addModuleInteraction]
  )

  const resetGame = useCallback(() => {
    setRounds([])
    setPlayerHistory([])
    setLastResult(null)
  }, [])

  const strategyLabels: Record<PDStrategy, string> = {
    random: 'Случайная',
    'always-defect': 'Всегда предаёт',
    'tit-for-tat': 'Око за око',
  }

  return (
    <div className="space-y-4">
      {/* Payoff Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Матрица выигрышей
          </CardTitle>
          <CardDescription>
            Формат: (Выигрыш Игрока 1, Выигрыш Игрока 2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50" />
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">Игрок 2</Badge>
                      <span>Сотрудничать</span>
                    </div>
                  </th>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">Игрок 2</Badge>
                      <span>Предать</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">Игрок 1</Badge>
                      <span>Сотрудничать</span>
                    </div>
                  </td>
                  <td className="border-2 border-border p-2 sm:p-3 text-center bg-green-500/10 border-green-500/30">
                    <div className="font-mono font-semibold">(-1, -1)</div>
                    <Badge className="mt-1 bg-green-600 text-xs">Парето-оптимум</Badge>
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">(-10, 0)</div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">Игрок 1</Badge>
                      <span>Предать</span>
                    </div>
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">(0, -10)</div>
                  </td>
                  <td className="border-2 border-border p-2 sm:p-3 text-center bg-amber-500/10 border-amber-500/30">
                    <div className="font-mono font-semibold">(-5, -5)</div>
                    <Badge className="mt-1 bg-amber-600 text-xs">Равновесие Нэша</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              🟡 Равновесие Нэша: взаимное предательство
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-600">
              🟢 Парето-оптимум: взаимное сотрудничество
            </Badge>
            <Badge variant="outline" className="border-red-500 text-red-600">
              🔴 Доминирующая стратегия: Предать
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Game */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Играйте против ИИ</CardTitle>
          <CardDescription>
            Выберите стратегию оппонента и свой ход в каждом раунде
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Стратегия ИИ-оппонента:</p>
            <div className="flex flex-wrap gap-2">
              {(['random', 'always-defect', 'tit-for-tat'] as PDStrategy[]).map(
                (s) => (
                  <Button
                    key={s}
                    variant={aiStrategy === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setAiStrategy(s)
                      resetGame()
                    }}
                  >
                    {strategyLabels[s]}
                  </Button>
                )
              )}
            </div>
          </div>

          <Separator />

          {/* Choice buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 h-14 text-base"
              variant="outline"
              onClick={() => playRound('cooperate')}
            >
              🤝 Сотрудничать
            </Button>
            <Button
              className="flex-1 h-14 text-base"
              variant="outline"
              onClick={() => playRound('defect')}
            >
              🗡️ Предать
            </Button>
          </div>

          {/* Last result */}
          {lastResult && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="font-semibold text-center">Результат раунда {rounds.length}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">Ваш выбор</div>
                  <div className="font-semibold">
                    {lastResult.player === 'cooperate' ? '🤝 Сотрудничество' : '🗡️ Предательство'}
                  </div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">Выбор ИИ</div>
                  <div className="font-semibold">
                    {lastResult.ai === 'cooperate' ? '🤝 Сотрудничество' : '🗡️ Предательство'}
                  </div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">Ваш выигрыш</div>
                  <div className="font-mono font-bold text-lg">{lastResult.playerPayoff}</div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">Выигрыш ИИ</div>
                  <div className="font-mono font-bold text-lg">{lastResult.aiPayoff}</div>
                </div>
              </div>
            </div>
          )}

          {/* Score */}
          {rounds.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Раундов:</span>{' '}
                  <span className="font-bold">{rounds.length}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Вы:</span>{' '}
                    <span className="font-mono font-bold">{totalPlayerScore}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ИИ:</span>{' '}
                    <span className="font-mono font-bold">{totalAIScore}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetGame}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Сброс
                </Button>
              </div>

              {/* Rounds history */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Вы</th>
                      <th className="p-2 text-left">ИИ</th>
                      <th className="p-2 text-right">Ваш Σ</th>
                      <th className="p-2 text-right">ИИ Σ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">
                          {r.playerChoice === 'cooperate' ? '🤝' : '🗡️'}
                        </td>
                        <td className="p-2">
                          {r.aiChoice === 'cooperate' ? '🤝' : '🗡️'}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {rounds.slice(0, i + 1).reduce((s, x) => s + x.playerPayoff, 0)}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {rounds.slice(0, i + 1).reduce((s, x) => s + x.aiPayoff, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Theory explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Анализ дилеммы заключённого
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <strong>Равновесие Нэша (взаимное предательство (-5, -5)):</strong> Ни один игрок не может
            улучшить свой результат, односторонне изменив стратегию. Если игрок 1 предаёт, то игроку 2
            лучше тоже предать (-5 &gt; -10). Если игрок 1 сотрудничает, игроку 2 всё равно выгоднее
            предать (0 &gt; -1). Таким образом, «Предать» — доминирующая стратегия.
          </div>
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <strong>Парето-оптимум (взаимное сотрудничество (-1, -1)):</strong> При взаимном сотрудничестве
            оба игрока получают лучший результат, чем при взаимном предательстве (-1 &gt; -5). Однако
            это состояние нестабильно: у каждого есть стимул отклониться и получить 0 вместо -1.
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Парадокс:</strong> Рациональные игроки, преследующие собственный интерес, приходят
            к худшему для обоих исходу. Это основная проблема теории игр и причина возникновения
            институтов, норм и механизмов принуждения к сотрудничеству.
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Стратегия «Око за око»:</strong> В повторяющейся игре эта простая стратегия
            (сотрудничать первым, затем повторять действие оппонента) способствует возникновению
            сотрудничества и является одной из наиболее успешных в турнирах по теории игр.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// BATTLE OF THE SEXES
// ═════════════════════════════════════════════════════════════════════════════

function BattleOfTheSexes() {
  const [player1Choice, setPlayer1Choice] = useState<BotSChoice | null>(null)
  const [player2Choice, setPlayer2Choice] = useState<BotSChoice | null>(null)
  const [result, setResult] = useState<{
    p1: number
    p2: number
  } | null>(null)

  const [rounds, setRounds] = useState<BotSRound[]>([])
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const totalP1 = useMemo(() => rounds.reduce((s, r) => s + r.player1Payoff, 0), [rounds])
  const totalP2 = useMemo(() => rounds.reduce((s, r) => s + r.player2Payoff, 0), [rounds])

  // Mixed strategy calculations
  // Player 1 chooses Opera with prob p, Football with prob (1-p)
  // Player 2's expected payoff from Opera:  2p + 0(1-p) = 2p
  // Player 2's expected payoff from Football: 0p + 3(1-p) = 3 - 3p
  // Indifference: 2p = 3 - 3p => 5p = 3 => p = 3/5
  //
  // Player 2 chooses Opera with prob q, Football with prob (1-q)
  // Player 1's expected payoff from Opera:  3q + 0(1-q) = 3q
  // Player 1's expected payoff from Football: 0q + 2(1-q) = 2 - 2q
  // Indifference: 3q = 2 - 2q => 5q = 2 => q = 2/5
  const mixedP1Opera = 3 / 5 // Player 1 plays Opera with prob 0.6
  const mixedP2Opera = 2 / 5 // Player 2 plays Opera with prob 0.4

  // Expected payoffs in mixed NE
  const mixedP1Expected = 3 * mixedP2Opera // = 1.2
  const mixedP2Expected = 2 * mixedP1Opera // = 1.2

  const playRound = useCallback(() => {
    if (!player1Choice || !player2Choice) return

    const [p1Payoff, p2Payoff] = BOTS_PAYOFF[player1Choice][player2Choice]
    const round: BotSRound = {
      player1Choice,
      player2Choice,
      player1Payoff: p1Payoff,
      player2Payoff: p2Payoff,
    }

    setRounds((prev) => [...prev, round])
    setResult({ p1: p1Payoff, p2: p2Payoff })

    if (!gameTheoryXpEarned) {
      gameTheoryXpEarned = true
      addModuleInteraction({ moduleId: 'game-theory', action: 'play', xpEarned: MODULE_XP['game-theory'] })
    }
  }, [player1Choice, player2Choice, addModuleInteraction])

  const resetGame = useCallback(() => {
    setRounds([])
    setPlayer1Choice(null)
    setPlayer2Choice(null)
    setResult(null)
  }, [])

  const isNashCell = (
    p1Choice: BotSChoice,
    p2Choice: BotSChoice
  ): boolean => {
    // Two pure NE: (Opera, Opera) and (Football, Football)
    return p1Choice === p2Choice
  }

  return (
    <div className="space-y-4">
      {/* Payoff Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Матрица выигрышей
          </CardTitle>
          <CardDescription>
            Игрок 1 предпочитает Оперу, Игрок 2 — Футбол. Формат: (Игрок 1, Игрок 2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50" />
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">Игрок 2</Badge>
                      <span>🎭 Опера</span>
                    </div>
                  </th>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">Игрок 2</Badge>
                      <span>⚽ Футбол</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(['opera', 'football'] as BotSChoice[]).map((p1) => (
                  <tr key={p1}>
                    <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="outline" className="text-xs">Игрок 1</Badge>
                        <span>{p1 === 'opera' ? '🎭 Опера' : '⚽ Футбол'}</span>
                      </div>
                    </td>
                    {(['opera', 'football'] as BotSChoice[]).map((p2) => {
                      const [p1Payoff, p2Payoff] = BOTS_PAYOFF[p1][p2]
                      const isNash = isNashCell(p1, p2)
                      return (
                        <td
                          key={p2}
                          className={`border border-border p-2 sm:p-3 text-center ${
                            isNash ? 'bg-green-500/10 border-2 border-green-500/30' : ''
                          }`}
                        >
                          <div className="font-mono font-semibold">({p1Payoff}, {p2Payoff})</div>
                          {isNash && (
                            <Badge className="mt-1 bg-green-600 text-xs">
                              Равновесие Нэша
                            </Badge>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-green-500 text-green-600">
              🟢 Два чистых равновесия Нэша: (Опера, Опера) и (Футбол, Футбол)
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-600">
              🟣 Одно смешанное равновесие Нэша
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Game */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Интерактивная игра</CardTitle>
          <CardDescription>
            Выберите стратегии для обоих игроков и наблюдайте результат
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Игрок 1 (предпочитает Оперу):</p>
              <div className="flex gap-2">
                <Button
                  variant={player1Choice === 'opera' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer1Choice('opera')}
                >
                  🎭 Опера
                </Button>
                <Button
                  variant={player1Choice === 'football' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer1Choice('football')}
                >
                  ⚽ Футбол
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Игрок 2 (предпочитает Футбол):</p>
              <div className="flex gap-2">
                <Button
                  variant={player2Choice === 'opera' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer2Choice('opera')}
                >
                  🎭 Опера
                </Button>
                <Button
                  variant={player2Choice === 'football' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer2Choice('football')}
                >
                  ⚽ Футбол
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!player1Choice || !player2Choice}
            onClick={playRound}
          >
            Сыграть раунд
          </Button>

          {result && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="font-semibold text-center">Результат раунда {rounds.length}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">Игрок 1</div>
                  <div className="font-mono font-bold text-lg">{result.p1}</div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">Игрок 2</div>
                  <div className="font-mono font-bold text-lg">{result.p2}</div>
                </div>
              </div>
            </div>
          )}

          {rounds.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                <div>
                  Раундов: <strong>{rounds.length}</strong>
                </div>
                <div className="flex gap-4">
                  <span>Игрок 1 Σ: <strong className="font-mono">{totalP1}</strong></span>
                  <span>Игрок 2 Σ: <strong className="font-mono">{totalP2}</strong></span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetGame}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Сброс
                </Button>
              </div>

              {/* Rounds history */}
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Игрок 1</th>
                      <th className="p-2 text-left">Игрок 2</th>
                      <th className="p-2 text-right">Игрок 1 Σ</th>
                      <th className="p-2 text-right">Игрок 2 Σ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{r.player1Choice === 'opera' ? '🎭' : '⚽'}</td>
                        <td className="p-2">{r.player2Choice === 'opera' ? '🎭' : '⚽'}</td>
                        <td className="p-2 text-right font-mono">
                          {rounds.slice(0, i + 1).reduce((s, x) => s + x.player1Payoff, 0)}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {rounds.slice(0, i + 1).reduce((s, x) => s + x.player2Payoff, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mixed Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Смешанная стратегия
          </CardTitle>
          <CardDescription>
            Расчёт равновесия в смешанных стратегиях
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-3">
            <div className="font-semibold text-base">Смешанное равновесие Нэша</div>
            <div className="space-y-2">
              <div>
                <strong>Игрок 1</strong> выбирает Оперу с вероятностью p:
                <div className="mt-1 p-2 bg-background rounded font-mono text-xs">
                  E[Игрок2|Опера] = E[Игрок2|Футбол]<br />
                  2p + 0(1−p) = 0p + 3(1−p)<br />
                  2p = 3 − 3p<br />
                  5p = 3 → <strong>p = 3/5 = {mixedP1Opera.toFixed(2)}</strong>
                </div>
              </div>
              <div>
                <strong>Игрок 2</strong> выбирает Оперу с вероятностью q:
                <div className="mt-1 p-2 bg-background rounded font-mono text-xs">
                  E[Игрок1|Опера] = E[Игрок1|Футбол]<br />
                  3q + 0(1−q) = 0q + 2(1−q)<br />
                  3q = 2 − 2q<br />
                  5q = 2 → <strong>q = 2/5 = {mixedP2Opera.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <strong>Ожидаемые выигрыши в смешанном равновесии:</strong>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 bg-background rounded font-mono text-xs">
                  Игрок 1: 3 × {mixedP2Opera.toFixed(2)} = {mixedP1Expected.toFixed(2)}
                </div>
                <div className="p-2 bg-background rounded font-mono text-xs">
                  Игрок 2: 2 × {mixedP1Opera.toFixed(2)} = {mixedP2Expected.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Замечание:</strong> В смешанном равновесии ожидаемые выигрыши ({mixedP1Expected.toFixed(2)}, {mixedP2Expected.toFixed(2)})
            ниже, чем в любом из чистых равновесий Нэша ((3, 2) или (2, 3)). Это иллюстрирует
            координационную проблему: игрокам нужно согласовать свои действия, чтобы достичь
            более выгодного исхода для обоих.
          </div>
        </CardContent>
      </Card>

      {/* Theory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Анализ «Битвы полов»
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <strong>Чистые равновесия Нэша:</strong> (Опера, Опера) и (Футбол, Футбол).
            В обоих случаях игроки координируют свои действия, но распределение выигрышей
            неравномерно: один игрок получает больше.
          </div>
          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
            <strong>Смешанное равновесие:</strong> Каждый игрок рандомизирует с определённой
            вероятностью, делая оппонента безразличным к выбору. Это равновесие менее
            эффективно, чем чистые, но не требует координации.
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Проблема координации:</strong> Главный вопрос — как игрокам договориться
            о том, какое именно равновесие реализовать. В реальности социальные нормы,
            коммуникация и фокальные точки (точки Шеллинга) помогают решить эту проблему.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// HAWKS AND DOVES
// ═════════════════════════════════════════════════════════════════════════════

function HawksAndDoves() {
  const [V, setV] = useState(50)
  const [C, setC] = useState(100)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  // ESS: proportion of hawks = V/C (when V < C)
  const essProportion = C > 0 ? V / C : 1

  // Population simulation
  const [generations, setGenerations] = useState(20)
  const [populationData, setPopulationData] = useState<
    { generation: number; hawks: number; doves: number }[]
  >([])

  const runSimulation = useCallback(() => {
    const data: { generation: number; hawks: number; doves: number }[] = []
    let hawkProp = 0.5 // start with 50% hawks

    for (let gen = 0; gen < generations; gen++) {
      const doveProp = 1 - hawkProp

      // Fitness calculations:
      // Hawk meets Dove: Hawk gets V, Dove gets 0
      // Hawk meets Hawk: Each gets (V-C)/2
      // Dove meets Dove: Each gets V/2
      // Dove meets Hawk: Dove gets 0
      //
      // Fitness(Hawk) = hawkProp * (V-C)/2 + doveProp * V
      // Fitness(Dove) = doveProp * V/2

      const hawkFitness = hawkProp * (V - C) / 2 + doveProp * V
      const doveFitness = doveProp * V / 2

      const totalFitness = hawkProp * hawkFitness + doveProp * doveFitness

      // Replicator dynamics
      if (totalFitness > 0) {
        hawkProp = (hawkProp * hawkFitness) / totalFitness
      } else if (hawkFitness < doveFitness) {
        hawkProp = Math.max(0, hawkProp - 0.05)
      } else if (hawkFitness > doveFitness) {
        hawkProp = Math.min(1, hawkProp + 0.05)
      }

      // Clamp between 0 and 1
      hawkProp = Math.max(0, Math.min(1, hawkProp))

      data.push({
        generation: gen + 1,
        hawks: Math.round(hawkProp * 1000) / 10,
        doves: Math.round((1 - hawkProp) * 1000) / 10,
      })
    }

    setPopulationData(data)

    if (!gameTheoryXpEarned) {
      gameTheoryXpEarned = true
      addModuleInteraction({ moduleId: 'game-theory', action: 'play', xpEarned: MODULE_XP['game-theory'] })
    }
  }, [V, C, generations, addModuleInteraction])

  // Payoff matrix values
  const hawkVsHawk = (V - C) / 2
  const hawkVsDove = V
  const doveVsHawk = 0
  const doveVsDove = V / 2

  const isESSValid = V < C

  return (
    <div className="space-y-4">
      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Параметры игры
          </CardTitle>
          <CardDescription>
            Настройте ценность ресурса (V) и стоимость конфликта (C)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                V — Ценность ресурса
              </span>
              <span className="font-mono text-sm font-bold bg-muted px-2 py-0.5 rounded">
                {V}
              </span>
            </div>
            <Slider
              value={[V]}
              min={10}
              max={200}
              step={5}
              onValueChange={(val) => setV(val[0])}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                C — Стоимость конфликта
              </span>
              <span className="font-mono text-sm font-bold bg-muted px-2 py-0.5 rounded">
                {C}
              </span>
            </div>
            <Slider
              value={[C]}
              min={10}
              max={300}
              step={5}
              onValueChange={(val) => setC(val[0])}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {isESSValid ? (
              <Badge className="bg-green-600">
                V &lt; C → Эволюционно стабильная стратегия (ЭСС) существует
              </Badge>
            ) : (
              <Badge variant="destructive">
                V ≥ C → Ястребы доминируют, ЭСС = все ястребы
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payoff Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Матрица выигрышей
          </CardTitle>
          <CardDescription>
            Формат: (Выигрыш строки, Выигрыш столбца)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50" />
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <span>🛡️ Голубь</span>
                  </th>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <span>⚔️ Ястреб</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center font-medium">
                    🛡️ Голубь
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">({doveVsDove.toFixed(1)}, {doveVsDove.toFixed(1)})</div>
                    <div className="text-xs text-muted-foreground mt-1">Делят ресурс</div>
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">({doveVsHawk.toFixed(1)}, {hawkVsDove.toFixed(1)})</div>
                    <div className="text-xs text-muted-foreground mt-1">Ястреб забирает всё</div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center font-medium">
                    ⚔️ Ястреб
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">({hawkVsDove.toFixed(1)}, {doveVsHawk.toFixed(1)})</div>
                    <div className="text-xs text-muted-foreground mt-1">Ястреб забирает всё</div>
                  </td>
                  <td className={`border border-border p-2 sm:p-3 text-center ${
                    isESSValid ? 'bg-amber-500/10 border-2 border-amber-500/30' : 'bg-red-500/10 border-2 border-red-500/30'
                  }`}>
                    <div className="font-mono font-semibold">
                      ({hawkVsHawk.toFixed(1)}, {hawkVsHawk.toFixed(1)})
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isESSValid ? 'Драка (отрицательный выигрыш)' : 'Драка (но V≥C)'}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ESS Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Эволюционно стабильная стратегия (ЭСС)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div className={`p-4 rounded-lg border ${
            isESSValid ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
          }`}>
            {isESSValid ? (
              <>
                <div className="font-semibold text-base mb-2">
                  Смешанная ЭСС: доля ястребов = V/C
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-background rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Доля ястребов</div>
                    <div className="font-mono font-bold text-2xl">
                      {(essProportion * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Доля голубей</div>
                    <div className="font-mono font-bold text-2xl">
                      {((1 - essProportion) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">V / C</div>
                    <div className="font-mono font-bold text-2xl">
                      {essProportion.toFixed(3)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-background rounded font-mono text-xs">
                  Фитнес Ястреба = Фитнес Голубя<br />
                  p·(V−C)/2 + (1−p)·V = (1−p)·V/2<br />
                  p·(V−C)/2 + V − pV = V/2 − pV/2<br />
                  p(V−C)/2 − pV + pV/2 = V/2 − V<br />
                  p(V−C − 2V + V)/2 = −V/2<br />
                  p(−C)/2 = −V/2<br />
                  <strong>p = V/C = {essProportion.toFixed(3)}</strong>
                </div>
              </>
            ) : (
              <div>
                <div className="font-semibold text-base mb-2">
                  Чистая ЭСС: все ястребы
                </div>
                <p>
                  Когда V ≥ C, стратегия «Ястреб» доминирует: даже при встрече двух ястребов
                  ожидаемый выигрыш ({hawkVsHawk.toFixed(1)}) не хуже, чем у голубя
                  ({doveVsDove.toFixed(1)}). Популяция голубей не может вторгнуться.
                </p>
              </div>
            )}
          </div>

          {/* Dominant strategy note */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Доминирующая стратегия:</strong>{' '}
            {isESSValid ? (
              <span>
                Ни одна стратегия не доминирует строго. Это приводит к смешанной ЭСС,
                где обе стратегии сосуществуют в определённой пропорции.
              </span>
            ) : (
              <span>
                При данных параметрах Ястреб является доминирующей стратегией:
                даже в наихудшем случае (встреча с другим ястребом) выигрыш не хуже,
                чем у голубя.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Population Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Симуляция популяции</CardTitle>
          <CardDescription>
            Репликаторная динамика: начальная доля ястребов = 50%, {generations} поколений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Число поколений
              </span>
              <span className="font-mono text-sm font-bold bg-muted px-2 py-0.5 rounded">
                {generations}
              </span>
            </div>
            <Slider
              value={[generations]}
              min={5}
              max={100}
              step={5}
              onValueChange={(val) => setGenerations(val[0])}
            />
          </div>

          <Button className="w-full" size="lg" onClick={runSimulation}>
            🧬 Запустить симуляцию
          </Button>

          {populationData.length > 0 && (
            <div className="space-y-4">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={populationData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="generation"
                      fontSize={11}
                      label={{
                        value: 'Поколение',
                        position: 'insideBottom',
                        offset: -5,
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      fontSize={11}
                      domain={[0, 100]}
                      label={{
                        value: 'Доля (%)',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 5,
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}%`,
                        name,
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="hawks"
                      name="⚔️ Ястребы"
                      fill="#ef4444"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="doves"
                      name="🛡️ Голуби"
                      fill="#22c55e"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ESS convergence info */}
              {isESSValid && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm">
                  <strong>ЭСС достигнута:</strong> Доля ястребов стабилизируется около{' '}
                  <span className="font-mono font-bold">{(essProportion * 100).toFixed(1)}%</span>.
                  Начав с 50% ястребов, популяция сходится к равновесию,
                  где фитнес обеих стратегий одинаков.
                </div>
              )}

              {!isESSValid && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm">
                  <strong>Ястребы доминируют:</strong> Поскольку V ≥ C, доля ястребов
                  стремится к 100%. Стратегия «Голубь» не может выжить в популяции.
                </div>
              )}

              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">Ястребы (начало)</div>
                  <div className="font-mono font-bold">{populationData[0]?.hawks.toFixed(1)}%</div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">Голуби (начало)</div>
                  <div className="font-mono font-bold">{populationData[0]?.doves.toFixed(1)}%</div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">Ястребы (конец)</div>
                  <div className="font-mono font-bold">
                    {populationData[populationData.length - 1]?.hawks.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">Голуби (конец)</div>
                  <div className="font-mono font-bold">
                    {populationData[populationData.length - 1]?.doves.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Анализ эволюционной игры
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Модель «Ястребы и Голуби»</strong> (Maynard Smith &amp; Price, 1973) —
            первая эволюционная игра. Ястребы агрессивно борются за ресурс, голуби
            избегают конфликта. Результат встречи зависит от типа обоих участников.
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>ЭСС (Эволюционно стабильная стратегия):</strong> Стратегия, которая
            не может быть вытеснена никакой альтернативной стратегией при малом вторжении.
            Если V &lt; C, то смешанная стратегия с долей ястребов p* = V/C является ЭСС.
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Репликаторная динамика:</strong> Доля стратегии в популяции растёт,
            если её фитнес выше среднего по популяции. Это приводит к сходимости к ЭСС
            из любого начального состояния (кроме краевых случаев).
          </div>
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <strong>Практическое значение:</strong> Модель объясняет, почему агрессия
            не вытесняет сотрудничество в природе. Если стоимость конфликта (C) превышает
            ценность ресурса (V), популяция стабилизируется с долей «голубей».
            Это основа для понимания эволюции альтруизма и кооперации.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
