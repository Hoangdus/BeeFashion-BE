$(document).ready(function () {
  // Mock user data (giả lập như product.js)
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

  // Danh sách trạng thái
  const statusOptions = [
    { value: "pending", text: "Chờ xác nhận" },
    { value: "packing", text: "Đóng gói" },
    { value: "intransit", text: "Vận chuyển" },
    { value: "completed", text: "Hoàn thành" },
    { value: "returned", text: "Trả về" },
    { value: "cancelled", text: "Hủy" },
    { value: "pendingcancel", text: "Đang chờ xác nhận huỷ" },
  ];

  // Model InvoiceFilter
  class InvoiceFilter {
    constructor(fromDate = "", toDate = "", status = null) {
      this.fromDate = fromDate;
      this.toDate = toDate;
      this.status = status;
    }

    toQueryParams() {
      const params = new URLSearchParams();
      params.append("fromDate", this.fromDate);
      params.append("toDate", this.toDate);
      if (this.status) {
        params.append("status", this.status);
      }
      return params.toString();
    }
  }

  let currentPage = 1;
  let pageSize = 10;
  let invoiceData = {
    invoices: [],
    total: 0,
  };

  // Hàm lấy danh sách đơn hàng từ API
  async function fetchInvoices() {
    try {
      console.log("Đang lấy dữ liệu đơn hàng...");
      const filter = new InvoiceFilter(); // Mặc định: fromDate="", toDate=""
      const queryParams = filter.toQueryParams();
      //   console.log(queryParams);
      const response = await fetch(`${BASE_URL}/admin/invoices?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Dữ liệu đơn hàng:", data);
      invoiceData = data;
      return data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu đơn hàng:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải dữ liệu đơn hàng: " + error.message,
      });
      return [];
    }
  }

  // Hàm lấy thông tin khách hàng từ API
  async function fetchCustomerInfo(customerId) {
    try {
      const response = await fetch(`${BASE_URL}/admin/customers/${customerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const customer = await response.json();
      return {
        fullName: customer.fullName || "Không xác định",
        phone: customer.phone || "Không xác định",
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin khách hàng:", error);
      return { fullName: "Không xác định", phone: "Không xác định" };
    }
  }

  //   // Hàm lấy thông tin địa chỉ từ API
  //   async function fetchAddress(addressId) {
  //     try {
  //       const response = await fetch(`${BASE_URL}/admin/addresses/${addressId}`);
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }
  //       const address = await response.json();
  //       return {
  //         detail: address.detail || "Không xác định",
  //         ward: address.ward || "Không xác định",
  //         district: address.district || "Không xác định",
  //         province: address.province || "Không xác định",
  //       };
  //       //   return address.addressDetail || "Không xác định";
  //     } catch (error) {
  //       console.error("Lỗi khi lấy thông tin địa chỉ:", error);
  //       return addressId || "Không xác định"; // Hiển thị addressID nếu API không tồn tại
  //     }
  //   }

  // Hàm định dạng giá tiền
  function formatPrice(price) {
    if (!price) return "0 VNĐ";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ";
  }

  // Hàm sao chép vào clipboard
  function copyToClipboard(text, element) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const feedback = $('<span class="copy-feedback">Đã sao chép!</span>');
        element.append(feedback);
        feedback.css({
          position: "absolute",
          top: element.position().top - 20,
          left:
            element.position().left +
            element.width() / 2 -
            feedback.width() / 2,
        });
        feedback.animate({ opacity: 1 }, 200, function () {
          setTimeout(() => {
            feedback.animate({ opacity: 0 }, 200, function () {
              feedback.remove();
            });
          }, 1000);
        });
      })
      .catch((err) => {
        console.error("Lỗi khi sao chép:", err);
      });
  }

  // Hàm cập nhật trạng thái đơn hàng
  async function updateInvoiceStatus(invoiceId, newStatus, customerId) {
    try {
      const response = await fetch(
        `${BASE_URL}/admin/invoices/${customerId}/${invoiceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      console.log(customerId, invoiceId);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật trạng thái đơn hàng thành công!",
        timer: 1500,
        showConfirmButton: false,
      });

      const activeTab = $("#invoiceTabs .nav-link.active").attr("id");
      handleTabChange(activeTab);
      return true;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể cập nhật trạng thái: " + error.message,
      });
      return false;
    }
  }

  // Hàm hiển thị chi tiết đơn hàng
  async function showInvoiceDetails(invoice) {
    if (!invoice) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy thông tin đơn hàng!",
      });
      return;
    }

    const customerInfo = await fetchCustomerInfo(invoice.customerID);

    const paymentMethod =
      invoice.paymentMethod === "cod"
        ? "Thanh toán khi nhận hàng"
        : invoice.paymentMethod || "Không xác định";
    const statusText =
      statusOptions.find((opt) => opt.value === invoice.status)?.text ||
      invoice.status;

    $("#viewInvoiceId").text(invoice.id || "Không xác định");
    $("#viewCustomerName").text(customerInfo.fullName);
    $("#viewPhone").text(customerInfo.phone);
    $("#viewAddressDetail").text(invoice.fullAddress || "Không xác định");
    // $("#viewWard").text(addressInfo.ward);
    // $("#viewDistrict").text(addressInfo.district);
    // $("#viewProvince").text(addressInfo.province);
    $("#viewTotal").text(formatPrice(invoice.total));
    $("#viewPaymentMethod").text(paymentMethod);
    $("#viewStatus").text(statusText);
    $("#viewCreatedAt").text(
      new Date(invoice.createdAt).toLocaleString("vi-VN") || "Không xác định"
    );

    const itemsTable = $("#viewInvoiceItems");
    itemsTable.empty();
    (invoice.invoiceItemDTOs || []).forEach((item) => {
      const productName = item.product?.name || "Không xác định";
      const sizeName = item.size?.name || "Không xác định";
      const quantity = item.quantity || 0;
      const price = item.product?.price || 0;
      itemsTable.append(`
        <tr>
          <td>${productName}</td>
          <td>${sizeName}</td>
          <td>${quantity}</td>
          <td>${formatPrice(price)}</td>
        </tr>
      `);
    });

    $("#viewInvoiceDetailModal").modal("show");
  }

  // Hàm cập nhật bảng đơn hàng
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
    const paginatedInvoices = data.slice(startIndex, endIndex);

    for (const invoice of paginatedInvoices) {
      try {
        const totalQuantity = (invoice.invoiceItemDTOs || []).reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        const customerInfo = await fetchCustomerInfo(invoice.customerID);
        const paymentMethod =
          invoice.paymentMethod === "cod"
            ? "Thanh toán khi nhận hàng"
            : invoice.paymentMethod || "Không xác định";
        const invoiceId = invoice.id;

        // Lọc tùy chọn trạng thái
        let filteredStatusOptions = statusOptions;
        let isDisabled = false;

        if (invoice.status === "pending") {
          filteredStatusOptions = statusOptions.filter(
            (opt) =>
              opt.value === "pending" ||
              opt.value === "packing" ||
              opt.value === "cancelled"
          );
        } else if (invoice.status === "packing") {
          filteredStatusOptions = statusOptions.filter(
            (opt) => opt.value === "packing" || opt.value === "intransit"
          );
        } else if (
          invoice.status === "intransit" ||
          invoice.status === "cancelled"
        ) {
          filteredStatusOptions = statusOptions.filter(
            (opt) => opt.value === invoice.status
          );
          isDisabled = true;
        }

        // Tạo dropdown trạng thái
        const statusSelectOptions = filteredStatusOptions
          .map(
            (opt) =>
              `<option value="${opt.value}" ${
                opt.value === invoice.status ? "selected" : ""
              }>${opt.text}</option>`
          )
          .join("");

        const row = `
          <tr>
            <td class="id-column" data-bs-toggle="tooltip" data-bs-placement="top" title="${invoiceId}" data-id="${invoiceId}">${invoiceId}</td>
            <td>${customerInfo.fullName}</td>
            <td>${totalQuantity}</td>
            <td>${formatPrice(invoice.total)}</td>
            <td>${paymentMethod}</td>
            <td>
              <select class="form-select status-select" data-id="${invoiceId}" data-customer-id="${
          invoice.customerID
        }" ${isDisabled ? "disabled" : ""}>
                ${statusSelectOptions}
              </select>
            </td>
            <td>
              <a href="#" class="view-invoice-btn" style="color: blue; text-decoration: underline; font-style: italic;" data-id="${invoiceId}">Xem chi tiết</a>
            </td>
          </tr>
        `;
        tableBody.append(row);
      } catch (error) {
        console.error("Lỗi khi hiển thị đơn hàng:", invoice.id, error);
      }
    }

    // Khởi tạo tooltip
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Sự kiện sao chép ID
    $(".id-column")
      .off("click")
      .on("click", function () {
        const idText = $(this).data("id");
        copyToClipboard(idText, $(this));
      });

    // Sự kiện thay đổi trạng thái
    $(".status-select")
      .off("change")
      .on("change", async function () {
        const invoiceId = $(this).data("id");
        const customerId = $(this).data("customer-id");
        const newStatus = $(this).val();
        const currentStatus = invoiceData.find(
          (inv) => inv.id === invoiceId
        )?.status;

        const confirmed = await Swal.fire({
          title: `Bạn có chắc muốn thay đổi trạng thái thành "${
            statusOptions.find((opt) => opt.value === newStatus).text
          }"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "OK",
          cancelButtonText: "Hủy",
          width: "350px",
          padding: "1em",
          buttonsStyling: true,
          customClass: {
            title: "swal2-title-small",
            popup: "swal2-popup-small",
          },
        });

        if (!confirmed.isConfirmed) {
          $(this).val(currentStatus);
          return;
        }

        const success = await updateInvoiceStatus(
          invoiceId,
          newStatus,
          customerId
        );
        if (!success) {
          $(this).val(currentStatus); // Hoàn tác nếu cập nhật thất bại
        }
      });

    // Sự kiện xem chi tiết
    $(".view-invoice-btn")
      .off("click")
      .on("click", function () {
        const invoiceId = $(this).data("id");
        const invoice = invoiceData.find((inv) => inv.id === invoiceId);
        showInvoiceDetails(invoice);
      });

    // Cập nhật thông tin trang
    const showingTo = Math.min(endIndex, data.length);
    pageInfo.text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        data.length
      } đơn hàng`
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
        // Gọi lại renderTable cho tab hiện tại
        const activeTab = $("#invoiceTabs .nav-link.active").attr("id");
        handleTabChange(activeTab);
      }
    });

    // Cập nhật khi thay đổi số lượng hiển thị
    $(`#${pageSizeSelectId}`).on("change", function () {
      pageSize = parseInt($(this).val());
      currentPage = 1;
      const activeTab = $("#invoiceTabs .nav-link.active").attr("id");
      handleTabChange(activeTab);
    });
  }

  // Hàm xử lý chuyển tab
  async function handleTabChange(targetTab) {
    let filteredData;

    // Lấy dữ liệu đơn hàng từ API
    filteredData = await fetchInvoices();

    // Sắp xếp dữ liệu theo createdAt giảm dần (đơn hàng mới nhất đứng đầu)
    filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (targetTab === "all-orders-tab") {
      await updateTable(
        filteredData,
        "invoiceTableBodyAll",
        "pageInfoAll",
        "paginationAll",
        "pageSizeSelectAll"
      );
    } else if (targetTab === "pending-approval-orders-tab") {
      filteredData = filteredData.filter(
        (invoice) => invoice.status === "pending"
      );
      await updateTable(
        filteredData,
        "invoiceTableBodyPendingApproval",
        "pageInfoPendingApproval",
        "paginationPendingApproval",
        "pageSizeSelectPendingApproval"
      );
    } else if (targetTab === "approved-orders-tab") {
      filteredData = filteredData.filter(
        (invoice) =>
          invoice.status === "packing" || invoice.status === "intransit"
      );
      await updateTable(
        filteredData,
        "invoiceTableBodyApproved",
        "pageInfoApproved",
        "paginationApproved",
        "pageSizeSelectApproved"
      );
    } else if (targetTab === "unpaid-orders-tab") {
      filteredData = filteredData.filter((invoice) => !invoice.paidStatus);
      await updateTable(
        filteredData,
        "invoiceTableBodyUnpaid",
        "pageInfoUnpaid",
        "paginationUnpaid",
        "pageSizeSelectUnpaid"
      );
    } else if (targetTab === "paid-orders-tab") {
      filteredData = filteredData.filter((invoice) => invoice.paidStatus);
      await updateTable(
        filteredData,
        "invoiceTableBodyPaid",
        "pageInfoPaid",
        "paginationPaid",
        "pageSizeSelectPaid"
      );
    }
  }

  // Xử lý sự kiện chuyển tab
  $("#invoiceTabs a").on("shown.bs.tab", function (e) {
    currentPage = 1;
    const targetTab = $(e.target).attr("id");
    handleTabChange(targetTab);
  });

  // Xử lý nút "Thêm mới"
  $(
    "#addInvoiceBtnAll, #addInvoiceBtnPendingApproval, #addInvoiceBtnApproved, #addInvoiceBtnUnpaid, #addInvoiceBtnPaid"
  ).on("click", function () {
    Swal.fire({
      icon: "info",
      title: "Thông báo",
      text: "Chức năng thêm mới đang được phát triển!",
      timer: 1500,
      showConfirmButton: false,
    });
  });

  // Khởi tạo bảng cho tab mặc định
  handleTabChange("all-orders-tab");
  handleTabChange("pending-approval-orders-tab");
  handleTabChange("approved-orders-tab");
  handleTabChange("unpaid-orders-tab");
  handleTabChange("paid-orders-tab");
});
