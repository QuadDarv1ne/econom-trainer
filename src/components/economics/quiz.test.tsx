import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EconomicsQuiz } from './quiz'

const mockAddQuizResult = vi.fn()
const mockToast = vi.fn()

vi.mock('@/store/economics-store', () => ({
  useEconomicsStore: (selector?: (s: any) => any) => {
    const state = {
      addQuizResult: mockAddQuizResult,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock('@/lib/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'quiz.economicTheoryTitle': 'Экономическая теория',
        'quiz.description': 'Проверьте свои знания',
        'quiz.questionsInBank': 'вопросов в базе',
        'quiz.questionsInQuiz': 'вопросов в тесте',
        'quiz.secondsSuffix': 'с',
        'quiz.perQuestion': 'на вопрос',
        'quiz.startQuiz': 'Начать тест',
        'quiz.resultsTitle': 'Результаты',
        'quiz.finishedTitle': 'Тест завершён',
        'quiz.finishedDescription': 'Ваш результат:',
        'quiz.of': 'из',
        'quiz.topicEconomicTheory': 'Экономическая теория',
        'quiz.nextQuestion': 'Следующий вопрос',
        'quiz.showResults': 'Показать результаты',
        'quiz.questionOf': 'Вопрос {current}/{total}',
        'quiz.difficultyEasy': 'Лёгкий',
        'quiz.difficultyMedium': 'Средний',
        'quiz.difficultyHard': 'Сложный',
        'quiz.correctExclamation': 'Верно!',
        'quiz.incorrectExclamation': 'Неверно!',
        'quiz.correctAnswer': 'Правильный ответ:',
        'quiz.correctAnswers': 'Правильных ответов',
        'quiz.excellent': 'Отлично!',
        'quiz.good': 'Хорошо',
        'quiz.needsImprovement': 'Нужно улучшить',
        'quiz.playAgain': 'Сыграть снова',
      }
      return map[key] || key
    },
    locale: 'ru',
  }),
}))

describe('Quiz question bank', () => {
  it('renders idle state with start button', () => {
    render(<EconomicsQuiz />)
    expect(screen.getByText('Экономическая теория')).toBeDefined()
    expect(screen.getByText('Проверьте свои знания')).toBeDefined()
    expect(screen.getByText('Начать тест')).toBeDefined()
  })

  it('shows question count of at least 50 in idle state', () => {
    render(<EconomicsQuiz />)
    const countElements = screen.getAllByText(/\d+/)
    const bankSize = countElements.find((el) => parseInt(el.textContent || '0') >= 45)
    expect(bankSize).toBeDefined()
    expect(parseInt(bankSize!.textContent || '0')).toBeGreaterThanOrEqual(95)
  })

  it('shows 10 questions per quiz', () => {
    render(<EconomicsQuiz />)
    const countElements = screen.getAllByText('10')
    expect(countElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows 30 seconds per question', () => {
    render(<EconomicsQuiz />)
    expect(screen.getByText('30с')).toBeDefined()
    expect(screen.getByText('на вопрос')).toBeDefined()
  })
})

describe('Quiz gameplay', () => {
  beforeEach(() => {
    mockAddQuizResult.mockClear()
    mockToast.mockClear()
  })

  it('starts quiz when start button is clicked', async () => {
    const user = userEvent.setup()
    render(<EconomicsQuiz />)

    await user.click(screen.getByText('Начать тест'))

    expect(screen.queryByText('Начать тест')).toBeNull()
  })

  it('shows a question after starting', async () => {
    const user = userEvent.setup()
    render(<EconomicsQuiz />)

    await user.click(screen.getByText('Начать тест'))

    const radioGroup = document.querySelector('[role="radiogroup"]')
    expect(radioGroup).not.toBeNull()
  })

  it('shows 4 answer options per question', async () => {
    const user = userEvent.setup()
    render(<EconomicsQuiz />)

    await user.click(screen.getByText('Начать тест'))

    const radioItems = document.querySelectorAll('[role="radio"]')
    expect(radioItems.length).toBe(4)
  })

  it('progresses to next question after answering', async () => {
    const user = userEvent.setup()
    render(<EconomicsQuiz />)

    await user.click(screen.getByText('Начать тест'))

    const radioItems = document.querySelectorAll('[role="radio"]')
    await user.click(radioItems[0])

    expect(screen.getByText('Следующий вопрос')).toBeDefined()

    await user.click(screen.getByText('Следующий вопрос'))

    const radioItems2 = document.querySelectorAll('[role="radio"]')
    expect(radioItems2.length).toBe(4)
  })

  it('completes full quiz of 10 questions', async () => {
    const user = userEvent.setup()
    render(<EconomicsQuiz />)

    await user.click(screen.getByText('Начать тест'))

    for (let q = 0; q < 10; q++) {
      const items = document.querySelectorAll('[role="radio"]')
      expect(items.length).toBe(4)
      await user.click(items[0])

      if (q < 9) {
        const nextBtn = screen.getByText('Следующий вопрос')
        await user.click(nextBtn)
      } else {
        const resultsBtn = screen.getByText('Показать результаты')
        await user.click(resultsBtn)
      }
    }

    expect(mockAddQuizResult).toHaveBeenCalled()
  })
})
