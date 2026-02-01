import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import SEO from '@/components/SEO';

export default function AdminAuditLogs() {
  return (
    <AdminGuard>
      <AdminLayout>
        <SEO title="Audit Logs" description="View admin activity audit logs" />
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground mt-2">
              Track all administrative actions and changes
            </p>
          </div>

          <AuditLogTable pageSize={20} />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}