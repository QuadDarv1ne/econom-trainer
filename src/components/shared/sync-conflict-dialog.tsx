"use client";

import { type SyncConflict, getLevelTitle } from "@/store/economics-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n-provider";

interface SyncConflictDialogProps {
  conflict: SyncConflict;
  onResolve: (choice: "keep-client" | "keep-server") => void;
  onForceSync?: () => void;
}

export function SyncConflictDialog({ conflict, onResolve, onForceSync }: SyncConflictDialogProps) {
  const { t } = useI18n();
  const open = conflict !== null;

  const handleKeepClient = () => {
    onResolve("keep-client");
    if (onForceSync) onForceSync();
  };

  const handleKeepServer = () => {
    onResolve("keep-server");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>{t("offline.syncErrorTitle")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("offline.syncCheckConnection")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-muted-foreground">{t("dashboard.progress.synced")}</p>
              <p className="text-2xl font-bold">{conflict.clientXP} XP</p>
              <p className="text-muted-foreground">
                {getLevelTitle(conflict.clientLevel)} ({conflict.clientLevel})
              </p>
            </div>

            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />

            <div className="text-center">
              <p className="font-medium text-muted-foreground">{t("dashboard.progress.sync")}</p>
              <p className="text-2xl font-bold">{conflict.serverXP} XP</p>
              <p className="text-muted-foreground">
                {getLevelTitle(conflict.serverLevel)} ({conflict.serverLevel})
              </p>
            </div>
          </div>

          <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">{t("offline.syncError")}</p>
            <p className="mt-1 text-muted-foreground">
              Discrepancy: {conflict.discrepancy} XP. This may happen if you use multiple devices.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleKeepServer}>
            {t("offline.reload")}
          </Button>
          <Button onClick={handleKeepClient}>
            {t("offline.syncBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
