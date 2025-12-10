/**
 * STATS.JS
 * Stats/Analytics view - weight progress, predictions, week view
 */

const StatsView = {
    /**
     * Render the stats view
     */
    render() {
        const container = document.getElementById('stats-view');
        
        // Safely render each section
        const sections = [
            () => Header.renderSimple('ANALYTICS'),
            () => this.renderMonthlyWeightChart(),
            () => this.renderPeriodizationAlerts(),
            () => this.renderProteinDistribution(),
            () => this.renderCorrelations(),
            () => this.renderFunStats(),
            () => this.renderDeloadCheck(),
            () => this.renderVolumeTracker(),
            () => this.renderWeightProgress(),
            () => this.renderPrediction(),
            () => this.renderProgressForecast(),
            () => this.renderAverages(),
            () => RunningView.renderDashboard(),
            () => this.renderWeekGrid(),
            () => this.renderAllTimeStats()
        ];
        
        let html = '';
        sections.forEach((fn, i) => {
            try {
                html += fn() || '';
            } catch (e) {
                console.error(`Stats section ${i} error:`, e);
            }
        });
        
        // Add tab spacer at end
        html += '<div class="tab-spacer"></div>';
        
        container.innerHTML = html;
    },

    /**
     * Render periodization alerts (high priority recommendations)
     */
    renderPeriodizationAlerts() {
        const periodization = Utils.getPeriodizationRecommendations();
        
        if (!periodization.hasHighPriority) return '';
        
        const highPriority = periodization.recommendations.filter(r => r.priority === 'high');
        
        return `
            <div class="periodization-alerts">
                ${highPriority.map(rec => `
                    <div class="periodization-alert ${rec.type}">
                        <div class="alert-title">${rec.title}</div>
                        <div class="alert-desc">${rec.description}</div>
                        <div class="alert-action">${rec.action}</div>
                        <button class="alert-dismiss" onclick="this.parentElement.remove()">DISMISS</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Get cumulative weight lifted data for a month
     * @param {number} monthOffset - 0 for current month, -1 for last month
     */
    getMonthlyWeightData(monthOffset = 0) {
        const liftHistory = State._data?.liftHistory || {};
        const now = new Date();
        const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
        
        // Build daily volume data
        const dailyVolume = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dailyVolume[day] = 0;
        }
        
        // Sum up volume from all exercises
        Object.values(liftHistory).forEach(exerciseEntries => {
            exerciseEntries.forEach(entry => {
                const entryDate = new Date(entry.date);
                if (entryDate.getMonth() === targetMonth.getMonth() && 
                    entryDate.getFullYear() === targetMonth.getFullYear()) {
                    const day = entryDate.getDate();
                    dailyVolume[day] = (dailyVolume[day] || 0) + (entry.volume || 0);
                }
            });
        });
        
        // Convert to cumulative
        const cumulative = [];
        let runningTotal = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            runningTotal += dailyVolume[day];
            cumulative.push({ day, volume: runningTotal });
        }
        
        return {
            monthName: targetMonth.toLocaleString('default', { month: 'short' }),
            year: targetMonth.getFullYear(),
            daysInMonth,
            cumulative,
            total: runningTotal
        };
    },

    /**
     * Render monthly cumulative weight chart (SVG)
     */
    renderMonthlyWeightChart() {
        const thisMonth = this.getMonthlyWeightData(0);
        const lastMonth = this.getMonthlyWeightData(-1);
        
        // If no data, don't show
        if (thisMonth.total === 0 && lastMonth.total === 0) {
            return '';
        }

        const today = new Date().getDate();
        const maxDays = Math.max(thisMonth.daysInMonth, lastMonth.daysInMonth);
        const maxVolume = Math.max(
            ...thisMonth.cumulative.map(d => d.volume),
            ...lastMonth.cumulative.map(d => d.volume),
            1 // Prevent division by zero
        );
        
        // Chart dimensions
        const width = 320;
        const height = 160;
        const padding = { top: 10, right: 10, bottom: 25, left: 45 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Scale functions
        const xScale = (day) => padding.left + (day / maxDays) * chartWidth;
        const yScale = (vol) => padding.top + chartHeight - (vol / maxVolume) * chartHeight;
        
        // Generate smooth curve path using Catmull-Rom spline
        const generatePath = (data, upToDay = null) => {
            const points = data
                .filter(d => upToDay === null || d.day <= upToDay)
                .map(d => ({ x: xScale(d.day), y: yScale(d.volume) }));
            
            if (points.length < 2) return '';
            
            // Catmull-Rom to Bezier for smooth curves
            let path = `M ${points[0].x} ${points[0].y}`;
            
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[Math.max(0, i - 1)];
                const p1 = points[i];
                const p2 = points[Math.min(points.length - 1, i + 1)];
                const p3 = points[Math.min(points.length - 1, i + 2)];
                
                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;
                
                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
            }
            
            return path;
        };
        
        // Current month line (up to today)
        const thisMonthPath = generatePath(thisMonth.cumulative, today);
        // Last month full line
        const lastMonthPath = generatePath(lastMonth.cumulative);
        
        // Calculate comparison
        const thisMonthToDate = thisMonth.cumulative.find(d => d.day === today)?.volume || 0;
        const lastMonthSameDay = lastMonth.cumulative.find(d => d.day === today)?.volume || 0;
        const difference = thisMonthToDate - lastMonthSameDay;
        const percentChange = lastMonthSameDay > 0 ? Math.round((difference / lastMonthSameDay) * 100) : 0;
        const isAhead = difference >= 0;
        
        // Y-axis labels
        const yLabels = [0, Math.round(maxVolume / 2), Math.round(maxVolume)];
        const formatVolume = (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;
        
        return `
            <div class="analysis-card monthly-weight-chart">
                <div class="analysis-header">
                    <span class="analysis-title">MONTHLY WEIGHT LIFTED</span>
                    <span class="chart-comparison ${isAhead ? 'positive' : 'negative'}">
                        ${isAhead ? '+' : ''}${formatVolume(difference)} lbs
                    </span>
                </div>
                
                <div class="chart-legend">
                    <span class="legend-item current"><span class="legend-line"></span>${thisMonth.monthName}</span>
                    <span class="legend-item last"><span class="legend-line"></span>${lastMonth.monthName}</span>
                </div>
                
                <div class="chart-container">
                    <svg viewBox="0 0 ${width} ${height}" class="weight-line-chart">
                        <!-- Grid lines -->
                        ${yLabels.map(val => `
                            <line 
                                x1="${padding.left}" 
                                y1="${yScale(val)}" 
                                x2="${width - padding.right}" 
                                y2="${yScale(val)}" 
                                class="grid-line"
                            />
                            <text 
                                x="${padding.left - 5}" 
                                y="${yScale(val) + 4}" 
                                class="axis-label y-label"
                            >${formatVolume(val)}</text>
                        `).join('')}
                        
                        <!-- X-axis labels -->
                        <text x="${xScale(1)}" y="${height - 5}" class="axis-label">1</text>
                        <text x="${xScale(Math.round(maxDays / 2))}" y="${height - 5}" class="axis-label">${Math.round(maxDays / 2)}</text>
                        <text x="${xScale(maxDays)}" y="${height - 5}" class="axis-label">${maxDays}</text>
                        
                        <!-- Last month line (full, faded) -->
                        <path d="${lastMonthPath}" class="line-path last-month" />
                        
                        <!-- This month line (up to today, prominent) -->
                        <path d="${thisMonthPath}" class="line-path this-month" />
                        
                        <!-- Today marker -->
                        ${thisMonthToDate > 0 ? `
                            <circle 
                                cx="${xScale(today)}" 
                                cy="${yScale(thisMonthToDate)}" 
                                r="4" 
                                class="today-marker"
                            />
                        ` : ''}
                    </svg>
                </div>
                
                <div class="chart-stats">
                    <div class="chart-stat">
                        <span class="stat-label">${thisMonth.monthName} (to date)</span>
                        <span class="stat-value">${formatVolume(thisMonthToDate)} lbs</span>
                    </div>
                    <div class="chart-stat">
                        <span class="stat-label">${lastMonth.monthName} total</span>
                        <span class="stat-value">${formatVolume(lastMonth.total)} lbs</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render progress forecast
     */
    renderProgressForecast() {
        const forecast = Utils.calculateForecasts();
        
        if (!forecast || !forecast.weeklyChange) {
            return '';
        }
        
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">PROGRESS FORECAST</span>
                    <span class="forecast-rate ${forecast.direction === 'losing' ? 'negative' : 'positive'}">
                        ${forecast.weeklyChange} lbs/week
                    </span>
                </div>
                
                <div class="forecast-message">
                    ${forecast.message}
                </div>
                
                ${forecast.forecasts ? `
                    <div class="forecast-grid">
                        ${forecast.forecasts.map(f => `
                            <div class="forecast-item">
                                <div class="forecast-label">${f.label}</div>
                                <div class="forecast-weight">${f.weight} lbs</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Render deload check/warning (only if there's lift data)
     */
    renderDeloadCheck() {
        // Check if there's any lift history
        const liftHistory = State._data?.liftHistory || {};
        const hasLiftData = Object.keys(liftHistory).length > 0;
        
        if (!hasLiftData) return '';
        
        const deload = State.shouldDeload();
        
        if (!deload.recommended) return '';

        return `
            <div class="deload-warning">
                <div class="deload-header">
                    <span class="deload-label">DELOAD RECOMMENDED</span>
                    <span class="deload-weeks">${deload.weeksSinceDeload} weeks</span>
                </div>
                <div class="deload-reason">${deload.reason}</div>
                <div class="deload-actions">
                    <button class="deload-btn" onclick="StatsView.startDeload()">
                        START DELOAD WEEK
                    </button>
                    <button class="deload-skip" onclick="StatsView.skipDeload()">
                        SKIP
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Start deload week
     */
    startDeload() {
        alert('Deload week started. This week, reduce your working weights by 40-50% and cut volume in half. Focus on recovery.');
        State.markDeloadComplete();
        this.render();
    },

    /**
     * Skip deload
     */
    skipDeload() {
        // Just dismiss for now
        document.querySelector('.deload-warning')?.remove();
    },

    /**
     * Render volume tracker (only if there's lift data)
     */
    renderVolumeTracker() {
        // Check if there's any lift history
        const liftHistory = State._data?.liftHistory || {};
        const hasLiftData = Object.keys(liftHistory).length > 0;
        
        if (!hasLiftData) {
            return `
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span class="analysis-title">WEEKLY VOLUME</span>
                    </div>
                    <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                        Log your first lift to start tracking volume
                    </div>
                </div>
            `;
        }
        
        const volumes = State.getAllWeeklyVolumes();
        const weeklyStats = State.getWeeklyTrainingStats();

        // All muscle groups for comprehensive tracking
        const mainGroups = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'biceps', 'triceps', 'glutes', 'core'];
        
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">WEEKLY VOLUME</span>
                    <span class="volume-total">${weeklyStats.totalSets} sets</span>
                </div>
                
                <div class="volume-grid">
                    ${mainGroups.map(group => {
                        const vol = volumes[group] || { sets: 0 };
                        const sets = vol.sets;
                        
                        // Get per-muscle-group landmarks
                        const { MEV, MAV, MRV } = Utils.getVolumeLandmarks(group);
                        
                        // Determine status
                        let status = 'low';
                        let statusText = 'Under MEV';
                        if (sets >= MRV) {
                            status = 'high';
                            statusText = 'At MRV!';
                        } else if (sets >= MAV) {
                            status = 'optimal';
                            statusText = 'Optimal';
                        } else if (sets >= MEV) {
                            status = 'good';
                            statusText = 'Good';
                        }
                        
                        const fillPercent = Math.min(100, (sets / MRV) * 100);
                        
                        return `
                            <div class="volume-row">
                                <div class="volume-label">${group.toUpperCase()}</div>
                                <div class="volume-bar-container">
                                    <div class="volume-bar">
                                        <div class="volume-fill ${status}" style="width: ${fillPercent}%"></div>
                                        <div class="volume-mev" style="left: ${(MEV/MRV)*100}%"></div>
                                        <div class="volume-mav" style="left: ${(MAV/MRV)*100}%"></div>
                                    </div>
                                    <div class="volume-markers">
                                        <span>${MEV}</span>
                                        <span>${MAV}</span>
                                        <span>${MRV}</span>
                                    </div>
                                </div>
                                <div class="volume-count ${status}">${sets}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="volume-legend">
                    <span>MEV: Minimum</span>
                    <span>MAV: Optimal</span>
                    <span>MRV: Maximum</span>
                </div>
            </div>
        `;
    },

    // Track current weight chart period
    weightChartPeriod: 'week',
    
    /**
     * Render weight progress card with line chart
     */
    renderWeightProgress() {
        const profile = State.getProfile();
        const goals = State.getGoals();
        const currentWeight = Utils.getCurrentWeight();
        
        const startWeight = profile?.startWeight;
        const targetWeight = goals?.targetWeight;
        
        // Get weight history
        const weightData = this.getWeightHistory(this.weightChartPeriod);
        
        let changeText = '--';
        let changeClass = '';
        let trendDirection = 'neutral';

        if (currentWeight && startWeight) {
            const lost = startWeight - currentWeight;
            changeText = lost >= 0 ? `-${lost.toFixed(1)}` : `+${Math.abs(lost).toFixed(1)}`;
            changeClass = lost >= 0 ? 'positive' : 'negative';
        }
        
        // Determine trend from recent data
        if (weightData.length >= 2) {
            const recent = weightData.slice(-7);
            const firstAvg = recent.slice(0, Math.ceil(recent.length/2)).reduce((a,b) => a + b.weight, 0) / Math.ceil(recent.length/2);
            const lastAvg = recent.slice(-Math.ceil(recent.length/2)).reduce((a,b) => a + b.weight, 0) / Math.ceil(recent.length/2);
            
            if (lastAvg < firstAvg - 0.3) trendDirection = 'down';
            else if (lastAvg > firstAvg + 0.3) trendDirection = 'up';
        }
        
        // Check if at or below target
        if (targetWeight && currentWeight && currentWeight <= targetWeight) {
            trendDirection = 'target';
        }

        return `
            <div class="analysis-card weight-chart-card">
                <div class="analysis-header">
                    <span class="analysis-title">WEIGHT PROGRESS</span>
                    <div class="chart-period-toggle">
                        <button class="period-btn ${this.weightChartPeriod === 'week' ? 'active' : ''}" 
                                onclick="StatsView.setWeightPeriod('week')">W</button>
                        <button class="period-btn ${this.weightChartPeriod === 'month' ? 'active' : ''}" 
                                onclick="StatsView.setWeightPeriod('month')">M</button>
                        <button class="period-btn ${this.weightChartPeriod === 'year' ? 'active' : ''}" 
                                onclick="StatsView.setWeightPeriod('year')">Y</button>
                    </div>
                </div>
                
                <div class="weight-stats-row">
                    <div class="weight-stat">
                        <div class="stat-value">${currentWeight || '--'}</div>
                        <div class="stat-label">CURRENT</div>
                    </div>
                    <div class="weight-stat">
                        <div class="stat-value ${changeClass}">${changeText}</div>
                        <div class="stat-label">CHANGE</div>
                    </div>
                    <div class="weight-stat">
                        <div class="stat-value">${targetWeight || '--'}</div>
                        <div class="stat-label">TARGET</div>
                    </div>
                </div>
                
                ${this.renderWeightChart(weightData, targetWeight, trendDirection)}
            </div>
        `;
    },
    
    /**
     * Get weight history for a time period
     */
    getWeightHistory(period) {
        const days = State.getAllDayKeys();
        const weights = [];
        
        // Determine how far back to look
        let daysBack = 7;
        if (period === 'month') daysBack = 30;
        if (period === 'year') daysBack = 365;
        
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysBack);
        
        for (const day of days) {
            const dayDate = new Date(day);
            if (dayDate >= cutoff) {
                const data = State.getDayData(day);
                if (data?.weight) {
                    weights.push({
                        date: day,
                        weight: data.weight
                    });
                }
            }
        }
        
        return weights.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    
    /**
     * Render SVG line chart for weight
     */
    renderWeightChart(data, targetWeight, trend) {
        if (data.length < 2) {
            return `
                <div class="chart-empty">
                    <div class="empty-text">Log weight for at least 2 days to see chart</div>
                </div>
            `;
        }
        
        const width = 300;
        const height = 120;
        const padding = { top: 10, right: 10, bottom: 20, left: 35 };
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Find min/max for scaling
        const weights = data.map(d => d.weight);
        let minWeight = Math.min(...weights);
        let maxWeight = Math.max(...weights);
        
        // Include target in range if set
        if (targetWeight) {
            minWeight = Math.min(minWeight, targetWeight);
            maxWeight = Math.max(maxWeight, targetWeight);
        }
        
        // Add padding to range
        const range = maxWeight - minWeight;
        minWeight -= range * 0.1 || 2;
        maxWeight += range * 0.1 || 2;
        
        // Create points
        const points = data.map((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - ((d.weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
            return `${x},${y}`;
        }).join(' ');
        
        // Line color based on trend
        let lineColor = '#888';
        if (trend === 'down' || trend === 'target') lineColor = '#22c55e';
        else if (trend === 'up') lineColor = '#ef4444';
        
        // Target line Y position
        let targetLineY = null;
        if (targetWeight) {
            targetLineY = padding.top + chartHeight - ((targetWeight - minWeight) / (maxWeight - minWeight)) * chartHeight;
        }
        
        // Y-axis labels
        const yLabels = [maxWeight, (maxWeight + minWeight) / 2, minWeight].map(v => v.toFixed(0));
        
        return `
            <div class="weight-chart">
                <svg viewBox="0 0 ${width} ${height}" class="line-chart">
                    <!-- Y axis labels -->
                    <text x="${padding.left - 5}" y="${padding.top + 4}" class="chart-label" text-anchor="end">${yLabels[0]}</text>
                    <text x="${padding.left - 5}" y="${padding.top + chartHeight/2 + 4}" class="chart-label" text-anchor="end">${yLabels[1]}</text>
                    <text x="${padding.left - 5}" y="${padding.top + chartHeight + 4}" class="chart-label" text-anchor="end">${yLabels[2]}</text>
                    
                    <!-- Grid lines -->
                    <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" class="grid-line"/>
                    <line x1="${padding.left}" y1="${padding.top + chartHeight/2}" x2="${width - padding.right}" y2="${padding.top + chartHeight/2}" class="grid-line"/>
                    <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" class="grid-line"/>
                    
                    <!-- Target line -->
                    ${targetLineY ? `
                        <line x1="${padding.left}" y1="${targetLineY}" x2="${width - padding.right}" y2="${targetLineY}" class="target-line"/>
                        <text x="${width - padding.right + 2}" y="${targetLineY + 3}" class="target-label">goal</text>
                    ` : ''}
                    
                    <!-- Data line -->
                    <polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    
                    <!-- Data points -->
                    ${data.map((d, i) => {
                        const x = padding.left + (i / (data.length - 1)) * chartWidth;
                        const y = padding.top + chartHeight - ((d.weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
                        return `<circle cx="${x}" cy="${y}" r="3" fill="${lineColor}"/>`;
                    }).join('')}
                    
                    <!-- X axis labels (first and last date) -->
                    <text x="${padding.left}" y="${height - 2}" class="chart-label">${this.formatChartDate(data[0].date)}</text>
                    <text x="${width - padding.right}" y="${height - 2}" class="chart-label" text-anchor="end">${this.formatChartDate(data[data.length-1].date)}</text>
                </svg>
            </div>
        `;
    },
    
    /**
     * Format date for chart axis
     */
    formatChartDate(dateStr) {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    },
    
    /**
     * Set weight chart period
     */
    setWeightPeriod(period) {
        this.weightChartPeriod = period;
        this.render();
    },

    /**
     * Render prediction card
     */
    renderPrediction() {
        const prediction = Utils.calculatePrediction();
        const currentWeight = Utils.getCurrentWeight();

        if (!prediction || !currentWeight) {
            return `
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span class="analysis-title">PREDICTION</span>
                    </div>
                    <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                        Log more data to see predictions
                    </div>
                </div>
            `;
        }

        const diff = currentWeight - parseFloat(prediction.predicted);
        let deltaText = '';
        
        if (Math.abs(diff) < 1) {
            deltaText = 'On track. Your logging matches reality.';
        } else if (diff > 0) {
            deltaText = `${diff.toFixed(1)} lbs heavier than predicted. Consider logging more accurately.`;
        } else {
            deltaText = `${Math.abs(diff).toFixed(1)} lbs lighter than predicted. Great progress!`;
        }

        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">PREDICTION</span>
                </div>
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        Based on your data, you should be
                    </div>
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700;">
                        ${prediction.predicted}
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        lbs (actual: ${currentWeight})
                    </div>
                </div>
                <div style="background: var(--surface-2); border-radius: 8px; padding: 12px; font-size: 12px; color: var(--text-2); text-align: center;">
                    ${deltaText}
                </div>
            </div>
        `;
    },

    /**
     * Render 7-day averages
     */
    renderAverages() {
        const avgs = Utils.getWeeklyAverages();
        const goals = State.getGoals();

        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">7-DAY AVERAGES</span>
                </div>
                <div class="avg-grid">
                    <div class="avg-item">
                        <div class="avg-value">${avgs.protein || '--'}</div>
                        <div class="avg-label">PROTEIN</div>
                        <div class="avg-goal">/ ${goals?.dailyProtein || 180}g</div>
                    </div>
                    <div class="avg-item">
                        <div class="avg-value">${avgs.calories || '--'}</div>
                        <div class="avg-label">CALORIES</div>
                        <div class="avg-goal">/ ${goals?.dailyCalories || 2000}</div>
                    </div>
                    <div class="avg-item">
                        <div class="avg-value">${avgs.sleep || '--'}</div>
                        <div class="avg-label">SLEEP</div>
                        <div class="avg-goal">/ 7+ hrs</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render protein distribution analysis
     */
    renderProteinDistribution() {
        if (typeof AINutrition === 'undefined' || !AINutrition.getProteinDistributionAnalysis) {
            return '';
        }
        
        let analysis;
        try {
            analysis = AINutrition.getProteinDistributionAnalysis();
        } catch (e) {
            console.error('Protein distribution error:', e);
            return '';
        }
        
        if (!analysis || !analysis.hasEnoughData) {
            return '';
        }
        
        const times = ['morning', 'midday', 'afternoon', 'evening'];
        const labels = { morning: 'AM', midday: 'NOON', afternoon: 'PM', evening: 'LATE' };
        
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">PROTEIN DISTRIBUTION</span>
                    <span class="dist-grade grade-${analysis.grade.toLowerCase()}">${analysis.grade}</span>
                </div>
                
                <div class="dist-bar-container">
                    ${times.map(time => `
                        <div class="dist-segment" style="flex: ${analysis.distribution[time] || 1}">
                            <div class="dist-label">${labels[time]}</div>
                            <div class="dist-percent">${analysis.distribution[time]}%</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="dist-ideal">
                    <span>IDEAL: 25% each meal for optimal MPS</span>
                </div>
                
                <div class="leucine-stats">
                    <span class="leucine-label">Avg leucine threshold hits/day:</span>
                    <span class="leucine-count">${analysis.avgLeucineHitsPerDay}</span>
                    <span class="leucine-target">(aim for 3-4)</span>
                </div>
                
                ${analysis.suggestions.length > 0 ? `
                    <div class="dist-suggestions">
                        ${analysis.suggestions.map(s => `<div class="dist-suggestion">${s}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Render correlations/insights
     */
    renderCorrelations() {
        let correlations;
        try {
            correlations = this.calculateCorrelations();
        } catch (e) {
            console.error('Correlations error:', e);
            return '';
        }
        
        if (!correlations || !correlations.hasData) return '';
        
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">WHAT PREDICTS YOUR SUCCESS</span>
                </div>
                
                <div class="correlations-list">
                    ${correlations.insights.map(insight => `
                        <div class="correlation-item ${insight.type}">
                            <div class="corr-stat">${insight.stat}</div>
                            <div class="corr-text">${insight.text}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Calculate correlations from user data
     */
    calculateCorrelations() {
        const allDays = State.getAllDayKeys();
        
        if (allDays.length < 14) {
            return { hasData: false };
        }
        
        const insights = [];
        
        // Analyze workout completion patterns
        let weekdayComplete = 0, weekdayTotal = 0;
        let weekendComplete = 0, weekendTotal = 0;
        let proteinHitDays = 0, proteinHitWorkoutDays = 0;
        let alcoholDays = 0, alcoholFollowedByMiss = 0;
        let streakBreaks = 0;
        
        const goals = State.getGoals();
        const proteinGoal = goals?.dailyProtein || 150;
        
        allDays.forEach((day, idx) => {
            const data = State.getDayData(day);
            const date = new Date(day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const hasWorkout = data?.exercises && Object.values(data.exercises).some(Boolean);
            const hitProtein = (data?.protein || 0) >= proteinGoal * 0.9;
            const hadAlcohol = data?.alcohol > 0;
            
            if (isWeekend) {
                weekendTotal++;
                if (hasWorkout) weekendComplete++;
            } else {
                weekdayTotal++;
                if (hasWorkout) weekdayComplete++;
            }
            
            if (hitProtein) {
                proteinHitDays++;
                if (hasWorkout) proteinHitWorkoutDays++;
            }
            
            if (hadAlcohol && idx < allDays.length - 1) {
                alcoholDays++;
                const nextDayData = State.getDayData(allDays[idx + 1]);
                const nextDayMissed = !nextDayData?.exercises || !Object.values(nextDayData.exercises).some(Boolean);
                if (nextDayMissed) alcoholFollowedByMiss++;
            }
        });
        
        // Calculate rates
        const weekdayRate = weekdayTotal > 0 ? Math.round((weekdayComplete / weekdayTotal) * 100) : 0;
        const weekendRate = weekendTotal > 0 ? Math.round((weekendComplete / weekendTotal) * 100) : 0;
        const proteinWorkoutRate = proteinHitDays > 0 ? Math.round((proteinHitWorkoutDays / proteinHitDays) * 100) : 0;
        const alcoholMissRate = alcoholDays > 0 ? Math.round((alcoholFollowedByMiss / alcoholDays) * 100) : 0;
        
        // Generate insights
        if (weekdayRate !== weekendRate) {
            const better = weekdayRate > weekendRate ? 'weekdays' : 'weekends';
            const worse = weekdayRate > weekendRate ? 'weekends' : 'weekdays';
            insights.push({
                type: weekdayRate > weekendRate ? 'warning' : 'positive',
                stat: `${Math.max(weekdayRate, weekendRate)}%`,
                text: `You complete workouts on ${better} vs ${Math.min(weekdayRate, weekendRate)}% on ${worse}`
            });
        }
        
        if (proteinHitDays > 5) {
            insights.push({
                type: proteinWorkoutRate > 80 ? 'positive' : 'neutral',
                stat: `${proteinWorkoutRate}%`,
                text: `When you hit protein, you also complete workouts ${proteinWorkoutRate}% of the time`
            });
        }
        
        if (alcoholDays > 2) {
            insights.push({
                type: alcoholMissRate > 40 ? 'warning' : 'neutral',
                stat: `${alcoholMissRate}%`,
                text: alcoholMissRate > 40 
                    ? `Alcohol predicts missed workout next day ${alcoholMissRate}% of the time`
                    : `You maintain discipline even after drinking (${100 - alcoholMissRate}% workout rate)`
            });
        }
        
        // Streak insight
        const currentStreak = Utils.getDailyStreak();
        if (currentStreak > 0) {
            insights.push({
                type: 'positive',
                stat: `${currentStreak} days`,
                text: `Current streak - ${currentStreak > 7 ? 'exceptional consistency!' : 'keep building!'}`
            });
        }
        
        return { hasData: insights.length > 0, insights };
    },
    
    /**
     * Render fun stats
     */
    renderFunStats() {
        let stats;
        try {
            stats = this.calculateFunStats();
        } catch (e) {
            console.error('Fun stats error:', e);
            return '';
        }
        
        if (!stats || !stats.hasData) return '';
        
        return `
            <div class="analysis-card fun-stats">
                <div class="analysis-header">
                    <span class="analysis-title">YOUR NUMBERS</span>
                </div>
                
                <div class="fun-stats-grid">
                    ${stats.items.map(stat => `
                        <div class="fun-stat-item">
                            <div class="fun-stat-value">${stat.value}</div>
                            <div class="fun-stat-label">${stat.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Calculate fun/interesting stats
     */
    calculateFunStats() {
        const allDays = State.getAllDayKeys();
        
        if (allDays.length < 7) {
            return { hasData: false };
        }
        
        const items = [];
        
        // Total protein consumed
        let totalProtein = 0;
        let totalCalories = 0;
        let totalWorkouts = 0;
        let bestProteinDay = 0;
        let longestStreak = 0;
        let currentStreak = 0;
        
        allDays.forEach(day => {
            const data = State.getDayData(day);
            const protein = data?.protein || 0;
            const calories = data?.calories || 0;
            const didWorkout = data?.exercises && Object.values(data.exercises).some(Boolean);
            
            totalProtein += protein;
            totalCalories += calories;
            if (didWorkout) {
                totalWorkouts++;
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
            bestProteinDay = Math.max(bestProteinDay, protein);
        });
        
        // Total XP
        const totalXP = State.getTotalXP();
        
        // Days active
        const daysActive = allDays.length;
        
        // Add items
        items.push({ value: `${Math.round(totalProtein / 1000)}kg`, label: 'PROTEIN CONSUMED' });
        items.push({ value: totalWorkouts.toString(), label: 'WORKOUTS COMPLETED' });
        items.push({ value: `${Math.round(totalCalories / 1000)}k`, label: 'CALORIES TRACKED' });
        items.push({ value: longestStreak.toString(), label: 'LONGEST STREAK' });
        items.push({ value: `${bestProteinDay}g`, label: 'BEST PROTEIN DAY' });
        items.push({ value: daysActive.toString(), label: 'DAYS ACTIVE' });
        items.push({ value: totalXP.toLocaleString(), label: 'TOTAL XP EARNED' });
        
        // Estimated PRs if lift data exists
        const liftHistory = State._data?.liftHistory;
        if (liftHistory) {
            let totalPRs = 0;
            Object.values(liftHistory).forEach(exercise => {
                if (exercise.prs) totalPRs += exercise.prs.length;
            });
            if (totalPRs > 0) {
                items.push({ value: totalPRs.toString(), label: 'PERSONAL RECORDS' });
            }
        }
        
        return { hasData: true, items: items.slice(0, 8) }; // Max 8 items
    },
    
    /**
     * Render all-time stats
     */
    renderAllTimeStats() {
        const profile = State.getProfile();
        const level = Utils.getLevel(State.getTotalXP());
        const streak = Utils.getDailyStreak();
        const allDays = State.getAllDayKeys();
        
        // Calculate completion rate
        let completedDays = 0;
        allDays.forEach(day => {
            const data = State.getDayData(day);
            if (data?.exercises && Object.values(data.exercises).some(Boolean)) {
                completedDays++;
            }
        });
        const completionRate = allDays.length > 0 ? Math.round((completedDays / allDays.length) * 100) : 0;
        
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">ALL-TIME</span>
                </div>
                <div class="alltime-grid">
                    <div class="alltime-item">
                        <div class="alltime-value">${level.level}</div>
                        <div class="alltime-label">LEVEL</div>
                    </div>
                    <div class="alltime-item">
                        <div class="alltime-value">${streak}</div>
                        <div class="alltime-label">STREAK</div>
                    </div>
                    <div class="alltime-item">
                        <div class="alltime-value">${completionRate}%</div>
                        <div class="alltime-label">COMPLETION</div>
                    </div>
                    <div class="alltime-item">
                        <div class="alltime-value">${allDays.length}</div>
                        <div class="alltime-label">DAYS</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render week grid with day grades
     */
    renderWeekGrid() {
        const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const today = new Date();
        const todayKey = State.getTodayKey();
        
        // Get user's start date to not show failed for days before they started
        let startDate = todayKey;
        try {
            const createdAt = State._data?.createdAt;
            startDate = createdAt ? createdAt.split('T')[0] : todayKey;
        } catch (e) {
            console.error('Error getting start date:', e);
        }

        let daysHtml = '';
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            // Use local date formatting, not UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const key = `${year}-${month}-${day}`;
            
            const dayData = State.getDayData(key);
            
            const isToday = key === todayKey;
            const isBeforeStart = key < startDate;
            
            // Get grade and grade class
            const grade = dayData?.dayGrade || '';
            const score = dayData?.dayScore || 0;
            let gradeClass = '';
            if (grade === 'A') gradeClass = 'grade-a';
            else if (grade === 'B') gradeClass = 'grade-b';
            else if (grade === 'C') gradeClass = 'grade-c';
            else if (grade === 'D') gradeClass = 'grade-d';
            else if (grade === 'F') gradeClass = 'grade-f';

            let className = 'week-day';
            if (isToday) className += ' today';
            if (gradeClass) className += ` ${gradeClass}`;
            if (isBeforeStart) className += ' inactive';

            // Show grade letter if available, otherwise just date
            const displayContent = grade && !isBeforeStart 
                ? `<div class="week-day-grade">${grade}</div>`
                : '';

            daysHtml += `
                <div class="${className}" title="${key}: ${score}/100">
                    <div class="week-day-label">${dayLabels[date.getDay()]}</div>
                    <div class="week-day-date">${date.getDate()}</div>
                    ${displayContent}
                </div>
            `;
        }

        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">WEEK VIEW</span>
                </div>
                <div class="week-grid">${daysHtml}</div>
                <div class="week-legend">
                    <span class="legend-item"><span class="legend-dot grade-a"></span> A</span>
                    <span class="legend-item"><span class="legend-dot grade-b"></span> B</span>
                    <span class="legend-item"><span class="legend-dot grade-c"></span> C</span>
                    <span class="legend-item"><span class="legend-dot grade-d"></span> D</span>
                    <span class="legend-item"><span class="legend-dot grade-f"></span> F</span>
                </div>
            </div>
        `;
    }
};

