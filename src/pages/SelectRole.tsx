import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { PREDEFINED_ROLES, AppRole } from '@/types/roles'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const SelectRole = () => {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null)
  const [customName, setCustomName] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRoleSelect = async () => {
    if (!selectedRole || !user || !token) return

    // Validaciones
    if (selectedRole === 'custom' && (!customName.trim() || !customDescription.trim())) {
      toast.error('Completa el nombre y descripción del rol personalizado')
      return
    }

    if (selectedRole === 'admin') {
      toast.error('El rol de administrador ya está asignado al creador de la organización')
      return
    }

    setLoading(true)

    try {
      // Verificar invitación
      const { data: invitation, error: inviteError } = await supabase
        .from('organization_invitations')
        .select('organization_id')
        .eq('token', token)
        .eq('is_active', true)
        .single()

      if (inviteError || !invitation) {
        toast.error('Link de invitación inválido o expirado')
        setLoading(false)
        return
      }

      // Verificar límite de usuarios
      const { data: countData } = await supabase.rpc('count_organization_users', {
        _org_id: invitation.organization_id
      })

      if (countData && countData >= 10) {
        toast.error('Esta organización alcanzó el límite de 10 usuarios en el plan gratuito')
        setLoading(false)
        return
      }

      // Crear rol de usuario
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          organization_id: invitation.organization_id,
          role: selectedRole,
          role_name: selectedRole === 'custom' ? customName : null,
          role_description: selectedRole === 'custom' ? customDescription : null
        })

      if (roleError) {
        console.error('Error creating role:', roleError)
        toast.error('Error al asignar rol')
        setLoading(false)
        return
      }

      // Actualizar organization_id en users
      await supabase
        .from('users')
        .update({ organization_id: invitation.organization_id })
        .eq('id', user.id)

      toast.success('¡Rol asignado! Generando tus tareas personalizadas...')

      // Generar tareas con IA
      const { error: taskError } = await supabase.functions.invoke('generate-role-tasks', {
        body: {
          userId: user.id,
          role: selectedRole,
          roleName: customName,
          roleDescription: customDescription
        }
      })

      if (taskError) {
        console.error('Error generating tasks:', taskError)
        toast.error('Error al generar tareas. Por favor contacta soporte.')
      } else {
        toast.success('¡Tareas generadas exitosamente!')
      }

      // Redirigir al home
      setTimeout(() => {
        navigate('/home')
      }, 2000)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Ocurrió un error inesperado')
      setLoading(false)
    }
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Link de invitación inválido o sesión expirada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-3 md:p-4 pb-24 md:pb-4">
      <div className="container max-w-5xl mx-auto py-4 md:py-8">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">
            Selecciona tu Rol
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            Elige el rol que mejor describe tu función
          </p>
        </div>

        {/* Tarjeta Rol Personalizado - DESTACADA ARRIBA */}
        <Card
          className={`mb-8 cursor-pointer transition-all duration-300 relative overflow-hidden ${
            selectedRole === 'custom'
              ? 'border-2 border-primary shadow-2xl scale-[1.02]'
              : 'border-2 border-primary/50 hover:border-primary hover:shadow-xl hover:scale-[1.01]'
          }`}
          onClick={() => setSelectedRole('custom')}
        >
          {/* Gradiente de fondo animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 animate-gradient-xy opacity-50" />
          
          {/* Badge "Recomendado" */}
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
              <span className="text-sm">✨</span>
              <span>Recomendado</span>
            </div>
          </div>

          <CardHeader className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="text-5xl">🎯</div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Rol Personalizado
                </CardTitle>
                <CardDescription className="text-base">
                  Define un rol único adaptado a tus necesidades específicas. 
                  La IA generará tareas personalizadas según tu descripción.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {selectedRole === 'custom' && (
            <CardContent className="relative z-10 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="role-name" className="text-base font-semibold">
                  Nombre del Rol *
                </Label>
                <Input
                  id="role-name"
                  placeholder="Ej: Growth Hacker, Content Manager, Product Designer..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={50}
                  className="border-2 focus:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description" className="text-base font-semibold">
                  Descripción del Rol *
                </Label>
                <Textarea
                  id="role-description"
                  placeholder="Describe las responsabilidades y actividades principales de este rol. Cuanto más detallado, mejores serán las tareas generadas..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="border-2 focus:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
                <p className="text-xs text-muted-foreground">
                  {customDescription.length}/300 caracteres
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Separador */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground font-medium">O elige un rol predefinido</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Botón Confirmar - MOVIDO AQUÍ */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleRoleSelect}
            disabled={!selectedRole || loading}
            size="lg"
            className="min-w-[280px] h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generando tareas con IA...
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Confirmar y Generar Tareas
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {PREDEFINED_ROLES.filter(r => r.value !== 'admin').map((role) => (
            <Card
              key={role.value}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === role.value
                  ? 'border-2 border-primary shadow-lg scale-105'
                  : 'border-2 border-transparent'
              }`}
              onClick={() => setSelectedRole(role.value)}
            >
              <CardHeader>
                <div className="text-4xl mb-2">{role.icon}</div>
                <CardTitle className="text-lg">{role.label}</CardTitle>
                <CardDescription className="text-sm">
                  {role.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Botón Cancelar abajo */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            disabled={loading}
          >
            ← Volver
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SelectRole