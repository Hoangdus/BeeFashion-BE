$(document).ready(function () {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  const managerRoleId = "9AC80862-F9B7-44FF-9DE7-4F02DF2F037A"; // ID của role Manager

  if (!user) {
    Swal.fire({
      icon: "warning",
      title: "Chưa đăng nhập",
      text: "Vui lòng đăng nhập để tiếp tục!",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      window.location.href = "login.html";
    });
    return;
  }

  if (user.role_id === managerRoleId) {
    $("#accountManagerTab").hide();
    $("#statsTab").hide();
    $("#logTab").hide();
  } else {
    $("#accountManagerTab").show();
    $("#statsTab").hide();
    $("#logTab").hide();
  }

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("vi-VN", { month: "long" });
  $("#currentMonth").text(currentMonth);

  function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  async function fetchData(url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async function fetchMonthlyRevenue() {
    try {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      )
        .toISOString()
        .split("T")[0];
      const data = await fetchData(
        `${BASE_URL}/admin/invoices?fromDate=${startOfMonth}&toDate=${endOfMonth}&status=completed`
      );
      const invoices = Array.isArray(data)
        ? data
        : data.invoices || data.data || data.results || [];
      const totalRevenue = invoices.reduce(
        (sum, invoice) => sum + (invoice.total || 0),
        0
      );
      $("#monthlyRevenue").text(formatCurrency(totalRevenue));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy dữ liệu doanh thu!",
      });
    }
  }

  async function fetchPendingOrders() {
    try {
      const data = await fetchData(
        `${BASE_URL}/admin/invoices?fromDate=&toDate=&status=pending`
      );
      console.log(`Lấy số lượng đơn đang chờ duyệt:`, data);
      const count = Array.isArray(data)
        ? data.length
        : data.invoices?.length ||
          data.data?.length ||
          data.results?.length ||
          0;
      $("#pendingOrders").text(count);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy dữ liệu đơn chờ duyệt!",
      });
    }
  }

  async function fetchCompletedOrders() {
    try {
      const data = await fetchData(
        `${BASE_URL}/admin/invoices?fromDate=&toDate=&status=completed`
      );
      console.log(`Lấy số lượng đơn hoàn thành:`, data);
      const count = Array.isArray(data)
        ? data.length
        : data.invoices?.length ||
          data.data?.length ||
          data.results?.length ||
          0;
      $("#completedOrders").text(count);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy dữ liệu đơn hoàn thành!",
      });
    }
  }

  async function fetchUserAccounts() {
    try {
      const data = await fetchData(`${BASE_URL}/admin/customers`);
      const count = Array.isArray(data) ? data.length : 0;
      $("#userAccounts").text(count);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy dữ liệu tài khoản!",
      });
    }
  }

  async function loadDashboardData() {
    await Promise.all([
      fetchMonthlyRevenue(),
      fetchPendingOrders(),
      fetchCompletedOrders(),
      fetchUserAccounts(),
    ]);
  }

  loadDashboardData();
});
