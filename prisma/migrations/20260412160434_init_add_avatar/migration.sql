-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `monk_profile_monastery_name_idx` ON `monk_profile`(`monastery_name`);

-- CreateIndex
CREATE INDEX `monk_profile_monastery_address_idx` ON `monk_profile`(`monastery_address`);
