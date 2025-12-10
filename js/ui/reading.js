/**
 * READING.JS
 * Reading tracker with Library system - multiple books, progress tracking, daily reading
 */

const ReadingView = {
    /**
     * Render reading section for daily view (compact)
     */
    renderDailyReading() {
        const library = State.getLibrary();
        const todaysPages = State.getTodaysReadingProgress();
        
        if (library.length === 0) {
            return `
                <section class="section">
                    <div class="section-header">
                        <span class="section-title">READING</span>
                    </div>
                    <div class="reading-empty" onclick="ReadingView.openAddBook()">
                        <div class="empty-text">No books in your library</div>
                        <div class="empty-action">+ Add Book</div>
                    </div>
                </section>
            `;
        }

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">READING</span>
                    <span class="section-count">${todaysPages} pages today</span>
                </div>
                <div class="library-cards">
                    ${library.slice(0, 2).map(book => this.renderBookCard(book, true)).join('')}
                    ${library.length > 2 ? `
                        <div class="library-more" onclick="App.showView('reading')">
                            +${library.length - 2} more in library
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    },

    /**
     * Render a single book card
     */
    renderBookCard(book, compact = false) {
        const progress = Math.round((book.pagesRead / book.totalPages) * 100);
        const today = State.getTodayKey();
        const todayEntry = book.dailyProgress?.find(d => d.date === today);
        const pagesReadToday = todayEntry?.pages || 0;

        if (compact) {
            return `
                <div class="book-card compact" onclick="ReadingView.openUpdatePages('${book.id}')">
                    <div class="book-card-header">
                        <div class="book-title">${book.title}</div>
                        ${pagesReadToday > 0 ? `<span class="today-badge">+${pagesReadToday} today</span>` : ''}
                    </div>
                    <div class="book-progress-bar">
                        <div class="book-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="book-stats">
                        <span>${book.pagesRead} / ${book.totalPages}</span>
                        <span>${progress}%</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="book-card" onclick="ReadingView.openUpdatePages('${book.id}')">
                <div class="book-card-content">
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        ${book.author ? `<div class="book-author">by ${book.author}</div>` : ''}
                    </div>
                    <div class="book-progress-circle">
                        <svg viewBox="0 0 36 36">
                            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path class="circle-fill" stroke-dasharray="${progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        </svg>
                        <span class="progress-text">${progress}%</span>
                    </div>
                </div>
                <div class="book-progress-bar">
                    <div class="book-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="book-meta">
                    <span>${book.pagesRead} of ${book.totalPages} pages</span>
                    ${pagesReadToday > 0 ? `<span class="today-badge">+${pagesReadToday} today</span>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Render full reading view (Library)
     */
    render() {
        const library = State.getLibrary();
        const completedBooks = State.getCompletedBooks();
        const reading = State.getReadingData();
        const thisYear = new Date().getFullYear();
        const booksThisYear = completedBooks.filter(b => 
            new Date(b.completedDate).getFullYear() === thisYear
        ).length;

        return `
            <div class="view-header">
                <div class="view-title">Library</div>
            </div>
            
            ${this.renderStats(library, completedBooks, booksThisYear, reading?.yearlyGoal || 12)}
            ${this.renderLibrary(library)}
            ${this.renderCompletedBooks(completedBooks)}
            
            <div class="tab-spacer"></div>
        `;
    },

    /**
     * Render reading stats
     */
    renderStats(library, completed, booksThisYear, yearlyGoal) {
        const totalPagesRead = library.reduce((sum, b) => sum + b.pagesRead, 0) +
                              completed.reduce((sum, b) => sum + b.totalPages, 0);
        const todaysPages = State.getTodaysReadingProgress();

        return `
            <div class="reading-stats-row">
                <div class="stat-card">
                    <div class="stat-value">${todaysPages}</div>
                    <div class="stat-label">Pages Today</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${library.length}</div>
                    <div class="stat-label">In Progress</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${booksThisYear}/${yearlyGoal}</div>
                    <div class="stat-label">${new Date().getFullYear()} Goal</div>
                </div>
            </div>
        `;
    },

    /**
     * Render library section
     */
    renderLibrary(library) {
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">CURRENTLY READING</span>
                    <button class="add-book-btn" onclick="ReadingView.openAddBook()">+ Add</button>
                </div>
                ${library.length === 0 ? `
                    <div class="empty-library">
                        <div class="empty-icon">📚</div>
                        <div class="empty-text">Your library is empty</div>
                        <button class="save-btn" onclick="ReadingView.openAddBook()">ADD YOUR FIRST BOOK</button>
                    </div>
                ` : `
                    <div class="library-list">
                        ${library.map(book => this.renderBookCard(book)).join('')}
                    </div>
                `}
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
                    <span class="section-count">${books.length} books</span>
                </div>
                <div class="completed-books-list">
                    ${sorted.map(book => `
                        <div class="completed-book-item">
                            <div class="completed-book-info">
                                <div class="completed-book-title">${book.title}</div>
                                ${book.author ? `<div class="completed-book-author">${book.author}</div>` : ''}
                            </div>
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
                <div class="modal-title">Add to Library</div>
                
                <div class="input-group">
                    <label>Book Title</label>
                    <input type="text" class="input-field" id="book-title" placeholder="Enter title">
                </div>
                
                <div class="input-group">
                    <label>Author (optional)</label>
                    <input type="text" class="input-field" id="book-author" placeholder="Author name">
                </div>
                
                <div class="input-group">
                    <label>Total Pages</label>
                    <input type="number" class="input-field" id="book-pages" 
                           placeholder="300" inputmode="numeric">
                </div>
                
                <button class="save-btn" onclick="ReadingView.saveNewBook()">ADD TO LIBRARY</button>
            </div>
        `;
        
        modal.classList.add('active');
        setTimeout(() => document.getElementById('book-title')?.focus(), 100);
    },

    /**
     * Save new book to library
     */
    saveNewBook() {
        const title = document.getElementById('book-title')?.value?.trim();
        const author = document.getElementById('book-author')?.value?.trim();
        const pages = parseInt(document.getElementById('book-pages')?.value);

        if (!title || !pages) {
            alert('Please enter title and page count');
            return;
        }

        State.addBookToLibrary(title, author, pages);
        document.getElementById('logger-modal').classList.remove('active');
        App.render();
    },

    /**
     * Open update pages modal for a specific book
     */
    openUpdatePages(bookId) {
        const library = State.getLibrary();
        const book = library.find(b => b.id === bookId);
        if (!book) return;

        const today = State.getTodayKey();
        const todayEntry = book.dailyProgress?.find(d => d.date === today);
        const pagesReadToday = todayEntry?.pages || 0;
        const progress = Math.round((book.pagesRead / book.totalPages) * 100);

        const modal = document.getElementById('logger-modal');
        
        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-header-row">
                    <div style="width: 36px;"></div>
                    <div class="modal-title">Update Progress</div>
                    <button class="modal-close" onclick="document.getElementById('logger-modal').classList.remove('active')">×</button>
                </div>
                
                <div class="book-update-header">
                    <div class="book-title-modal">${book.title}</div>
                    <div class="book-progress-visual">
                        <div class="progress-bar-large">
                            <div class="progress-fill-large" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>${book.pagesRead} / ${book.totalPages} pages</span>
                            <span>${progress}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="pages-input-section">
                    <label>Current page you're on</label>
                    <input type="number" class="logger-input" id="pages-input" 
                           value="${book.pagesRead}" 
                           placeholder="0" inputmode="numeric"
                           onfocus="this.select()">
                </div>
                
                <div class="quick-add-section">
                    <label>Quick add pages</label>
                    <div class="preset-grid">
                        <button class="preset-btn" onclick="ReadingView.addPages(10)">+10</button>
                        <button class="preset-btn" onclick="ReadingView.addPages(20)">+20</button>
                        <button class="preset-btn" onclick="ReadingView.addPages(30)">+30</button>
                        <button class="preset-btn" onclick="ReadingView.addPages(50)">+50</button>
                    </div>
                </div>
                
                ${pagesReadToday > 0 ? `
                    <div class="today-reading-note">
                        You've logged ${pagesReadToday} pages today
                    </div>
                ` : ''}
                
                <div class="book-actions-row">
                    <button class="save-btn" onclick="ReadingView.savePages('${bookId}')">SAVE PROGRESS</button>
                </div>
                
                <div class="book-secondary-actions">
                    <button class="text-btn" onclick="ReadingView.finishBook('${bookId}')">Mark as Complete</button>
                    <button class="text-btn danger" onclick="ReadingView.removeBook('${bookId}')">Remove Book</button>
                </div>
            </div>
        `;
        
        this.currentBookId = bookId;
        this.originalPages = book.pagesRead;
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
    savePages(bookId) {
        const pages = parseInt(document.getElementById('pages-input')?.value);
        if (isNaN(pages)) return;

        const library = State.getLibrary();
        const book = library.find(b => b.id === bookId);
        if (!book) return;

        const pagesAddedToday = Math.max(0, pages - this.originalPages);
        
        State.logBookProgress(bookId, pages, pagesAddedToday);
        document.getElementById('logger-modal').classList.remove('active');
        
        // Award XP for reading progress
        if (pagesAddedToday > 0) {
            const xp = Math.min(30, Math.floor(pagesAddedToday / 10) * 5 + 5); // 5-30 XP based on pages
            App.awardXP(xp, 'discipline');
        }
        
        App.render();
    },

    /**
     * Finish a book from library
     */
    finishBook(bookId) {
        if (confirm('Mark this book as complete?')) {
            State.completeBookFromLibrary(bookId);
            document.getElementById('logger-modal').classList.remove('active');
            App.awardXP(50, 'discipline'); // Bonus XP for finishing a book
            App.render();
        }
    },

    /**
     * Remove book from library
     */
    removeBook(bookId) {
        if (confirm('Remove this book from your library?')) {
            State.removeBookFromLibrary(bookId);
            document.getElementById('logger-modal').classList.remove('active');
            App.render();
        }
    },

    // Storage for tracking original pages when updating
    currentBookId: null,
    originalPages: 0
};
