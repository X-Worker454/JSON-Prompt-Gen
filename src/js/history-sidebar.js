/**
 * History Sidebar Controller
 * Manages the collapsible sidebar in the Version History modal AND the History Section page
 */

(function () {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initHistorySidebars);

    function initHistorySidebars() {
        // ===============================
        // MODAL SIDEBAR
        // ===============================
        const historySidebar = document.getElementById('history-sidebar');
        const historySidebarOverlay = document.getElementById('history-sidebar-overlay');
        const historyHamburgerBtn = document.getElementById('history-hamburger-btn');
        const historySidebarClose = document.getElementById('history-sidebar-close');
        const historyList = document.getElementById('history-list');

        function openHistorySidebar() {
            if (historySidebar) historySidebar.classList.add('active');
            if (historySidebarOverlay) historySidebarOverlay.classList.add('active');
        }

        function closeHistorySidebar() {
            if (historySidebar) historySidebar.classList.remove('active');
            if (historySidebarOverlay) historySidebarOverlay.classList.remove('active');
        }

        if (historyHamburgerBtn) {
            historyHamburgerBtn.addEventListener('click', openHistorySidebar);
        }

        if (historySidebarClose) {
            historySidebarClose.addEventListener('click', closeHistorySidebar);
        }

        if (historySidebarOverlay) {
            historySidebarOverlay.addEventListener('click', closeHistorySidebar);
        }

        // Close modal sidebar when a history item is clicked
        if (historyList) {
            historyList.addEventListener('click', function (e) {
                const historyItem = e.target.closest('.history-item');
                if (historyItem && !e.target.closest('.history-delete-btn')) {
                    setTimeout(closeHistorySidebar, 150);
                }
            });
        }

        // ===============================
        // SECTION (PAGE) SIDEBAR
        // ===============================
        const historySectionSidebar = document.getElementById('history-section-sidebar');
        const historySectionSidebarOverlay = document.getElementById('history-section-sidebar-overlay');
        const historySectionHamburgerBtn = document.getElementById('history-section-hamburger-btn');
        const historySectionSidebarClose = document.getElementById('history-section-sidebar-close');
        const historySectionList = document.getElementById('history-section-list');

        function openHistorySectionSidebar() {
            if (historySectionSidebar) historySectionSidebar.classList.add('active');
            if (historySectionSidebarOverlay) historySectionSidebarOverlay.classList.add('active');
        }

        function closeHistorySectionSidebar() {
            if (historySectionSidebar) historySectionSidebar.classList.remove('active');
            if (historySectionSidebarOverlay) historySectionSidebarOverlay.classList.remove('active');
        }

        if (historySectionHamburgerBtn) {
            historySectionHamburgerBtn.addEventListener('click', openHistorySectionSidebar);
        }

        if (historySectionSidebarClose) {
            historySectionSidebarClose.addEventListener('click', closeHistorySectionSidebar);
        }

        if (historySectionSidebarOverlay) {
            historySectionSidebarOverlay.addEventListener('click', closeHistorySectionSidebar);
        }

        // Close section sidebar when a history item is clicked
        if (historySectionList) {
            historySectionList.addEventListener('click', function (e) {
                const historyItem = e.target.closest('.history-item');
                if (historyItem && !e.target.closest('.history-delete-btn')) {
                    setTimeout(closeHistorySectionSidebar, 150);
                }
            });
        }

        // ===============================
        // EXPOSE GLOBAL CONTROLLERS
        // ===============================
        window.historysSidebarController = {
            // Modal sidebar
            open: openHistorySidebar,
            close: closeHistorySidebar,
            // Section sidebar
            openSection: openHistorySectionSidebar,
            closeSection: closeHistorySectionSidebar
        };

        console.log('History sidebars initialized (modal + section)');
    }
})();
