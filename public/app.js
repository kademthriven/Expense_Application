const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

const authConfig = {
  headers: {
    Authorization: token
  }
};

let currentPage = 1;
let totalPages = 1;
let pageSize = 10;
let currentChart = null;
let editModalInstance = null;
let premiumPurchaseModalInstance = null;
let cancelPaymentConfirmModalInstance = null;
let deleteTransactionModalInstance = null;
let leaderboardLoaded = false;
let activePremiumOrder = null;
let currentUserIsPremium = false;
let transactionIdToDelete = null;
let downloadHistoryLoaded = false;

function getTodayLocal() {
  return new Date().toLocaleDateString('en-CA');
}

function getCurrentMonthLocal() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getCurrentYearLocal() {
  return String(new Date().getFullYear());
}

function getFilterParams() {
  const view = document.getElementById('viewType').value;

  const params = {
    page: currentPage,
    limit: pageSize,
    search: document.getElementById('searchInput').value,
    view
  };

  if (view === 'daily') {
    params.selectedDate = document.getElementById('dailyFilter').value;
  }

  if (view === 'monthly') {
    params.selectedMonth = document.getElementById('monthFilter').value;
  }

  if (view === 'yearly') {
    params.selectedYear = document.getElementById('yearFilter').value;
  }

  return params;
}

