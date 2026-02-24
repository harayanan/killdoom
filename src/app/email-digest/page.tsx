'use client';

import { useEffect, useState } from 'react';
import {
  Mail,
  Loader2,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Topic {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
}

interface Subscription {
  id: string;
  email: string;
  topic_ids: string[];
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
}

export default function EmailDigestPage() {
  const [email, setEmail] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await fetch('/api/topics');
        const json = await res.json();
        setTopics((json.topics as Topic[]) || []);
      } catch {
        console.error('Failed to load topics');
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, []);

  async function lookupSubscription() {
    if (!email.trim()) return;

    setLookingUp(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/email-subscription?email=${encodeURIComponent(email.trim())}`);
      const json = await res.json();

      if (json.subscription) {
        setSubscription(json.subscription);
        setSelectedTopics(new Set(json.subscription.topic_ids || []));
        setMessage({ type: 'success', text: 'Subscription found! Update your preferences below.' });
      } else {
        setSubscription(null);
        // Pre-select all active topics for new subscribers
        setSelectedTopics(new Set(topics.filter((t) => t.is_active).map((t) => t.id)));
        setMessage(null);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to look up subscription.' });
    } finally {
      setLookingUp(false);
    }
  }

  function toggleTopic(topicId: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  }

  async function subscribe() {
    if (!email.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/email-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          topic_ids: Array.from(selectedTopics),
          is_active: true,
        }),
      });

      const json = await res.json();

      if (res.ok && json.subscription) {
        setSubscription(json.subscription);
        setMessage({ type: 'success', text: 'Subscribed! You\'ll receive daily digests at 6 AM UTC.' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to subscribe.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function unsubscribe() {
    if (!email.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/email-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          is_active: false,
        }),
      });

      const json = await res.json();

      if (res.ok && json.subscription) {
        setSubscription(json.subscription);
        setMessage({ type: 'success', text: 'Unsubscribed. You won\'t receive any more digests.' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to unsubscribe.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeTopics = topics.filter((t) => t.is_active);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Email Digest</h1>
        </div>
        <p className="text-muted-foreground">
          Get your daily KillDoom digest delivered to your inbox at 6 AM UTC. Choose which topics to include.
        </p>
      </div>

      {/* Email input */}
      <Card className="mb-6">
        <CardContent className="py-5">
          <label className="text-sm font-medium mb-2 block">Email address</label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupSubscription()}
            />
            <Button
              onClick={lookupSubscription}
              disabled={!email.trim() || lookingUp}
              variant="secondary"
            >
              {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look up'}
            </Button>
          </div>

          {/* Status indicator */}
          {subscription && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              {subscription.is_active ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Active subscription</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-600">Subscription paused</span>
                </>
              )}
              {subscription.last_sent_at && (
                <span className="text-muted-foreground ml-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last sent: {new Date(subscription.last_sent_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Topic selection */}
      <Card className="mb-6">
        <CardContent className="py-5">
          <label className="text-sm font-medium mb-3 block">
            Topics to include ({selectedTopics.size} selected)
          </label>
          <div className="space-y-2">
            {activeTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  selectedTopics.has(topic.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <span className="font-medium text-sm">{topic.name}</span>
                {selectedTopics.has(topic.id) && (
                  <Badge variant="default" className="text-xs">
                    Selected
                  </Badge>
                )}
              </button>
            ))}
          </div>
          {activeTopics.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No active topics available.</p>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={subscribe}
          disabled={!email.trim() || selectedTopics.size === 0 || saving}
          className="flex-1"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          {subscription ? 'Update Subscription' : 'Subscribe'}
        </Button>

        {subscription?.is_active && (
          <Button
            onClick={unsubscribe}
            disabled={saving}
            variant="secondary"
          >
            Unsubscribe
          </Button>
        )}
      </div>
    </div>
  );
}
