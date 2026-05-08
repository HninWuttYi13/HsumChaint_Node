-- CreateIndex
CREATE INDEX `users_is_deleted_user_type_created_at_idx` ON `users`(`is_deleted`, `user_type`, `created_at` DESC);

-- CreateIndex
CREATE INDEX `users_username_idx` ON `users`(`username`);
