# 🎯 ESTRATEGIA COMPLETA DE MENSAJES DE MARKETING - OPTIMUS-K

## 📖 FILOSOFÍA DE MARCA

**Diferenciadores clave:**
1. ⚡ **Velocidad** - Setup en 2-3 horas vs. semanas de competencia
2. 🎯 **Personalización** - App adaptada a TU negocio, no genérica
3. 🔌 **Integración** - Se adapta a tus herramientas, no al revés
4. 🎮 **Gamificación** - Motivación real del equipo
5. 📊 **Decisiones con datos** - KPIs que importan, no métricas vanidosas
6. 💪 **Sin vendor lock-in** - Cancela cuando quieras

**Tono de voz:**
- Directo y profesional
- Empático con los dolores del cliente
- Optimista sobre resultados
- Sin exageraciones ni promesas vacías

---

## 📍 MENSAJES POR UBICACIÓN EN LA APP

### **1. LANDING PAGE**

#### Hero Section (ya existente - mejorado)
```tsx
<h1>OPTIMUS-K</h1>
<p className="text-xl">
  Tu empresa merece una app de gestión <strong>tan única como tu negocio</strong>.
  No más herramientas genéricas que te obligan a adaptarte.
</p>
<p className="text-lg text-muted-foreground">
  En <strong>2-3 horas</strong> tendrás una app completa que habla tu lenguaje:
  con TUS procesos, TUS métricas y TU forma de trabajar.
</p>
```

#### Sección de Integr Beneficios (nueva sección a añadir)
```tsx
<div className="bg-primary/5 py-16">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12">
      ¿Por Qué Elegir OPTIMUS-K?
    </h2>
    
    <div className="grid md:grid-cols-3 gap-8">
      <Card className="p-6">
        <Clock className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-bold mb-2">Setup Ultra-Rápido</h3>
        <p className="text-muted-foreground">
          Mientras la competencia tarda <strong>semanas</strong>, tú empiezas 
          en <strong>2-3 horas</strong>. 30 preguntas y listo.
        </p>
      </Card>
      
      <Card className="p-6">
        <Zap className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-bold mb-2">100% Personalizado</h3>
        <p className="text-muted-foreground">
          No es una plantilla. Es <strong>TU app</strong> con tus procesos,
          tus productos, tu equipo y tus objetivos.
        </p>
      </Card>
      
      <Card className="p-6">
        <Users className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-bold mb-2">Tu Equipo lo Amará</h3>
        <p className="text-muted-foreground">
          Gamificación real: puntos, rachas, badges. 
          <strong>Motivación sostenible</strong>, no solo la primera semana.
        </p>
      </Card>
    </div>
  </div>
</div>
```

#### Social Proof (nueva sección)
```tsx
<div className="py-16">
  <div className="container mx-auto px-4 text-center">
    <p className="text-2xl font-semibold mb-8">
      "Probamos 5 CRMs genéricos. Todos fallaron.<br/>
      OPTIMUS-K entendió nuestro negocio desde el día 1."
    </p>
    <p className="text-muted-foreground">
      — CEO, Agencia de Marketing Digital
    </p>
  </div>
</div>
```

---

### **2. ONBOARDING (30 PREGUNTAS)**

#### Pantalla de Bienvenida (Step 0)
```tsx
<div className="text-center max-w-2xl mx-auto">
  <h1 className="text-4xl font-bold mb-4">
    Bienvenido a OPTIMUS-K 👋
  </h1>
  <p className="text-xl mb-6">
    Las próximas <strong>30 preguntas</strong> son nuestra forma de 
    <strong> conocer tu negocio en profundidad</strong>.
  </p>
  <Alert className="mb-6">
    <Lightbulb className="h-4 w-4" />
    <AlertTitle>💡 Consejo Pro</AlertTitle>
    <AlertDescription>
      Cuanto más específico seas, más personalizada será tu app.
      <strong> No hay respuestas incorrectas</strong>, solo tu realidad.
    </AlertDescription>
  </Alert>
  <p className="text-muted-foreground">
    ⏱️ Tiempo estimado: <strong>15-20 minutos</strong><br/>
    💾 Se guarda automáticamente. Puedes pausar en cualquier momento.
  </p>
</div>
```

