import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Trash2, Wallet, Clock } from 'lucide-react';
import { Step6Props, Founder, FounderCommitment, FundingStrategy } from '@/types/startup-onboarding';

const FUNDING_OPTIONS: { value: FundingStrategy; label: string; description: string }[] = [
  { value: 'bootstrapped', label: 'Bootstrapped', description: 'Sin inversión externa, con recursos propios' },
  { value: 'friends-family', label: 'Friends & Family', description: 'Inversión de conocidos cercanos' },
  { value: 'angel', label: 'Angel Investors', description: 'Inversores ángel individuales' },
  { value: 'vc', label: 'Venture Capital', description: 'Fondos de inversión institucionales' },
  { value: 'crowdfunding', label: 'Crowdfunding', description: 'Financiación colectiva (Kickstarter, etc.)' },
];

const COMMON_SKILLS = [
  'Desarrollo Frontend', 'Desarrollo Backend', 'Diseño UI/UX', 'Marketing Digital',
  'Ventas B2B', 'Finanzas', 'Legal', 'Operaciones', 'Data Science', 'DevOps'
];

export default function StartupStep6Resources({ data, updateData }: Step6Props) {
  const [newSkill, setNewSkill] = useState('');
  const [newFounder, setNewFounder] = useState<Founder>({
    name: '', role: '', expertise: '', commitment: 'full-time'
  });

  const addFounder = () => {
    if (newFounder.name.trim() && newFounder.role.trim()) {
      updateData({ founders: [...data.founders, { ...newFounder }] });
      setNewFounder({ name: '', role: '', expertise: '', commitment: 'full-time' });
    }
  };

  const removeFounder = (index: number) => {
    updateData({ founders: data.founders.filter((_, i) => i !== index) });
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !data.missingSkills.includes(skill)) {
      updateData({ missingSkills: [...data.missingSkills, skill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    updateData({ missingSkills: data.missingSkills.filter((_, i) => i !== index) });
  };

  const monthlyBurnRate = data.capitalNeeded > 0 && data.runwayGoal > 0 
    ? Math.round(data.capitalNeeded / data.runwayGoal)
    : 0;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <Users className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Recursos y Equipo</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Define tu equipo fundador y los recursos que necesitas
        </p>
      </div>

      {/* Founders */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle>Equipo Fundador</CardTitle>
          <CardDescription>¿Quiénes están construyendo esto?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.founders.length > 0 && (
            <div className="space-y-3">
              {data.founders.map((founder, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{founder.name}</h4>
                        <p className="text-sm text-muted-foreground">{founder.role}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{founder.expertise}</Badge>
                          <Badge variant={founder.commitment === 'full-time' ? 'default' : 'outline'}>
                            {founder.commitment}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFounder(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <Label className="font-semibold">➕ Agregar Fundador</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nombre" value={newFounder.name}
                onChange={(e) => setNewFounder({ ...newFounder, name: e.target.value })} />
              <Input placeholder="Rol (CEO, CTO...)" value={newFounder.role}
                onChange={(e) => setNewFounder({ ...newFounder, role: e.target.value })} />
            </div>
            <Input placeholder="Área de expertise" value={newFounder.expertise}
              onChange={(e) => setNewFounder({ ...newFounder, expertise: e.target.value })} />
            <Select value={newFounder.commitment}
              onValueChange={(value) => setNewFounder({ ...newFounder, commitment: value as FounderCommitment })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addFounder} className="w-full" disabled={!newFounder.name.trim() || !newFounder.role.trim()}>
              <Plus className="w-4 h-4 mr-2" />Agregar Fundador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Missing Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills que Faltan</CardTitle>
          <CardDescription>¿Qué capacidades necesitas pero no tienes en el equipo?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMMON_SKILLS.map((skill) => {
              const isSelected = data.missingSkills.includes(skill);
              return (
                <Badge key={skill} variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer" onClick={() => {
                    if (isSelected) removeSkill(data.missingSkills.indexOf(skill));
                    else addSkill(skill);
                  }}>
                  {skill}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Otro skill..." value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)} />
            <Button onClick={() => addSkill(newSkill)} disabled={!newSkill.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Capital */}
      <Card className="border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Capital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capital Actual</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" value={data.currentCapital || ''}
                  onChange={(e) => updateData({ currentCapital: parseFloat(e.target.value) || 0 })}
                  placeholder="10000" />
                <span className="text-muted-foreground">€</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Capital Necesario</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" value={data.capitalNeeded || ''}
                  onChange={(e) => updateData({ capitalNeeded: parseFloat(e.target.value) || 0 })}
                  placeholder="50000" />
                <span className="text-muted-foreground">€</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Estrategia de Financiación</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={data.fundingStrategy}
            onValueChange={(value) => updateData({ fundingStrategy: value as FundingStrategy })}>
            <div className="space-y-3">
              {FUNDING_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label htmlFor={option.value} className="cursor-pointer flex-1">
                    <span className="font-semibold">{option.label}</span>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Runway Goal */}
      <Card className="border-2 border-blue-300 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Runway Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meses de runway objetivo</Label>
            <Input type="number" min="1" max="36" value={data.runwayGoal || ''}
              onChange={(e) => updateData({ runwayGoal: parseInt(e.target.value) || 0 })}
              placeholder="12" />
          </div>
          {monthlyBurnRate > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-muted-foreground">Burn rate estimado:</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                €{monthlyBurnRate.toLocaleString()}/mes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🎯 Tips para este paso:</h4>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
          <li>Al menos 1 fundador debe estar full-time para que funcione</li>
          <li>18 meses de runway es ideal para startups seed</li>
          <li>Identifica skills faltantes ANTES de necesitarlas</li>
        </ul>
      </div>
    </div>
  );
}
