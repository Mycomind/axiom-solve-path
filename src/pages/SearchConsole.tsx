import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend,
} from 'recharts';
import { Search, MousePointerClick, Eye, Percent, TrendingUp, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Site = { siteUrl: string; permissionLevel: string };
type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
type Sitemap = { path: string; lastSubmitted?: string; isPending?: boolean; errors?: string; warnings?: string; contents?: { type: string; submitted: string; indexed: string }[] };

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 28 days', days: 28 },
  { label: 'Last 90 days', days: 90 },
];

async function call(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('search-console', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return (data as { data: unknown }).data;
}

export default function SearchConsole() {
  const [sites, setSites] = useState<Site[]>([]);
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [byDate, setByDate] = useState<Row[]>([]);
  const [byQuery, setByQuery] = useState<Row[]>([]);
  const [byPage, setByPage] = useState<Row[]>([]);
  const [byDevice, setByDevice] = useState<Row[]>([]);
  const [sitemaps, setSitemaps] = useState<Sitemap[]>([]);

  const range = useMemo(() => ({
    startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
  }), [days]);

  useEffect(() => {
    (async () => {
      try {
        const res = await call('list_sites') as { siteEntry?: Site[] };
        const list = res?.siteEntry ?? [];
        setSites(list);
        if (list[0]) setSiteUrl(list[0].siteUrl);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load sites');
      }
    })();
  }, []);

  const refresh = async () => {
    if (!siteUrl) return;
    setLoading(true);
    try {
      const [d, q, p, dev, sm] = await Promise.all([
        call('search_analytics', { siteUrl, ...range, dimensions: ['date'], rowLimit: 1000 }),
        call('search_analytics', { siteUrl, ...range, dimensions: ['query'], rowLimit: 25 }),
        call('search_analytics', { siteUrl, ...range, dimensions: ['page'], rowLimit: 25 }),
        call('search_analytics', { siteUrl, ...range, dimensions: ['device'], rowLimit: 10 }),
        call('sitemaps', { siteUrl }).catch(() => ({ sitemap: [] })),
      ]);
      setByDate(((d as { rows?: Row[] }).rows ?? []).sort((a, b) => (a.keys?.[0] ?? '').localeCompare(b.keys?.[0] ?? '')));
      setByQuery((q as { rows?: Row[] }).rows ?? []);
      setByPage((p as { rows?: Row[] }).rows ?? []);
      setByDevice((dev as { rows?: Row[] }).rows ?? []);
      setSitemaps((sm as { sitemap?: Sitemap[] }).sitemap ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (siteUrl) refresh(); /* eslint-disable-next-line */ }, [siteUrl, days]);

  const totals = useMemo(() => {
    const t = byDate.reduce((acc, r) => ({
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
      position: acc.position + r.position,
    }), { clicks: 0, impressions: 0, position: 0 });
    return {
      clicks: t.clicks,
      impressions: t.impressions,
      ctr: t.impressions ? (t.clicks / t.impressions) * 100 : 0,
      position: byDate.length ? t.position / byDate.length : 0,
    };
  }, [byDate]);

  const chartData = byDate.map(r => ({
    date: r.keys?.[0] ?? '',
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: +(r.ctr * 100).toFixed(2),
    position: +r.position.toFixed(1),
  }));

  const errorSitemaps = sitemaps.filter(s => Number(s.errors ?? 0) > 0 || Number(s.warnings ?? 0) > 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Search className="w-8 h-8 text-primary" />
              Search Console
            </h1>
            <p className="text-muted-foreground mt-1">Impressions, clicks, CTR & indexing health over time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={siteUrl} onValueChange={setSiteUrl}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select a site" /></SelectTrigger>
              <SelectContent>
                {sites.map(s => <SelectItem key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</SelectItem>)}
                {sites.length === 0 && <SelectItem value="__none" disabled>No verified sites</SelectItem>}
              </SelectContent>
            </Select>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGES.map(r => <SelectItem key={r.days} value={String(r.days)}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {sites.length === 0 && (
          <Card className="p-6 border-dashed">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">No verified sites yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Publish your app and verify it in Search Console (we already added the verification meta tag to <code>index.html</code>).
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={MousePointerClick} label="Clicks" value={totals.clicks.toLocaleString()} />
          <Stat icon={Eye} label="Impressions" value={totals.impressions.toLocaleString()} />
          <Stat icon={Percent} label="CTR" value={`${totals.ctr.toFixed(2)}%`} />
          <Stat icon={TrendingUp} label="Avg position" value={totals.position.toFixed(1)} />
        </div>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Performance over time</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Tabs defaultValue="queries">
          <TabsList>
            <TabsTrigger value="queries">Top queries</TabsTrigger>
            <TabsTrigger value="pages">Top pages</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="indexing">Indexing</TabsTrigger>
          </TabsList>

          <TabsContent value="queries">
            <RowsTable rows={byQuery} keyLabel="Query" />
          </TabsContent>
          <TabsContent value="pages">
            <RowsTable rows={byPage} keyLabel="Page" linkify />
          </TabsContent>
          <TabsContent value="devices">
            <Card className="p-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDevice.map(r => ({ device: r.keys?.[0], clicks: r.clicks, impressions: r.impressions }))}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="device" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="clicks" fill="hsl(var(--primary))" />
                    <Bar dataKey="impressions" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="indexing">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Sitemaps</h3>
                {errorSitemaps.length > 0 && (
                  <Badge variant="destructive">{errorSitemaps.length} with issues</Badge>
                )}
              </div>
              {sitemaps.length === 0 && <p className="text-sm text-muted-foreground">No sitemaps submitted to Search Console yet.</p>}
              <div className="divide-y divide-border">
                {sitemaps.map(s => (
                  <div key={s.path} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-sm truncate">{s.path}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.lastSubmitted ? `Submitted ${format(new Date(s.lastSubmitted), 'PP')}` : 'Not submitted'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {Number(s.errors ?? 0) > 0 && <Badge variant="destructive">{s.errors} errors</Badge>}
                      {Number(s.warnings ?? 0) > 0 && <Badge variant="secondary">{s.warnings} warnings</Badge>}
                      {Number(s.errors ?? 0) === 0 && Number(s.warnings ?? 0) === 0 && <Badge>OK</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function RowsTable({ rows, keyLabel, linkify }: { rows: Row[]; keyLabel: string; linkify?: boolean }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">{keyLabel}</th>
              <th className="text-right px-4 py-2">Clicks</th>
              <th className="text-right px-4 py-2">Impr.</th>
              <th className="text-right px-4 py-2">CTR</th>
              <th className="text-right px-4 py-2">Pos.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => {
              const k = r.keys?.[0] ?? '';
              return (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-2 max-w-[420px] truncate">
                    {linkify ? (
                      <a href={k} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        {k} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : k}
                  </td>
                  <td className="px-4 py-2 text-right">{r.clicks.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{r.impressions.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{(r.ctr * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right">{r.position.toFixed(1)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No data for this range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
