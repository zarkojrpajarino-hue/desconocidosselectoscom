/**
 * @fileoverview Configuración centralizada de integraciones
 */

import { 
  MessageSquare, 
  Link2, 
  Calendar, 
  ListTodo, 
  LayoutDashboard, 
  Zap,
  Mail
} from 'lucide-react';
import type { IntegrationType, IntegrationConfig, PlanLevel } from './types';

export const INTEGRATION_CONFIG: Record<Exclude<IntegrationType, 'all'>, IntegrationConfig> = {
  slack: {
    icon: <MessageSquare className="h-4 w-4" />,
    label: 'Slack',
    colorClass: 'text-blue-400',
    minPlan: 'professional',
    endpoint: 'slack-notify'
  },
  hubspot: {
    icon: <Link2 className="h-4 w-4" />,
    label: 'HubSpot',
    colorClass: 'text-orange-500',
    minPlan: 'professional',
    endpoint: 'sync-to-hubspot'
  },
  calendar: {
    icon: <Calendar className="h-4 w-4" />,
    label: 'Google Calendar',
    colorClass: 'text-blue-500',
    minPlan: 'starter',
    endpoint: 'sync-calendar-events'
  },
  outlook: {
    icon: <Mail className="h-4 w-4" />,
    label: 'Outlook Calendar',
    colorClass: 'text-blue-600',
    minPlan: 'professional',
    endpoint: 'sync-outlook-events'
  },
  asana: {
    icon: <ListTodo className="h-4 w-4" />,
    label: 'Asana',
    colorClass: 'text-rose-500',
    minPlan: 'professional',
    endpoint: 'sync-to-asana'
  },
  trello: {
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Trello',
    colorClass: 'text-sky-600',
    minPlan: 'professional',
    endpoint: 'sync-to-trello'
  },
  zapier: {
    icon: <Zap className="h-4 w-4" />,
    label: 'Zapier',
    colorClass: 'text-orange-600',
    minPlan: 'professional',
    endpoint: 'trigger-webhook'
  }
};

export const PLAN_ORDER: Record<string, number> = {
  'free': 0,
  'trial': 0,
  'starter': 1,
  'professional': 2,
  'enterprise': 3
};

export function getIntegrationConfig(type: Exclude<IntegrationType, 'all'>): IntegrationConfig {
  return INTEGRATION_CONFIG[type];
}

export function getAllIntegrationTypes(): Exclude<IntegrationType, 'all'>[] {
  return Object.keys(INTEGRATION_CONFIG) as Exclude<IntegrationType, 'all'>[];
}

export function isValidIntegrationType(type: string): type is Exclude<IntegrationType, 'all'> {
  return type in INTEGRATION_CONFIG;
}

export function getPlanDisplayName(plan: PlanLevel): string {
  const names: Record<PlanLevel, string> = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise'
  };
  return names[plan];
}
