
# Admin Dashboard Enhancement Plan

## Current State Analysis

### Existing Admin Features

| Page | Features | Limitations |
|------|----------|-------------|
| **Dashboard** | 6 stats cards (users, conversations, documents, active today, KB docs, KB chunks) | Static metrics only, no trends or charts, no quick actions |
| **Users** | List, search, role assignment, delete | No pagination, no bulk actions, no user details view, no activity history |
| **Conversations** | List, search, delete | No message preview, no pagination, no export, no moderation tools |
| **Documents** | List, search, delete | No preview, no pagination, basic file info only |
| **Knowledge Base** | 5 tabs (Overview, Documents, Categories, Chunks, Settings) | Good foundation but limited analytics and no reprocessing tools |

### Security Implementation
- `AdminGuard` component checks `isAdmin` from `useUserRole` hook
- Role-based access via `has_role()` security definer function
- `admin_audit_log` table exists but is not being used

### Missing Best-in-Class Capabilities
1. **Real-time monitoring** - No live activity feeds or system health
2. **Advanced analytics** - No charts, trends, or usage patterns
3. **Audit logging** - Table exists but no logging implementation
4. **Bulk operations** - No multi-select or batch actions
5. **Export functionality** - No data export capabilities
6. **System configuration** - Limited to KB settings only
7. **User detail views** - No drill-down into individual users
8. **Moderation tools** - No conversation review or content flagging
9. **Collapsible sidebar** - Current layout uses inline navigation

---

## Solution Architecture

### Phase 1: Enhanced Dashboard and Analytics

**1.1 Real-Time Dashboard**
- Live stats with auto-refresh (30-second intervals)
- Activity feed showing recent actions
- System health indicators (voice providers, edge functions)
- Quick action buttons (common admin tasks)

**1.2 Analytics Charts**
- User growth over time (line chart)
- Conversation volume trends (area chart)
- Voice provider usage distribution (pie chart)
- Daily/weekly active users comparison (bar chart)

**1.3 Dashboard Widgets**
- Recent user registrations with quick role actions
- Recent conversations with preview
- Processing queue status for KB documents
- Storage usage summary

### Phase 2: Advanced User Management

**2.1 Enhanced User Table**
- Server-side pagination for scalability
- Bulk selection with multi-action toolbar
- Column sorting and advanced filters
- User status indicators (online/offline based on updated_at)

**2.2 User Detail Drawer/Modal**
- Complete profile information
- Role history
- Conversation count and recent activity
- Document uploads summary
- Voice preferences and settings
- Quick actions (reset password, disable, impersonate)

**2.3 Bulk Operations**
- Select multiple users
- Bulk role assignment
- Bulk export to CSV
- Bulk delete with confirmation

### Phase 3: Conversation Moderation Tools

**3.1 Enhanced Conversation View**
- Message preview panel (sliding drawer)
- Full message transcript view
- User and assistant message differentiation
- Audio playback for voice messages

**3.2 Moderation Features**
- Flag conversations for review
- Add moderator notes
- Export conversation transcripts
- Archive instead of delete option

### Phase 4: Audit Logging System

**4.1 Implement Audit Logging**
Create `admin-operations` edge function for secure admin actions:
- User role changes
- User deletion
- Conversation deletion
- Document management
- Settings changes

**4.2 Audit Log Viewer Page**
- Searchable audit log table
- Filter by action type, admin, target
- Export audit logs
- Date range filtering

### Phase 5: System Settings and Configuration

**5.1 New Settings Page**
- Voice provider configuration
- AI model defaults
- Rate limiting settings
- Feature flags
- Maintenance mode toggle

**5.2 Email/Notification Templates**
- Welcome email customization
- Password reset templates
- System notification settings

### Phase 6: Modern Admin Layout

**6.1 Collapsible Sidebar**
- Use ShadcnUI Sidebar component
- Mini-collapsed mode (icons only)
- Persistent trigger button
- Mobile-responsive sheet

**6.2 Command Palette**
- Cmd+K quick navigation
- Search users, conversations, documents
- Quick actions from keyboard

---

## Implementation Details

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Collapsible sidebar with navigation |
| `src/components/admin/DashboardCharts.tsx` | Analytics charts component |
| `src/components/admin/ActivityFeed.tsx` | Real-time activity feed |
| `src/components/admin/UserDetailDrawer.tsx` | User detail slide-over panel |
| `src/components/admin/ConversationPreview.tsx` | Message transcript viewer |
| `src/components/admin/AuditLogTable.tsx` | Audit log display component |
| `src/components/admin/BulkActionToolbar.tsx` | Multi-select action bar |
| `src/pages/admin/AuditLogs.tsx` | New audit log page |
| `src/pages/admin/Settings.tsx` | System settings page |
| `supabase/functions/admin-operations/index.ts` | Secure admin operations |

### Files to Refactor

| File | Changes |
|------|---------|
| `src/components/admin/AdminLayout.tsx` | Replace with SidebarProvider layout |
| `src/pages/admin/Dashboard.tsx` | Add charts, activity feed, widgets |
| `src/pages/admin/Users.tsx` | Add pagination, bulk actions, detail drawer |
| `src/pages/admin/Conversations.tsx` | Add message preview, moderation tools |
| `src/pages/admin/Documents.tsx` | Add pagination, preview, bulk actions |
| `src/hooks/useUserRole.ts` | Add auth state subscription for real-time updates |

### Database Changes

**New table: `admin_settings`**
```sql
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
```

**Add indexes for performance:**
```sql
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at DESC);
```

### Edge Function: admin-operations

Secure server-side operations using service role:
- `deleteUser` - Delete user and cascade data
- `updateUserRole` - Change user roles with audit logging
- `exportData` - Generate CSV exports
- `bulkOperations` - Handle multi-item actions

---

## Priority Implementation Order

1. **Phase 6.1: Admin Layout Refactor** - Foundation for better UX
2. **Phase 1.1-1.3: Enhanced Dashboard** - Immediate value visibility
3. **Phase 4: Audit Logging** - Security compliance
4. **Phase 2: User Management** - Core admin functionality
5. **Phase 3: Conversation Tools** - Content moderation
6. **Phase 5: System Settings** - Advanced configuration

---

## Technical Considerations

### Performance Optimizations
- Implement server-side pagination (50 items per page)
- Use React Query for caching and background refetch
- Debounce search inputs (300ms)
- Virtual scrolling for large lists

### Security Measures
- All destructive operations via edge function with service role
- Audit logging for every admin action
- Rate limiting on admin endpoints
- IP address capture in audit logs

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader announcements for actions
- Focus management in modals

---

## Expected Outcomes

After implementation:
- Comprehensive platform visibility with real-time metrics
- Efficient user and content management at scale
- Complete audit trail for compliance
- Modern, responsive admin interface
- Reduced admin task completion time
- Enhanced security through proper access controls

