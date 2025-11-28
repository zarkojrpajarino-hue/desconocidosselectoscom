import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ConfettiEffect from './ConfettiEffect';

interface BadgeUnlockAnimationProps {
  badge: {
    name: string;
    description: string;
    icon_emoji: string;
    rarity: string;
  } | null;
  onClose: () => void;
}

const BadgeUnlockAnimation = ({ badge, onClose }: BadgeUnlockAnimationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (badge) {
      setShowConfetti(true);
      // Auto-cerrar después de 5 segundos
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  if (!badge) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-500 to-orange-500';
      case 'epic':
        return 'from-purple-500 to-pink-500';
      case 'rare':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <>
      <ConfettiEffect trigger={showConfetti} type="badge" />
      <Dialog open={!!badge} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-6 py-6">
            {/* Badge icon con animación */}
            <div className="relative">
              <div
                className={`
                  w-32 h-32 mx-auto rounded-full
                  bg-gradient-to-br ${getRarityColor(badge.rarity)}
                  flex items-center justify-center
                  animate-pulse
                  shadow-2xl
                `}
              >
                <span className="text-6xl animate-bounce">{badge.icon_emoji}</span>
              </div>
              
              {/* Anillo brillante */}
              <div
                className={`
                  absolute inset-0 w-32 h-32 mx-auto rounded-full
                  bg-gradient-to-br ${getRarityColor(badge.rarity)}
                  opacity-20 blur-xl
                  animate-ping
                `}
              />
            </div>

            {/* Texto */}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ¡Nuevo Badge Desbloqueado!
              </h2>
              
              <Badge className={`text-lg px-4 py-1 bg-gradient-to-r ${getRarityColor(badge.rarity)}`}>
                {badge.rarity.toUpperCase()}
              </Badge>

              <p className="text-2xl font-bold">{badge.name}</p>
              
              <p className="text-muted-foreground">{badge.description}</p>
            </div>

            {/* Estrellas decorativas */}
            <div className="flex justify-center gap-2 text-3xl">
              <span className="animate-pulse">✨</span>
              <span className="animate-pulse delay-100">⭐</span>
              <span className="animate-pulse delay-200">✨</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BadgeUnlockAnimation;