function updateFilterInputs() {
  const view = document.getElementById('viewType').value;

  document.getElementById('dailyFilterBox').classList.add('d-none');
  document.getElementById('monthlyFilterBox').classList.add('d-none');
  document.getElementById('yearlyFilterBox').classList.add('d-none');

  if (view === 'daily') {
    document.getElementById('dailyFilterBox').classList.remove('d-none');
  }

  if (view === 'monthly') {
    document.getElementById('monthlyFilterBox').classList.remove('d-none');
  }

  if (view === 'yearly') {
    document.getElementById('yearlyFilterBox').classList.remove('d-none');
  }
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll("'", '&#39;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;

  toast.innerHTML = `
    <div class="toast-title">${escapeHtml(title)}</div>
    <p class="toast-message">${escapeHtml(message)}</p>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.25s ease';

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2500);
}

function showPaymentStatus() {
  return;
}

function setButtonLoading(button, isLoading, loadingText, normalText) {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = normalText || button.innerHTML;
    button.innerHTML = loadingText;
    button.disabled = true;
    button.classList.add('btn-loading');
  } else {
    button.innerHTML = normalText || button.dataset.originalText || button.innerHTML;
    button.disabled = false;
    button.classList.remove('btn-loading');
  }
}

function getExcelButton() {
  return document.querySelector('button[onclick="exportExcel()"]');
}

function getDownloadHistoryToggleButton() {
  return document.querySelector('button[onclick="toggleDownloadHistory()"]') || document.getElementById('toggleHistoryBtn');
}

function handlePaymentStatusFromURL() {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');
  const message = params.get('message');

  if (!paymentStatus) return;

  if (paymentStatus === 'success') {
    showToast(
      'success',
      'Payment Successful',
      message || 'Your premium membership has been activated successfully.'
    );
  } else if (paymentStatus === 'failed') {
    showToast(
      'error',
      'Payment Failed',
      message || 'Your payment failed. Please try again.'
    );
  } else if (paymentStatus === 'pending') {
    showToast(
      'warning',
      'Payment Pending',
      message || 'Your payment is still pending.'
    );
  }

  window.history.replaceState({}, document.title, '/index.html');
}

async function refreshPremiumUI() {
  try {
    const res = await axios.get('/premium/status', authConfig);
    const isPremium = !!res.data.isPremium;
    currentUserIsPremium = isPremium;

    localStorage.setItem('isPremium', String(isPremium));

    document.getElementById('premiumBadge').classList.toggle('d-none', !isPremium);
    document.getElementById('buyPremiumBtn').classList.toggle('d-none', isPremium);
    document.getElementById('premiumBanner').classList.toggle('d-none', !isPremium);
    document.getElementById('showLeaderboardBtn').classList.toggle('d-none', !isPremium);
    document.getElementById('showReportBtn').classList.toggle('d-none', !isPremium);
    document.getElementById('showReportBtn').disabled = !isPremium;
    const premiumNote = document.getElementById('reportPremiumNote');
    if (premiumNote) {
      premiumNote.innerText = isPremium ? '' : 'Premium only';
    }

    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.toggle('premium-navbar', isPremium);
    }

    const excelBtn = getExcelButton();
    const historyBtn = document.getElementById('toggleHistoryBtn');
    const historySection = document.getElementById('downloadHistorySection');

    if (!isPremium) {
      document.getElementById('leaderboardSection').classList.add('d-none');
      document.getElementById('reportSection').classList.add('d-none');

      if (historySection) historySection.classList.add('d-none');
      if (historyBtn) historyBtn.classList.add('d-none');
      if (excelBtn) excelBtn.classList.add('d-none');
    } else {
      if (historyBtn) historyBtn.classList.remove('d-none');
      if (excelBtn) excelBtn.classList.remove('d-none');
    }
  } catch (err) {
    console.log(err);
  }
}

async function loadLeaderboard() {
  try {
    const res = await axios.get('/premium/leaderboard', authConfig);
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    res.data.forEach((item) => {
      const tr = document.createElement('tr');
      let rankBadgeClass = 'rank-other';
      let rankEmoji = '🏅';

      if (item.rank === 1) {
        rankBadgeClass = 'rank-1';
        rankEmoji = '🥇';
      } else if (item.rank === 2) {
        rankBadgeClass = 'rank-2';
        rankEmoji = '🥈';
      } else if (item.rank === 3) {
        rankBadgeClass = 'rank-3';
        rankEmoji = '🥉';
      }

      tr.innerHTML = `
        <td><span class="rank-badge ${rankBadgeClass}">${rankEmoji} #${escapeHtml(String(item.rank))}</span></td>
        <td><strong>${escapeHtml(item.name || '')}</strong></td>
        <td>${escapeHtml(item.email || '')}</td>
        <td><strong style="color: #1a9bae;">₹${escapeHtml(String(item.totalExpense ?? 0))}</strong></td>
      `;

      tbody.appendChild(tr);
    });

    leaderboardLoaded = true;
  } catch (err) {
    showToast('error', 'Leaderboard Failed', err.response?.data?.error || 'Failed to load leaderboard.');
  }
}

async function toggleLeaderboard() {
  if (!currentUserIsPremium) {
    showToast('warning', 'Premium Only', 'Leaderboard is available only for premium users.');
    return;
  }

  const section = document.getElementById('leaderboardSection');

  if (section.classList.contains('d-none')) {
    section.classList.remove('d-none');

    if (!leaderboardLoaded) {
      await loadLeaderboard();
    }
  } else {
    section.classList.add('d-none');
  }
}

function toggleReportSection() {
  if (!currentUserIsPremium) {
    showToast('warning', 'Premium Only', 'Report generation is available only for premium users.');
    return;
  }

  const reportSection = document.getElementById('reportSection');
  if (!reportSection) return;

  reportSection.classList.toggle('d-none');
}

async function toggleDownloadHistory() {
  if (!currentUserIsPremium) {
    showToast('warning', 'Premium Only', 'Download history is available only for premium users.');
    return;
  }

  const historySection = document.getElementById('downloadHistorySection');
  const historyBtn = document.getElementById('toggleHistoryBtn');

  if (!historySection) return;

  const isHidden = historySection.classList.contains('d-none');

  if (isHidden) {
    historySection.classList.remove('d-none');
    if (historyBtn) historyBtn.innerText = 'Hide Download History';
    await loadDownloadHistory();
  } else {
    historySection.classList.add('d-none');
    if (historyBtn) historyBtn.innerText = 'Download History';
  }
}

async function generatePremiumReport() {
  const reportButton = document.querySelector('button[onclick="generatePremiumReport()"]');

  try {
    if (!currentUserIsPremium) {
      showToast('warning', 'Premium Only', 'Report generation is available only for premium users.');
      return;
    }

    setButtonLoading(reportButton, true, 'Loading...', 'View Report');

    const view = document.getElementById('reportView').value;
    const selectedDate = document.getElementById('reportDate').value || getTodayLocal();

    const res = await axios.get('/reports', {
      ...authConfig,
      params: { view, selectedDate }
    });

    document.getElementById('reportMainLabel').innerText =
      view === 'monthly' ? selectedDate.slice(0, 4) : 'Premium Report';

    document.getElementById('reportSubLabel').innerText = `${view.toUpperCase()} • ${res.data.label}`;
    document.getElementById('reportTotalIncome').innerText = `₹${res.data.summary.income}`;
    document.getElementById('reportTotalExpense').innerText = `₹${res.data.summary.expense}`;
    document.getElementById('reportSavings').innerText = `₹${res.data.summary.savings}`;

    const transactionBody = document.getElementById('reportTransactionsBody');
    transactionBody.innerHTML = '';

    if (!res.data.transactions.length) {
      transactionBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">No transactions found for this report</td>
        </tr>
      `;
    } else {
      res.data.transactions.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(item.date || '')}</td>
          <td>${escapeHtml(item.description || '')}</td>
          <td>${escapeHtml(item.category || '')}</td>
          <td>${item.income ? `₹${escapeHtml(String(item.income))}` : ''}</td>
          <td>${item.expense ? `₹${escapeHtml(String(item.expense))}` : ''}</td>
        `;
        transactionBody.appendChild(tr);
      });
    }

    const categoryBody = document.getElementById('reportCategoryBody');
    categoryBody.innerHTML = '';

    if (!res.data.categorySummary.length) {
      categoryBody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center text-muted">No expense category summary available</td>
        </tr>
      `;
    } else {
      res.data.categorySummary.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(item.category || '')}</td>
          <td>₹${escapeHtml(String(item.totalAmount ?? 0))}</td>
        `;
        categoryBody.appendChild(tr);
      });
    }

    document.getElementById('downloadReportBtn').disabled = false;
    showToast('success', 'Report Ready', 'Premium report generated successfully.');
  } catch (err) {
    showToast('error', 'Report Failed', err.response?.data?.error || 'Failed to generate report.');
  } finally {
    setButtonLoading(reportButton, false, 'Loading...', 'View Report');
  }
}

async function downloadPremiumReport() {
  const downloadBtn = document.getElementById('downloadReportBtn');

  try {
    if (!currentUserIsPremium) {
      showToast('warning', 'Premium Only', 'Download is available only for premium users.');
      return;
    }

    const reportSheet =
      document.querySelector('.report-card') ||
      document.querySelector('.report-sheet') ||
      document.getElementById('reportSection');

    if (!reportSheet) {
      showToast('error', 'Report Missing', 'Please generate the report first.');
      return;
    }

    const reportView = document.getElementById('reportView')?.value || 'monthly';
    const reportDate = document.getElementById('reportDate')?.value || getTodayLocal();

    setButtonLoading(downloadBtn, true, 'Generating PDF...', '📄 Download');

    const cloneWrapper = document.createElement('div');
    cloneWrapper.style.position = 'fixed';
    cloneWrapper.style.left = '-99999px';
    cloneWrapper.style.top = '0';
    cloneWrapper.style.width = '1200px';
    cloneWrapper.style.background = '#ffffff';
    cloneWrapper.style.padding = '24px';
    cloneWrapper.style.zIndex = '-1';

    const clone = reportSheet.cloneNode(true);
    clone.style.background = '#ffffff';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.margin = '0';

    cloneWrapper.appendChild(clone);
    document.body.appendChild(cloneWrapper);

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0
    });

    document.body.removeChild(cloneWrapper);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 8;
    const usableWidth = pdfWidth - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - margin * 2);

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);
    }

    const pdfBlob = pdf.output('blob');

    const response = await fetch(
      `/reports/upload-rendered-pdf?view=${encodeURIComponent(reportView)}&selectedDate=${encodeURIComponent(reportDate)}`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/pdf'
        },
        body: pdfBlob
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload PDF');
    }

    showDownloadModal(data);
    downloadHistoryLoaded = false;
    await loadDownloadHistory();
    showToast('success', 'PDF Ready', 'Your PDF report is ready.');
  } catch (err) {
    console.error('downloadPremiumReport error:', err);
    showToast('error', 'Download Failed', err.message || 'Failed to generate PDF.');
  } finally {
    setButtonLoading(downloadBtn, false, 'Generating PDF...', '📄 Download');
  }
}

function showDownloadModal(data) {
  const modalHTML = `
    <div class="modal fade" id="downloadModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">PDF Report Ready</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body pt-2">
            <div class="p-4 rounded-4" style="background:#e8f5ee;">
              <h4 class="mb-2 fw-bold">${escapeHtml(data.fileName || 'report.pdf')}</h4>
              <p class="mb-1">${escapeHtml((data.reportType || 'monthly').toUpperCase())} report • ${escapeHtml(data.reportLabel || '')}</p>
              <p class="text-muted mb-0">Link expires in ${escapeHtml(data.expiresIn || '7 days')}</p>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success" onclick="window.open('${data.downloadUrl}', '_blank')">
              Open PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const existingModal = document.getElementById('downloadModal');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalEl = document.getElementById('downloadModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  modalEl.addEventListener('hidden.bs.modal', function () {
    this.remove();
  });
}

