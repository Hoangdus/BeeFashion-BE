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
    $("#logTab").hide();
  } else {
    $("#accountManagerTab").show();
    $("#statsTab").show();
    $("#logTab").show();
  }

  // Model LogFilter
  class LogFilter {
    constructor(contentType = null) {
      this.contentType = contentType;
    }

    toQueryParams() {
      const params = new URLSearchParams();
      if (this.contentType) {
        params.append("contentType", this.contentType);
      }
      return params.toString();
    }
  }

  let currentPage = 1;
  let pageSize = 10;
  let logData = [];

  // Hàm định dạng ngày giờ
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return "Invalid Date";
    }
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // Hàm lấy danh sách log từ API
  async function fetchLogs(filter = new LogFilter()) {
    try {
      const queryParams = filter.toQueryParams();
      const response = await fetch(`${BASE_URL}/admin/logs?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dữ liệu log:", data);
      logData = data;
      return data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu log:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải dữ liệu log: " + error.message,
        timer: 1500,
        showConfirmButton: false,
      });
      return [];
    }
  }

  // Hàm cập nhật bảng log
  async function updateTable(
    data,
    tableBodyId,
    pageInfoId,
    paginationId,
    pageSizeSelectId
  ) {
    const tableBody = $(`#${tableBodyId}`);
    const pageInfo = $(`#${pageInfoId}`);
    const pagination = $(`#${paginationId}`);
    const pageSizeSelect = $(`#${pageSizeSelectId}`);
    pageSize = parseInt(pageSizeSelect.val());

    tableBody.empty();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLogs = data.slice(startIndex, endIndex);

    paginatedLogs.forEach((log) => {
      const contentTypeText =
        {
          add: "Thêm",
          changeStatus: "Thay đổi trạng thái",
          approval: "Duyệt đơn hàng",
          other: "Khác",
        }[log.contentType] || "N/A";

      const row = `
        <tr>
          <td>${log.name || "N/A"}</td>
          <td>${contentTypeText}</td>
          <td>${log.content || "N/A"}</td>
          <td>${formatDate(log.createdAt)}</td>
        </tr>
      `;
      tableBody.append(row);
    });

    // Cập nhật thông tin trang
    const showingTo = Math.min(endIndex, data.length);
    pageInfo.text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${data.length} log`
    );

    // Cập nhật phân trang
    updatePagination(data.length, pagination, pageSizeSelectId);
  }

  // Hàm cập nhật phân trang
  function updatePagination(totalItems, pagination, pageSizeSelectId) {
    const totalPages = Math.ceil(totalItems / pageSize);
    pagination.empty();

    pagination.append(`
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" aria-label="Previous">
          <span aria-hidden="true">«</span>
        </a>
      </li>
    `);

    for (let i = 1; i <= totalPages; i++) {
      pagination.append(`
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="#">${i}</a>
        </li>
      `);
    }

    pagination.append(`
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" aria-label="Next">
          <span aria-hidden="true">»</span>
        </a>
      </li>
    `);

    pagination.find(".page-link").on("click", function (e) {
      e.preventDefault();
      const parentLi = $(this).parent();

      if (!parentLi.hasClass("disabled")) {
        if ($(this).attr("aria-label") === "Previous" && currentPage > 1) {
          currentPage--;
        } else if (
          $(this).attr("aria-label") === "Next" &&
          currentPage < totalPages
        ) {
          currentPage++;
        } else if (!$(this).attr("aria-label")) {
          currentPage = parseInt($(this).text());
        }
        const activeTab = $("#logTabs .nav-link.active").attr("id");
        handleTabChange(activeTab);
      }
    });

    // Cập nhật khi thay đổi số lượng hiển thị
    $(`#${pageSizeSelectId}`).on("change", function () {
      pageSize = parseInt($(this).val());
      currentPage = 1;
      const activeTab = $("#logTabs .nav-link.active").attr("id");
      handleTabChange(activeTab);
    });
  }

  // Hàm xử lý chuyển tab
  async function handleTabChange(targetTab) {
    let filteredData;

    // Lấy tất cả log từ API (không sử dụng bộ lọc)
    const allLogs = await fetchLogs();

    // Sắp xếp dữ liệu theo createdAt giảm dần (mới nhất đứng đầu)
    allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Lọc dữ liệu theo tab
    if (targetTab === "all-logs-tab") {
      filteredData = allLogs;
    } else if (targetTab === "add-logs-tab") {
      filteredData = allLogs.filter((log) => log.contentType === "add");
    } else if (targetTab === "change-status-logs-tab") {
      filteredData = allLogs.filter(
        (log) => log.contentType === "changeStatus"
      );
    } else if (targetTab === "approval-logs-tab") {
      filteredData = allLogs.filter((log) => log.contentType === "approval");
    } else if (targetTab === "other-logs-tab") {
      filteredData = allLogs.filter((log) => log.contentType === "other");
    }

    // Cập nhật bảng cho tab tương ứng
    if (targetTab === "all-logs-tab") {
      await updateTable(
        filteredData,
        "logTableBodyAll",
        "pageInfoAll",
        "paginationAll",
        "pageSizeSelectAll"
      );
    } else if (targetTab === "add-logs-tab") {
      await updateTable(
        filteredData,
        "logTableBodyAdd",
        "pageInfoAdd",
        "paginationAdd",
        "pageSizeSelectAdd"
      );
    } else if (targetTab === "change-status-logs-tab") {
      await updateTable(
        filteredData,
        "logTableBodyChangeStatus",
        "pageInfoChangeStatus",
        "paginationChangeStatus",
        "pageSizeSelectChangeStatus"
      );
    } else if (targetTab === "approval-logs-tab") {
      await updateTable(
        filteredData,
        "logTableBodyApproval",
        "pageInfoApproval",
        "paginationApproval",
        "pageSizeSelectApproval"
      );
    } else if (targetTab === "other-logs-tab") {
      await updateTable(
        filteredData,
        "logTableBodyOther",
        "pageInfoOther",
        "paginationOther",
        "pageSizeSelectOther"
      );
    }
  }

  // Xử lý sự kiện chuyển tab
  $("#logTabs a").on("shown.bs.tab", function (e) {
    currentPage = 1;
    const targetTab = $(e.target).attr("id");
    handleTabChange(targetTab);
  });

  // Khởi tạo bảng cho tất cả các tab
  handleTabChange("all-logs-tab");
  handleTabChange("add-logs-tab");
  handleTabChange("change-status-logs-tab");
  handleTabChange("approval-logs-tab");
  handleTabChange("other-logs-tab");
});
