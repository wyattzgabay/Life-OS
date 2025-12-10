/**
 * PROFILE.JS
 * Profile view - stats, goals, settings, backup
 */

const ProfileView = {
    /**
     * Render the profile view
     */
    render() {
        const container = document.getElementById('profile-view');
        
        container.innerHTML = `
            ${Header.renderSimple('PROFILE')}
            ${this.renderHero()}
            ${this.renderStatsGrid()}
            ${this.renderGoalsSection()}
            ${this.renderPhysiquePriorities()}
            ${this.renderPostureSection()}
            ${this.renderRunningSection()}
            ${this.renderCloudSection()}
            ${this.renderDataSection()}
            ${this.renderSettingsSection()}
            ${this.renderFeedbackSection()}
            <div class="version-info">
                <p>${Firebase.isConfigured() ? 'Cloud sync enabled' : 'Data saves locally. Back up regularly.'}</p>
            </div>
            <div class="tab-spacer"></div>
        `;
    },

    /**
     * Render profile hero with level ring
     */
    renderHero() {
        const totalXP = State.getTotalXP();
        const level = Utils.getLevel(totalXP);
        const progress = Utils.getLevelProgress(totalXP);
        const offset = 283 - (progress / 100) * 283;

        return `
            <div class="profile-hero">
                <div class="profile-ring">
                    <svg viewBox="0 0 100 100">
                        <circle class="ring-bg" cx="50" cy="50" r="45"/>
                        <circle class="ring-fill" cx="50" cy="50" r="45" 
                                style="stroke-dashoffset: ${offset}"/>
                    </svg>
                    <div class="profile-level-num">${level.level}</div>
                </div>
                <div class="profile-title">${level.title}</div>
                <div class="profile-xp">${totalXP.toLocaleString()} TOTAL XP</div>
            </div>
        `;
    },

    /**
     * Render stats grid
     */
    renderStatsGrid() {
        const days = State.getAllDayKeys();
        const bestStreak = State.getBestStreak();
        
        let workouts = 0;
        let habits = 0;
        
        for (const day of days) {
            const data = State.getDayData(day);
            if (!data) continue;
            
            if (Object.values(data.exercises || {}).some(Boolean)) {
                workouts++;
            }
            habits += Object.values(data.habits || {}).filter(Boolean).length;
        }

        return `
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-num">${days.length}</div>
                    <div class="stat-label">DAYS</div>
                </div>
                <div class="stat-box">
                    <div class="stat-num">${workouts}</div>
                    <div class="stat-label">SESSIONS</div>
                </div>
                <div class="stat-box">
                    <div class="stat-num">${habits}</div>
                    <div class="stat-label">HABITS</div>
                </div>
                <div class="stat-box">
                    <div class="stat-num">${bestStreak}</div>
                    <div class="stat-label">BEST</div>
                </div>
            </div>
        `;
    },

    /**
     * Render goals section
     */
    renderGoalsSection() {
        const goals = State.getGoals();

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">TARGETS</span>
                    <button class="edit-btn" onclick="ProfileView.openGoalsModal()">EDIT</button>
                </div>
                <div class="goals-list">
                    <div class="goal-row">
                        <span>Target Weight</span>
                        <span>${goals?.targetWeight || '--'} lbs</span>
                    </div>
                    <div class="goal-row">
                        <span>Daily Calories</span>
                        <span>${goals?.dailyCalories || '--'}</span>
                    </div>
                    <div class="goal-row">
                        <span>TDEE</span>
                        <span>${goals?.tdee || '--'}</span>
                    </div>
                    <div class="macros-breakdown">
                        <div class="macro-goal">
                            <span class="macro-label">Protein</span>
                            <span class="macro-value">${goals?.dailyProtein || '--'}g</span>
                        </div>
                        <div class="macro-goal">
                            <span class="macro-label">Carbs</span>
                            <span class="macro-value">${goals?.dailyCarbs || '--'}g</span>
                        </div>
                        <div class="macro-goal">
                            <span class="macro-label">Fats</span>
                            <span class="macro-value">${goals?.dailyFats || '--'}g</span>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render physique priorities section
     */
    renderPhysiquePriorities() {
        const priorities = State.getPhysiquePriorities();

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">PHYSIQUE FOCUS</span>
                    <button class="edit-btn" onclick="ProfileView.openPhysiqueModal()">EDIT</button>
                </div>
                <div class="goals-list">
                    <div class="goal-row">
                        <span>Priority Areas</span>
                        <span>${priorities.length > 0 ? priorities.map(p => {
                            const priority = CONFIG.PHYSIQUE_PRIORITIES.find(pp => pp.id === p);
                            return priority?.name || p;
                        }).join(', ') : 'None set'}</span>
                    </div>
                </div>
                ${priorities.length > 0 ? `
                    <div class="priority-hint">
                        Extra volume recommended for lagging areas
                    </div>
                ` : ''}
            </section>
        `;
    },

    /**
     * Open physique priorities modal
     */
    openPhysiqueModal() {
        const priorities = State.getPhysiquePriorities();
        const modal = document.getElementById('goals-modal');

        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">PHYSIQUE PRIORITIES</div>
                
                <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 16px;">
                    Select 1-3 areas you want to prioritize for extra volume and focus.
                </p>
                
                <div class="priority-options">
                    ${CONFIG.PHYSIQUE_PRIORITIES.map(p => `
                        <label class="priority-check ${priorities.includes(p.id) ? 'active' : ''}">
                            <input type="checkbox" 
                                   ${priorities.includes(p.id) ? 'checked' : ''}
                                   onchange="ProfileView.togglePriority('${p.id}')">
                            <div class="priority-info">
                                <span class="priority-name">${p.name}</span>
                                <span class="priority-desc">${p.description}</span>
                            </div>
                        </label>
                    `).join('')}
                </div>
                
                <button class="save-btn" onclick="document.getElementById('goals-modal').classList.remove('active'); ProfileView.render();">DONE</button>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Toggle a physique priority
     */
    togglePriority(priorityId) {
        const priorities = State.getPhysiquePriorities();
        const idx = priorities.indexOf(priorityId);
        
        if (idx >= 0) {
            priorities.splice(idx, 1);
        } else {
            if (priorities.length < 3) {
                priorities.push(priorityId);
            } else {
                alert('Maximum 3 priorities. Remove one first.');
                return;
            }
        }
        
        State.setPhysiquePriorities(priorities);
        this.openPhysiqueModal(); // Refresh
    },

    /**
     * Render posture issues section
     */
    renderPostureSection() {
        const issues = State.getPostureIssues();

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">POSTURE ASSESSMENT</span>
                    <button class="edit-btn" onclick="ProfileView.openPostureModal()">EDIT</button>
                </div>
                <div class="goals-list">
                    <div class="goal-row">
                        <span>Issues Identified</span>
                        <span>${issues.length > 0 ? issues.length : 'None'}</span>
                    </div>
                    ${issues.length > 0 ? `
                        <div class="goal-row">
                            <span>Corrections Active</span>
                            <span>In workouts</span>
                        </div>
                    ` : ''}
                </div>
                ${issues.length === 0 ? `
                    <div class="priority-hint">
                        Identify any posture issues for personalized corrections
                    </div>
                ` : ''}
            </section>
        `;
    },

    /**
     * Open posture assessment modal
     */
    openPostureModal() {
        const issues = State.getPostureIssues();
        const modal = document.getElementById('goals-modal');

        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">POSTURE ASSESSMENT</div>
                
                <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 16px;">
                    Select any issues you have. Corrective exercises will be emphasized in your workouts.
                </p>
                
                <div class="posture-options">
                    ${CONFIG.POSTURE_ISSUES.map(issue => `
                        <label class="posture-check ${issues.includes(issue.id) ? 'active' : ''}">
                            <input type="checkbox" 
                                   ${issues.includes(issue.id) ? 'checked' : ''}
                                   onchange="ProfileView.togglePostureIssue('${issue.id}')">
                            <div class="posture-info">
                                <span class="posture-name">${issue.name}</span>
                                <span class="posture-desc">${issue.description}</span>
                                <span class="posture-focus">Focus: ${issue.focus.join(', ')}</span>
                            </div>
                        </label>
                    `).join('')}
                </div>
                
                <button class="save-btn" onclick="document.getElementById('goals-modal').classList.remove('active'); ProfileView.render();">DONE</button>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Toggle a posture issue
     */
    togglePostureIssue(issueId) {
        const issues = State.getPostureIssues();
        const idx = issues.indexOf(issueId);
        
        if (idx >= 0) {
            issues.splice(idx, 1);
        } else {
            issues.push(issueId);
        }
        
        State.setPostureIssues(issues);
        this.openPostureModal(); // Refresh
    },

    /**
     * Render running program section
     */
    renderRunningSection() {
        const running = State.getRunningData();
        const goal = running?.goal ? CONFIG.RUNNING.GOALS.find(g => g.id === running.goal) : null;

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">RUNNING PROGRAM</span>
                    <button class="edit-btn" onclick="ProfileView.openRunningModal()">
                        ${goal ? 'EDIT' : 'SETUP'}
                    </button>
                </div>
                <div class="goals-list">
                    <div class="goal-row">
                        <span>Goal</span>
                        <span>${goal?.name || 'Not set'}</span>
                    </div>
                    ${goal?.weeks ? `
                        <div class="goal-row">
                            <span>Week</span>
                            <span>${running?.weekNumber || 1} / ${goal.weeks}</span>
                        </div>
                    ` : ''}
                    <div class="goal-row">
                        <span>Injuries</span>
                        <span>${running?.injuries?.length || 0} tracked</span>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Open running setup modal
     */
    openRunningModal() {
        const running = State.getRunningData();
        const modal = document.getElementById('goals-modal');

        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">RUNNING PROGRAM</div>
                
                <div class="setup-section">
                    <label>Running Goal</label>
                    <div class="goal-options">
                        ${CONFIG.RUNNING.GOALS.map(g => `
                            <button class="goal-btn ${running?.goal === g.id ? 'active' : ''}" 
                                    onclick="ProfileView.selectRunningGoal('${g.id}')">
                                ${g.name}
                                ${g.weeks ? `<span class="goal-weeks">${g.weeks} weeks</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="setup-section" style="margin-top: 20px;">
                    <label>Current Injuries/Limitations</label>
                    <div class="injury-options">
                        ${CONFIG.RUNNING.INJURIES.map(i => `
                            <label class="injury-check">
                                <input type="checkbox" 
                                       ${running?.injuries?.includes(i.id) ? 'checked' : ''}
                                       onchange="ProfileView.toggleRunningInjury('${i.id}')">
                                <span>${i.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <button class="save-btn" onclick="ProfileView.closeRunningModal()">DONE</button>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Select running goal
     */
    selectRunningGoal(goalId) {
        State.setRunningGoal(goalId);
        this.openRunningModal(); // Refresh modal
        App.render(); // Refresh main views with new goal
    },

    /**
     * Toggle running injury
     */
    toggleRunningInjury(injuryId) {
        const running = State.getRunningData();
        const injuries = running?.injuries || [];
        
        const idx = injuries.indexOf(injuryId);
        if (idx >= 0) {
            injuries.splice(idx, 1);
        } else {
            injuries.push(injuryId);
        }
        
        State.setRunningInjuries(injuries);
    },

    /**
     * Close running modal
     */
    closeRunningModal() {
        document.getElementById('goals-modal').classList.remove('active');
        this.render();
    },

    /**
     * Render cloud sync section
     */
    renderCloudSection() {
        const isConfigured = Firebase.isConfigured();
        const isConnected = Firebase.initialized && Firebase.user;
        const userEmail = localStorage.getItem('user_email');

        if (!isConfigured) {
            return `
                <section class="section">
                    <div class="section-header">
                        <span class="section-title">CLOUD SYNC</span>
                    </div>
                    <div class="cloud-setup-card">
                        <div class="cloud-status offline">NOT CONFIGURED</div>
                        <p style="font-size: 12px; color: var(--text-muted); margin: 12px 0;">
                            Enable cloud sync to access your data from any device and never lose progress.
                        </p>
                        <button class="save-btn" onclick="ProfileView.showFirebaseSetup()">
                            SETUP CLOUD SYNC
                        </button>
                    </div>
                </section>
            `;
        }

        // Not signed in - show account creation
        if (!isConnected) {
            return `
                <section class="section">
                    <div class="section-header">
                        <span class="section-title">CLOUD SYNC</span>
                        <span class="section-badge" style="background: var(--warning); color: var(--bg);">NOT SYNCED</span>
                    </div>
                    <div class="cloud-setup-card">
                        <p style="font-size: 13px; color: var(--text); margin-bottom: 12px;">
                            <strong>Your data is only saved locally!</strong>
                        </p>
                        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
                            Create an account to sync to the cloud. You'll be able to recover your data if you clear your browser.
                        </p>
                        <button class="save-btn" onclick="ProfileView.showAccountSetup()">
                            CREATE ACCOUNT
                        </button>
                    </div>
                </section>
            `;
        }

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">CLOUD SYNC</span>
                    <span class="section-badge" style="background: var(--success);">SYNCED</span>
                </div>
                <div class="goals-list">
                    <div class="goal-row">
                        <span>Account</span>
                        <span style="font-size: 12px;">${userEmail || 'Signed in'}</span>
                    </div>
                    <div class="goal-row">
                        <span>Last Sync</span>
                        <span>${Firebase.lastSync ? new Date(Firebase.lastSync).toLocaleTimeString() : 'Syncing...'}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="secondary-btn" style="flex: 1;" onclick="ProfileView.forceCloudRestore()">
                        RESTORE FROM CLOUD
                    </button>
                    <button class="secondary-btn" style="flex: 1;" onclick="ProfileView.signOut()">
                        SIGN OUT
                    </button>
                </div>
            </section>
        `;
    },
    
    /**
     * Show account setup modal
     */
    showAccountSetup() {
        const modal = document.getElementById('goals-modal');
        
        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">CREATE ACCOUNT</div>
                
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
                    Your current data will be synced to this account.
                </p>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">EMAIL</label>
                    <input type="email" id="account-email" placeholder="your@email.com" 
                           style="width: 100%; padding: 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 16px;">
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">PASSWORD</label>
                    <input type="password" id="account-password" placeholder="Create password (6+ chars)"
                           style="width: 100%; padding: 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 16px;">
                </div>
                
                <div id="account-error" style="color: var(--error); font-size: 13px; margin-bottom: 12px; min-height: 20px;"></div>
                
                <button class="save-btn" id="account-submit" onclick="ProfileView.createAccount()">
                    CREATE & SYNC
                </button>
                
                <button class="secondary-btn" style="margin-top: 12px; width: 100%;" onclick="document.getElementById('goals-modal').classList.remove('active')">
                    CANCEL
                </button>
            </div>
        `;
        
        modal.classList.add('active');
    },
    
    /**
     * Create account and sync data
     */
    async createAccount() {
        const email = document.getElementById('account-email').value.trim();
        const password = document.getElementById('account-password').value;
        const errorDiv = document.getElementById('account-error');
        const submitBtn = document.getElementById('account-submit');
        
        if (!email || !password) {
            errorDiv.textContent = 'Please enter email and password';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        errorDiv.textContent = '';
        
        const result = await Firebase.createAccount(email, password);
        
        if (result.success) {
            // Sync current data to new account
            await State.syncToCloud();
            
            document.getElementById('goals-modal').classList.remove('active');
            App.showNotification('Account created! Data synced.');
            App.render();
        } else {
            errorDiv.textContent = result.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'CREATE & SYNC';
        }
    },
    
    /**
     * Force restore data from cloud (overwrites local)
     */
    async forceCloudRestore() {
        if (!confirm('This will replace local data with cloud data. Continue?')) {
            return;
        }
        
        try {
            // Create backup first
            State.createBackup('pre-force-restore');
            
            const cloudData = await Firebase.loadData();
            
            if (cloudData && cloudData.profile) {
                const cloudCount = State.countDataEntries(cloudData);
                State._data = cloudData;
                State.saveLocal();
                App.showNotification(`Restored ${cloudCount} entries from cloud!`);
                App.render();
            } else {
                App.showNotification('No cloud data found for this account');
            }
        } catch (e) {
            console.error('Force restore error:', e);
            App.showNotification('Error restoring: ' + e.message);
        }
    },
    
    /**
     * Sign out
     */
    async signOut() {
        if (confirm('Sign out? Your local data will remain, but cloud sync will stop.')) {
            await Firebase.signOut();
            App.render();
        }
    },

    /**
     * Show Firebase setup instructions
     */
    showFirebaseSetup() {
        const modal = document.getElementById('goals-modal');

        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">SETUP CLOUD SYNC</div>
                
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-2);">
                    <p style="margin-bottom: 16px;">To enable cloud sync:</p>
                    
                    <ol style="padding-left: 20px; margin-bottom: 20px;">
                        <li style="margin-bottom: 8px;">Go to <strong>console.firebase.google.com</strong></li>
                        <li style="margin-bottom: 8px;">Create a new project (free)</li>
                        <li style="margin-bottom: 8px;">Add a Web App to your project</li>
                        <li style="margin-bottom: 8px;">Copy the config values</li>
                        <li style="margin-bottom: 8px;">Enable <strong>Firestore Database</strong> (test mode)</li>
                        <li style="margin-bottom: 8px;">Enable <strong>Anonymous Authentication</strong></li>
                        <li style="margin-bottom: 8px;">Update <code>js/firebase-config.js</code> with your values</li>
                    </ol>
                    
                    <p style="color: var(--text-muted); font-size: 11px;">
                        Once configured, your data will automatically sync across all devices.
                    </p>
                </div>
                
                <button class="save-btn" onclick="document.getElementById('goals-modal').classList.remove('active')">
                    GOT IT
                </button>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Render data backup section with status
     */
    renderDataSection() {
        const backups = State.getBackups();
        const hasBackups = backups.length > 0;
        const dataCount = State.countDataEntries(State._data);
        const lastModified = State._data?.lastModified 
            ? new Date(State._data.lastModified).toLocaleString()
            : 'Unknown';
        
        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">DATA STATUS</span>
                    <span class="section-badge" style="background: var(--success);">${dataCount} entries</span>
                </div>
                <div class="goals-list" style="margin-bottom: 12px;">
                    <div class="goal-row">
                        <span>Last Saved</span>
                        <span style="font-size: 11px;">${lastModified}</span>
                    </div>
                    <div class="goal-row">
                        <span>Auto-Backups</span>
                        <span>${backups.length} saved</span>
                    </div>
                    <div class="goal-row">
                        <span>Storage</span>
                        <span style="font-size: 11px;">Local + Cloud + IDB</span>
                    </div>
                </div>
                <div class="settings-list">
                    ${hasBackups ? `
                        <div class="setting-row highlight" onclick="ProfileView.showAutoBackups()">
                            <span>Restore from Auto-Backup</span>
                            <span class="setting-value">${backups.length} saved</span>
                        </div>
                    ` : ''}
                    <div class="setting-row" onclick="ProfileView.forceBackup()">
                        <span>Create Manual Backup</span>
                        <span class="setting-value">NOW</span>
                    </div>
                    <div class="setting-row" onclick="ProfileView.backup()">
                        <span>Copy Data to Clipboard</span>
                        <span class="setting-value">COPY</span>
                    </div>
                    <div class="setting-row" onclick="ProfileView.openRestoreModal()">
                        <span>Restore from Clipboard</span>
                        <span class="setting-value">PASTE</span>
                    </div>
                    <div class="setting-row" onclick="ProfileView.exportJSON()">
                        <span>Export JSON File</span>
                        <span class="setting-value">FILE</span>
                    </div>
                </div>
            </section>
        `;
    },
    
    /**
     * Force create a manual backup
     */
    forceBackup() {
        State.createBackup('manual');
        State.saveToIndexedDB(State._data);
        State.syncToCloud();
        App.showNotification('Backup created successfully!');
        this.render();
    },
    
    /**
     * Show auto-backup restore options
     */
    showAutoBackups() {
        const backups = State.getBackups();
        
        if (backups.length === 0) {
            App.showNotification('No auto-backups available');
            return;
        }
        
        const modal = document.getElementById('goals-modal');
        
        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">RESTORE FROM BACKUP</div>
                
                <p style="text-align: center; color: var(--text-muted); margin-bottom: 16px; font-size: 13px;">
                    Select a backup to restore. Your current data will be backed up first.
                </p>
                
                <div class="backup-list">
                    ${backups.map((b, i) => {
                        const date = new Date(b.timestamp);
                        const timeStr = date.toLocaleString();
                        const dataCount = State.countDataEntries(b.data);
                        return `
                            <div class="backup-item" onclick="ProfileView.confirmRestore(${i})">
                                <div class="backup-time">${timeStr}</div>
                                <div class="backup-meta">
                                    <span class="backup-reason">${b.reason || 'auto'}</span>
                                    <span class="backup-count">${dataCount} entries</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <button class="cancel-btn" onclick="document.getElementById('goals-modal').classList.remove('active')">
                    CANCEL
                </button>
            </div>
        `;
        
        modal.classList.add('active');
    },
    
    /**
     * Confirm and execute restore
     */
    confirmRestore(index) {
        const backups = State.getBackups();
        const backup = backups[index];
        
        if (!backup) {
            App.showNotification('Backup not found');
            return;
        }
        
        const dataCount = State.countDataEntries(backup.data);
        const currentCount = State.countDataEntries(State._data);
        
        const msg = `Restore backup from ${new Date(backup.timestamp).toLocaleString()}?\n\n` +
                    `Backup has ${dataCount} data entries.\n` +
                    `Current data has ${currentCount} entries.\n\n` +
                    `Current data will be backed up first.`;
        
        if (confirm(msg)) {
            State.restoreFromBackup(index);
            document.getElementById('goals-modal').classList.remove('active');
            App.showNotification('Data restored successfully!');
            App.render();
        }
    },

    /**
     * Render settings section
     */
    renderSettingsSection() {
        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">SETTINGS</span>
                </div>
                <div class="settings-list">
                    <div class="setting-row" onclick="ProfileView.recalculate()">
                        <span>Recalculate Nutrition</span>
                        <span class="setting-value">CALC</span>
                    </div>
                    <div class="setting-row" onclick="App.resetOnboarding()">
                        <span>Redo Setup</span>
                        <span class="setting-value">→</span>
                    </div>
                    <div class="setting-row danger" onclick="App.resetAll()">
                        <span>Reset All Data</span>
                        <span class="setting-value">→</span>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Open goals edit modal
     */
    openGoalsModal() {
        const goals = State.getGoals();
        const modal = document.getElementById('goals-modal');

        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">EDIT TARGETS</div>
                
                <div class="input-group">
                    <label>Target Weight (lbs)</label>
                    <input type="number" class="input-field" id="edit-weight" 
                           value="${goals?.targetWeight || ''}" inputmode="decimal">
                </div>
                
                <div class="input-group">
                    <label>Daily Calories</label>
                    <input type="number" class="input-field" id="edit-calories" 
                           value="${goals?.dailyCalories || ''}" inputmode="numeric">
                </div>
                
                <div class="macro-inputs-row">
                    <div class="input-group compact">
                        <label>Protein (g)</label>
                        <input type="number" class="input-field" id="edit-protein" 
                               value="${goals?.dailyProtein || ''}" inputmode="numeric">
                    </div>
                    <div class="input-group compact">
                        <label>Carbs (g)</label>
                        <input type="number" class="input-field" id="edit-carbs" 
                               value="${goals?.dailyCarbs || ''}" inputmode="numeric">
                    </div>
                    <div class="input-group compact">
                        <label>Fats (g)</label>
                        <input type="number" class="input-field" id="edit-fats" 
                               value="${goals?.dailyFats || ''}" inputmode="numeric">
                    </div>
                </div>
                
                <button class="recalc-btn" onclick="ProfileView.recalculateMacros()">AUTO-CALCULATE</button>
                
                <button class="save-btn" onclick="ProfileView.saveGoals()">SAVE</button>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Recalculate macros based on goals
     */
    recalculateMacros() {
        const profile = State.getProfile();
        const goals = State.getGoals();
        const todayData = State.getDayData();
        
        // Use most recent logged weight, or current profile weight
        const currentWeight = todayData?.weight || profile?.currentWeight || 180;
        const targetWeight = parseFloat(document.getElementById('edit-weight').value) || goals?.targetWeight || 175;
        const height = profile?.height || 70;
        const age = profile?.age || 28;
        
        const targets = Utils.calculateTargets(currentWeight, targetWeight, height, age);
        
        document.getElementById('edit-calories').value = targets.calories;
        document.getElementById('edit-protein').value = targets.protein;
        document.getElementById('edit-carbs').value = targets.carbs;
        document.getElementById('edit-fats').value = targets.fats;
        
        App.showNotification(`${targets.calories} cal / ${targets.protein}g P / ${targets.carbs}g C / ${targets.fats}g F`);
    },

    /**
     * Save goals from modal
     */
    saveGoals() {
        const weight = parseFloat(document.getElementById('edit-weight').value);
        const protein = parseInt(document.getElementById('edit-protein').value);
        const calories = parseInt(document.getElementById('edit-calories').value);
        const carbs = parseInt(document.getElementById('edit-carbs').value);
        const fats = parseInt(document.getElementById('edit-fats').value);

        if (weight) State.setGoals({ targetWeight: weight });
        if (protein) State.setGoals({ dailyProtein: protein });
        if (calories) State.setGoals({ dailyCalories: calories });
        if (carbs) State.setGoals({ dailyCarbs: carbs });
        if (fats) State.setGoals({ dailyFats: fats });

        document.getElementById('goals-modal').classList.remove('active');
        this.render();
    },

    /**
     * Backup data to clipboard
     */
    backup() {
        const json = State.export();
        
        navigator.clipboard.writeText(json).then(() => {
            alert('Data copied to clipboard! Save it somewhere safe.');
        }).catch(() => {
            prompt('Copy this backup:', json);
        });
    },

    /**
     * Open restore modal
     */
    openRestoreModal() {
        const modal = document.getElementById('restore-modal');

        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">RESTORE DATA</div>
                
                <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                    Paste your backup JSON below:
                </p>
                
                <textarea class="restore-textarea" id="restore-input" 
                          placeholder="Paste backup data here..."></textarea>
                
                <button class="save-btn" onclick="ProfileView.doRestore()">RESTORE</button>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Restore data from modal
     */
    doRestore() {
        const input = document.getElementById('restore-input').value;
        
        if (State.import(input)) {
            alert('Data restored! Reloading...');
            location.reload();
        } else {
            alert('Invalid backup data');
        }
    },

    /**
     * Export JSON file
     */
    exportJSON() {
        const json = State.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `life-os-${State.getTodayKey()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Recalculate nutrition targets
     */
    recalculate() {
        const profile = State.getProfile();
        const goals = State.getGoals();

        if (!profile?.startWeight || !profile?.height || !profile?.age || !goals?.targetWeight) {
            alert('Missing profile data. Please redo setup.');
            return;
        }

        const targets = Utils.calculateTargets(
            profile.startWeight,
            goals.targetWeight,
            profile.height,
            profile.age
        );

        State.setGoals({
            dailyCalories: targets.calories,
            dailyProtein: targets.protein,
            tdee: targets.tdee
        });

        alert(`Recalculated!\n\nTDEE: ${targets.tdee}\nCalories: ${targets.calories}\nProtein: ${targets.protein}g\n\n${targets.explanation}`);
        
        this.render();
    },

    /**
     * Render feedback/bug report section
     */
    renderFeedbackSection() {
        return `
            <section class="section feedback-section">
                <div class="section-header">
                    <span class="section-title">BUG REPORTS / FEATURE IDEAS</span>
                </div>
                <textarea class="feedback-textarea" id="feedback-input" 
                          placeholder="Found a bug? Have an idea? Write it here..."
                          rows="3"></textarea>
                <button class="feedback-btn" onclick="ProfileView.submitFeedback()">SUBMIT</button>
                <div id="feedback-list" class="feedback-list">
                    ${this.renderFeedbackList()}
                </div>
            </section>
        `;
    },

    /**
     * Render list of submitted feedback
     */
    renderFeedbackList() {
        const feedback = State.getFeedback();
        if (!feedback || feedback.length === 0) return '';
        
        // Show last 3
        const recent = feedback.slice(-3).reverse();
        
        return `
            <div class="feedback-history-label">Recent submissions:</div>
            ${recent.map(f => `
                <div class="feedback-item">
                    <span class="feedback-date">${new Date(f.timestamp).toLocaleDateString()}</span>
                    <span class="feedback-text">${f.text.substring(0, 50)}${f.text.length > 50 ? '...' : ''}</span>
                </div>
            `).join('')}
            ${feedback.length > 0 ? `
                <button class="view-all-feedback-btn" onclick="ProfileView.showAllFeedback()">
                    VIEW ALL (${feedback.length})
                </button>
            ` : ''}
        `;
    },
    
    /**
     * Show all feedback in a modal for easy copying
     */
    showAllFeedback() {
        const feedback = State.getFeedback();
        const modal = document.getElementById('goals-modal');
        
        // Format feedback for easy copying
        const formattedFeedback = feedback.map(f => 
            `[${new Date(f.timestamp).toLocaleDateString()} ${new Date(f.timestamp).toLocaleTimeString()}]\n${f.text}`
        ).join('\n\n---\n\n');
        
        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">ALL FEEDBACK (${feedback.length})</div>
                
                <div class="feedback-export-section">
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                        Long-press the text below to select and copy
                    </p>
                    
                    <textarea class="feedback-export-textarea" id="feedback-export-text" readonly
                              onclick="this.select(); this.setSelectionRange(0, this.value.length);">${formattedFeedback}</textarea>
                    
                    <button class="save-btn" onclick="ProfileView.selectFeedbackText()">SELECT ALL TEXT</button>
                    <button class="clear-btn" onclick="ProfileView.clearFeedback()" style="margin-top: 10px;">CLEAR ALL</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    },
    
    /**
     * Select all feedback text for copying
     */
    selectFeedbackText() {
        const textarea = document.getElementById('feedback-export-text');
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        App.showNotification('Text selected - now copy it');
    },
    
    /**
     * Copy all feedback to clipboard
     */
    copyAllFeedback() {
        const feedback = State.getFeedback();
        const formattedFeedback = feedback.map(f => 
            `[${new Date(f.timestamp).toLocaleDateString()} ${new Date(f.timestamp).toLocaleTimeString()}]\n${f.text}`
        ).join('\n\n---\n\n');
        
        // iOS-friendly clipboard method
        const textarea = document.createElement('textarea');
        textarea.value = formattedFeedback;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        
        // iOS specific selection
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textarea.setSelectionRange(0, formattedFeedback.length);
        
        try {
            document.execCommand('copy');
            App.showNotification('Copied to clipboard!');
        } catch (err) {
            // Show the text so user can manually copy
            alert('Copy this text:\n\n' + formattedFeedback);
        }
        
        document.body.removeChild(textarea);
    },
    
    /**
     * Clear all feedback
     */
    clearFeedback() {
        if (confirm('Clear all feedback? This cannot be undone.')) {
            State.clearFeedback();
            document.getElementById('goals-modal').classList.remove('active');
            this.render();
            App.showNotification('Feedback cleared');
        }
    },

    /**
     * Submit feedback
     */
    submitFeedback() {
        const input = document.getElementById('feedback-input');
        const text = input.value.trim();
        
        if (!text) {
            App.showNotification('Enter some feedback first');
            return;
        }
        
        State.addFeedback(text);
        input.value = '';
        
        // Re-render the feedback list
        document.getElementById('feedback-list').innerHTML = this.renderFeedbackList();
        
        App.showNotification('Feedback saved. Thanks!');
    }
};

// Modal click handlers
document.addEventListener('DOMContentLoaded', () => {
    ['goals-modal', 'restore-modal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    modal.innerHTML = '';
                    document.body.style.overflow = '';
                }
            });
        }
    });
});

