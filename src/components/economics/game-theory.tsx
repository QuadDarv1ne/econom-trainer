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
import { useI18n } from '@/lib/i18n-provider'

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

// ─── Main Component ──────────────────────────────────────────────────────────

export function GameTheory() {
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            {t('gameTheory.title')}
          </CardTitle>
          <CardDescription>
            {t('gameTheory.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="prisoner" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="prisoner" className="flex-1 min-w-[140px] text-xs sm:text-sm">
            <Swords className="h-4 w-4 mr-1" />
            {t('gameTheory.tab.prisoner')}
          </TabsTrigger>
          <TabsTrigger value="battle" className="flex-1 min-w-[140px] text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1" />
            {t('gameTheory.tab.battle')}
          </TabsTrigger>
          <TabsTrigger value="hawks" className="flex-1 min-w-[140px] text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1" />
            {t('gameTheory.tab.hawks')}
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
  const { t } = useI18n()
  const [playerHistory, setPlayerHistory] = useState<PDChoice[]>([])
  const [rounds, setRounds] = useState<PDRound[]>([])
  const [aiStrategy, setAiStrategy] = useState<PDStrategy>('random')
  const [lastResult, setLastResult] = useState<{
    player: PDChoice
    ai: PDChoice
    playerPayoff: number
    aiPayoff: number
  } | null>(null)
  const [xpEarned, setXpEarned] = useState(false)
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

      if (!xpEarned) {
        setXpEarned(true)
        addModuleInteraction({ moduleId: 'game-theory', action: 'play', xpEarned: MODULE_XP['game-theory'] })
      }
    },
    [aiStrategy, playerHistory, addModuleInteraction, xpEarned]
  )

  const resetGame = useCallback(() => {
    setRounds([])
    setPlayerHistory([])
    setLastResult(null)
  }, [])

  const strategyLabels: Record<PDStrategy, string> = useMemo(() => ({
    random: t('gameTheory.strategy.random'),
    'always-defect': t('gameTheory.strategy.alwaysDefect'),
    'tit-for-tat': t('gameTheory.strategy.titForTat'),
  }), [t])

  return (
    <div className="space-y-4">
      {/* Payoff Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t('gameTheory.payoffMatrix')}
          </CardTitle>
          <CardDescription>
            {t('gameTheory.format')}
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
                      <Badge variant="outline" className="text-xs">{t('gameTheory.player2')}</Badge>
                      <span>{t('gameTheory.cooperate')}</span>
                    </div>
                  </th>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">{t('gameTheory.player2')}</Badge>
                      <span>{t('gameTheory.defect')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">{t('gameTheory.player1')}</Badge>
                      <span>{t('gameTheory.cooperate')}</span>
                    </div>
                  </td>
                  <td className="border-2 border-border p-2 sm:p-3 text-center bg-green-500/10 border-green-500/30">
                    <div className="font-mono font-semibold">(-1, -1)</div>
                    <Badge className="mt-1 bg-green-600 text-xs">{t('gameTheory.paretoOptimum')}</Badge>
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">(-10, 0)</div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">{t('gameTheory.player1')}</Badge>
                      <span>{t('gameTheory.defect')}</span>
                    </div>
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">(0, -10)</div>
                  </td>
                  <td className="border-2 border-border p-2 sm:p-3 text-center bg-amber-500/10 border-amber-500/30">
                    <div className="font-mono font-semibold">(-5, -5)</div>
                    <Badge className="mt-1 bg-amber-600 text-xs">{t('gameTheory.nashEquilibrium')}</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              {t('gameTheory.nashMutualDefect')}
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-600">
              {t('gameTheory.paretoMutualCoop')}
            </Badge>
            <Badge variant="outline" className="border-red-500 text-red-600">
              {t('gameTheory.dominantDefect')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Game */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('gameTheory.playAgainstAI')}</CardTitle>
          <CardDescription>
            {t('gameTheory.aiStrategyDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('gameTheory.aiStrategy')}</p>
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
              {t('gameTheory.cooperate')}
            </Button>
            <Button
              className="flex-1 h-14 text-base"
              variant="outline"
              onClick={() => playRound('defect')}
            >
              {t('gameTheory.defect')}
            </Button>
          </div>

          {/* Last result */}
          {lastResult && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="font-semibold text-center">{t('gameTheory.roundResult')} {rounds.length}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">{t('gameTheory.yourChoice')}</div>
                  <div className="font-semibold">
                    {lastResult.player === 'cooperate' ? t('gameTheory.cooperation') : t('gameTheory.betrayal')}
                  </div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">{t('gameTheory.aiChoice')}</div>
                  <div className="font-semibold">
                    {lastResult.ai === 'cooperate' ? t('gameTheory.cooperation') : t('gameTheory.betrayal')}
                  </div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">{t('gameTheory.yourPayoff')}</div>
                  <div className="font-mono font-bold text-lg">{lastResult.playerPayoff}</div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">{t('gameTheory.aiPayoff')}</div>
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
                  <span className="text-muted-foreground">{t('gameTheory.rounds')}</span>{' '}
                  <span className="font-bold">{rounds.length}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('gameTheory.you:')}</span>{' '}
                    <span className="font-mono font-bold">{totalPlayerScore}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('gameTheory.ai:')}</span>{' '}
                    <span className="font-mono font-bold">{totalAIScore}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetGame}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {t('gameTheory.reset')}
                </Button>
              </div>

              {/* Rounds history */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">{t('gameTheory.history.number')}</th>
                      <th className="p-2 text-left">{t('gameTheory.history.you')}</th>
                      <th className="p-2 text-left">{t('gameTheory.history.ai')}</th>
                      <th className="p-2 text-right">{t('gameTheory.history.yourSum')}</th>
                      <th className="p-2 text-right">{t('gameTheory.history.aiSum')}</th>
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
            {t('gameTheory.prisonerAnalysis.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <strong>{t('gameTheory.prisonerAnalysis.nash')}</strong>
          </div>
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <strong>{t('gameTheory.prisonerAnalysis.pareto')}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.prisonerAnalysis.paradox')}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.prisonerAnalysis.titForTat')}</strong>
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
  const { t } = useI18n()
  const [player1Choice, setPlayer1Choice] = useState<BotSChoice | null>(null)
  const [player2Choice, setPlayer2Choice] = useState<BotSChoice | null>(null)
  const [result, setResult] = useState<{
    p1: number
    p2: number
  } | null>(null)

  const [rounds, setRounds] = useState<BotSRound[]>([])
  const [xpEarned, setXpEarned] = useState(false)
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

    if (!xpEarned) {
      setXpEarned(true)
      addModuleInteraction({ moduleId: 'game-theory', action: 'play', xpEarned: MODULE_XP['game-theory'] })
    }
  }, [player1Choice, player2Choice, addModuleInteraction, xpEarned])

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
            {t('gameTheory.payoffMatrix')}
          </CardTitle>
          <CardDescription>
            {t('gameTheory.battleDesc')}
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
                      <Badge variant="outline" className="text-xs">{t('gameTheory.player2')}</Badge>
                      <span>{t('gameTheory.opera')}</span>
                    </div>
                  </th>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="text-xs">{t('gameTheory.player2')}</Badge>
                      <span>{t('gameTheory.football')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(['opera', 'football'] as BotSChoice[]).map((p1) => (
                  <tr key={p1}>
                    <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="outline" className="text-xs">{t('gameTheory.player1')}</Badge>
                        <span>{p1 === 'opera' ? t('gameTheory.opera') : t('gameTheory.football')}</span>
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
                              {t('gameTheory.nashEquilibrium')}
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
              {t('gameTheory.nashEquilibrium')}: ({t('gameTheory.opera')}, {t('gameTheory.opera')}), ({t('gameTheory.football')}, {t('gameTheory.football')})
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-600">
              {t('gameTheory.mixedStrategy')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Game */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('gameTheory.interactiveGame')}</CardTitle>
          <CardDescription>
            {t('gameTheory.battleGameDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('gameTheory.player1Pref')}</p>
              <div className="flex gap-2">
                <Button
                  variant={player1Choice === 'opera' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer1Choice('opera')}
                >
                  {t('gameTheory.opera')}
                </Button>
                <Button
                  variant={player1Choice === 'football' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer1Choice('football')}
                >
                  {t('gameTheory.football')}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('gameTheory.player2Pref')}</p>
              <div className="flex gap-2">
                <Button
                  variant={player2Choice === 'opera' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer2Choice('opera')}
                >
                  {t('gameTheory.opera')}
                </Button>
                <Button
                  variant={player2Choice === 'football' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPlayer2Choice('football')}
                >
                  {t('gameTheory.football')}
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
            {t('gameTheory.playRound')}
          </Button>

          {result && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="font-semibold text-center">{t('gameTheory.roundResult')} {rounds.length}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">{t('gameTheory.player1')}</div>
                  <div className="font-mono font-bold text-lg">{result.p1}</div>
                </div>
                <div className="p-2 bg-background rounded text-center">
                  <div className="text-muted-foreground text-xs">{t('gameTheory.player2')}</div>
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
                  {t('gameTheory.rounds')} <strong>{rounds.length}</strong>
                </div>
                <div className="flex gap-4">
                  <span>{t('gameTheory.player1')} Σ: <strong className="font-mono">{totalP1}</strong></span>
                  <span>{t('gameTheory.player2')} Σ: <strong className="font-mono">{totalP2}</strong></span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetGame}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {t('gameTheory.reset')}
                </Button>
              </div>

              {/* Rounds history */}
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">{t('gameTheory.history.number')}</th>
                      <th className="p-2 text-left">{t('gameTheory.player1')}</th>
                      <th className="p-2 text-left">{t('gameTheory.player2')}</th>
                      <th className="p-2 text-right">{t('gameTheory.player1')} Σ</th>
                      <th className="p-2 text-right">{t('gameTheory.player2')} Σ</th>
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
            {t('gameTheory.mixedStrategy')}
          </CardTitle>
          <CardDescription>
            {t('gameTheory.mixedStrategyDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-3">
            <div className="font-semibold text-base">{t('gameTheory.mixedStrategy')}</div>
            <div className="space-y-2">
              <div>
                <strong>{t('gameTheory.player1')}</strong> {t('gameTheory.opera')}:
                <div className="mt-1 p-2 bg-background rounded font-mono text-xs">
                  E[{t('gameTheory.player2')}|{t('gameTheory.opera')}] = E[{t('gameTheory.player2')}|{t('gameTheory.football')}]<br />
                  2p + 0(1−p) = 0p + 3(1−p)<br />
                  2p = 3 − 3p<br />
                  5p = 3 → <strong>p = 3/5 = {mixedP1Opera.toFixed(2)}</strong>
                </div>
              </div>
              <div>
                <strong>{t('gameTheory.player2')}</strong> {t('gameTheory.opera')}:
                <div className="mt-1 p-2 bg-background rounded font-mono text-xs">
                  E[{t('gameTheory.player1')}|{t('gameTheory.opera')}] = E[{t('gameTheory.player1')}|{t('gameTheory.football')}]<br />
                  3q + 0(1−q) = 0q + 2(1−q)<br />
                  3q = 2 − 2q<br />
                  5q = 2 → <strong>q = 2/5 = {mixedP2Opera.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <strong>{t('gameTheory.expectedPayoffs')}</strong>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 bg-background rounded font-mono text-xs">
                  {t('gameTheory.player1')}: 3 × {mixedP2Opera.toFixed(2)} = {mixedP1Expected.toFixed(2)}
                </div>
                <div className="p-2 bg-background rounded font-mono text-xs">
                  {t('gameTheory.player2')}: 2 × {mixedP1Opera.toFixed(2)} = {mixedP2Expected.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.note')}</strong>{' '}
            {t('gameTheory.note.mixedPayoffs')
              .replace('{p1}', mixedP1Expected.toFixed(2))
              .replace('{p2}', mixedP2Expected.toFixed(2))}
          </div>
        </CardContent>
      </Card>

      {/* Theory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t('gameTheory.battleAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <strong>{t('gameTheory.battleAnalysis.pure')}</strong>
          </div>
          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
            <strong>{t('gameTheory.battleAnalysis.mixed')}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.battleAnalysis.coordination')}</strong>
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
  const { t } = useI18n()
  const [V, setV] = useState(50)
  const [C, setC] = useState(100)
  const [xpEarned, setXpEarned] = useState(false)
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

    if (!xpEarned) {
      setXpEarned(true)
      addModuleInteraction({ moduleId: 'game-theory', action: 'play', xpEarned: MODULE_XP['game-theory'] })
    }
  }, [V, C, generations, addModuleInteraction, xpEarned])

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
            {t('gameTheory.gameParams')}
          </CardTitle>
          <CardDescription>
            {t('gameTheory.paramsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('gameTheory.resourceValue')}
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
                {t('gameTheory.conflictCost')}
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
                {t('gameTheory.essExists')}
              </Badge>
            ) : (
              <Badge variant="destructive">
                {t('gameTheory.hawksDominate')}
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
            {t('gameTheory.payoffMatrix')}
          </CardTitle>
          <CardDescription>
            {t('gameTheory.format')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50" />
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <span>{t('gameTheory.dove')}</span>
                  </th>
                  <th className="border border-border p-2 sm:p-3 bg-muted/50 text-center">
                    <span>{t('gameTheory.hawk')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center font-medium">
                    {t('gameTheory.dove')}
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">({doveVsDove.toFixed(1)}, {doveVsDove.toFixed(1)})</div>
                    <div className="text-xs text-muted-foreground mt-1">{t('gameTheory.shareResource')}</div>
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">({doveVsHawk.toFixed(1)}, {hawkVsDove.toFixed(1)})</div>
                    <div className="text-xs text-muted-foreground mt-1">{t('gameTheory.hawkTakesAll')}</div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-border p-2 sm:p-3 bg-muted/50 text-center font-medium">
                    {t('gameTheory.hawk')}
                  </td>
                  <td className="border border-border p-2 sm:p-3 text-center">
                    <div className="font-mono font-semibold">({hawkVsDove.toFixed(1)}, {doveVsHawk.toFixed(1)})</div>
                    <div className="text-xs text-muted-foreground mt-1">{t('gameTheory.hawkTakesAll')}</div>
                  </td>
                  <td className={`border border-border p-2 sm:p-3 text-center ${
                    isESSValid ? 'bg-amber-500/10 border-2 border-amber-500/30' : 'bg-red-500/10 border-2 border-red-500/30'
                  }`}>
                    <div className="font-mono font-semibold">
                      ({hawkVsHawk.toFixed(1)}, {hawkVsHawk.toFixed(1)})
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isESSValid ? t('gameTheory.fightNegative') : t('gameTheory.fightButVC')}
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
          <CardTitle className="text-lg">{t('gameTheory.essTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div className={`p-4 rounded-lg border ${
            isESSValid ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
          }`}>
            {isESSValid ? (
              <>
                <div className="font-semibold text-base mb-2">
                  {t('gameTheory.mixedESS')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-background rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">{t('gameTheory.hawkShare')}</div>
                    <div className="font-mono font-bold text-2xl">
                      {(essProportion * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">{t('gameTheory.doveShare')}</div>
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
                  {t('gameTheory.player1')} = {t('gameTheory.player2')}<br />
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
                  {t('gameTheory.pureESS')}
                </div>
                <p>
                  {t('gameTheory.pureESSDesc')}
                </p>
              </div>
            )}
          </div>

          {/* Dominant strategy note */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.dominantStrategy')}</strong>{' '}
            {isESSValid ? (
              <span>
                {t('gameTheory.dominantStrategyNote.mixed')}
              </span>
            ) : (
              <span>
                {t('gameTheory.dominantStrategyNote.pure')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Population Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('gameTheory.populationSim')}</CardTitle>
          <CardDescription>
            {t('gameTheory.replicatorDesc').replace('{generations}', String(generations))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('gameTheory.generations')}
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
            {t('gameTheory.runSimulation')}
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
                        value: t('gameTheory.generation'),
                        position: 'insideBottom',
                        offset: -5,
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      fontSize={11}
                      domain={[0, 100]}
                      label={{
                        value: t('gameTheory.sharePercent'),
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
                      name={t('gameTheory.hawks')}
                      fill="#ef4444"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="doves"
                      name={t('gameTheory.doves')}
                      fill="#22c55e"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ESS convergence info */}
              {isESSValid && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm">
                  <strong>{t('gameTheory.essReached')}</strong>{' '}
                  <span className="font-mono font-bold">{(essProportion * 100).toFixed(1)}%</span>.
                  {' '}
                  {t('gameTheory.essReachedDesc').replace('{percent}', (essProportion * 100).toFixed(1))}
                </div>
              )}

              {!isESSValid && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm">
                  <strong>{t('gameTheory.hawksDominateSim')}</strong>{' '}
                  {t('gameTheory.hawksDominateDesc')}
                </div>
              )}

              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">{t('gameTheory.hawksStart')}</div>
                  <div className="font-mono font-bold">{populationData[0]?.hawks.toFixed(1)}%</div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">{t('gameTheory.dovesStart')}</div>
                  <div className="font-mono font-bold">{populationData[0]?.doves.toFixed(1)}%</div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">{t('gameTheory.hawksEnd')}</div>
                  <div className="font-mono font-bold">
                    {populationData[populationData.length - 1]?.hawks.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded text-center">
                  <div className="text-xs text-muted-foreground">{t('gameTheory.dovesEnd')}</div>
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
            {t('gameTheory.evolutionAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.evolutionAnalysis.model')}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.evolutionAnalysis.ess')}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('gameTheory.evolutionAnalysis.replicator')}</strong>
          </div>
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <strong>{t('gameTheory.evolutionAnalysis.practical')}</strong>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