#### Entre Secciones del Onboarding
```tsx
// Después de Sección 1 (Empresa)
<Alert className="bg-primary/10 border-primary">
  <CheckCircle2 className="h-4 w-4 text-primary" />
  <AlertDescription>
    ✅ <strong>Sección 1/5 completada.</strong> Ya conocemos tu empresa.
    Ahora cuéntanos sobre tu proceso comercial.
  </AlertDescription>
</Alert>

// Después de Sección 3 (Equipo)
<Alert className="bg-green-50 border-green-500">
  <TrendingUp className="h-4 w-4 text-green-600" />
  <AlertDescription>
    🎯 <strong>¡Vas por el 60%!</strong> Mientras completas esto,
    nuestro sistema ya está preparando tu dashboard personalizado.
  </AlertDescription>
</Alert>

// Antes de Sección 5 (Objetivos)
<Alert>
  <Target className="h-4 w-4" />
  <AlertDescription>
    🏆 <strong>Última sección.</strong> Define tus objetivos y 
    generaremos OKRs, métricas y tareas específicas para alcanzarlos.
  </AlertDescription>
</Alert>
```

#### Pantalla Final de Onboarding
```tsx
<div className="text-center max-w-2xl mx-auto">
  <div className="mb-8">
    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 className="h-12 w-12 text-white" />
    </div>
    <h1 className="text-4xl font-bold mb-4">
      ¡Perfecto! Ya Conocemos tu Negocio 🎉
    </h1>
  </div>
  
  <Card className="p-8 mb-6">
    <h2 className="text-2xl font-bold mb-4">¿Qué Sucede Ahora?</h2>
    <div className="space-y-4 text-left">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
          1
        </div>
        <div>
          <p className="font-semibold">Nuestro sistema está generando tu app</p>
          <p className="text-sm text-muted-foreground">
            Creando dashboard, tareas personalizadas, métricas específicas, 
            pipeline de ventas adaptado a tu proceso...
          </p>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
          2
        </div>
        <div>
          <p className="font-semibold">Recibirás un email en 2-3 horas</p>
          <p className="text-sm text-muted-foreground">
            Con tus credenciales de acceso y un video tutorial de 5 minutos.
          </p>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
          3
        </div>
        <div>
          <p className="font-semibold">¡Empieza a gestionar profesionalmente!</p>
          <p className="text-sm text-muted-foreground">
            Sin curva de aprendizaje. La app habla tu lenguaje desde el día 1.
          </p>
        </div>
      </div>
    </div>
  </Card>
  
  <Alert className="bg-blue-50 border-blue-500">
    <Sparkles className="h-4 w-4 text-blue-600" />
    <AlertTitle className="text-blue-900">🎁 14 Días Gratis</AlertTitle>
    <AlertDescription className="text-blue-800">
      Explora todo sin límites. Si no te convence, cancela en 2 clicks.
      <strong> Sin compromisos.</strong>
    </AlertDescription>
  </Alert>
</div>
```

---

### **3. DASHBOARD PRINCIPAL**

#### Header del Dashboard
```tsx
<div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg mb-6">
  <p className="text-lg">
    <strong>Buenos días, {userName}</strong> 👋
  </p>
  <p className="text-sm text-muted-foreground">
    Tu pipeline está <strong>{pipelineHealth}%</strong> saludable.
    Tienes <strong>{pendingTasks} tareas</strong> pendientes esta semana.
    {streak > 0 && ` 🔥 Racha de ${streak} días activo.`}
  </p>
</div>
```

