import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';
import type { SocialPost } from '@/types/ai-resources.types';

interface SocialPostsDisplayProps {
  posts: SocialPost[];
}

export const SocialPostsDisplay = ({ posts }: SocialPostsDisplayProps) => {
  const copyPost = (post: SocialPost) => {
    const text = `${post.caption}\n\n${post.hashtags.join(' ')}`.trim();
    navigator.clipboard.writeText(text);
    toast.success('Post copiado al portapapeles');
  };
  
  if (!posts?.length) {
    return <p className="text-muted-foreground">No hay posts generados.</p>;
  }
  
  const groupedByPlatform = posts.reduce((acc, post) => {
    if (!acc[post.platform]) acc[post.platform] = [];
    acc[post.platform].push(post);
    return acc;
  }, {} as Record<string, SocialPost[]>);
  
  const pillarColors: Record<string, string> = {
    'Educational': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    'Entertaining': 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
    'Promotional': 'bg-green-500/10 text-green-700 dark:text-green-400',
    'Behind-the-scenes': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  };
  
  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      'Instagram': '📷',
      'LinkedIn': '💼',
      'Facebook': '📘',
      'Twitter': '🐦',
      'TikTok': '🎵',
    };
    return icons[platform] || '📱';
  };
  
  const platforms = Object.keys(groupedByPlatform);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">📱 Ideas de Posts para Redes Sociales</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {posts.length} posts listos para publicar
        </p>
      </div>
      
      <Tabs defaultValue={platforms[0]} className="w-full">
        <TabsList className="w-full flex">
          {platforms.map(platform => (
            <TabsTrigger key={platform} value={platform} className="flex-1">
              {getPlatformIcon(platform)} {platform}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {platforms.map(platform => (
          <TabsContent key={platform} value={platform} className="space-y-4 mt-4">
            {groupedByPlatform[platform].map((post, idx) => (
              <Card key={idx} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{post.post_type}</Badge>
                        <Badge className={pillarColors[post.content_pillar] || ''}>
                          {post.content_pillar}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Mejor momento: {post.best_time_to_post}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => copyPost(post)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="bg-muted border-l-4 border-primary p-4 rounded">
                    <p className="text-xs font-medium text-primary mb-2">🎨 Visual sugerido:</p>
                    <p className="text-sm">{post.visual_description}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium mb-2">📝 CAPTION:</p>
                    <div className="bg-card border rounded-lg p-4">
                      <p className="text-sm whitespace-pre-line">{post.caption}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4" />
                      <p className="text-xs font-medium">HASHTAGS:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
