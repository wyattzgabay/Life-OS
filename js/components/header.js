/**
 * HEADER.JS
 * Header component with date, XP, level bar
 */

const Header = {
    /**
     * Render the main header for daily view
     */
    render() {
        const date = Utils.formatDate();
        const totalXP = State.getTotalXP();
        const level = Utils.getLevel(totalXP);
        const nextLevel = Utils.getNextLevel(totalXP);
        const progress = Utils.getLevelProgress(totalXP);
        const streak = Utils.getDailyStreak();
        const mult = Utils.getStreakMultiplier(streak);

        return `
            <header class="header">
                <div class="header-row">
                    <div>
                        <div class="date-label">${date.dayName}</div>
                        <div class="date-full">${date.monthName} ${date.dayNum}</div>
                    </div>
                    <div class="xp-display">
                        <div class="xp-row">
                            <span class="xp-number">${totalXP.toLocaleString()}</span>
                            ${mult > 1 ? `<span class="streak-badge">${mult}x</span>` : ''}
                        </div>
                        <div class="xp-label">XP</div>
                    </div>
                </div>
                <div class="level-container">
                    <div class="level-info">
                        <span class="level-badge">LVL ${level.level}</span>
                        <span class="level-title">${level.title}</span>
                    </div>
                    <div class="level-bar">
                        <div class="level-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="level-xp-text">${totalXP} / ${nextLevel.xp} XP</div>
                </div>
            </header>
        `;
    },

    /**
     * Render simple header for other views
     */
    renderSimple(title) {
        return `
            <header class="view-header">
                <h1 class="view-title">${title}</h1>
            </header>
        `;
    }
};


