/**
 * Migration script: Normalize UserProgress JSON fields into relational tables
 * Run with: node scripts/migrate-to-normalized.mjs
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = resolve(__dirname, '..', 'dev.db');

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({
  adapter,
  log: ['query'],
});

async function migrate() {
  console.log('🚀 Starting migration to normalized schema...\n');

  try {
    const allProgress = await prisma.userProgress.findMany({
      where: {
        OR: [
          { quizResults: { not: null } },
          { moduleHistory: { not: null } },
          { achievements: { not: null } },
          { settings: { not: null } },
        ],
      },
    });

    console.log(`📊 Found ${allProgress.length} UserProgress records with JSON data\n`);

    let totalQuizAttempts = 0;
    let totalModuleSessions = 0;
    let totalAchievements = 0;
    let totalSettings = 0;

    for (const progress of allProgress) {
      console.log(`🔄 Migrating user ${progress.userId}...`);

      if (progress.quizResults) {
        try {
          const quizArr = JSON.parse(progress.quizResults);
          if (Array.isArray(quizArr)) {
            for (const quiz of quizArr) {
              await prisma.quizAttempt.create({
                data: {
                  userProgressId: progress.id,
                  userId: progress.userId,
                  topic: quiz.topic || 'unknown',
                  score: quiz.score || 0,
                  total: quiz.total || 0,
                  accuracy: quiz.total > 0 ? (quiz.score / quiz.total) : 0,
                  date: new Date(quiz.date || Date.now()),
                  details: JSON.stringify(quiz),
                },
              });
              totalQuizAttempts++;
            }
          }
        } catch (e) {
          console.error(`  ❌ Failed to parse quizResults:`, e.message);
        }
      }

      if (progress.moduleHistory) {
        try {
          const moduleArr = JSON.parse(progress.moduleHistory);
          if (Array.isArray(moduleArr)) {
            for (const mod of moduleArr) {
              await prisma.moduleSession.create({
                data: {
                  userProgressId: progress.id,
                  userId: progress.userId,
                  moduleId: mod.moduleId || 'unknown',
                  action: mod.action || 'explore',
                  xpEarned: mod.xpEarned || 0,
                  date: new Date(mod.date || Date.now()),
                  details: JSON.stringify(mod),
                },
              });
              totalModuleSessions++;
            }
          }
        } catch (e) {
          console.error(`  ❌ Failed to parse moduleHistory:`, e.message);
        }
      }

      if (progress.achievements) {
        try {
          const achArr = JSON.parse(progress.achievements);
          if (Array.isArray(achArr)) {
            for (const ach of achArr) {
              const name = typeof ach === 'string' ? ach : ach.id || ach.name || 'unknown';
              const xpReward = typeof ach === 'object' ? (ach.xpReward || 0) : 0;
              
              await prisma.userAchievement.create({
                data: {
                  userProgressId: progress.id,
                  userId: progress.userId,
                  name,
                  xpReward,
                  unlockedAt: new Date(ach.unlockedAt || ach.date || Date.now()),
                  metadata: typeof ach === 'object' ? JSON.stringify(ach) : null,
                },
              });
              totalAchievements++;
            }
          }
        } catch (e) {
          console.error(`  ❌ Failed to parse achievements:`, e.message);
        }
      }

      if (progress.settings) {
        try {
          const settingsObj = JSON.parse(progress.settings);
          if (typeof settingsObj === 'object') {
            for (const [key, value] of Object.entries(settingsObj)) {
              await prisma.userSetting.create({
                data: {
                  userProgressId: progress.id,
                  userId: progress.userId,
                  key,
                  value: String(value),
                },
              });
              totalSettings++;
            }
          }
        } catch (e) {
          console.error(`  ❌ Failed to parse settings:`, e.message);
        }
      }

      console.log(`  ✅ Done\n`);
    }

    console.log('\n📋 Migration Summary:');
    console.log(`   - QuizAttempts created: ${totalQuizAttempts}`);
    console.log(`   - ModuleSessions created: ${totalModuleSessions}`);
    console.log(`   - UserAchievements created: ${totalAchievements}`);
    console.log(`   - UserSettings created: ${totalSettings}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