#### Empty State del Dashboard (primera vez)
```tsx
<Card className="p-12 text-center">
  <Rocket className="h-16 w-16 text-primary mx-auto mb-4" />
  <h2 className="text-2xl font-bold mb-4">
    ¡Tu App Personalizada Está Lista! 🎉
  </h2>
  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
    Hemos generado <strong>{tasksCount} tareas semanales</strong>, 
    <strong> {okrsCount} OKRs</strong> y <strong>{metricsCount} métricas</strong> 
    basadas en tu onboarding. Todo adaptado a <strong>{companyName}</strong>.
  </p>
  <div className="grid md:grid-cols-3 gap-4 mb-6">
    <Button onClick={() => navigate('/tasks')}>
      <CheckSquare className="mr-2 h-4 w-4" />
      Ver Mis Tareas
    </Button>
    <Button variant="outline" onClick={() => navigate('/crm')}>
      <Users className="mr-2 h-4 w-4" />
      Añadir Primer Lead
    </Button>
    <Button variant="outline" onClick={() => navigate('/settings')}>
      <Settings className="mr-2 h-4 w-4" />
      Configurar Integraciones
    </Button>
  </div>
  <Alert>
    <Lightbulb className="h-4 w-4" />
    <AlertDescription>
      💡 <strong>Consejo:</strong> Empieza añadiendo tus leads actuales al CRM.
      El sistema te guiará con tareas específicas para cada uno.
    </AlertDescription>
  </Alert>
</Card>
```

#### Sidebar - Tooltip de Features
```tsx
// En cada item del menú
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <NavItem icon={Target} label="OKRs" />
    </TooltipTrigger>
    <TooltipContent side="right">
      <p className="font-semibold">Objetivos y Key Results</p>
      <p className="text-xs text-muted-foreground">
        Tus metas de {quarter} con progreso en tiempo real
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### **4. CRM / LEADS**

#### Header del CRM
```tsx
<div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-3xl font-bold">Pipeline de Ventas</h1>
    <p className="text-muted-foreground">
      {leadsCount} leads · <strong>€{totalValue}</strong> en pipeline ·
      Tasa de conversión: <strong>{conversionRate}%</strong>
    </p>
  </div>
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Nuevo Lead
  </Button>
</div>

<Alert className="mb-6">
  <TrendingUp className="h-4 w-4" />
  <AlertDescription>
    💡 <strong>Aumenta tu conversión:</strong> Los leads con seguimiento 
    semanal tienen <strong>3x más probabilidad</strong> de cerrar.
    El sistema te recuerda automáticamente.
  </AlertDescription>
</Alert>
```

#### Empty State del CRM
```tsx
<Card className="p-12 text-center">
  <Users className="h-16 w-16 text-primary mx-auto mb-4" />
  <h2 className="text-2xl font-bold mb-4">
    Empieza a Llenar tu Pipeline 🚀
  </h2>
  <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
    Cada lead que añadas tendrá un <strong>seguimiento automático</strong> 
    basado en tu proceso comercial de {salesCycleSteps} pasos.
  </p>
  <Button size="lg" onClick={handleAddLead}>
    <Plus className="mr-2 h-5 w-5" />
    Añadir Primer Lead
  </Button>
  
  <div className="mt-8 pt-8 border-t">
    <p className="text-sm text-muted-foreground mb-4">
      ¿Ya tienes leads en otro sistema?
    </p>
    <div className="flex gap-4 justify-center">
      <Button variant="outline" size="sm">
        <FileUp className="mr-2 h-4 w-4" />
        Importar CSV
      </Button>
      <Button variant="outline" size="sm">
        <Link className="mr-2 h-4 w-4" />
        Sincronizar con HubSpot
      </Button>
    </div>
  </div>
</Card>
```

---

### **5. TAREAS**

#### Header de Tareas
```tsx
<div className="mb-6">
  <h1 className="text-3xl font-bold mb-2">Mis Tareas</h1>
  <p className="text-muted-foreground">
    Semana {weekNumber} · {completedThisWeek}/{totalThisWeek} completadas ·
    {streak > 3 && `🔥 Racha de ${streak} días cumpliendo objetivos`}
  </p>
</div>

{completionRate >= 80 && (
  <Alert className="bg-green-50 border-green-500 mb-6">
    <Trophy className="h-4 w-4 text-green-600" />
    <AlertTitle className="text-green-900">🎉 ¡Semana Productiva!</AlertTitle>
    <AlertDescription className="text-green-800">
      Has completado <strong>{completionRate}%</strong> de tus tareas.
      Estás en el <strong>top 10%</strong> del equipo.
      +{points} puntos ganados esta semana.
    </AlertDescription>
  </Alert>
)}

