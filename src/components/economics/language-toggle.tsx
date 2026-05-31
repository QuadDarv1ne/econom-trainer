'use client';

import { useI18n } from '@/lib/i18n-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('language.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale('ru')} className={locale === 'ru' ? 'font-bold' : ''}>
          {t('language.ru')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('en')} className={locale === 'en' ? 'font-bold' : ''}>
          {t('language.en')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('zh')} className={locale === 'zh' ? 'font-bold' : ''}>
          {t('language.zh')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}