/*
  Warnings:

  - Made the column `queueNumber` on table `booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `serviceType` on table `booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `booking` MODIFY `queueNumber` INTEGER NOT NULL,
    MODIFY `serviceType` VARCHAR(191) NOT NULL;
