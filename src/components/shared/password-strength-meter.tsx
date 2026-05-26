import { Check, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { checkPasswordStrength } from '@/lib/password-strength'

interface PasswordStrengthMeterProps {
  password: string
  t: (key: string) => string
}

export function PasswordStrengthMeter({ password, t }: PasswordStrengthMeterProps) {
  if (!password) return null

  const strength = checkPasswordStrength(password)

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t('passwordStrength.label')}</span>
        <span className="text-xs font-medium">{t(strength.label)}</span>
      </div>
      <Progress
        value={(strength.score / 4) * 100}
        className={`h-1 ${strength.color}`}
      />

      <div className="grid grid-cols-2 gap-1 pt-1">
        {[
          { key: 'passwordStrength.minLength', met: strength.requirements.minLength },
          { key: 'passwordStrength.hasUpper', met: strength.requirements.hasUpper },
          { key: 'passwordStrength.hasLower', met: strength.requirements.hasLower },
          { key: 'passwordStrength.hasNumber', met: strength.requirements.hasNumber },
          { key: 'passwordStrength.hasSpecial', met: strength.requirements.hasSpecial },
        ].map(({ key, met }) => (
          <div key={key} className="flex items-center gap-1 text-xs">
            {met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
              {t(key)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
