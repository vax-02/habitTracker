-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `habits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `frequency` ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL DEFAULT 'DAILY',
    `targetDays` INTEGER NULL,
    `color` VARCHAR(7) NULL,
    `icon` VARCHAR(10) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `habits_user_id_idx`(`user_id`),
    INDEX `habits_frequency_idx`(`frequency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `habit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `habit_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `date` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('COMPLETED', 'SKIPPED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `habit_logs_user_id_date_idx`(`user_id`, `date`),
    INDEX `habit_logs_status_idx`(`status`),
    UNIQUE INDEX `habit_logs_habit_id_date_key`(`habit_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reminders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `habit_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `time` VARCHAR(5) NOT NULL,
    `days` VARCHAR(20) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reminders_user_id_active_idx`(`user_id`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `habits` ADD CONSTRAINT `habits_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `habit_logs` ADD CONSTRAINT `habit_logs_habit_id_fkey` FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `habit_logs` ADD CONSTRAINT `habit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_habit_id_fkey` FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
