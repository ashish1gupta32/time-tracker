document.addEventListener('DOMContentLoaded', () => {
    const btnDaily = document.getElementById('btn-daily');
    const btnWeekly = document.getElementById('btn-weekly');
    const statsList = document.getElementById('stats-list');
    const totalTimeDisplay = document.getElementById('total-time-display');

    let currentView = 'daily'; // 'daily' or 'weekly'

    btnDaily.addEventListener('click', () => {
        currentView = 'daily';
        updateToggleState();
        loadStats();
    });

    btnWeekly.addEventListener('click', () => {
        currentView = 'weekly';
        updateToggleState();
        loadStats();
    });

    const btnClear = document.getElementById('btn-clear');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all usage data? This cannot be undone.')) {
                chrome.storage.local.clear(() => {
                    loadStats();
                });
            }
        });
    }

    function updateToggleState() {
        if (currentView === 'daily') {
            btnDaily.classList.add('active');
            btnWeekly.classList.remove('active');
        } else {
            btnWeekly.classList.add('active');
            btnDaily.classList.remove('active');
        }
    }

    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }

    function getDates(view) {
        const dates = [];
        const today = new Date();
        if (view === 'daily') {
            dates.push(today.toISOString().split('T')[0]);
        } else {
            // Last 7 days including today
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dates.push(d.toISOString().split('T')[0]);
            }
        }
        return dates;
    }

    let isExpanded = false;

    function loadStats() {
        const dates = getDates(currentView);
        chrome.storage.local.get(dates, (result) => {
            // Aggregate data
            const domainMap = {};
            let totalMs = 0;

            dates.forEach(date => {
                const dailyData = result[date] || {};
                for (const [domain, ms] of Object.entries(dailyData)) {
                    if (!domain || domain === 'null' || domain === 'undefined') continue;
                    if (!domainMap[domain]) domainMap[domain] = 0;
                    domainMap[domain] += ms;
                    totalMs += ms;
                }
            });

            // Sort all items
            const sortedDomains = Object.entries(domainMap)
                .sort((a, b) => b[1] - a[1]);

            render(sortedDomains, totalMs);
        });
    }

    function render(allItems, totalMs) {
        totalTimeDisplay.textContent = formatTime(totalMs);
        statsList.innerHTML = '';

        if (allItems.length === 0) {
            statsList.innerHTML = '<div style="text-align:center; color: #94a3b8; font-size: 0.9rem; padding: 20px;">No activity recorded yet.</div>';
            return;
        }

        const itemsToShow = isExpanded ? allItems : allItems.slice(0, 5);
        const maxVal = allItems[0][1];

        itemsToShow.forEach(([domain, ms]) => {
            const percentage = (ms / maxVal) * 100;
            const itemEl = document.createElement('div');
            itemEl.className = 'stat-item';

            const faviconUrl = chrome.runtime.getURL(`_favicon/?pageUrl=${encodeURIComponent('https://' + domain)}&size=32`);

            itemEl.innerHTML = `
        <div class="stat-icon" style="margin-right: 12px; display: flex; align-items: center;">
            <img src="${faviconUrl}" style="width: 24px; height: 24px; border-radius: 4px;" alt="" />
        </div>
        <div class="stat-info" style="flex: 1; margin-right: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
             <span class="domain-name">${domain}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
        <span class="stat-time">${formatTime(ms)}</span>
      `;
            statsList.appendChild(itemEl);
        });

        // Show More Button
        if (allItems.length > 5) {
            const btnShowMore = document.createElement('button');
            btnShowMore.className = 'btn-show-more';
            btnShowMore.textContent = isExpanded ? 'Show Less' : `Show More (${allItems.length - 5} more)`;
            btnShowMore.onclick = () => {
                isExpanded = !isExpanded;
                render(allItems, totalMs);
            };
            statsList.appendChild(btnShowMore);
        }
    }

    // Initial load
    loadStats();
});
