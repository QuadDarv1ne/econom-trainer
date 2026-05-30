-- Create QuizAttempt table
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "accuracy" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "userProgressId" TEXT NOT NULL,
    CONSTRAINT "QuizAttempt_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ModuleSession table
CREATE TABLE "ModuleSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" REAL,
    "duration" INTEGER,
    "details" TEXT,
    "userProgressId" TEXT NOT NULL,
    CONSTRAINT "ModuleSession_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create UserAchievement table
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "userProgressId" TEXT NOT NULL,
    CONSTRAINT "UserAchievement_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create UserSetting table
CREATE TABLE "UserSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProgressId" TEXT NOT NULL,
    CONSTRAINT "UserSetting_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for QuizAttempt
CREATE INDEX "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");
CREATE INDEX "QuizAttempt_topic_idx" ON "QuizAttempt"("topic");
CREATE INDEX "QuizAttempt_date_idx" ON "QuizAttempt"("date");
CREATE INDEX "QuizAttempt_accuracy_idx" ON "QuizAttempt"("accuracy");

-- Create indexes for ModuleSession
CREATE INDEX "ModuleSession_userId_idx" ON "ModuleSession"("userId");
CREATE INDEX "ModuleSession_moduleId_idx" ON "ModuleSession"("moduleId");
CREATE INDEX "ModuleSession_date_idx" ON "ModuleSession"("date");
CREATE INDEX "ModuleSession_xpEarned_idx" ON "ModuleSession"("xpEarned");

-- Create indexes for UserAchievement
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE INDEX "UserAchievement_name_idx" ON "UserAchievement"("name");
CREATE INDEX "UserAchievement_unlockedAt_idx" ON "UserAchievement"("unlockedAt");

-- Create indexes for UserSetting
CREATE INDEX "UserSetting_userId_idx" ON "UserSetting"("userId");
CREATE UNIQUE INDEX "UserSetting_userProgressId_key_key" ON "UserSetting"("userProgressId", "key");
