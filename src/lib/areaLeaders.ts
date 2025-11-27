/**
 * User areas and leaders configuration
 */

export const userAreas: Record<string, string> = {
  zarko: 'direccion',
  angel: 'redes',
  carla: 'redes',
  miguel: 'operaciones',
  fer: 'leads',
  fernando: 'ventas',
  manu: 'analiticas',
  casti: 'cumplimiento',
  diego: 'innovacion'
};

export const areaLeaders: Record<string, string[]> = {
  direccion: ['zarko'],
  redes: ['angel', 'carla'],
  operaciones: ['miguel'],
  leads: ['fer'],
  ventas: ['fernando'],
  analiticas: ['manu'],
  cumplimiento: ['casti'],
  innovacion: ['diego']
};

export const getLeadersForArea = (area: string): string[] => {
  return areaLeaders[area] || [];
};

export const isUserLeaderOfArea = (userId: string, area: string): boolean => {
  const leaders = areaLeaders[area] || [];
  return leaders.includes(userId);
};

export const getLeaderDisplayName = (leaders: string[]): string => {
  if (leaders.length === 0) return 'Sin líder';
  if (leaders.length === 1) return leaders[0];
  return leaders.join(' & ');
};
