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
    $("#statsTab").show();
    $("#logTab").show();
  }

  // Hàm ánh xạ trạng thái sang tiếng Việt và màu badge
  function getStatusDisplay(status) {
    const statusMap = {
      pending: { text: "Chờ duyệt", badge: "warning" },
      packing: { text: "Đang đóng gói", badge: "info" },
      intransit: { text: "Đang vận chuyển", badge: "primary" },
      completed: { text: "Hoàn thành", badge: "success" },
      returned: { text: "Đã trả hàng", badge: "secondary" },
      cancelled: { text: "Đã hủy", badge: "danger" },
      pendingcancel: { text: "Chờ hủy", badge: "warning" },
    };
    return statusMap[status] || { text: "Không xác định", badge: "secondary" };
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

  async function fetchRecentOrders() {
    try {
      const data = await fetchData(
        `${BASE_URL}/admin/invoices?fromDate=&toDate=`
      );

      console.log(`Lấy danh sách đơn hàng gần đây:`, data);
      const invoices = Array.isArray(data)
        ? data
        : data.invoices || data.data || data.results || [];

      if (!invoices.length) {
        console.log("No invoices found");
        recentOrders.innerHTML =
          '<tr><td colspan="4" class="text-center">Không có đơn hàng nào</td></tr>';
        return;
      }

      function shortenId(id) {
        if (!id) return "N/A";
        return id.length > 8 ? `...${id.slice(-8)}` : id;
      }

      const recentInvoices = invoices
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6);

      const recentOrders = document.getElementById("recentOrders");
      let html = "";
      if (recentInvoices.length === 0) {
        html =
          '<tr><td colspan="4" class="text-center">Không có đơn hàng nào</td></tr>';
      } else {
        recentInvoices.forEach((invoice) => {
          const statusDisplay = getStatusDisplay(invoice.status);
          html += `
            <tr>
              <td><a href="invoice.html?orderId=${
                invoice.id || "N/A"
              }">${shortenId(invoice.id)}</a></td>
              <td>${invoice.recipientName || "Khách hàng"}</td>
              <td>${formatCurrency(invoice.total || 0)}</td>
              <td><span class="badge bg-${statusDisplay.badge}">${
            statusDisplay.text
          }</span></td>
            </tr>`;
        });
      }
      recentOrders.innerHTML = html;
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy dữ liệu đơn hàng gần đây!",
      });
      document.getElementById("recentOrders").innerHTML =
        '<tr><td colspan="4" class="text-center">Lỗi khi tải dữ liệu</td></tr>';
    }
  }

  async function fetchOrderStatusStats() {
    try {
      const data = await fetchData(
        `${BASE_URL}/admin/invoices?fromDate=&toDate=`
      );
      const invoices = Array.isArray(data)
        ? data
        : data.invoices || data.data || data.results || [];

      // Đếm số lượng đơn hàng theo trạng thái
      const stats = {
        pending: invoices.filter((invoice) => invoice.status === "pending")
          .length,
        packing: invoices.filter((invoice) => invoice.status === "packing")
          .length,
        intransit: invoices.filter((invoice) => invoice.status === "intransit")
          .length,
        completed: invoices.filter((invoice) => invoice.status === "completed")
          .length,
        returned: invoices.filter((invoice) => invoice.status === "returned")
          .length,
        cancelled: invoices.filter((invoice) => invoice.status === "cancelled")
          .length,
        pendingcancel: invoices.filter(
          (invoice) => invoice.status === "pendingcancel"
        ).length,
      };

      const options = {
        series: [
          stats.pending,
          stats.packing,
          stats.intransit,
          stats.completed,
          stats.returned,
          stats.cancelled,
          stats.pendingcancel,
        ],
        chart: {
          type: "pie",
          height: 350,
        },
        labels: [
          "Chờ duyệt",
          "Đang đóng gói",
          "Đang vận chuyển",
          "Hoàn thành",
          "Đã trả hàng",
          "Đã hủy",
          "Chờ hủy",
        ],
        colors: [
          "#ffbc00",
          "#17a2b8",
          "#007bff",
          "#4caf50",
          "#6c757d",
          "#f44336",
          "#ffc107",
        ],
        legend: {
          position: "bottom",
        },
        dataLabels: {
          enabled: true,
          formatter: function (val, opts) {
            return opts.w.config.series[opts.seriesIndex]; // Hiển thị số lượng
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 300,
              },
              legend: {
                position: "bottom",
              },
            },
          },
        ],
      };

      const chart = new ApexCharts(
        document.querySelector("#orderStatusChart"),
        options
      );
      chart.render();
    } catch (error) {
      console.error("Error fetching order status stats:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy dữ liệu tỷ lệ trạng thái đơn hàng!",
      });
      document.getElementById("orderStatusChart").innerHTML =
        '<p class="text-center text-muted">Lỗi khi tải dữ liệu biểu đồ</p>';
    }
  }

  async function loadDashboardData() {
    await Promise.all([
      fetchMonthlyRevenue(),
      fetchPendingOrders(),
      fetchCompletedOrders(),
      fetchUserAccounts(),
      fetchRecentOrders(),
      fetchOrderStatusStats(),
    ]);
  }

  loadDashboardData();
});
