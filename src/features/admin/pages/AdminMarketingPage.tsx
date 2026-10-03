import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Coins,
  Filter,
  MousePointerClick,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  useMarketingFunnel,
  useMarketingOverview,
  useMarketingPlatforms,
  useMarketingTimeline,
} from '../../marketing/api/useMarketing';
import type { MarketingGroupBy, TrafficPlatform } from '../../../types/enums';
import { TrafficPlatform as TrafficPlatformEnum, MarketingGroupBy as MarketingGroupByEnum } from '../../../types/enums';
import type { MarketingQueryParams } from '../../../types';
import { formatPrice } from '../../../lib/utils/currency';
import { Button } from '../../../components/ui/Button';

/** Palette shared with the sales dashboard so both read as one product. */
const CHART_COLORS = ['#008060', '#1d8cf8', '#f59e0b', '#e11d48', '#7c3aed', '#0f766e', '#64748b', '#0891b2', '#b45309'];

/** Fixed order so a platform keeps the same colour across every chart. */
const PLATFORM_ORDER: TrafficPlatform[] = [
  'META',
  'GOOGLE',
  'TIKTOK',
  'WHATSAPP',
  'EMAIL',
  'ORGANIC',
  'DIRECT',
  'REFERRAL',
  'UNKNOWN',
];

const PLATFORM_LABELS: Record<TrafficPlatform, string> = {
  META: 'Meta (Facebook / Instagram)',
  GOOGLE: 'Google Ads',
  TIKTOK: 'TikTok Ads',
  ORGANIC: 'Organique (SEO)',
  DIRECT: 'Direct',
  REFERRAL: 'Sites référents',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  UNKNOWN: 'Non attribué',
};

const GROUP_BY_OPTIONS: Array<{ value: MarketingGroupBy; label: string }> = [
  { value: MarketingGroupByEnum.DAY, label: 'Par jour' },
  { value: MarketingGroupByEnum.WEEK, label: 'Par semaine' },
  { value: MarketingGroupByEnum.MONTH, label: 'Par mois' },
];

const PRESETS = [
  { key: '7days', label: '7 derniers jours', days: 7 },
  { key: '30days', label: '30 derniers jours', days: 30 },
  { key: '90days', label: '90 derniers jours', days: 90 },
] as const;

type PresetKey = (typeof PRESETS)[number]['key'] | 'custom';

const toNumber = (value: unknown): number => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toIsoDate = (date: Date): string => date.toISOString().split('T')[0];

const percent = (value: number, digits = 1): string =>
  `${value.toLocaleString('fr-FR', { maximumFractionDigits: digits })} %`;

