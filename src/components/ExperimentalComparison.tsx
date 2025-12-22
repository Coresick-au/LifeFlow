import React, { useEffect, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import {
    locationBenchmarks,
    detectLocationFromAddress,
    calculateCOLAdjustedValue,
    getLocationDisplayName,
    calculatePercentileRank,
    ageBenchmarks,
    getAgeBenchmarks,
    hasCustomBenchmarks,
    getUserAgeBracket,
    BENCHMARK_METADATA,
    type LocationKey,
} from '../data/benchmarkData';
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, Info, ArrowLeft } from 'lucide-react';

export function ExperimentalComparison() {
    const {
        wealthItems,
        stories,
        userProfile,
        loadWealthItems,
        getTotalNetWorth,
        setCurrentView,
    } = useTimelineStore();

    useEffect(() => {
        loadWealthItems();
    }, [loadWealthItems]);

    // Detect user's location from HouseTracker
    const userLocation: LocationKey = useMemo(() => {
        const homeEvents = stories.filter(s =>
            s.tags.some(tag =>
                ['home', 'house', 'property'].includes(tag.toLowerCase())
            )
        );
        if (homeEvents.length === 0) return 'australia';

        // Get most recent home
        const latestHome = homeEvents.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        // Try to extract location from title or description
        const locationText = `${latestHome.title} ${latestHome.content || ''}`;
        return detectLocationFromAddress(locationText);
    }, [stories]);

    const netWorth = getTotalNetWorth();
    const userBenchmark = locationBenchmarks[userLocation];
    const percentileRank = calculatePercentileRank(netWorth, userBenchmark.medianNetWorth);

    // Get user's age bracket
    const userAgeBracket = userProfile?.birthDate ? getUserAgeBracket(userProfile.birthDate) : null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getStatusColor = (percentile: number) => {
        if (percentile > 10) return 'green';
        if (percentile > -10) return 'yellow';
        return 'red';
    };

    const getStatusText = (percentile: number) => {
        if (percentile > 50) return 'Well Above Median';
        if (percentile > 10) return 'Above Median';
        if (percentile > -10) return 'At Median';
        if (percentile > -50) return 'Below Median';
        return 'Significantly Below Median';
    };

    const statusColor = getStatusColor(percentileRank);

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <AlertTriangle className="w-10 h-10 text-orange-600 dark:text-orange-500" />
                        Experimental: Location Comparison
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Compare your wealth against location-based Australian benchmarks
                    </p>
                </div>
                <button
                    onClick={() => setCurrentView({ type: 'wealth-tracker' })}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Wealth Tracker
                </button>
            </div>

            {/* Median Definition Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700 mb-8">
                <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">
                            What is "Median"?
                        </h3>
                        <p className="text-blue-800 dark:text-blue-300 text-sm mb-3">
                            The <strong>median</strong> is the middle value when all values are sorted from lowest to highest.
                            Half of people have more, half have less.
                        </p>
                        <div className="bg-blue-100 dark:bg-blue-800/30 p-3 rounded-lg mb-3">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">Example:</p>
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                5 people's net worth: $10k, $20k, $30k, $40k, $1M
                            </p>
                            <ul className="text-xs text-blue-800 dark:text-blue-300 mt-2 space-y-1">
                                <li>• <strong>Median:</strong> $30k (the middle value)</li>
                                <li>• <strong>Average:</strong> $220k (misleading, skewed by the $1M)</li>
                            </ul>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            <strong>Why use median?</strong> It gives you a more realistic picture of what's "typical" because extreme values don't skew it.
                        </p>
                    </div>
                </div>
            </div>

            {/* Location Detection */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl mb-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Detected Location</h3>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {getLocationDisplayName(userLocation)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Based on your Home Tracker data
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cost of Living Index</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {userBenchmark.costOfLivingIndex}
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/100</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Comparison Card */}
            <div className={`p-8 rounded-2xl shadow-2xl mb-8 border-2 ${statusColor === 'green'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400'
                : statusColor === 'yellow'
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500 border-yellow-400'
                    : 'bg-gradient-to-br from-red-500 to-pink-600 border-red-400'
                } text-white`}>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    {percentileRank >= 0 ? (
                        <TrendingUp className="w-8 h-8" />
                    ) : (
                        <TrendingDown className="w-8 h-8" />
                    )}
                    Wealth Position: {getStatusText(percentileRank)}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm opacity-90 mb-2">Your Net Worth</p>
                        <p className="text-4xl font-bold">{formatCurrency(netWorth)}</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-90 mb-2">{getLocationDisplayName(userLocation)} Median</p>
                        <p className="text-4xl font-bold">{formatCurrency(userBenchmark.medianNetWorth)}</p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                    <p className="text-sm opacity-90 mb-2">Wealth Gap</p>
                    <p className="text-2xl font-bold">
                        {percentileRank >= 0 ? '+' : ''}{percentileRank.toFixed(1)}%
                        <span className="text-base font-normal opacity-75 ml-2">
                            ({percentileRank >= 0 ? 'Surplus' : 'Deficit'}: {formatCurrency(Math.abs(netWorth - userBenchmark.medianNetWorth))})
                        </span>
                    </p>
                </div>
            </div>

            {/* Cost-of-Living Adjusted Comparisons */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        How Your Wealth Compares Across Australia
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Cost-of-living adjusted values based on {getLocationDisplayName(userLocation)}
                    </p>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {(Object.keys(locationBenchmarks) as LocationKey[]).map((locKey) => {
                            if (locKey === userLocation) return null;

                            const adjusted = calculateCOLAdjustedValue(netWorth, userLocation, locKey);
                            const benchmark = locationBenchmarks[locKey];
                            const diff = ((adjusted - benchmark.medianNetWorth) / benchmark.medianNetWorth) * 100;

                            return (
                                <div
                                    key={locKey}
                                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {getLocationDisplayName(locKey)}
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${diff > 10
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : diff > -10
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Your Wealth (Adjusted)</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(adjusted)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Local Median</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(benchmark.medianNetWorth)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">COL Index</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {benchmark.costOfLivingIndex}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {formatCurrency(netWorth)} in {getLocationDisplayName(userLocation)} ≈ {formatCurrency(adjusted)} in {getLocationDisplayName(locKey)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Benchmark Data Version Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-8">
                <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-300">
                    <Info className="w-4 h-4" />
                    <p>
                        <strong>Benchmark Data:</strong> {BENCHMARK_METADATA.version} |
                        <strong> Source:</strong> {BENCHMARK_METADATA.source} |
                        <strong> Last Updated:</strong> {new Date(BENCHMARK_METADATA.lastUpdated).toLocaleDateString('en-AU')}
                    </p>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                    {BENCHMARK_METADATA.note}
                </p>
                <details className="mt-3">
                    <summary className="text-xs font-semibold text-blue-800 dark:text-blue-300 cursor-pointer hover:underline">
                        ℹ️ How is this data updated?
                    </summary>
                    <div className="mt-2 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-2">
                        <p>
                            <strong>Benchmark data is bundled with the application.</strong> The values come from official ABS (Australian Bureau of Statistics) data and are updated periodically by the developer.
                        </p>
                        <p>
                            To update the data, a developer would modify the <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">benchmarkData.ts</code> file in the source code. This ensures data integrity and prevents accidental changes.
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                            <strong>Future feature:</strong> User-defined custom benchmarks are planned for a future release.
                        </p>
                    </div>
                </details>
            </div>

            {/* Wealth by Age Graph */}
            {userAgeBracket && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-8">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Wealth Accumulation by Age
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    How your net worth compares across life stages (You are in: {userAgeBracket.ageGroup})
                                </p>
                            </div>
                            {hasCustomBenchmarks() && (
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                                    Custom Data
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {getAgeBenchmarks().map((bracket) => {
                                const isUserBracket = bracket.ageGroup === userAgeBracket.ageGroup;
                                const barPercentage = Math.min((bracket.medianNetWorth / 1000000) * 100, 100);
                                const userPercentage = Math.min((netWorth / 1000000) * 100, 100);

                                return (
                                    <div key={bracket.ageGroup} className={`p-4 rounded-xl border ${isUserBracket
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                                        }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className={`font-semibold ${isUserBracket
                                                    ? 'text-blue-900 dark:text-blue-300'
                                                    : 'text-gray-900 dark:text-white'
                                                    }`}>
                                                    Age {bracket.ageGroup} {isUserBracket && '(You)'}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Median: {formatCurrency(bracket.medianNetWorth)} | Income: {formatCurrency(bracket.medianIncome)}
                                                </p>
                                            </div>
                                            {isUserBracket && (() => {
                                                const percentDiff = ((netWorth - bracket.medianNetWorth) / bracket.medianNetWorth) * 100;
                                                const isAbove = netWorth > bracket.medianNetWorth;
                                                return (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isAbove
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {isAbove ? '+' : ''}{percentDiff.toFixed(1)}% {isAbove ? 'Above' : 'Below'} Median
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        {/* Bar Graph */}
                                        <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                            {/* Median Bar */}
                                            <div
                                                className="absolute h-full bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600"
                                                style={{ width: `${barPercentage}%` }}
                                            />
                                            {/* User Bar (if in this bracket) */}
                                            {isUserBracket && (
                                                <div
                                                    className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-75"
                                                    style={{ width: `${userPercentage}%` }}
                                                />
                                            )}
                                            {/* Scale markers */}
                                            <div className="absolute inset-0 flex items-center justify-end pr-2">
                                                <span className="text-xs font-semibold text-white drop-shadow">
                                                    {isUserBracket && `You: ${formatCurrency(netWorth)} | `}
                                                    Median: {formatCurrency(bracket.medianNetWorth)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                <strong>Note:</strong> This graph shows median net worth by age bracket in Australia.
                                The blue bar represents your current position within your age group.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Benchmarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Benchmark */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Household Income Benchmark
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {getLocationDisplayName(userLocation)} Median
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(userBenchmark.medianHouseholdIncome)}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/year</span>
                    </p>
                </div>

                {/* Property Benchmark */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Property Value Benchmark
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {getLocationDisplayName(userLocation)} Median
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(userBenchmark.medianPropertyValue)}
                    </p>
                </div>
            </div>
        </div>
    );
}
