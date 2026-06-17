'use client'

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

const shortcuts = [
  { keys: ['/'], desc: 'shortcuts.search' },
  { keys: ['?'], desc: 'shortcuts.help' },
  { keys: ['Esc'], desc: 'shortcuts.close' },
  { keys: ['1'], desc: 'shortcuts.answer1' },
  { keys: ['2'], desc: 'shortcuts.answer2' },
  { keys: ['3'], desc: 'shortcuts.answer3' },
  { keys: ['4'], desc: 'shortcuts.answer4' },
  { keys: ['⌘K', 'Ctrl+K'], desc: 'shortcuts.searchFocus' },
]

export const KeyboardShortcutsDialog = memo(function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex items-center justify-center group sm:flex hidden"
        aria-label={t('shortcuts.title') || 'Keyboard shortcuts'}
        title={t('shortcuts.title') || 'Keyboard shortcuts'}
      >
        <Keyboard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  {t('shortcuts.title') || 'Keyboard Shortcuts'}
                </DialogTitle>
                <DialogDescription>
                  {t('shortcuts.description') || 'Available keyboard shortcuts'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {shortcuts.map((shortcut) => (
                  <motion.div
                    key={shortcut.desc}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {t(shortcut.desc) || shortcut.desc}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={key}>
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border/50 shadow-sm">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground/40 mx-0.5 text-xs">{t('shortcuts.or') || 'or'}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  {t('shortcuts.gotIt') || 'Got it'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
})