/** `YYYY-Www` and `YYYY-MM` buckets are not valid dates for `Date.parse`. */
const formatBucketLabel = (bucket: string): string => {
  if (/^\d{4}-\d{2}$/.test(bucket)) {
    const [year, month] = bucket.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('fr-FR', {
      month: 'short',
      year: '2-digit',
    });
  }
  if (/^\d{4}-W\d{2}$/.test(bucket)) return `S${bucket.split('-W')[1]} ${bucket.slice(0, 4)}`;
  return new Date(bucket).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const shortNumber = (value: number): string =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`
    : value >= 1_000
      ? `${(value / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`
      : String(value);

export const AdminMarketingPage: React.FC = () => {
  const [startDate, setStartDate] = useState(() =>
    toIsoDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000))
  );
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [platform, setPlatform] = useState<TrafficPlatform | ''>('');
  const [groupBy, setGroupBy] = useState<MarketingGroupBy>(MarketingGroupByEnum.DAY);
  const [activePreset, setActivePreset] = useState<PresetKey>('30days');

  const params: MarketingQueryParams = useMemo(
    () => ({
      startDate,
      endDate,
      groupBy,
      ...(platform ? { platform } : {}),
    }),
    [startDate, endDate, groupBy, platform]
  );

  const overviewQuery = useMarketingOverview(params);
  const funnelQuery = useMarketingFunnel(params);
  const platformsQuery = useMarketingPlatforms(params);
  const timelineQuery = useMarketingTimeline(params);

  const overview = overviewQuery.data;
  const funnel = funnelQuery.data;

  // Defaulted inside useMemo: a fresh `[]` literal on every render would
  // invalidate every downstream memo.
  const platforms = useMemo(() => platformsQuery.data?.data ?? [], [platformsQuery.data]);
  const timeline = useMemo(() => timelineQuery.data ?? [], [timelineQuery.data]);

  const isLoading = overviewQuery.isLoading;
  const isError = overviewQuery.isError;
  const refetchAll = () => {
    void overviewQuery.refetch();
    void funnelQuery.refetch();
    void platformsQuery.refetch();
    void timelineQuery.refetch();
  };

  const handlePresetChange = (preset: (typeof PRESETS)[number]) => {
    setActivePreset(preset.key);

    const end = new Date();
    setEndDate(toIsoDate(end));

    const start = new Date(end);
    start.setDate(start.getDate() - (preset.days - 1));
    setStartDate(toIsoDate(start));
  };

  // --- Derived KPIs --------------------------------------------------------
  const kpis = useMemo(() => {
    const revenue = toNumber(overview?.revenue);
    const orders = toNumber(overview?.orders);
    const spend = toNumber(overview?.spend);
    const sessions = toNumber(overview?.sessions);
    const purchases = toNumber(funnel?.purchases);

    return {
      revenue,
      orders,
      spend,
      sessions,
      purchases,
      aov: toNumber(overview?.aov),
      roas: toNumber(overview?.roas),
      cancelRate: toNumber(overview?.cancelRate),
      metaCapiSent: toNumber(overview?.metaCapiSent),
      /** Conversion rate per visit: paid orders over tracked sessions. */
      cvr: sessions > 0 ? (purchases / sessions) * 100 : 0,
      /** Cost per order: ad spend divided by paid orders. */
      cpo: orders > 0 ? spend / orders : 0,
      /** Marketing efficiency ratio: revenue per unit of spend. */
      mer: spend > 0 ? revenue / spend : 0,
    };
  }, [overview, funnel]);

  /** Platform comparison is only trustworthy once attribution is wired up. */
  const attributionMissing = useMemo(() => {
    const hasOrders = platforms.some((item) => toNumber(item.orders) > 0);
    return kpis.orders > 0 && !hasOrders;
  }, [platforms, kpis.orders]);

  const spendMissing = kpis.orders > 0 && kpis.spend === 0;

  // --- Funnel --------------------------------------------------------------
  const funnelSteps = useMemo(() => {
    if (!funnel) return [];
    const raw = [
      { label: 'Sessions', value: toNumber(funnel.sessions), icon: Users },
      { label: 'Pages vues', value: toNumber(funnel.pageViews), icon: MousePointerClick },
      { label: 'Ajouts au panier', value: toNumber(funnel.addToCart), icon: ShoppingCart },
      { label: 'Checkout', value: toNumber(funnel.initiateCheckout), icon: Target },
      { label: 'Achats', value: toNumber(funnel.purchases), icon: Coins },
    ];
    return raw.map((step, index) => ({
      ...step,
      shareOfTop: raw[0].value > 0 ? (step.value / raw[0].value) * 100 : 0,
      stepRate: index === 0 ? 100 : raw[index - 1].value > 0 ? (step.value / raw[index - 1].value) * 100 : 0,
    }));
  }, [funnel]);

  // --- Timeline chart ------------------------------------------------------
  const chart = useMemo(() => {
    const points = timeline
      .map((point) => ({ date: point.date, revenue: toNumber(point.revenue), orders: toNumber(point.orders) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const maxRevenue = Math.max(...points.map((p) => p.revenue), 1);
    return points.map((point) => ({
      ...point,
      heightPercent: point.revenue > 0 ? Math.max(6, Math.round((point.revenue / maxRevenue) * 100)) : 2,
    }));
  }, [timeline]);

  // --- Platform donut ------------------------------------------------------
  const platformChart = useMemo(() => {
    const items = PLATFORM_ORDER.map((key, index) => {
      const stat = platforms.find((item) => item.platform === key);
      return {
        platform: key,
        label: PLATFORM_LABELS[key],
        color: CHART_COLORS[index % CHART_COLORS.length],
        revenue: toNumber(stat?.revenue),
        orders: toNumber(stat?.orders),
        spend: toNumber(stat?.spend),
        roas: toNumber(stat?.roas),
      };
    }).filter((item) => item.orders > 0 || item.revenue > 0 || item.spend > 0);

    const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0);

    // Immutable accumulation: a mutable `offset` counter would break purity.
    const segments = items
      .reduce<{ segments: string[]; offset: number }>(
        (acc, item) => {
          const from = acc.offset;
          const to =
            from +
            (totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 100 / Math.max(items.length, 1));
          return { segments: [...acc.segments, `${item.color} ${from}% ${to}%`], offset: to };
        },
        { segments: [], offset: 0 }
      )
      .segments;

    return { items, totalRevenue, segments };
  }, [platforms]);

  const rangeLabel = overview?.range
    ? `${formatBucketLabel(toIsoDate(new Date(overview.range.startDate)))} → ${formatBucketLabel(
        toIsoDate(new Date(overview.range.endDate))
      )}`
    : '—';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#008060]" /> Marketing &amp; Conversion
          </h2>
          <p className="text-xs text-[#6d7175] mt-1">
            Performance des campagnes, entonnoir de conversion et retour sur investissement.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e1e3e5] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
            {/* <span className="text-xs font-bold text-[#6d7175] flex items-center gap-1.5 mr-2 whitespace-nowrap">
              <Calendar className="w-4 h-4 text-[#008060]" /> Période :
            </span> */}
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activePreset === preset.key
                    ? 'bg-[#008060] text-white shadow-2xs'
                    : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
              className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-3 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
              className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-3 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
            />

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#6d7175]" />
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as TrafficPlatform | '')}
                className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-3 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060] cursor-pointer"
              >
                <option value="">Toutes les sources</option>
                {PLATFORM_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {PLATFORM_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as MarketingGroupBy)}
              className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-3 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060] cursor-pointer"
            >
              {GROUP_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={refetchAll}
              disabled={isLoading}
              aria-label="Actualiser les indicateurs"
              className="p-2 bg-[#f0f9f6] text-[#008060] border border-[#008060]/20 rounded-xl hover:bg-[#008060] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {isError && !overview ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
          <h3 className="font-bold">Impossible de charger les indicateurs marketing</h3>
          <p className="text-xs">Vérifiez que la période est valide puis réessayez.</p>
          <Button size="sm" onClick={refetchAll}>Réessayer</Button>
        </div>
      ) : null}

      {/* Data-availability notice: the KPI cards stay, the gaps are explained. */}
      {(attributionMissing || spendMissing) && !isLoading ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs space-y-1.5">
          <p className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Données marketing incomplètes
          </p>
          {attributionMissing && (
            <p>
              Aucune commande n&apos;est encore rattachée à une source de trafic : la répartition par
              plateforme restera vide tant que l&apos;attribution serveur (dernier touch) n&apos;est pas
              alimentée à la création des commandes.
            </p>
          )}
          {spendMissing && (
            <p>
              Les dépenses publicitaires ne sont pas renseignées, donc le ROAS, le CPO et le MER
              restent à zéro. Importez les dépenses quotidiennes Meta / Google pour les activer.
            </p>
          )}
        </div>
      ) : null}

      {isLoading && !overview ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#008060] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : overview ? (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <KpiCard
              label="Chiffre d'affaires"
              value={formatPrice(kpis.revenue)}
              hint={`${kpis.orders} commandes payées`}
              icon={TrendingUp}
            />
            <KpiCard label="Panier moyen (AOV)" value={formatPrice(kpis.aov)} hint="Par commande payée" icon={ShoppingCart} />
            <KpiCard
              label="ROAS"
              value={kpis.spend > 0 ? `${kpis.roas.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}x` : '—'}
              hint={kpis.spend > 0 ? `${formatPrice(kpis.spend)} investis` : 'Dépenses non renseignées'}
              icon={Zap}
              tone={kpis.spend > 0 ? (kpis.roas >= 2.5 ? 'good' : kpis.roas >= 1.5 ? 'warn' : 'bad') : 'muted'}
            />
            <KpiCard
              label="Taux de conversion"
              value={percent(kpis.cvr, 2)}
              hint={`${kpis.purchases} achats / ${kpis.sessions} sessions`}
              icon={Target}
              tone={kpis.sessions === 0 ? 'muted' : kpis.cvr >= 1.5 ? 'good' : 'warn'}
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <KpiCard label="Dépenses publicitaires" value={formatPrice(kpis.spend)} hint={`CPO ${kpis.cpo > 0 ? formatPrice(kpis.cpo) : '—'}`} icon={Coins} />
            <KpiCard label="Sessions trackées" value={kpis.sessions.toLocaleString('fr-FR')} hint="Visites marketing mesurées" icon={Users} />
            <KpiCard
              label="Taux d'annulation"
              value={percent(kpis.cancelRate)}
              hint="Annulées + refus COD"
              icon={AlertTriangle}
              tone={kpis.cancelRate === 0 ? 'muted' : kpis.cancelRate < 10 ? 'good' : kpis.cancelRate <= 15 ? 'warn' : 'bad'}
            />
            <KpiCard
              label="MER"
              value={kpis.spend > 0 ? `${kpis.mer.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}x` : '—'}
              hint={`${kpis.metaCapiSent} conversions envoyées à Meta`}
              icon={BarChart3}
              tone={kpis.spend > 0 ? 'good' : 'muted'}
            />
          </div>

          {/* Funnel */}
          <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-bold text-[#1a1a1a] text-base">Entonnoir de conversion</h2>
              {funnel ? (
                <p className="text-[11px] text-[#6d7175]">
                  Page vue → achat : {percent(toNumber(funnel.crPageViewToPurchase), 2)} · Panier → achat :{' '}
                  {percent(toNumber(funnel.crAtcToPurchase), 2)}
                </p>
              ) : null}
            </div>

            {funnelSteps.length === 0 || kpis.purchases === 0 ? (
              <p className="text-xs text-[#6d7175] py-6 text-center">
                Aucune donnée de parcours sur cette période. L&apos;entonnoir se remplira dès que les
                événements de navigation seront reçus.
              </p>
            ) : (
              <div className="space-y-3">
                {funnelSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-[#008060]" /> {step.label}
                        </span>
                        <span className="text-xs text-[#6d7175]">
                          <span className="font-bold text-[#1a1a1a]">{step.value.toLocaleString('fr-FR')}</span>
                          <span className="mx-2">·</span>
                          {percent(step.shareOfTop)} des sessions
                        </span>
                      </div>
                      <div className="h-7 bg-[#f6f6f7] rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-[#008060] rounded-lg transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(step.shareOfTop, step.value > 0 ? 2 : 0))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline + platform mix */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-[#1a1a1a] text-base">Chiffre d&apos;affaires attribué</h2>
                <span className="text-[11px] text-[#6d7175]">{rangeLabel}</span>
              </div>

              {chart.length === 0 ? (
                <p className="text-xs text-[#6d7175] h-48 flex items-center justify-center text-center px-4">
                  Aucune vente payée sur cette période. Les journées sans commande ne remontent pas de
                  l&apos;API.
                </p>
              ) : (
                <>
                  <div className="flex items-end gap-1 sm:gap-2 h-52">
                    {chart.map((point) => (
                      <div
                        key={point.date}
                        className="flex-1 min-w-[24px] h-full flex flex-col items-center gap-2 group relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#1a1a1a] text-white text-[10px] py-1 px-2 rounded-md font-bold shadow-md z-10 whitespace-nowrap">
                          {formatPrice(point.revenue)} · {point.orders} cmd
                        </div>
                        <div className="w-full flex-1 min-h-0 bg-[#f0f9f6] group-hover:bg-[#008060]/20 rounded-t-xl flex items-end overflow-hidden p-1">
                          <div
                            className="w-full bg-[#008060] group-hover:bg-[#006e52] rounded-t-lg transition-all duration-500"
                            style={{ height: `${point.heightPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-[#6d7175] whitespace-nowrap">
                          {formatBucketLabel(point.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#e1e3e5] text-[11px] text-[#6d7175]">
                    <span>Max {chart.length} points</span>
                    <span>
                      Commandes cumulées :{' '}
                      <span className="font-bold text-[#1a1a1a]">
                        {chart.reduce((sum, point) => sum + point.orders, 0).toLocaleString('fr-FR')}
                      </span>
                    </span>
                    <span>
                      CA cumulé :{' '}
                      <span className="font-bold text-[#1a1a1a]">
                        {formatPrice(chart.reduce((sum, point) => sum + point.revenue, 0))}
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-6">
              <h2 className="font-bold text-[#1a1a1a] text-base">Mix par source de trafic</h2>

              {platformChart.items.length === 0 || platformChart.totalRevenue === 0 ? (
                <p className="text-xs text-[#6d7175] h-48 flex items-center justify-center text-center px-4">
                  Aucune commande attribuée à une plateforme sur cette période.
                </p>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-5">
                    <div
                      className="w-40 h-40 rounded-full"
                      style={{ background: `conic-gradient(${platformChart.segments.join(', ')})` }}
                      role="img"
                      aria-label="Répartition du chiffre d'affaires par source de trafic"
                    />
                    <div className="w-full space-y-2">
                      {platformChart.items.map((item) => (
                        <div key={item.platform} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-xs text-[#1a1a1a] min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          <span className="text-xs font-bold text-[#1a1a1a] whitespace-nowrap">
                            {shortNumber(item.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Platform table */}
          <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="font-bold text-[#1a1a1a] text-base">Performance par plateforme</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1a1a1a] min-w-[640px]">
                <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-y border-[#e1e3e5]">
                  <tr>
                    <th className="py-3 px-4">Plateforme</th>
                    <th className="py-3 px-4 text-right">Chiffre d&apos;affaires</th>
                    <th className="py-3 px-4 text-right">Commandes</th>
                    <th className="py-3 px-4 text-right">Part du CA</th>
                    <th className="py-3 px-4 text-right">Dépenses</th>
                    <th className="py-3 px-4 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3e5]">
                  {platforms.map((item) => {
                    const revenue = toNumber(item.revenue);
                    const orders = toNumber(item.orders);
                    const spend = toNumber(item.spend);
                    const share =
                      kpis.revenue > 0 ? (revenue / kpis.revenue) * 100 : 0;
                    const isUnattributed = item.platform === TrafficPlatformEnum.UNKNOWN;

                    return (
                      <tr key={item.platform} className="hover:bg-[#f6f6f7]/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold">
                          {PLATFORM_LABELS[item.platform] ?? item.platform}
                          {isUnattributed && (
                            <span className="ml-2 text-[10px] font-normal text-[#6d7175]">
                              (trafic direct ou non identifié)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">{formatPrice(revenue)}</td>
                        <td className="py-3.5 px-4 text-right">{orders.toLocaleString('fr-FR')}</td>
                        <td className="py-3.5 px-4 text-right text-[#6d7175]">{percent(share)}</td>
                        <td className="py-3.5 px-4 text-right text-[#6d7175]">{formatPrice(spend)}</td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            spend > 0 ? (toNumber(item.roas) >= 2.5 ? 'text-[#008060]' : 'text-[#6d7175]') : 'text-[#6d7175]'
                          }`}
                        >
                          {spend > 0
                            ? `${toNumber(item.roas).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}x`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {platforms.every((item) => toNumber(item.orders) === 0) ? (
              <p className="text-xs text-[#6d7175] text-center py-4">
                Aucune commande payée attribuée : les montants restent nuls jusqu&apos;à ce que
                l&apos;attribution serveur renseigne la source de trafic de chaque commande.
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
};

type KpiTone = 'default' | 'good' | 'warn' | 'bad' | 'muted';

const TONE_CLASSES: Record<KpiTone, string> = {
  default: 'bg-[#f0f9f6] text-[#008060] border-[#008060]/20',
  good: 'bg-[#f0f9f6] text-[#008060] border-[#008060]/20',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad: 'bg-rose-50 text-rose-700 border-rose-200',
  muted: 'bg-[#f6f6f7] text-[#6d7175] border-[#e1e3e5]',
};

const TONE_TEXT_CLASSES: Record<KpiTone, string> = {
  default: 'text-[#1a1a1a]',
  good: 'text-[#008060]',
  warn: 'text-amber-700',
  bad: 'text-rose-600',
  muted: 'text-[#6d7175]',
};

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon: Icon, tone = 'default' }) => (
  <div className="bg-white border border-[#e1e3e5] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#008060]/40 transition-colors">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-[#6d7175] uppercase tracking-wider">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${TONE_CLASSES[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <h3 className={`text-2xl font-black ${TONE_TEXT_CLASSES[tone]}`}>{value}</h3>
      <p className="text-[11px] text-[#6d7175] mt-1">{hint}</p>
    </div>
  </div>
);