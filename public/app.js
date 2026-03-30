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

    document.getElementById('reportPremiumNote').innerText = isPremium ? '' : 'Premium only';

    // Update navbar styling for premium users
    const navbar = document.querySelector('.navbar');
    if (isPremium) {
      navbar.classList.add('premium-navbar');
    } else {
      navbar.classList.remove('premium-navbar');
    }

    if (!isPremium) {
      document.getElementById('leaderboardSection').classList.add('d-none');
      document.getElementById('reportSection').classList.add('d-none');
      // Hide Excel export button for non-premium users
      const excelBtn = document.querySelector('button[onclick="exportExcel()"]');
      if (excelBtn) {
        excelBtn.classList.add('d-none');
      }
    } else {
      // Show Excel export button for premium users
      const excelBtn = document.querySelector('button[onclick="exportExcel()"]');
      if (excelBtn) {
        excelBtn.classList.remove('d-none');
      }
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
        <td><span class="rank-badge ${rankBadgeClass}">${rankEmoji} #${item.rank}</span></td>
        <td><strong>${item.name}</strong></td>
        <td>${item.email}</td>
        <td><strong style="color: #1a9bae;">₹${item.totalExpense}</strong></td>
      `;
      tbody.appendChild(tr);
    });

    leaderboardLoaded = true;
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to load leaderboard');
  }
}

async function toggleLeaderboard() {
  if (!currentUserIsPremium) {
    alert('Leaderboard is available only for premium users');
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
    alert('Report generation is available only for premium users');
    return;
  }

  document.getElementById('reportSection').classList.toggle('d-none');
}

async function generatePremiumReport() {
  try {
    if (!currentUserIsPremium) {
      alert('Report generation is available only for premium users');
      return;
    }

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
          <td>${item.date}</td>
          <td>${item.description || ''}</td>
          <td>${item.category}</td>
          <td>${item.income ? `₹${item.income}` : ''}</td>
          <td>${item.expense ? `₹${item.expense}` : ''}</td>
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
          <td>${item.category}</td>
          <td>₹${item.totalAmount}</td>
        `;
        categoryBody.appendChild(tr);
      });
    }

    document.getElementById('downloadReportBtn').disabled = false;
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to generate report');
  }
}

async function downloadPremiumReport() {
  try {
    if (!currentUserIsPremium) {
      alert('Download is available only for premium users');
      return;
    }

    const reportSection = document.querySelector('.report-sheet');

    if (!reportSection || reportSection.classList.contains('d-none')) {
      alert('Please generate the report first');
      return;
    }

    const { jsPDF } = window.jspdf;

    const canvas = await html2canvas(reportSection, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 10;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 5;

    pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 10);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 5;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 10);
    }

    pdf.save('premium-report.pdf');
  } catch (err) {
    console.error('downloadPremiumReport error:', err);
    alert('Failed to download PDF report');
  }
}

async function loadAIInsights() {
  try {
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
  } catch (err) {
    alert(err.response?.data?.error || 'Unable to load AI insights');
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
    hintElement.innerHTML = `<span class="ai-success">✅ AI suggested: <strong>${res.data.categoryName}</strong></span>`;
  } catch (err) {
    document.getElementById('aiCategoryHint').innerText = '';
    alert(err.response?.data?.error || 'AI category suggestion failed');
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

  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');

  if (paymentStatus === 'success') {
    alert('Transaction successful');
    window.history.replaceState({}, document.title, '/index.html');
  }

  if (paymentStatus === 'failed') {
    alert('TRANSACTION FAILED');
    window.history.replaceState({}, document.title, '/index.html');
  }

  if (paymentStatus === 'pending') {
    alert('Payment is still pending');
    window.history.replaceState({}, document.title, '/index.html');
  }

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

  try {
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
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to add transaction');
  }
});

document.getElementById('editTransactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editId').value;

  try {
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
  } catch (err) {
    alert(err.response?.data?.error || 'Update failed');
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
  try {
    premiumPurchaseModalInstance.hide();

    const response = await axios.post('/premium/create-order', {}, authConfig);

    activePremiumOrder = {
      orderId: response.data.orderId,
      paymentSessionId: response.data.paymentSessionId,
      environment: response.data.environment
    };

    await launchCashfreeCheckout(activePremiumOrder);
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to start premium payment');
  }
}

async function resumePremiumPayment() {
  cancelPaymentConfirmModalInstance.hide();

  if (!activePremiumOrder) {
    alert('No active payment found');
    return;
  }

  await launchCashfreeCheckout(activePremiumOrder);
}

async function confirmCancelPayment() {
  try {
    if (!activePremiumOrder) {
      cancelPaymentConfirmModalInstance.hide();
      alert('Payment cancelled');
      return;
    }

    await axios.post(
      `/premium/cancel-order/${activePremiumOrder.orderId}`,
      {},
      authConfig
    );

    cancelPaymentConfirmModalInstance.hide();
    alert('Payment cancelled');
    activePremiumOrder = null;
  } catch (err) {
    alert(err.response?.data?.error || 'Unable to cancel payment');
  }
}

async function checkPremiumOrderAndShowMessage(orderId) {
  try {
    const verifyRes = await axios.get(`/premium/check-order/${orderId}`, authConfig);

    if (verifyRes.data.status === 'SUCCESSFUL') {
      leaderboardLoaded = false;
      await refreshPremiumUI();
      alert('Transaction successful');
      activePremiumOrder = null;
      return;
    }

    if (verifyRes.data.status === 'FAILED') {
      alert('TRANSACTION FAILED');
      activePremiumOrder = null;
      return;
    }

    if (verifyRes.data.status === 'CANCELLED') {
      alert('Payment cancelled');
      activePremiumOrder = null;
      return;
    }

    alert('Payment is pending. Please check again in a moment.');
  } catch (err) {
    alert('Unable to verify payment status');
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

  // Update pagination button states
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

  transactions.forEach((item) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>₹${item.amount}</td>
      <td>
        <span class="badge ${item.type === 'income' ? 'bg-success' : 'bg-danger'}">
          ${item.type}
        </span>
      </td>
      <td>${item.description || ''}</td>
      <td>${item.date}</td>
      <td>${item.category ? item.category.name : ''}</td>
      <td>${item.account ? item.account.name : ''}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${item.id}, '${item.amount}', '${item.type}', '${escapeHtml(item.description || '')}', '${item.date}', '${item.category ? item.category.id : ''}', '${item.account ? item.account.id : ''}')">
          Edit
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${item.id})">
          Delete
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function openEditModal(id, amount, type, description, date, categoryId, accountId) {
  document.getElementById('editId').value = id;
  document.getElementById('editAmount').value = amount;
  document.getElementById('editType').value = type;
  document.getElementById('editDescription').value = decodeHtml(description);
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
  } catch (err) {
    alert(err.response?.data?.error || 'Delete failed');
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
  try {
    if (!currentUserIsPremium) {
      alert('Excel export is available only for premium users');
      return;
    }

    const res = await axios.get('/transactions/export', {
      ...authConfig,
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    alert('Export failed');
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

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll("'", '&#39;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function decodeHtml(text) {
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value;
}