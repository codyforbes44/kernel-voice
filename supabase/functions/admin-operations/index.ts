import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminOperation {
  action: 'deleteUser' | 'updateUserRole' | 'deleteConversation' | 'deleteDocument' | 'bulkDelete' | 'exportData' | 'grantFeature' | 'revokeFeature' | 'listUserFeatures' | 'resetPassword'
  targetUserId?: string
  targetEmail?: string
  targetResourceId?: string
  targetResourceIds?: string[]
  resourceType?: 'user' | 'conversation' | 'document'
  newRole?: 'admin' | 'moderator' | 'user'
  featureKey?: string
  redirectTo?: string
  metadata?: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create user client to verify caller is admin
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user has admin role
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const operation: AdminOperation = await req.json()
    let result: Record<string, unknown> = {}

    // Get client IP for audit logging
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

    switch (operation.action) {
      case 'deleteUser': {
        if (!operation.targetUserId) {
          throw new Error('targetUserId is required')
        }

        // Delete user's data first (cascade)
        await adminClient.from('messages').delete().eq('conversation_id', 
          adminClient.from('conversations').select('id').eq('user_id', operation.targetUserId)
        )
        await adminClient.from('conversations').delete().eq('user_id', operation.targetUserId)
        await adminClient.from('documents').delete().eq('user_id', operation.targetUserId)
        await adminClient.from('user_roles').delete().eq('user_id', operation.targetUserId)
        await adminClient.from('profiles').delete().eq('id', operation.targetUserId)

        // Delete auth user
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(operation.targetUserId)
        if (deleteError) throw deleteError

        // Log the action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: 'delete_user',
          target_user_id: operation.targetUserId,
          ip_address: clientIp,
          metadata: operation.metadata || {},
        })

        result = { success: true, message: 'User deleted successfully' }
        break
      }

      case 'updateUserRole': {
        if (!operation.targetUserId || !operation.newRole) {
          throw new Error('targetUserId and newRole are required')
        }

        // Get current role for audit log
        const { data: currentRole } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', operation.targetUserId)
          .single()

        // Upsert the new role
        const { error: roleError } = await adminClient
          .from('user_roles')
          .upsert({ 
            user_id: operation.targetUserId, 
            role: operation.newRole 
          }, { 
            onConflict: 'user_id,role' 
          })

        if (roleError) throw roleError

        // Log the action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: 'update_role',
          target_user_id: operation.targetUserId,
          ip_address: clientIp,
          metadata: { 
            previous_role: currentRole?.role || 'none',
            new_role: operation.newRole,
            ...operation.metadata 
          },
        })

        result = { success: true, message: 'Role updated successfully' }
        break
      }

      case 'deleteConversation': {
        if (!operation.targetResourceId) {
          throw new Error('targetResourceId is required')
        }

        // Get conversation owner for audit
        const { data: conv } = await adminClient
          .from('conversations')
          .select('user_id')
          .eq('id', operation.targetResourceId)
          .single()

        // Delete messages first
        await adminClient.from('messages').delete().eq('conversation_id', operation.targetResourceId)
        
        // Delete conversation
        const { error: deleteError } = await adminClient
          .from('conversations')
          .delete()
          .eq('id', operation.targetResourceId)

        if (deleteError) throw deleteError

        // Log the action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: 'delete_conversation',
          target_user_id: conv?.user_id,
          target_resource_id: operation.targetResourceId,
          target_resource_type: 'conversation',
          ip_address: clientIp,
          metadata: operation.metadata || {},
        })

        result = { success: true, message: 'Conversation deleted successfully' }
        break
      }

      case 'deleteDocument': {
        if (!operation.targetResourceId) {
          throw new Error('targetResourceId is required')
        }

        // Get document owner for audit
        const { data: doc } = await adminClient
          .from('documents')
          .select('user_id')
          .eq('id', operation.targetResourceId)
          .single()

        // Delete chunks first
        await adminClient.from('document_chunks').delete().eq('document_id', operation.targetResourceId)
        
        // Delete document
        const { error: deleteError } = await adminClient
          .from('documents')
          .delete()
          .eq('id', operation.targetResourceId)

        if (deleteError) throw deleteError

        // Log the action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: 'delete_document',
          target_user_id: doc?.user_id,
          target_resource_id: operation.targetResourceId,
          target_resource_type: 'document',
          ip_address: clientIp,
          metadata: operation.metadata || {},
        })

        result = { success: true, message: 'Document deleted successfully' }
        break
      }

      case 'bulkDelete': {
        if (!operation.targetResourceIds || !operation.resourceType) {
          throw new Error('targetResourceIds and resourceType are required')
        }

        const deletedIds: string[] = []

        for (const resourceId of operation.targetResourceIds) {
          try {
            if (operation.resourceType === 'conversation') {
              await adminClient.from('messages').delete().eq('conversation_id', resourceId)
              await adminClient.from('conversations').delete().eq('id', resourceId)
            } else if (operation.resourceType === 'document') {
              await adminClient.from('document_chunks').delete().eq('document_id', resourceId)
              await adminClient.from('documents').delete().eq('id', resourceId)
            } else if (operation.resourceType === 'user') {
              await adminClient.from('conversations').delete().eq('user_id', resourceId)
              await adminClient.from('documents').delete().eq('user_id', resourceId)
              await adminClient.from('user_roles').delete().eq('user_id', resourceId)
              await adminClient.from('profiles').delete().eq('id', resourceId)
              await adminClient.auth.admin.deleteUser(resourceId)
            }
            deletedIds.push(resourceId)
          } catch (e) {
            console.error(`Failed to delete ${resourceId}:`, e)
          }
        }

        // Log the bulk action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: `bulk_delete_${operation.resourceType}`,
          ip_address: clientIp,
          metadata: { 
            deleted_count: deletedIds.length,
            deleted_ids: deletedIds,
            ...operation.metadata 
          },
        })

        result = { success: true, deleted: deletedIds.length, message: `Deleted ${deletedIds.length} items` }
        break
      }

      case 'exportData': {
        // Export functionality - returns data as JSON
        const { resourceType } = operation
        let exportData: unknown[] = []

        if (resourceType === 'user') {
          const { data } = await adminClient.from('profiles').select('*')
          exportData = data || []
        } else if (resourceType === 'conversation') {
          const { data } = await adminClient.from('conversations').select('*')
          exportData = data || []
        } else if (resourceType === 'document') {
          const { data } = await adminClient.from('documents').select('*')
          exportData = data || []
        }

        // Log the export
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: `export_${resourceType}`,
          ip_address: clientIp,
          metadata: { record_count: exportData.length },
        })

        result = { success: true, data: exportData, count: exportData.length }
        break
      }

      case 'grantFeature': {
        if (!operation.targetUserId || !operation.featureKey) {
          throw new Error('targetUserId and featureKey are required')
        }

        // Upsert the feature (enable it)
        const { error: featureError } = await adminClient
          .from('user_features')
          .upsert({
            user_id: operation.targetUserId,
            feature_key: operation.featureKey,
            enabled: true,
            granted_by: user.id,
            granted_at: new Date().toISOString(),
            revoked_at: null,
            metadata: operation.metadata || {},
          }, {
            onConflict: 'user_id,feature_key',
          })

        if (featureError) throw featureError

        // Log the action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: 'grant_feature',
          target_user_id: operation.targetUserId,
          ip_address: clientIp,
          metadata: { 
            feature_key: operation.featureKey,
            ...operation.metadata 
          },
        })

        result = { success: true, message: `Feature ${operation.featureKey} granted` }
        break
      }

      case 'revokeFeature': {
        if (!operation.targetUserId || !operation.featureKey) {
          throw new Error('targetUserId and featureKey are required')
        }

        // Update the feature to disabled and set revoked_at
        const { error: featureError } = await adminClient
          .from('user_features')
          .update({
            enabled: false,
            revoked_at: new Date().toISOString(),
          })
          .eq('user_id', operation.targetUserId)
          .eq('feature_key', operation.featureKey)

        if (featureError) throw featureError

        // Log the action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: 'revoke_feature',
          target_user_id: operation.targetUserId,
          ip_address: clientIp,
          metadata: { 
            feature_key: operation.featureKey,
            ...operation.metadata 
          },
        })

        result = { success: true, message: `Feature ${operation.featureKey} revoked` }
        break
      }

      case 'listUserFeatures': {
        if (!operation.targetUserId) {
          throw new Error('targetUserId is required')
        }

        const { data: features, error: fetchError } = await adminClient
          .from('user_features')
          .select('*')
          .eq('user_id', operation.targetUserId)

        if (fetchError) throw fetchError

        result = { success: true, features: features || [] }
        break
      }

      case 'resetPassword': {
        if (!operation.targetEmail) {
          throw new Error('targetEmail is required')
        }

        const redirectUrl = operation.redirectTo || 'https://kernel-voice.lovable.app/auth'

        // Generate password reset link using admin API
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: operation.targetEmail,
          options: {
            redirectTo: redirectUrl,
          },
        })

        if (linkError) throw linkError

        // Log the action
        await adminClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action: 'reset_password',
          target_user_id: linkData.user?.id,
          ip_address: clientIp,
          metadata: { 
            email: operation.targetEmail,
            ...operation.metadata 
          },
        })

        result = { 
          success: true, 
          message: 'Password reset link generated',
          resetLink: linkData.properties?.action_link,
        }
        break
      }

      default:
        throw new Error(`Unknown action: ${operation.action}`)
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Admin operation error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Operation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})