function showExcelDownloadModal(data) {
  const modalHTML = `
    <div class="modal fade" id="excelDownloadModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">Excel Report Ready</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body pt-2">
            <div class="p-4 rounded-4" style="background:#eef6ff;">
              <h4 class="mb-2 fw-bold">${escapeHtml(data.fileName || 'report.xlsx')}</h4>
              <p class="mb-1">${escapeHtml((data.reportType || 'monthly').toUpperCase())} report • ${escapeHtml(data.reportLabel || '')}</p>
              <p class="text-muted mb-0">Link expires in ${escapeHtml(data.expiresIn || '7 days')}</p>
            </div>
            <p class="small text-muted mt-3 mb-0">
              Excel files may open in Excel or download automatically depending on your browser.
            </p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success" onclick="window.open('${data.downloadUrl}', '_blank')">
              Open Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const existingModal = document.getElementById('excelDownloadModal');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalEl = document.getElementById('excelDownloadModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  modalEl.addEventListener('hidden.bs.modal', function () {
    this.remove();
  });
}

function copyDownloadUrl() {
  const field = document.getElementById('downloadUrlField');

  if (!field) {
    return;
  }

  field.select();
  field.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(field.value)
    .then(() => showToast('success', 'Copied', 'S3 URL copied to clipboard.'))
    .catch(() => showToast('error', 'Copy Failed', 'Could not copy the S3 URL.'));
}

async function loadDownloadHistory() {
  try {
    const res = await axios.get('/reports/history', authConfig);

    if (res.data.success) {
      displayDownloadHistory(res.data.downloads);
      downloadHistoryLoaded = true;
    }
  } catch (err) {
    if (err.response?.status !== 401) {
      console.error('Error loading download history:', err);
    }
  }
}

function displayDownloadHistory(downloads) {
  const historyContainer = document.getElementById('downloadHistoryContainer');

  if (!historyContainer) return;

  if (!downloads || downloads.length === 0) {
    historyContainer.innerHTML = `
      <div class="alert alert-info">
        No files downloaded yet. Generate your first report to see it here!
      </div>
    `;
    return;
  }

  let historyHTML = `
    <div class="table-responsive">
      <table class="table table-hover table-sm">
        <thead class="table-light">
          <tr>
            <th>File Name</th>
            <th>Type</th>
            <th>Period</th>
            <th>Downloaded</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
  `;

  downloads.forEach((download) => {
    const downloadDate = new Date(download.downloadDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const fileName = download.fileName || '';
    const lowerFileName = fileName.toLowerCase();
    const isPdf = lowerFileName.endsWith('.pdf');
    const actionLabel = isPdf ? 'Open PDF' : 'Open Excel';

    historyHTML += `
      <tr>
        <td><small>${escapeHtml(fileName)}</small></td>
        <td><span class="badge bg-primary">${escapeHtml((download.reportType || '').toUpperCase())}</span></td>
        <td><small>${escapeHtml(download.reportLabel || '')}</small></td>
        <td><small>${escapeHtml(downloadDate)}</small></td>
        <td>
          <a href="${download.downloadUrl}" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener noreferrer">
            ${actionLabel}
          </a>
        </td>
      </tr>
    `;
  });

  historyHTML += `
        </tbody>
      </table>
    </div>
  `;

  historyContainer.innerHTML = historyHTML;
}

/**
 * Initialize download history when page loads
 */
async function initDownloadHistory() {
  if (currentUserIsPremium) {
    await loadDownloadHistory();
  }
}

async function loadAIInsights() {
  const aiButton = document.querySelector('button[onclick="loadAIInsights()"]');

  try {
    setButtonLoading(aiButton, true, 'Loading...', '✨ AI Insights');

    const res = await axios.get('/ai/insights', authConfig);
    const section = document.getElementById('aiInsightsSection');
    const title = document.getElementById('aiInsightsTitle');
    const list = document.getElementById('aiInsightsList');

    title.innerText = res.data.title || 'AI Insights';
    list.innerHTML = '';

    (res.data.insights || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    section.classList.remove('d-none');
    showToast('success', 'AI Insights', 'AI insights loaded successfully.');
  } catch (err) {
    showToast('error', 'AI Failed', err.response?.data?.error || 'Unable to load AI insights');
  } finally {
    setButtonLoading(aiButton, false, 'Loading...', '✨ AI Insights');
  }
}

async function suggestCategoryAI() {
  try {
    const description = document.getElementById('description').value;
    const type = document.getElementById('type').value;
    const hintElement = document.getElementById('aiCategoryHint');

    if (!description.trim()) {
      hintElement.innerHTML = '<span class="ai-error">⚠️ Please enter a description first</span>';
      return;
    }

    hintElement.innerHTML = '<span class="ai-loading">⏳ AI is analyzing...</span>';

    const res = await axios.post(
      '/ai/suggest-category',
      { description, type },
      authConfig
    );

    document.getElementById('category').value = res.data.categoryId;
    hintElement.innerHTML = `<span class="ai-success">✅ AI suggested: <strong>${escapeHtml(res.data.categoryName)}</strong></span>`;
  } catch (err) {
    document.getElementById('aiCategoryHint').innerText = '';
    showToast('error', 'AI Failed', err.response?.data?.error || 'AI category suggestion failed');
  }
}

function openPremiumPurchaseModal() {
  premiumPurchaseModalInstance.show();
}

window.addEventListener('DOMContentLoaded', async () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  handlePaymentStatusFromURL();

  editModalInstance = new bootstrap.Modal(document.getElementById('editTransactionModal'));
  premiumPurchaseModalInstance = new bootstrap.Modal(document.getElementById('premiumPurchaseModal'));
  cancelPaymentConfirmModalInstance = new bootstrap.Modal(document.getElementById('cancelPaymentConfirmModal'));
  deleteTransactionModalInstance = new bootstrap.Modal(document.getElementById('deleteTransactionConfirmModal'));

  document.getElementById('date').value = getTodayLocal();
  document.getElementById('dailyFilter').value = getTodayLocal();
  document.getElementById('monthFilter').value = getCurrentMonthLocal();
  document.getElementById('reportDate').value = getTodayLocal();
  document.getElementById('yearFilter').value = getCurrentYearLocal();

  updateFilterInputs();

  const historyToggleBtn = getDownloadHistoryToggleButton();
  if (historyToggleBtn) {
    historyToggleBtn.innerText = 'Download History';
  }

  const historySection = document.getElementById('downloadHistorySection');
  if (historySection) {
    historySection.classList.add('d-none');
  }

  document.getElementById('pageSize').addEventListener('change', () => {
    pageSize = Number(document.getElementById('pageSize').value);
    currentPage = 1;
    loadTransactions();
  });

  document.getElementById('viewType').addEventListener('change', () => {
    updateFilterInputs();
    currentPage = 1;
    loadSummary();
    loadTransactions();
  });

  document.getElementById('description').addEventListener('blur', async () => {
    const description = document.getElementById('description').value.trim();
    const type = document.getElementById('type').value;

    if (type === 'expense' && description) {
      await suggestCategoryAI();
    }
  });

  await loadCategories();
  await loadAccounts();
  await loadEditCategories();
  await loadEditAccounts();
  await loadSummary();
  await loadTransactions();
  await refreshPremiumUI();
});

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    setButtonLoading(submitBtn, true, 'Saving...', 'Add Transaction');

    await axios.post(
      '/transactions',
      {
        amount: Number(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value,
        categoryId: document.getElementById('category').value,
        accountId: document.getElementById('account').value
      },
      authConfig
    );

    e.target.reset();
    document.getElementById('date').value = getTodayLocal();
    document.getElementById('aiCategoryHint').innerText = '';
    currentPage = 1;

    await loadSummary();
    await loadTransactions();
    leaderboardLoaded = false;
    await refreshPremiumUI();

    showToast('success', 'Added', 'Transaction added successfully.');
  } catch (err) {
    showToast('error', 'Add Failed', err.response?.data?.error || 'Failed to add transaction');
  } finally {
    setButtonLoading(submitBtn, false, 'Saving...', 'Add Transaction');
  }
});

document.getElementById('editTransactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    setButtonLoading(submitBtn, true, 'Updating...', 'Update Transaction');

    await axios.put(
      `/transactions/${id}`,
      {
        amount: Number(document.getElementById('editAmount').value),
        type: document.getElementById('editType').value,
        description: document.getElementById('editDescription').value,
        date: document.getElementById('editDate').value,
        categoryId: document.getElementById('editCategory').value,
        accountId: document.getElementById('editAccount').value
      },
      authConfig
    );

    editModalInstance.hide();
    await loadSummary();
    await loadTransactions();
    leaderboardLoaded = false;
    await refreshPremiumUI();

    showToast('success', 'Updated', 'Transaction updated successfully.');
  } catch (err) {
    showToast('error', 'Update Failed', err.response?.data?.error || 'Update failed');
  } finally {
    setButtonLoading(submitBtn, false, 'Updating...', 'Update Transaction');
  }
});

async function launchCashfreeCheckout(orderData) {
  const cashfree = Cashfree({
    mode: orderData.environment === 'production' ? 'production' : 'sandbox'
  });

  const checkoutOptions = {
    paymentSessionId: orderData.paymentSessionId,
    redirectTarget: '_modal'
  };

  cashfree.checkout(checkoutOptions).then(async (result) => {
    if (result.error) {
      cancelPaymentConfirmModalInstance.show();
      return;
    }

    if (result.redirect) {
      return;
    }

    if (result.paymentDetails) {
      await checkPremiumOrderAndShowMessage(orderData.orderId);
    }
  });
}

async function buyPremiumMembership() {
  const proceedBtn = document.getElementById('proceedPremiumPaymentBtn');

  try {
    setButtonLoading(proceedBtn, true, 'Processing...', 'Proceed to Pay');
    premiumPurchaseModalInstance.hide();

    const response = await axios.post('/premium/create-order', {}, authConfig);

    activePremiumOrder = {
      orderId: response.data.orderId,
      paymentSessionId: response.data.paymentSessionId,
      environment: response.data.environment
    };

    await launchCashfreeCheckout(activePremiumOrder);
  } catch (err) {
    showToast('error', 'Payment Failed', err.response?.data?.error || 'Failed to start premium payment');
  } finally {
    setButtonLoading(proceedBtn, false, 'Processing...', 'Proceed to Pay');
  }
}

async function resumePremiumPayment() {
  cancelPaymentConfirmModalInstance.hide();

  if (!activePremiumOrder) {
    showToast('warning', 'No Active Payment', 'No active payment found');
    return;
  }

  await launchCashfreeCheckout(activePremiumOrder);
}

async function confirmCancelPayment() {
  try {
    if (!activePremiumOrder) {
      cancelPaymentConfirmModalInstance.hide();
      showToast('warning', 'Cancelled', 'Payment cancelled');
      return;
    }

    await axios.post(
      `/premium/cancel-order/${activePremiumOrder.orderId}`,
      {},
      authConfig
    );

    cancelPaymentConfirmModalInstance.hide();
    showToast('warning', 'Payment Cancelled', 'Your premium payment was cancelled.');
    activePremiumOrder = null;
  } catch (err) {
    showToast('error', 'Cancel Failed', err.response?.data?.error || 'Unable to cancel payment');
  }
}

async function checkPremiumOrderAndShowMessage(orderId) {
  try {
    const verifyRes = await axios.get(`/premium/check-order/${orderId}`, authConfig);

    if (verifyRes.data.status === 'SUCCESSFUL') {
      leaderboardLoaded = false;
      await refreshPremiumUI();
      showToast('success', 'Payment Successful', 'Premium membership activated.');
      activePremiumOrder = null;
      return;
    }

    if (verifyRes.data.status === 'FAILED') {
      showToast('error', 'Payment Failed', 'Premium payment failed.');
      activePremiumOrder = null;
      return;
    }

    if (verifyRes.data.status === 'CANCELLED') {
      showToast('warning', 'Payment Cancelled', 'Premium payment was cancelled.');
      activePremiumOrder = null;
      return;
    }

    showToast('warning', 'Payment Pending', 'Your payment is still pending.');
  } catch (err) {
    showToast('error', 'Verification Failed', 'Unable to verify payment status');
  }
}

async function loadCategories() {
  const res = await axios.get('/categories', authConfig);
  const select = document.getElementById('category');
  select.innerHTML = '';

  res.data.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

async function loadAccounts() {
  const res = await axios.get('/accounts', authConfig);
  const select = document.getElementById('account');
  select.innerHTML = '';

  res.data.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

async function loadEditCategories() {
  const res = await axios.get('/categories', authConfig);
  const select = document.getElementById('editCategory');
  select.innerHTML = '';

  res.data.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

async function loadEditAccounts() {
  const res = await axios.get('/accounts', authConfig);
  const select = document.getElementById('editAccount');
  select.innerHTML = '';

  res.data.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

async function loadSummary() {
  const res = await axios.get('/transactions/summary', {
    ...authConfig,
    params: getFilterParams()
  });

  document.getElementById('income').innerText = `₹${res.data.income}`;
  document.getElementById('expense').innerText = `₹${res.data.expense}`;
  document.getElementById('balance').innerText = `₹${res.data.balance}`;
}

async function loadTransactions() {
  const res = await axios.get('/transactions', {
    ...authConfig,
    params: getFilterParams()
  });

  totalPages = res.data.totalPages || 1;

  document.getElementById('pageInfo').innerText =
    `Page ${res.data.currentPage} of ${totalPages} | Total Items: ${res.data.totalItems}`;

  const prevBtn = document.querySelector('button[onclick="prevPage()"]');
  const nextBtn = document.querySelector('button[onclick="nextPage()"]');

  if (prevBtn) {
    prevBtn.disabled = res.data.currentPage === 1;
  }

  if (nextBtn) {
    nextBtn.disabled = res.data.currentPage >= totalPages;
  }

  renderTransactions(res.data.transactions);
  renderChart(res.data.transactions);
}

function renderTransactions(transactions) {
  const tbody = document.getElementById('transactionTableBody');
  tbody.innerHTML = '';

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No transactions found</td>
      </tr>
    `;
    return;
  }

  transactions.forEach((item) => {
    const tr = document.createElement('tr');

    const amountTd = document.createElement('td');
    amountTd.textContent = `₹${item.amount}`;

    const typeTd = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${item.type === 'income' ? 'bg-success' : 'bg-danger'}`;
    badge.textContent = item.type;
    typeTd.appendChild(badge);

    const descriptionTd = document.createElement('td');
    descriptionTd.textContent = item.description || '';

    const dateTd = document.createElement('td');
    dateTd.textContent = item.date || '';

    const categoryTd = document.createElement('td');
    categoryTd.textContent = item.category ? item.category.name : '';

    const accountTd = document.createElement('td');
    accountTd.textContent = item.account ? item.account.name : '';

    const actionTd = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary me-1';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      openEditModal(
        item.id,
        item.amount,
        item.type,
        item.description || '',
        item.date,
        item.category ? item.category.id : '',
        item.account ? item.account.id : ''
      );
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      deleteTransaction(item.id);
    });

    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);

    tr.appendChild(amountTd);
    tr.appendChild(typeTd);
    tr.appendChild(descriptionTd);
    tr.appendChild(dateTd);
    tr.appendChild(categoryTd);
    tr.appendChild(accountTd);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
}

function openEditModal(id, amount, type, description, date, categoryId, accountId) {
  document.getElementById('editId').value = id;
  document.getElementById('editAmount').value = amount;
  document.getElementById('editType').value = type;
  document.getElementById('editDescription').value = description || '';
  document.getElementById('editDate').value = date ? date.split('T')[0] : '';
  document.getElementById('editCategory').value = categoryId;
  document.getElementById('editAccount').value = accountId;

  editModalInstance.show();
}

function renderChart(transactions) {
  const categoryTotals = {};

  transactions.forEach((item) => {
    if (item.type === 'expense') {
      const key = item.category ? item.category.name : 'Other';
      categoryTotals[key] = (categoryTotals[key] || 0) + Number(item.amount);
    }
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const ctx = document.getElementById('expenseChart');

  if (currentChart) {
    currentChart.destroy();
  }

  if (labels.length === 0) {
    return;
  }

  currentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#4CAF50',
            '#F44336',
            '#2196F3',
            '#FF9800',
            '#9C27B0',
            '#00BCD4'
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function deleteTransaction(id) {
  transactionIdToDelete = id;
  deleteTransactionModalInstance.show();
}

async function confirmDeleteTransaction() {
  try {
    await axios.delete(`/transactions/${transactionIdToDelete}`, authConfig);
    deleteTransactionModalInstance.hide();
    await loadSummary();
    await loadTransactions();
    leaderboardLoaded = false;
    await refreshPremiumUI();
    transactionIdToDelete = null;

    showToast('success', 'Deleted', 'Transaction deleted successfully.');
  } catch (err) {
    showToast('error', 'Delete Failed', err.response?.data?.error || 'Delete failed.');
    transactionIdToDelete = null;
  }
}

function applyFilters() {
  currentPage = 1;
  pageSize = Number(document.getElementById('pageSize').value);
  loadSummary();
  loadTransactions();
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadTransactions();
  }
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    loadTransactions();
  }
}

async function exportExcel() {
  const excelBtn = getExcelButton();

  try {
    if (!currentUserIsPremium) {
      showToast('warning', 'Premium Only', 'Excel export is available only for premium users.');
      return;
    }

    const reportView = document.getElementById('reportView')?.value || 'monthly';
    const reportDate = document.getElementById('reportDate')?.value || getTodayLocal();

    setButtonLoading(excelBtn, true, 'Generating Excel...', 'Excel');

    const res = await axios.get('/reports/download', {
      ...authConfig,
      params: {
        view: reportView,
        selectedDate: reportDate
      }
    });

    if (!res.data || !res.data.downloadUrl) {
      throw new Error('Excel report URL not received');
    }

    showExcelDownloadModal(res.data);
    downloadHistoryLoaded = false;
    await loadDownloadHistory();
    showToast('success', 'Excel Ready', 'Excel report is ready.');
  } catch (err) {
    showToast(
      'error',
      'Export Failed',
      err.response?.data?.error || err.message || 'Failed to export Excel file.'
    );
  } finally {
    setButtonLoading(excelBtn, false, 'Generating Excel...', 'Excel');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');

  localStorage.setItem(
    'theme',
    document.body.classList.contains('dark-mode') ? 'dark' : 'light'
  );
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('isPremium');
  window.location.href = 'login.html';
}