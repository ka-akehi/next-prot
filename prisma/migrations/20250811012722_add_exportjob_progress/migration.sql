-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filePath" TEXT,
    "error" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ExportJob" ("createdAt", "error", "filePath", "id", "status", "updatedAt") SELECT "createdAt", "error", "filePath", "id", "status", "updatedAt" FROM "ExportJob";
DROP TABLE "ExportJob";
ALTER TABLE "new_ExportJob" RENAME TO "ExportJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
