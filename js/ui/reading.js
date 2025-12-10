/**
 * READING.JS
 * Reading tracker - current book, pages, completed books list
 */

const ReadingView = {
    /**
     * Render reading section for daily view
     */
    renderDailyReading() {
        const reading = State.getReadingData();
        
        if (!reading?.currentBook) {
            return `
                <section class="section">
                    <div class="section-header">
                        <span class="section-title">READING</span>
                    </div>
                    <div class="reading-empty" onclick="ReadingView.openAddBook()">
                        <div class="empty-text">No book in progress</div>
                        <div class="empty-action">+ Add Book</div>
                    </div>
                </section>
            `;
        }

        const book = reading.currentBook;
        const progress = Math.round((book.pagesRead / book.totalPages) * 100);

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">READING</span>
                    <span class="section-count">${reading.completedBooks.length} books</span>
                </div>
                <div class="reading-card" onclick="ReadingView.openUpdatePages()">
                    <div class="book-title">${book.title}</div>
                    <div class="book-progress-bar">
                        <div class="book-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="book-stats">
                        <span>${book.pagesRead} / ${book.totalPages} pages</span>
                        <span>${progress}%</span>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render full reading view
     */
    render() {
        const reading = State.getReadingData();
        const books = State.getCompletedBooks();
        const thisYear = new Date().getFullYear();
        const booksThisYear = books.filter(b => 
            new Date(b.completedDate).getFullYear() === thisYear
        ).length;

        return `
            ${Header.renderSimple('READING')}
            
            ${this.renderCurrentBook(reading)}
            ${this.renderYearlyGoal(booksThisYear, reading?.yearlyGoal || 12)}
            ${this.renderCompletedBooks(books)}
        `;
    },

    /**
     * Render current book section
     */
    renderCurrentBook(reading) {
        if (!reading?.currentBook) {
            return `
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span class="analysis-title">CURRENT BOOK</span>
                    </div>
                    <div style="text-align: center; padding: 30px;">
                        <button class="save-btn" onclick="ReadingView.openAddBook()">
                            START A BOOK
                        </button>
                    </div>
                </div>
            `;
        }

        const book = reading.currentBook;
        const progress = Math.round((book.pagesRead / book.totalPages) * 100);
        const pagesLeft = book.totalPages - book.pagesRead;

        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">CURRENT BOOK</span>
                </div>
                <div class="current-book-display">
                    <div class="book-title-large">${book.title}</div>
                    <div class="book-big-progress">
                        <div class="big-progress-bar">
                            <div class="big-progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="big-progress-text">${progress}%</div>
                    </div>
                    <div class="book-page-stats">
                        <div class="page-stat">
                            <div class="page-stat-num">${book.pagesRead}</div>
                            <div class="page-stat-label">READ</div>
                        </div>
                        <div class="page-stat">
                            <div class="page-stat-num">${pagesLeft}</div>
                            <div class="page-stat-label">LEFT</div>
                        </div>
                        <div class="page-stat">
                            <div class="page-stat-num">${book.totalPages}</div>
                            <div class="page-stat-label">TOTAL</div>
                        </div>
                    </div>
                    <div class="book-actions">
                        <button class="book-action-btn" onclick="ReadingView.openUpdatePages()">
                            UPDATE PAGES
                        </button>
                        <button class="book-action-btn secondary" onclick="ReadingView.finishBook()">
                            MARK COMPLETE
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render yearly goal
     */
    renderYearlyGoal(completed, goal) {
        const progress = Math.round((completed / goal) * 100);

        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">${new Date().getFullYear()} GOAL</span>
                </div>
                <div class="yearly-goal">
                    <div class="goal-progress-ring">
                        <svg viewBox="0 0 100 100">
                            <circle class="ring-bg" cx="50" cy="50" r="40"/>
                            <circle class="ring-fill" cx="50" cy="50" r="40" 
                                    style="stroke-dasharray: 251; stroke-dashoffset: ${251 - (progress / 100) * 251}"/>
                        </svg>
                        <div class="goal-progress-text">${completed}/${goal}</div>
                    </div>
                    <div class="goal-label">books this year</div>
                </div>
            </div>
        `;
    },

    /**
     * Render completed books list
     */
    renderCompletedBooks(books) {
        if (books.length === 0) {
            return `
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span class="analysis-title">COMPLETED</span>
                    </div>
                    <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                        No completed books yet
                    </div>
                </div>
            `;
        }

        // Sort by completion date, newest first
        const sorted = [...books].sort((a, b) => 
            new Date(b.completedDate) - new Date(a.completedDate)
        );

        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">COMPLETED</span>
                    <span class="section-count">${books.length} total</span>
                </div>
                <div class="completed-books-list">
                    ${sorted.map(book => `
                        <div class="completed-book-item">
                            <div class="completed-book-title">${book.title}</div>
                            <div class="completed-book-meta">
                                ${book.totalPages} pages · ${this.formatDate(book.completedDate)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    /**
     * Open add book modal
     */
    openAddBook() {
        const modal = document.getElementById('logger-modal');
        
        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">START A BOOK</div>
                
                <div class="input-group">
                    <label>Book Title</label>
                    <input type="text" class="input-field" id="book-title" placeholder="Enter title">
                </div>
                
                <div class="input-group">
                    <label>Total Pages</label>
                    <input type="number" class="input-field" id="book-pages" 
                           placeholder="300" inputmode="numeric">
                </div>
                
                <button class="save-btn" onclick="ReadingView.saveNewBook()">START READING</button>
            </div>
        `;
        
        modal.classList.add('active');
        setTimeout(() => document.getElementById('book-title')?.focus(), 100);
    },

    /**
     * Save new book
     */
    saveNewBook() {
        const title = document.getElementById('book-title')?.value?.trim();
        const pages = parseInt(document.getElementById('book-pages')?.value);

        if (!title || !pages) {
            alert('Please enter title and page count');
            return;
        }

        State.startBook(title, pages);
        document.getElementById('logger-modal').classList.remove('active');
        App.render();
    },

    /**
     * Open update pages modal
     */
    openUpdatePages() {
        const reading = State.getReadingData();
        if (!reading?.currentBook) return;

        const modal = document.getElementById('logger-modal');
        
        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">UPDATE PAGES</div>
                
                <div class="book-title-modal">${reading.currentBook.title}</div>
                
                <input type="number" class="logger-input" id="pages-input" 
                       value="${reading.currentBook.pagesRead}" 
                       placeholder="0" inputmode="numeric">
                
                <div class="preset-grid">
                    <button class="preset-btn" onclick="ReadingView.addPages(10)">+10</button>
                    <button class="preset-btn" onclick="ReadingView.addPages(20)">+20</button>
                    <button class="preset-btn" onclick="ReadingView.addPages(30)">+30</button>
                </div>
                
                <div class="logger-goal">of ${reading.currentBook.totalPages} pages</div>
                
                <button class="save-btn" onclick="ReadingView.savePages()">SAVE</button>
            </div>
        `;
        
        modal.classList.add('active');
    },

    /**
     * Add pages to input
     */
    addPages(amount) {
        const input = document.getElementById('pages-input');
        const current = parseInt(input.value) || 0;
        input.value = current + amount;
    },

    /**
     * Save page update
     */
    savePages() {
        const pages = parseInt(document.getElementById('pages-input')?.value);
        if (isNaN(pages)) return;

        State.updatePagesRead(pages);
        document.getElementById('logger-modal').classList.remove('active');
        
        // Award XP for reading progress
        App.awardXP(10, 'discipline');
        App.render();
    },

    /**
     * Finish current book
     */
    finishBook() {
        if (confirm('Mark this book as complete?')) {
            State.completeBook();
            App.awardXP(50, 'discipline'); // Bonus XP for finishing a book
            App.render();
        }
    }
};



