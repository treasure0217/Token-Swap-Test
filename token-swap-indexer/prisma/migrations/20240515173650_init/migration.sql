-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Active', 'Cancelled', 'Filled');

-- CreateTable
CREATE TABLE "Order" (
    "id" VARCHAR(66) NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "seller" VARCHAR(42) NOT NULL,
    "tokenA" VARCHAR(42) NOT NULL,
    "tokenB" VARCHAR(42) NOT NULL,
    "amountA" TEXT NOT NULL,
    "amountB" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderFill" (
    "id" BIGSERIAL NOT NULL,
    "buyer" VARCHAR(42) NOT NULL,
    "amountA" TEXT NOT NULL,
    "amountB" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" VARCHAR(66) NOT NULL,

    CONSTRAINT "OrderFill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderFill" ADD CONSTRAINT "OrderFill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
