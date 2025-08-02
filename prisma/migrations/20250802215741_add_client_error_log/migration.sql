-- CreateTable
CREATE TABLE "ClientErrorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "pathname" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
