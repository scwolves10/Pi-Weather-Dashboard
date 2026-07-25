import React, { useEffect, useState } from 'react';
import {
  Newspaper,
  RefreshCw,
  AlertTriangle,
  Clock,
  Compass,
  CloudLightning,
  Sun,
  Globe,
  Search,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  ShieldAlert,
  Flame,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, WeatherNewsArticle } from '../../types';

interface WeatherNewsPageProps {
  settings: AppSettings;
}

export const WeatherNewsPage: React.FC<WeatherNewsPageProps> = ({ settings }) => {
  const [articles, setArticles] = useState<WeatherNewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefreshMs, setNextRefreshMs] = useState<number>(3600000);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<WeatherNewsArticle | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Fetch weather news from server
  const fetchNews = async (force: boolean = false) => {
    setIsLoading(true);
    try {
      const locationQuery = encodeURIComponent(settings.location.name);
      const url = `/api/weather-news?location=${locationQuery}${force ? '&force=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        if (data.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated));
        }
        if (data.nextRefreshInMs) {
          setNextRefreshMs(data.nextRefreshInMs);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch weather news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and hourly auto-refresh setup
  useEffect(() => {
    fetchNews();

    // Auto refresh every 1 hour (3,600,000 ms)
    const hourlyTimer = setInterval(() => {
      fetchNews(true);
    }, 3600000);

    // Countdown tick every second for user feedback
    const countdownTimer = setInterval(() => {
      setNextRefreshMs((prev) => (prev > 1000 ? prev - 1000 : 3600000));
    }, 1000);

    return () => {
      clearInterval(hourlyTimer);
      clearInterval(countdownTimer);
    };
  }, [settings.location.name]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Format time remaining
  const formatCountdown = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Format publication date
  const formatPublishedAt = (isoStr: string) => {
    if (!isoStr) return 'Just now';
    const date = new Date(isoStr);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter articles
  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const heroArticle = filteredArticles[0] || articles[0];
  const listArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : [];

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'severe':
        return {
          label: 'Severe Warning',
          bg: 'bg-red-500/20 text-red-300 border-red-500/40',
          icon: <ShieldAlert size={12} />,
        };
      case 'regional':
        return {
          label: 'Regional Forecast',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Compass size={12} />,
        };
      case 'tropical':
        return {
          label: 'Tropical & Radar',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <CloudLightning size={12} />,
        };
      case 'climate':
        return {
          label: 'Climate Science',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Globe size={12} />,
        };
      default:
        return {
          label: 'General News',
          bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          icon: <Sun size={12} />,
        };
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 overflow-y-auto pr-1 text-white select-none pb-8">
      {/* 1. Header Bar with Hourly Timer Badge */}
      <div className="bg-[#2C3E50]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl shadow-lg shadow-orange-500/25">
            <Newspaper size={24} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-wide text-white flex items-center gap-2">
              <span>Weather News & Bulletins</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Hourly Feed
              </span>
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
              <span>{settings.location.name}</span>
              <span>•</span>
              <span className="text-orange-300 font-mono text-[11px]">
                {lastUpdated ? `Updated ${formatPublishedAt(lastUpdated.toISOString())}` : 'Live Meteorological Wire'}
              </span>
            </p>
          </div>
        </div>

        {/* Live Timer Pill & Manual Refresh */}
        <div className="flex items-center gap-3 justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-[#1A252F] border border-white/10 px-3 py-1.5 rounded-xl font-mono text-xs">
            <Clock size={14} className="text-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">Next Auto-Refresh</span>
              <span className="font-bold text-orange-300">{formatCountdown(nextRefreshMs)}</span>
            </div>
          </div>

          <button
            onClick={() => fetchNews(true)}
            disabled={isLoading}
            title="Force refresh weather news now"
            className="flex items-center gap-2 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-orange-500/20 transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* 2. Category Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#2C3E50]/60 backdrop-blur-md p-2 rounded-2xl border border-white/10">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'All News' },
            { id: 'severe', label: 'Severe Alerts' },
            { id: 'regional', label: 'Regional' },
            { id: 'tropical', label: 'Tropical & Radar' },
            { id: 'climate', label: 'Climate' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md border border-orange-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search weather news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A252F] border border-white/10 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Hero Feature Breaking Story */}
      {heroArticle && (
        <div
          onClick={() => setSelectedArticle(heroArticle)}
          className="relative bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-orange-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl overflow-hidden cursor-pointer group hover:border-orange-400 transition-all"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    getCategoryBadge(heroArticle.category).bg
                  }`}
                >
                  {getCategoryBadge(heroArticle.category).icon}
                  {getCategoryBadge(heroArticle.category).label}
                </span>

                {heroArticle.impactLevel === 'High' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/30 text-red-200 border border-red-500/40">
                    <Flame size={12} /> High Priority
                  </span>
                )}
              </div>

              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                {formatPublishedAt(heroArticle.publishedAt)}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white group-hover:text-orange-300 transition-colors leading-snug">
              {heroArticle.title}
            </h2>

            <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
              {heroArticle.summary}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-bold text-slate-400">
              <span className="text-orange-400 font-mono">
                Source: {heroArticle.source}
              </span>
              <span className="text-orange-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Full Dispatch <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Grid of Secondary News Articles */}
      {listArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listArticles.map((article) => {
            const badge = getCategoryBadge(article.category);
            return (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-[#2C3E50]/70 hover:bg-[#2C3E50] border border-white/10 hover:border-orange-500/40 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatPublishedAt(article.publishedAt)}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-orange-300 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400 font-mono">
                  <span>{article.source}</span>
                  <span className="text-orange-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Read <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredArticles.length === 0 && !isLoading && (
        <div className="bg-[#2C3E50]/50 border border-white/10 rounded-2xl p-8 text-center space-y-2">
          <Newspaper size={32} className="mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-200">No news articles found</h3>
          <p className="text-xs text-slate-400">Try selecting a different category or clearing your search filter.</p>
        </div>
      )}

      {/* 5. Article Detail Modal Reader */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-[#1E293B] border border-white/20 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white relative">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#2C3E50]/80">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    getCategoryBadge(selectedArticle.category).bg
                  }`}
                >
                  {getCategoryBadge(selectedArticle.category).icon}
                  {getCategoryBadge(selectedArticle.category).label}
                </span>

                <span className="text-xs font-mono text-slate-300">
                  {selectedArticle.source}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio Reader Toggle Button */}
                <button
                  onClick={() =>
                    handleToggleSpeech(
                      `${selectedArticle.title}. ${selectedArticle.summary}. ${selectedArticle.content}`
                    )
                  }
                  title="Listen to Audio Brief"
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-amber-500 text-slate-900 font-extrabold animate-pulse'
                      : 'bg-[#1A252F] text-slate-200 hover:text-white border border-white/10'
                  }`}
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                </button>

                <button
                  onClick={() => {
                    if (isSpeaking && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                    setSelectedArticle(null);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {selectedArticle.title}
              </h2>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-3 border-b border-white/10">
                <span>Location: {selectedArticle.locationName || settings.location.name}</span>
                <span>Published: {formatPublishedAt(selectedArticle.publishedAt)}</span>
              </div>

              {/* Summary Highlight Box */}
              <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-r-2xl text-xs sm:text-sm text-orange-200 font-medium leading-relaxed">
                <span className="font-bold block text-orange-400 mb-1 uppercase text-[10px] tracking-wider">
                  Executive Weather Briefing
                </span>
                {selectedArticle.summary}
              </div>

              {/* Full Paragraphs */}
              <div className="text-xs sm:text-sm text-slate-200 space-y-3 leading-relaxed whitespace-pre-line font-sans">
                {selectedArticle.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#1A252F] flex justify-between items-center text-xs text-slate-400">
              <span className="font-mono">
                Updates every 1h • Pi Weather Wire
              </span>
              <button
                onClick={() => {
                  if (isSpeaking && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                  setSelectedArticle(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 font-bold text-white rounded-xl transition-all cursor-pointer"
              >
                Close Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