{completionRate < 40 && (
  <Alert className="bg-yellow-50 border-yellow-500 mb-6">
    <AlertTriangle className="h-4 w-4 text-yellow-600" />
    <AlertDescription className="text-yellow-800">
      💪 <strong>Foco en prioridades:</strong> Concéntrate en las 
      <strong> {highPriorityCount} tareas de alta prioridad</strong> primero.
      El resto puede esperar.
    </AlertDescription>
  </Alert>
)}
```

#### Empty State de Tareas
```tsx
<Card className="p-12 text-center">
  <CheckSquare className="h-16 w-16 text-primary mx-auto mb-4" />
  <h2 className="text-2xl font-bold mb-4">
    Todo Listo para Esta Semana ✅
  </h2>
  <p className="text-muted-foreground mb-6">
    Has completado todas tus tareas. El sistema generará nuevas tareas 
    el <strong>próximo lunes</strong> basadas en tus OKRs y leads activos.
  </p>
  <Button onClick={() => navigate('/okrs')}>
    <Target className="mr-2 h-4 w-4" />
    Revisar Progreso de OKRs
  </Button>
</Card>
```

---

### **6. OKRs**

#### Header de OKRs
```tsx
<div className="mb-6">
  <h1 className="text-3xl font-bold mb-2">OKRs {quarter}</h1>
  <p className="text-muted-foreground">
    {onTrackCount} en camino · {atRiskCount} en riesgo · {completedCount} completados
  </p>
</div>

<div className="grid md:grid-cols-3 gap-4 mb-6">
  <Card className="p-4">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Progreso Global</p>
        <p className="text-2xl font-bold">{overallProgress}%</p>
      </div>
      <TrendingUp className="h-8 w-8 text-green-500" />
    </div>
  </Card>
  
  <Card className="p-4">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Días Restantes</p>
        <p className="text-2xl font-bold">{daysLeft}</p>
      </div>
      <Clock className="h-8 w-8 text-blue-500" />
    </div>
  </Card>
  
  <Card className="p-4">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Velocidad</p>
        <p className="text-2xl font-bold">{velocity}%/mes</p>
      </div>
      <Zap className="h-8 w-8 text-yellow-500" />
    </div>
  </Card>
</div>

<Alert className="mb-6">
  <Target className="h-4 w-4" />
  <AlertDescription>
    🎯 <strong>Buen ritmo:</strong> A este paso alcanzarás 
    <strong> {projectedOkrs} de {totalOkrs} OKRs</strong> antes de fin de {quarter}.
    {atRiskCount > 0 && ` Enfócate en los ${atRiskCount} en riesgo.`}
  </AlertDescription>
</Alert>
```

---

### **7. MÉTRICAS / KPIs**

#### Header de Métricas
```tsx
<div className="mb-6">
  <h1 className="text-3xl font-bold mb-2">Dashboard de Métricas</h1>
  <p className="text-muted-foreground">
    Actualizado en tiempo real · Última actualización: {lastUpdate}
  </p>
</div>

<Alert className="bg-blue-50 border-blue-500 mb-6">
  <BarChart3 className="h-4 w-4 text-blue-600" />
  <AlertTitle className="text-blue-900">📊 Métricas Personalizadas</AlertTitle>
  <AlertDescription className="text-blue-800">
    Estas no son métricas genéricas. Son <strong>TUS KPIs</strong> 
    basados en {industryName} y tus objetivos específicos de {quarter}.
  </AlertDescription>
