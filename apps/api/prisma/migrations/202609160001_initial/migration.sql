-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'OPERATIONS', 'ADMIN');

-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TravelerKind" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('VNPAY', 'MOMO', 'ZALOPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'SUCCEEDED', 'FAILED', 'REFUND_REQUIRED', 'REFUNDED');

-- CreateTable
CREATE TABLE "NGUOI_DUNG" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NGUOI_DUNG_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TOUR" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "destination" VARCHAR(100) NOT NULL,
    "countryCode" CHAR(2) NOT NULL DEFAULT 'VN',
    "durationDays" INTEGER NOT NULL,
    "status" "TourStatus" NOT NULL DEFAULT 'DRAFT',
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TOUR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LICH_KHOI_HANH" (
    "id" UUID NOT NULL,
    "tourId" UUID NOT NULL,
    "departureAt" TIMESTAMPTZ(3) NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "reservedSeats" INTEGER NOT NULL DEFAULT 0,
    "adultPrice" BIGINT NOT NULL,
    "childPrice" BIGINT NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "LICH_KHOI_HANH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DON_DAT_TOUR" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "tourTitle" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "cancelReason" TEXT,
    "seatsReleasedAt" TIMESTAMPTZ(3),
    "timeoutEnqueuedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DON_DAT_TOUR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CHI_TIET_DAT_TOUR" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "kind" "TravelerKind" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "lineTotal" BIGINT NOT NULL,

    CONSTRAINT "CHI_TIET_DAT_TOUR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "THANH_TOAN" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerReference" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "refundedAt" TIMESTAMPTZ(3),
    "refundReference" TEXT,

    CONSTRAINT "THANH_TOAN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NGUOI_DUNG_email_key" ON "NGUOI_DUNG"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_familyId_idx" ON "RefreshSession"("userId", "familyId");

-- CreateIndex
CREATE UNIQUE INDEX "TOUR_slug_key" ON "TOUR"("slug");

-- CreateIndex
CREATE INDEX "TOUR_status_destination_idx" ON "TOUR"("status", "destination");

-- CreateIndex
CREATE INDEX "LICH_KHOI_HANH_tourId_departureAt_idx" ON "LICH_KHOI_HANH"("tourId", "departureAt");

-- CreateIndex
CREATE INDEX "DON_DAT_TOUR_status_expiresAt_idx" ON "DON_DAT_TOUR"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "DON_DAT_TOUR_scheduleId_status_idx" ON "DON_DAT_TOUR"("scheduleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DON_DAT_TOUR_userId_idempotencyKey_key" ON "DON_DAT_TOUR"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CHI_TIET_DAT_TOUR_bookingId_kind_key" ON "CHI_TIET_DAT_TOUR"("bookingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "THANH_TOAN_bookingId_key" ON "THANH_TOAN"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "THANH_TOAN_providerReference_key" ON "THANH_TOAN"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "THANH_TOAN_provider_transactionId_key" ON "THANH_TOAN"("provider", "transactionId");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_createdAt_idx" ON "AuditLog"("entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "NGUOI_DUNG"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LICH_KHOI_HANH" ADD CONSTRAINT "LICH_KHOI_HANH_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "TOUR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DON_DAT_TOUR" ADD CONSTRAINT "DON_DAT_TOUR_userId_fkey" FOREIGN KEY ("userId") REFERENCES "NGUOI_DUNG"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DON_DAT_TOUR" ADD CONSTRAINT "DON_DAT_TOUR_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LICH_KHOI_HANH"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHI_TIET_DAT_TOUR" ADD CONSTRAINT "CHI_TIET_DAT_TOUR_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "DON_DAT_TOUR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "THANH_TOAN" ADD CONSTRAINT "THANH_TOAN_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "DON_DAT_TOUR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

