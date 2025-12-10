/**
 * MODAL-GESTURES.JS
 * Apple-style pull-down-to-dismiss for modals
 * 
 * Makes all modal sheets feel native to iOS
 */

const ModalGestures = {
    activeModal: null,
    startY: 0,
    currentY: 0,
    isDragging: false,
    threshold: 100, // Pixels to drag before dismissing
    
    /**
     * Initialize gesture handling for a modal
     * Call this after modal content is rendered
     */
    init(modalElement, onClose) {
        if (!modalElement) return;
        
        this.activeModal = modalElement;
        this.onClose = onClose;
        
        const sheet = modalElement.querySelector('.modal-sheet');
        if (!sheet) return;
        
        // Add touch event listeners
        sheet.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        sheet.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        sheet.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Store reference for cleanup
        sheet._gestureCleanup = () => {
            sheet.removeEventListener('touchstart', this.handleTouchStart.bind(this));
            sheet.removeEventListener('touchmove', this.handleTouchMove.bind(this));
            sheet.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        };
    },
    
    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        // Only start drag from the handle area or top of modal
        const sheet = this.activeModal?.querySelector('.modal-sheet');
        if (!sheet) return;
        
        const touch = e.touches[0];
        const rect = sheet.getBoundingClientRect();
        
        // Only allow drag from top 60px of modal (handle area)
        if (touch.clientY - rect.top > 60) {
            // Check if we're at scroll top - allow drag if scrolled to top
            if (sheet.scrollTop > 0) return;
        }
        
        this.startY = touch.clientY;
        this.isDragging = true;
        sheet.style.transition = 'none';
    },
    
    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.isDragging) return;
        
        const sheet = this.activeModal?.querySelector('.modal-sheet');
        if (!sheet) return;
        
        const touch = e.touches[0];
        this.currentY = touch.clientY;
        const deltaY = this.currentY - this.startY;
        
        // Only allow dragging down
        if (deltaY < 0) {
            this.isDragging = false;
            sheet.style.transform = '';
            return;
        }
        
        // Prevent page scroll while dragging modal
        e.preventDefault();
        
        // Apply rubber-band effect (drag slows as you pull further)
        const resistance = 0.5;
        const transform = deltaY * resistance;
        
        sheet.style.transform = `translateY(${transform}px)`;
        
        // Fade overlay as user drags
        const overlay = this.activeModal;
        if (overlay) {
            const opacity = Math.max(0.3, 1 - (deltaY / 300));
            overlay.style.background = `rgba(0, 0, 0, ${opacity * 0.85})`;
        }
    },
    
    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        const sheet = this.activeModal?.querySelector('.modal-sheet');
        if (!sheet) return;
        
        const deltaY = this.currentY - this.startY;
        
        sheet.style.transition = 'transform 0.3s ease-out';
        
        if (deltaY > this.threshold) {
            // Dismiss modal
            sheet.style.transform = 'translateY(100%)';
            
            setTimeout(() => {
                if (this.onClose) {
                    this.onClose();
                }
                this.cleanup();
            }, 300);
        } else {
            // Snap back
            sheet.style.transform = '';
            
            // Reset overlay
            const overlay = this.activeModal;
            if (overlay) {
                overlay.style.background = '';
            }
        }
        
        this.isDragging = false;
    },
    
    /**
     * Clean up after modal closes
     */
    cleanup() {
        const sheet = this.activeModal?.querySelector('.modal-sheet');
        if (sheet) {
            sheet.style.transform = '';
            sheet.style.transition = '';
            if (sheet._gestureCleanup) {
                sheet._gestureCleanup();
            }
        }
        
        if (this.activeModal) {
            this.activeModal.style.background = '';
        }
        
        this.activeModal = null;
        this.onClose = null;
        this.isDragging = false;
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.ModalGestures = ModalGestures;
}


