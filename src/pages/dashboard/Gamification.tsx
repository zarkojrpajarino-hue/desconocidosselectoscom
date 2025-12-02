import GamificationDashboard from '@/components/GamificationDashboard';
import { SectionTourButton } from '@/components/SectionTourButton';

const Gamification = () => {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            🏆 Gamificación
          </h1>
          <p className="text-muted-foreground">
            Tu progreso, badges y ranking en el equipo
          </p>
        </div>
        <SectionTourButton sectionId="gamification" />
      </div>

      <GamificationDashboard />
    </div>
  );
};

export default Gamification;
