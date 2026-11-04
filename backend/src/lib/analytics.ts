import { prisma } from './db';

export function kstDay(date: Date = new Date()): string {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

export function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + delta);
  return kstDay(d);
}

async function countVisitors(sinceDay?: string): Promise<number> {
  const rows = await prisma.pageView.findMany({
    where: sinceDay ? { day: { gte: sinceDay } } : undefined,
    select: { visitorId: true },
    distinct: ['visitorId'],
  });
  return rows.length;
}

const SERIES_DAYS = 14;

export async function getAnalyticsSummary() {
  const today = kstDay();
  const weekStart = addDays(today, -6);
  const monthStart = addDays(today, -29);
  const seriesStart = addDays(today, -(SERIES_DAYS - 1));

  const [
    pvTotal,
    pvToday,
    uvTotal,
    dau,
    wau,
    mau,
    dailyPv,
    dailyVisitors,
    contentViews,
    contentVisitors,
    pageViews,
  ] = await Promise.all([
    prisma.pageView.count({ where: { type: 'pageview' } }),
    prisma.pageView.count({ where: { type: 'pageview', day: today } }),
    countVisitors(),
    countVisitors(today),
    countVisitors(weekStart),
    countVisitors(monthStart),
    prisma.pageView.groupBy({
      by: ['day'],
      where: { type: 'pageview', day: { gte: seriesStart } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ['day', 'visitorId'],
      where: { day: { gte: seriesStart } },
    }),
    prisma.pageView.groupBy({
      by: ['contentType', 'contentId', 'contentName'],
      where: { type: 'content' },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.pageView.groupBy({
      by: ['contentType', 'contentId', 'visitorId'],
      where: { type: 'content' },
    }),
    prisma.pageView.groupBy({
      by: ['path'],
      where: { type: 'pageview' },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
  ]);

  const pvByDay = new Map(dailyPv.map((r) => [r.day, r._count._all]));
  const uvByDay = new Map<string, number>();
  for (const row of dailyVisitors) {
    uvByDay.set(row.day, (uvByDay.get(row.day) ?? 0) + 1);
  }

  const daily: { day: string; pv: number; uv: number }[] = [];
  for (let i = 0; i < SERIES_DAYS; i += 1) {
    const day = addDays(seriesStart, i);
    daily.push({ day, pv: pvByDay.get(day) ?? 0, uv: uvByDay.get(day) ?? 0 });
  }

  const visitorsByContent = new Map<string, number>();
  for (const row of contentVisitors) {
    const key = `${row.contentType}|${row.contentId}`;
    visitorsByContent.set(key, (visitorsByContent.get(key) ?? 0) + 1);
  }

  return {
    today,
    pv: { today: pvToday, total: pvTotal },
    uv: { today: dau, total: uvTotal },
    dau,
    wau,
    mau,
    daily,
    topContents: contentViews.map((r) => ({
      contentType: r.contentType,
      contentId: r.contentId,
      contentName: r.contentName,
      views: r._count._all,
      visitors: visitorsByContent.get(`${r.contentType}|${r.contentId}`) ?? 0,
    })),
    topPages: pageViews.map((r) => ({ path: r.path, views: r._count._all })),
  };
}

export async function getDayDetail(day: string) {
  const [pv, visitors, pageGroups, contentViews, contentVisitors, events] =
    await Promise.all([
      prisma.pageView.count({ where: { type: 'pageview', day } }),
      prisma.pageView.findMany({
        where: { day },
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
      prisma.pageView.groupBy({
        by: ['path'],
        where: { type: 'pageview', day },
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      prisma.pageView.groupBy({
        by: ['contentType', 'contentId', 'contentName'],
        where: { type: 'content', day },
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      prisma.pageView.groupBy({
        by: ['contentType', 'contentId', 'visitorId'],
        where: { type: 'content', day },
      }),
      prisma.pageView.findMany({
        where: { day },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          createdAt: true,
          type: true,
          path: true,
          contentType: true,
          contentId: true,
          contentName: true,
          visitorId: true,
        },
      }),
    ]);

  const visitorsByContent = new Map<string, number>();
  for (const row of contentVisitors) {
    const key = `${row.contentType}|${row.contentId}`;
    visitorsByContent.set(key, (visitorsByContent.get(key) ?? 0) + 1);
  }

  return {
    day,
    pv,
    uv: visitors.length,
    pages: pageGroups.map((r) => ({ path: r.path, views: r._count._all })),
    contents: contentViews.map((r) => ({
      contentType: r.contentType,
      contentId: r.contentId,
      contentName: r.contentName,
      views: r._count._all,
      visitors: visitorsByContent.get(`${r.contentType}|${r.contentId}`) ?? 0,
    })),
    events: events.map((e) => ({
      time: e.createdAt.toLocaleTimeString('sv-SE', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: e.type,
      path: e.path,
      contentType: e.contentType,
      contentId: e.contentId,
      contentName: e.contentName,
      visitorId: e.visitorId,
    })),
  };
}
