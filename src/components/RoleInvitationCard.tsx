import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Copy, Users, UserPlus, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import { UpgradeModal } from '@/components/UpgradeModal'

export const RoleInvitationCard = () => {
  const { user } = useAuth()
  const { canAddUser, plan, userCount, limits } = useSubscriptionLimits()
  const [inviteLink, setInviteLink] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    if (user) {
      checkAdminAndLoadInvitation()
    }
  }, [user])

  const checkAdminAndLoadInvitation = async () => {
    if (!user) return

    try {
      // Verificar si es admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .single()

      if (!roleData) {
        setLoading(false)
        return
      }

      setIsAdmin(roleData.role === 'admin')

      if (roleData.role !== 'admin') {
        setLoading(false)
        return
      }

      // Obtener o crear link de invitación
      const { data: invitation } = await supabase
        .from('organization_invitations')
        .select('token')
        .eq('organization_id', roleData.organization_id)
        .eq('is_active', true)
        .single()

      if (invitation) {
        const link = `${window.location.origin}/join/${invitation.token}`
        setInviteLink(link)
      } else {
        // Crear invitación si no existe
        const { data: newInvite, error } = await supabase
          .from('organization_invitations')
          .insert({
            organization_id: roleData.organization_id,
            created_by: user.id
          })
          .select('token')
          .single()

        if (!error && newInvite) {
          const link = `${window.location.origin}/join/${newInvite.token}`
          setInviteLink(link)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading invitation:', error)
      setLoading(false)
    }
  }

  const copyInviteLink = () => {
    // Verificar límite antes de permitir copiar
    const { allowed } = canAddUser()
    if (!allowed) {
      setShowUpgradeModal(true)
      return
    }

    navigator.clipboard.writeText(inviteLink)
    toast.success('Link de invitación copiado')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!isAdmin) {
    return null // Solo admins ven esta tarjeta
  }

  const { allowed: canInvite } = canAddUser()
  const maxUsers = limits.max_users === -1 ? '∞' : limits.max_users

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Invitar Colaboradores</CardTitle>
              <CardDescription>
                Comparte el link para que otros se unan ({userCount}/{maxUsers} usuarios)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canInvite && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Límite alcanzado</p>
                <p>En tu plan {plan} el máximo es {maxUsers} usuarios. Actualiza a un plan superior para añadir más miembros.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Link de invitación</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-muted border rounded-md text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                disabled={!inviteLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {!canInvite 
                ? 'Mejora tu plan para añadir más usuarios'
                : 'Comparte este link con las personas que quieras invitar a tu organización'
              }
            </p>
          </div>

          <Button 
            className="w-full gap-2" 
            onClick={copyInviteLink}
            disabled={!inviteLink}
            variant={canInvite ? 'default' : 'outline'}
          >
            {canInvite ? (
              <>
                <UserPlus className="w-4 h-4" />
                Copiar Link de Invitación
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Mejorar Plan para Invitar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="users"
        currentValue={userCount}
        limitValue={limits.max_users}
      />
    </>
  )
}
