$(document).ready(function () {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  const managerRoleId = "9AC80862-F9B7-44FF-9DE7-4F02DF2F037A";

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
  } else {
    $("#accountManagerTab").show();
  }

  // Kiểm tra canvas
  const ctx = document.getElementById("statusChart")?.getContext("2d");
  if (!ctx) {
    console.error("Canvas #statusChart không tìm thấy!");
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không tìm thấy canvas biểu đồ!",
    });
    return;
  }

  // Khởi tạo Chart.js
  const statusChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Chờ xác nhận",
        "Đang đóng gói",
        "Đang vận chuyển",
        "Hoàn thành",
        "Đã hủy",
        "Chờ hủy",
        "Trả hàng",
      ],
      datasets: [
        {
          label: "Số đơn hàng",
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });

  // Hàm kiểm tra định dạng ngày (yyyy-mm-dd)
  function isValidDate(date) {
    if (!date) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date) && !isNaN(Date.parse(date));
  }

  // Hàm gọi API với fetch
  async function fetchInvoices(fromDate, toDate) {
    const url = new URL(`${BASE_URL}/admin/invoices`);

    url.searchParams.append("fromDate", fromDate || "");
    url.searchParams.append("toDate", toDate || "");

    console.log(url.toString());

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Tham số không hợp lệ!");
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      const invoices = await response.json();
      console.log("Dữ liệu hóa đơn:", invoices);
      return invoices;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: `Không thể tải dữ liệu: ${error.message}`,
      });
      throw error;
    }
  }

  // Hàm cập nhật thống kê doanh thu
  async function updateRevenueStats(fromDate, toDate) {
    try {
      const invoices = await fetchInvoices(fromDate, toDate);
      let totalRevenue = 0;
      let invoiceCount = 0;

      invoices.forEach((invoice) => {
        if (invoice.status === "completed") {
          invoiceCount++;
          invoice.invoiceItemDTOs.forEach((item) => {
            totalRevenue += item.quantity * (item.product.price || 0);
          });
        }
      });

      document.getElementById("totalRevenue").textContent =
        totalRevenue.toLocaleString("vi-VN");
      document.getElementById("invoiceCount").textContent = invoiceCount;
    } catch (error) {
      // Lỗi đã được xử lý trong fetchInvoices
    }
  }

  // Hàm cập nhật thống kê trạng thái
  async function updateStatusStats(fromDate, toDate) {
    try {
      const invoices = await fetchInvoices(fromDate, toDate);
      const statusCounts = {
        pending: 0,
        packing: 0,
        intransit: 0,
        completed: 0,
        cancelled: 0,
        pendingcancel: 0,
        returned: 0,
      };

      invoices.forEach((invoice) => {
        console.log("Trạng thái hóa đơn:", invoice.status);
        if (statusCounts.hasOwnProperty(invoice.status)) {
          statusCounts[invoice.status]++;
        } else {
          console.warn("Trạng thái không xác định:", invoice.status);
        }
      });

      const counts = [
        statusCounts.pending,
        statusCounts.packing,
        statusCounts.intransit,
        statusCounts.completed,
        statusCounts.cancelled,
        statusCounts.pendingcancel,
        statusCounts.returned,
      ];
      console.log("Dữ liệu biểu đồ:", counts);

      statusChart.data.datasets[0].data = counts;
      statusChart.update();
    } catch (error) {
      // Lỗi đã được xử lý trong fetchInvoices
    }
  }

  // Hiển thị dữ liệu tất cả khoảng thời gian khi tải trang
  updateRevenueStats(""); // Không truyền fromDate, toDate
  updateStatusStats("");

  // Xử lý nút tìm kiếm doanh thu
  const fetchRevenueBtn = document.getElementById("fetchRevenue");
  if (fetchRevenueBtn) {
    fetchRevenueBtn.addEventListener("click", async () => {
      const fromDate = document.getElementById("fromDateRevenue").value;
      const toDate = document.getElementById("toDateRevenue").value;

      if (!fromDate || !toDate) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Vui lòng chọn khoảng thời gian!",
        });
        return;
      }

      await updateRevenueStats(fromDate, toDate);
    });
  }

  // Xử lý nút tìm kiếm trạng thái đơn hàng
  const fetchStatusBtn = document.getElementById("fetchStatus");
  if (fetchStatusBtn) {
    fetchStatusBtn.addEventListener("click", async () => {
      const fromDate = document.getElementById("fromDateStatus").value;
      const toDate = document.getElementById("toDateStatus").value;

      if (!fromDate || !toDate) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Vui lòng chọn khoảng thời gian!",
        });
        return;
      }

      await updateStatusStats(fromDate, toDate);
    });
  }
});