</Alert>
```

---

### **8. GAMIFICACIÓN**

#### Card de Progreso de Usuario
```tsx
<Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
  <div className="flex items-center gap-4 mb-4">
    <Avatar className="h-16 w-16 border-4 border-primary">
      <AvatarImage src={userAvatar} />
      <AvatarFallback>{userInitials}</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <h3 className="text-xl font-bold">{userName}</h3>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Level {level}</Badge>
        <Badge variant="outline">🏆 {totalPoints} pts</Badge>
        {streak >= 7 && <Badge className="bg-orange-500">🔥 {streak} días</Badge>}
      </div>
    </div>
  </div>
  
  <Progress value={progressToNextLevel} className="mb-2" />
  <p className="text-sm text-muted-foreground">
    {pointsToNextLevel} puntos para <strong>Level {level + 1}</strong>
  </p>
  
  {recentBadges.length > 0 && (
    <div className="mt-4 pt-4 border-t">
      <p className="text-sm font-semibold mb-2">Últimos Logros:</p>
      <div className="flex gap-2">
        {recentBadges.map(badge => (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
                  {badge.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  )}
</Card>
```

---

### **9. CONFIGURACIÓN / SETTINGS**

#### Sección de Integraciones
```tsx
<div className="mb-8">
  <h2 className="text-2xl font-bold mb-2">Integraciones</h2>
  <p className="text-muted-foreground mb-6">
    Conecta OPTIMUS-K con las herramientas que ya usas
  </p>
  
  <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
    <Plug className="h-4 w-4 text-blue-600" />
    <AlertTitle className="text-blue-900">
      🔌 No Cambies Tu Forma de Trabajar
    </AlertTitle>
    <AlertDescription className="text-blue-800">
      <strong>OPTIMUS-K se integra con tus herramientas favoritas.</strong> 
      Si tu equipo usa Slack, recibirán notificaciones ahí. Si tienes HubSpot, 
      todo se sincroniza automáticamente. Si prefieres Trello, las tareas 
      aparecerán en tu board. <strong>Y si usas alguna app que no tenemos, 
      Zapier te permite conectarla.</strong>
    </AlertDescription>
  </Alert>
  
  <div className="grid md:grid-cols-2 gap-4">
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Slack</h3>
          <p className="text-sm text-muted-foreground">
            Notificaciones en tiempo real
          </p>
        </div>
        <Button variant="outline" size="sm">Conectar</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Tu equipo recibirá alertas de nuevos leads, tareas completadas y OKRs en riesgo.
      </p>
    </Card>
    
    {/* Repetir para cada integración */}
  </div>
</div>
```

---

### **10. NOTIFICACIONES IN-APP**

#### Notificaciones Motivacionales
```tsx
// Cuando completa una tarea
<Toast>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
      <CheckCircle2 className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="font-semibold">¡Tarea Completada! 🎉</p>
      <p className="text-sm text-muted-foreground">
        +{points} puntos · {tasksLeftToday} tareas restantes hoy
      </p>
    </div>
  </div>
</Toast>

// Cuando gana un lead
<Toast className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
  <div className="flex items-center gap-3">
    <Trophy className="h-8 w-8" />
    <div>
      <p className="font-bold text-lg">💰 ¡Venta Cerrada!</p>
      <p className="text-sm opacity-90">
        +€{leadValue} · Ya llevas €{totalClosedThisMonth} este mes
      </p>
    </div>
  </div>
</Toast>

// Cuando alcanza un milestone
<Toast className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
  <div className="flex items-center gap-3">
    <Award className="h-8 w-8" />
    <div>
      <p className="font-bold text-lg">🏆 ¡Nuevo Logro Desbloqueado!</p>
      <p className="text-sm opacity-90">
        "{achievementName}" · +{bonusPoints} puntos bonus
      </p>
    </div>
  </div>
</Toast>

// Cuando está en racha
<Toast>
  <div className="flex items-center gap-3">
    <Flame className="h-8 w-8 text-orange-500" />
    <div>
      <p className="font-semibold">🔥 Racha de {streak} Días</p>
      <p className="text-sm text-muted-foreground">
        ¡Sigue así! Estás en el top {percentile}% del equipo.
      </p>
    </div>
  </div>
</Toast>
```

---

## 🎨 COMPONENTE REUTILIZABLE: MarketingMessage

### Crear componente para reutilizar mensajes

```tsx
// src/components/marketing/MarketingMessage.tsx

import { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LucideIcon } from "lucide-react";

interface MarketingMessageProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  variant?: "default" | "success" | "info" | "warning";
  className?: string;
}

const variantStyles = {
  default: "bg-muted border-muted-foreground/20",
  success: "bg-green-50 border-green-500 text-green-900",
  info: "bg-blue-50 border-blue-500 text-blue-900",
  warning: "bg-yellow-50 border-yellow-500 text-yellow-900",
};

export function MarketingMessage({
  icon: Icon,
  title,
  message,
  variant = "default",
  className = "",
}: MarketingMessageProps) {
  return (
    <Alert className={`${variantStyles[variant]} ${className}`}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription dangerouslySetInnerHTML={{ __html: message }} />
    </Alert>
  );
}

// Uso:
<MarketingMessage
  icon={Lightbulb}
  title="💡 Consejo Pro"
  message="Los leads con seguimiento semanal tienen <strong>3x más probabilidad</strong> de cerrar."
  variant="info"
/>
```

---

## 📊 MENSAJES POR CONTEXTO

### Mensajes de Éxito
```tsx
const successMessages = {
  taskCompleted: "¡Tarea completada! 🎉 +{points} puntos ganados.",
  leadWon: "💰 ¡Venta cerrada! +€{value} en ventas este mes.",
  okrCompleted: "🎯 ¡OKR alcanzado! Estás cumpliendo objetivos.",
  streakMilestone: "🔥 ¡Racha de {days} días! Eres imparable.",
  levelUp: "🚀 ¡Subiste a Level {level}! Nuevos logros desbloqueados.",
};
```

### Mensajes de Motivación
```tsx
const motivationMessages = {
  lowCompletion: "💪 <strong>Foco en lo importante:</strong> Completa primero las {count} tareas de alta prioridad.",
  noActivity: "👋 Te extrañamos. Tu última actividad fue hace {days} días. ¿Continuamos?",
  weeklyGoal: "🎯 Esta semana tu objetivo es {goal}. Vas {progress}% del camino.",
  behindSchedule: "⚡ <strong>Acelera un poco:</strong> Para cumplir tus OKRs necesitas {velocity}% más de velocidad.",
};
```

### Mensajes de Valor/Diferenciación
```tsx
const valueMessages = {
  integration: "🔌 <strong>Se adapta a ti:</strong> OPTIMUS-K se integra con {appName} que ya usas. Sin cambios en tu workflow.",
  personalization: "🎯 <strong>Tu app única:</strong> Estas métricas son específicas para {industry} y tus objetivos de {quarter}.",
  speed: "⚡ <strong>Setup ultra-rápido:</strong> Mientras la competencia tarda semanas, tú empezaste en 2-3 horas.",
  noVendorLock: "💪 <strong>Sin compromisos:</strong> Cancela cuando quieras. Tus datos siempre son tuyos (exportables en 1 click).",
};
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Prioridad Alta (Implementar Ya)
```
✅ Landing: Sección de integraciones con logos
✅ Landing: Sección "Por Qué OPTIMUS-K"
✅ Onboarding: Mensajes entre secciones
✅ Onboarding: Pantalla final mejorada
✅ Dashboard: Empty states con CTAs
✅ CRM: Header con estadísticas
✅ Tareas: Alertas de progreso semanal
```

### Prioridad Media (Esta Semana)
```
⏳ OKRs: Dashboard de progreso
⏳ Métricas: Alert de personalización
⏳ Settings: Mensajes en integraciones
⏳ Toast notifications motivacionales
⏳ Componente MarketingMessage reutilizable
```

### Prioridad Baja (Próximamente)
```
⏳ Social proof / testimonios
⏳ Tooltips educativos
⏳ Onboarding in-app tours
⏳ Emails transaccionales con mensajes
```

---

## 🎯 KPIs DE ÉXITO

**Medir el impacto de los mensajes:**

1. **Engagement:**
   - ¿Aumenta el % de usuarios que completan onboarding?
   - ¿Mejora la retención semanal?

2. **Conversión:**
   - ¿Más usuarios conectan integraciones?
   - ¿Más usuarios invitan a su equipo?

3. **Satisfacción:**
   - NPS score
   - Feedback en soporte: "La app me entiende"

---

**¿Todo claro? ¿Empezamos a implementar los mensajes prioritarios?** 🚀
