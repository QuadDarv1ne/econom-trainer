'use client';

import { memo } from 'react';
import { useI18n } from '@/lib/i18n-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const flagLabels: Record<string, string> = {
  ru: 'RU',
  en: 'EN',
  zh: '中文',
};

export const LanguageToggle = memo(function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0 transition-all duration-200 hover:bg-primary/5">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('language.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[130px]">
        {(['ru', 'en', 'zh'] as const).map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className={`flex items-center justify-between cursor-pointer transition-colors ${locale === l ? 'bg-primary/10 text-primary font-medium' : ''}`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xs opacity-60">{flagLabels[l]}</span>
              <span>{t(`language.${l}`)}</span>
            </span>
            {locale === l && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Check className="h-4 w-4 text-primary" />
              </motion.span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});