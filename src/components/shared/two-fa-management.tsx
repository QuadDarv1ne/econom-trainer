'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { PasswordInput } from '@/components/ui/password-input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Shield, QrCode, Copy, Check, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'
import { safeErrorMessage } from '@/lib/safe-error'
import { COPY_FEEDBACK_MS } from '@/lib/constants'

interface TwoFAManagementProps {
  twoFactorEnabled: boolean
  onTwoFactorChange: (enabled: boolean) => void
  setError: (msg: string) => void
  setSuccess: (msg: string) => void
}

export function TwoFAManagement({ twoFactorEnabled, onTwoFactorChange, setError, setSuccess }: TwoFAManagementProps) {
  const { t } = useI18n()

  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [settingUp2FA, setSettingUp2FA] = useState(false)
  const [verifying2FA, setVerifying2FA] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [disabling2FA, setDisabling2FA] = useState(false)

  useEffect(() => {
    if (!copiedCode) return
    const timer = setTimeout(() => setCopiedCode(false), COPY_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copiedCode])

  async function setup2FA() {
    setSettingUp2FA(true)
    setError('')

    try {
      const res = await fetch('/api/auth/two-factor/setup', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setShowQR(true)
      } else {
        setError(safeErrorMessage(data, t('auth.error.serverError')))
      }
    } catch {
      setError(t('auth.error.2faSetupError'))
    } finally {
      setSettingUp2FA(false)
    }
  }

  async function verify2FA() {
    setVerifying2FA(true)
    setError('')

    try {
      const res = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode }),
      })

      const data = await res.json()

      if (res.ok) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        setShowQR(false)
        onTwoFactorChange(true)
      } else {
        setError(safeErrorMessage(data, t('auth.error.serverError')))
      }
    } catch {
      setError(t('auth.error.2faVerifyError'))
    } finally {
      setVerifying2FA(false)
    }
  }

  async function disable2FA() {
    setDisabling2FA(true)
    setError('')
    try {
      const res = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setQrCode('')
        setSecret('')
        setBackupCodes([])
        setTwoFactorCode('')
        setShowQR(false)
        setShowBackupCodes(false)
        setDisablePassword('')
        onTwoFactorChange(false)
        setSuccess(t('dashboard.security.disabled'))
      } else {
        setError(safeErrorMessage(data, t('auth.error.serverError')))
      }
    } catch {
      setError(t('auth.error.2faDisableError'))
    } finally {
      setDisabling2FA(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('dashboard.security.title')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.security.desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {twoFactorEnabled ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {t('dashboard.security.enabled')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="disable-2fa-password">{t('profile.password')}</Label>
              <PasswordInput
                id="disable-2fa-password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder={t('auth.login.password')}
              />
            </div>

            <Button variant="destructive" onClick={disable2FA} disabled={disabling2FA || !disablePassword}>
              {disabling2FA ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.login.loading')}</> : t('dashboard.security.disable')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('dashboard.security.warning')}
              </AlertDescription>
            </Alert>

            {!showQR && (
              <Button onClick={setup2FA} disabled={settingUp2FA}>
                {settingUp2FA ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                {t('dashboard.security.setup')}
              </Button>
            )}

            {showQR && (
              <div className="space-y-4 pt-4">
                <Separator />
                <div className="text-center space-y-2">
                  <h4 className="font-semibold">{t('dashboard.security.scanQr')}</h4>
                  <div className="inline-block p-4 bg-white rounded-lg">
                    <img src={qrCode} alt={t('dashboard.security.qrCodeAlt') || 'QR Code'} className="w-48 h-48" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">{t('dashboard.security.manualEntry')}</h4>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono">{secret}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(secret)
                        setCopiedCode(true)
                      }}
                    >
                      {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">{t('dashboard.security.enterCode')}</h4>
                  <div className="flex flex-col gap-2">
                    <InputOTP
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={setTwoFactorCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <Button onClick={verify2FA} disabled={verifying2FA} className="self-start">
                      {verifying2FA ? <Loader2 className="h-4 w-4 animate-spin" /> : t('dashboard.security.verify')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {showBackupCodes && (
              <div className="space-y-4 pt-4">
                <Separator />
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    <strong>{t('dashboard.security.saveCodes')}</strong>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-muted px-3 py-2 rounded"
                    >
                      <code className="font-mono text-sm">{code}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(code)
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={() => setShowBackupCodes(false)}>
                  {t('dashboard.security.savedCodes')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
