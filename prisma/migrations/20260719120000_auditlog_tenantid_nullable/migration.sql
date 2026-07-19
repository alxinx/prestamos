-- AuditLog.tenantId pasa a ser nullable: las acciones globales de MasterAdmin
-- (ej. cambios de Plan) no pertenecen a ningún tenant específico.
ALTER TABLE `audit_logs` MODIFY COLUMN `tenant_id` CHAR(36) NULL;
