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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

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

interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  slug: string;
  description: string | null;
  region: string | null;
  subreddits: string[];
  rss_feeds_news: string[];
  rss_feeds_individual: string[];
  hn_tags: string[];
  is_active: boolean;
  sort_order: number;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [subtopicsByTopic, setSubtopicsByTopic] = useState<Record<string, Subtopic[]>>({});
  const [subtopicLoading, setSubtopicLoading] = useState<string | null>(null);
  const [subtopicToggling, setSubtopicToggling] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      const res = await fetch('/api/topics');
      const json = await res.json();
      const fetchedTopics = (json.topics as Topic[]) || [];
      setTopics(fetchedTopics);

      // Load subtopics for all topics so badges show immediately
      const subtopicResults: Record<string, Subtopic[]> = {};
      await Promise.all(
        fetchedTopics.map(async (t) => {
          try {
            const stRes = await fetch(`/api/subtopics?topic_id=${t.id}`);
            const stJson = await stRes.json();
            subtopicResults[t.id] = (stJson.subtopics as Subtopic[]) || [];
          } catch {
            subtopicResults[t.id] = [];
          }
        })
      );
      setSubtopicsByTopic(subtopicResults);
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

  async function toggleExpand(topicId: string) {
    const newExpanded = new Set(expandedTopics);

    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
      setExpandedTopics(newExpanded);
      return;
    }

    newExpanded.add(topicId);
    setExpandedTopics(newExpanded);

    // Fetch subtopics if not already loaded
    if (!subtopicsByTopic[topicId]) {
      setSubtopicLoading(topicId);
      try {
        const res = await fetch(`/api/subtopics?topic_id=${topicId}`);
        const json = await res.json();
        setSubtopicsByTopic((prev) => ({
          ...prev,
          [topicId]: (json.subtopics as Subtopic[]) || [],
        }));
      } catch (err) {
        console.error('Failed to fetch subtopics:', err);
      } finally {
        setSubtopicLoading(null);
      }
    }
  }

  async function toggleSubtopic(subtopicId: string, topicId: string, isActive: boolean) {
    setSubtopicToggling(subtopicId);
    try {
      const res = await fetch(`/api/subtopics/${subtopicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (res.ok) {
        setSubtopicsByTopic((prev) => ({
          ...prev,
          [topicId]: (prev[topicId] || []).map((st) =>
            st.id === subtopicId ? { ...st, is_active: isActive } : st
          ),
        }));
      }
    } catch (err) {
      console.error('Subtopic toggle failed:', err);
    } finally {
      setSubtopicToggling(null);
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
          Toggle topics on/off to customize your daily digest. Expand to manage subtopics.
        </p>
      </div>

      <div className="space-y-3">
        {topics.map((topic) => {
          const Icon = (topic.icon && iconMap[topic.icon]) || Hash;
          const isExpanded = expandedTopics.has(topic.id);
          const subtopics = subtopicsByTopic[topic.id] || [];
          const isLoadingSubtopics = subtopicLoading === topic.id;

          return (
            <div key={topic.id}>
              <Card className={topic.is_active ? '' : 'opacity-60'}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleExpand(topic.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-primary" />
                      )}
                    </button>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className="h-5 w-5 text-primary shrink-0" />
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
                        {subtopicsByTopic[topic.id] && subtopicsByTopic[topic.id].length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {subtopicsByTopic[topic.id].filter((st) => st.is_active).slice(0, 3).map((st) => (
                              <Badge
                                key={st.id}
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {st.name}
                              </Badge>
                            ))}
                            {subtopicsByTopic[topic.id].filter((st) => st.is_active).length > 3 && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                +{subtopicsByTopic[topic.id].filter((st) => st.is_active).length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Switch
                      checked={topic.is_active}
                      onCheckedChange={(checked) => toggleTopic(topic.id, checked)}
                      className={toggling === topic.id ? 'opacity-50' : ''}
                    />
                  </div>

                  {/* Subtopics accordion */}
                  {isExpanded && (
                    <div className="mt-4 ml-14 space-y-2 border-l-2 border-border pl-4">
                      {isLoadingSubtopics ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Loading subtopics...</span>
                        </div>
                      ) : subtopics.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-2">
                          No subtopics configured yet.
                        </p>
                      ) : (
                        subtopics.map((st) => (
                          <div
                            key={st.id}
                            className={`flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 px-3 py-2.5 ${
                              !st.is_active ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{st.name}</span>
                                {st.region && (
                                  <Badge variant="outline" className="text-xs">
                                    {st.region}
                                  </Badge>
                                )}
                              </div>
                              {st.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                  {st.description}
                                </p>
                              )}
                              <div className="mt-1 flex flex-wrap gap-1">
                                {st.subreddits.slice(0, 2).map((sub) => (
                                  <Badge
                                    key={sub}
                                    variant="secondary"
                                    className="text-[10px] font-normal"
                                  >
                                    r/{sub}
                                  </Badge>
                                ))}
                                {st.hn_tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-[10px] font-normal"
                                  >
                                    HN:{tag}
                                  </Badge>
                                ))}
                                {(st.subreddits.length + st.hn_tags.length) > 4 && (
                                  <Badge variant="secondary" className="text-[10px] font-normal">
                                    +{st.subreddits.length + st.hn_tags.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Switch
                              checked={st.is_active}
                              onCheckedChange={(checked) =>
                                toggleSubtopic(st.id, topic.id, checked)
                              }
                              className={subtopicToggling === st.id ? 'opacity-50' : ''}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
