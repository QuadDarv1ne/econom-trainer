'use client'

import { useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n-provider'
import { GraduationCap, Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  const { t } = useI18n()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-6xl font-bold">404</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/10 shadow-2xl shadow-primary/5 backdrop-blur-sm bg-card/95 text-center overflow-hidden">
          <CardHeader className="pb-4">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Search className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="text-7xl font-bold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent mb-2">
                404
              </CardTitle>
              <CardDescription className="text-base mt-2 max-w-sm mx-auto">
                {t('notFound.description')}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button asChild size="lg" className="w-full h-12 font-semibold relative overflow-hidden group">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  {t('notFound.backHome')}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button variant="outline" className="w-full h-11 interactive-scale" onClick={() => typeof window !== 'undefined' && window.history.length > 1 ? window.history.back() : window.location.href = '/'}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('notFound.goBack')}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
