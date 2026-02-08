'use client';

import { useEffect, useState } from 'react';
import {
  Cpu,
  Globe,
  TrendingUp,
  Atom,
  Code,
  Trophy,
  Clapperboard,
  Heart,
  Hash,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabase';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu,
  Globe,
  TrendingUp,
  Atom,
  Code,
  Trophy,
  Clapperboard,
  Heart,
};

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  subreddits: string[];
  rss_feeds: string[];
  is_active: boolean;
  is_custom: boolean;
  sort_order: number;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('topics')
        .select('*')
        .order('sort_order');
      setTopics((data as Topic[]) || []);
      setLoading(false);
    }
    fetchTopics();
  }, []);

  async function toggleTopic(id: string, isActive: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (res.ok) {
        setTopics((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: isActive } : t))
        );
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
        <p className="mt-1 text-muted-foreground">
          Toggle topics on/off to customize your daily digest.
        </p>
      </div>

      <div className="space-y-3">
        {topics.map((topic) => {
          const Icon = (topic.icon && iconMap[topic.icon]) || Hash;

          return (
            <Card
              key={topic.id}
              className={
                topic.is_active ? '' : 'opacity-60'
              }
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{topic.name}</h3>
                    {topic.is_custom && (
                      <Badge variant="outline" className="text-xs">
                        Custom
                      </Badge>
                    )}
                  </div>
                  {topic.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {topic.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {topic.subreddits.slice(0, 3).map((sub) => (
                      <Badge
                        key={sub}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        r/{sub}
                      </Badge>
                    ))}
                    {topic.subreddits.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        +{topic.subreddits.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Switch
                  checked={topic.is_active}
                  onCheckedChange={(checked) => toggleTopic(topic.id, checked)}
                  className={toggling === topic.id ? 'opacity-50' : ''}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
