-- CreateTable
CREATE TABLE "BalanceHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceHistory_userId_idx" ON "BalanceHistory"("userId");

-- AddForeignKey
ALTER TABLE "BalanceHistory" ADD CONSTRAINT "BalanceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
