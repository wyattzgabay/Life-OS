/**
 * SKILLS.JS
 * Skill trees view
 */

const SkillsView = {
    /**
     * Render the skills view
     */
    render() {
        const container = document.getElementById('skills-view');
        
        container.innerHTML = `
            ${Header.renderSimple('SKILL TREES')}
            <div class="skill-trees">
                ${Object.keys(CONFIG.SKILL_TREES).map(key => this.renderTree(key)).join('')}
            </div>
            <div class="tab-spacer"></div>
        `;
    },

    /**
     * Render a single skill tree
     */
    renderTree(skillKey) {
        const tree = CONFIG.SKILL_TREES[skillKey];
        const xp = State.getSkillXP(skillKey);
        const level = Utils.getSkillLevel(skillKey);

        return `
            <div class="skill-tree">
                <div class="tree-header">
                    <div class="tree-icon">${tree.icon}</div>
                    <div class="tree-info">
                        <div class="tree-name">${tree.name}</div>
                        <div class="tree-level">Level ${level}</div>
                    </div>
                    <div class="tree-xp">${xp} XP</div>
                </div>
                <div class="skill-nodes">
                    ${tree.nodes.map((node, idx) => {
                        const unlocked = xp >= node.xpRequired;
                        const active = idx === level - 1;
                        return `
                            <div class="skill-node ${unlocked ? 'unlocked' : ''} ${active ? 'active' : ''}">
                                ${node.name}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
};

