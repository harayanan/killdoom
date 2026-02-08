import Link from 'next/link';
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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { truncate } from '@/lib/utils';

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

interface TopicCardProps {
  topic: {
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
  };
  digest: {
    summary: string;
    key_takeaways: string[];
    post_count: number;
    digest_date: string;
  } | null;
}

export function TopicCard({ topic, digest }: TopicCardProps) {
  const Icon = (topic.icon && iconMap[topic.icon]) || Hash;

  return (
    <Link href={`/topic/${topic.slug}`}>
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-card/80">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>{topic.name}</CardTitle>
              {topic.description && (
                <CardDescription className="mt-0.5">
                  {topic.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {digest ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {truncate(digest.summary, 200)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {digest.key_takeaways.slice(0, 2).map((takeaway, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {truncate(takeaway, 50)}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{digest.post_count} posts</span>
                <span>{digest.digest_date}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No digest yet. Waiting for the next cron run.
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
