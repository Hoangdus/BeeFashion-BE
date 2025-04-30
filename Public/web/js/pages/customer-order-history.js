$(document).ready(function () {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  const managerRoleId = "9AC80862-F9B7-44FF-9DE7-4F02DF2F037A";
  let customer = [];

  // Kiểm tra đăng nhập
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

  const tableBody = $("#customerTableBody");
  let currentPage = 1;
  let pageSize = 10;

  // Hàm lấy dữ liệu khách hàng từ API
  async function fetchCustomer() {
    try {
      console.log("Đang gọi API...");
      const response = await fetch(`${BASE_URL}/admin/customers`);
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      customer = await response.json();
      customer.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log("Dữ liệu nhận được:", customer);
      updateTable();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      tableBody.html(
        `<tr><td colspan="5">Không thể tải dữ liệu khách hàng: ${error.message}</td></tr>`
      );
    }
  }

  // Cập nhật số lượng hiển thị khi thay đổi select
  $("#pageSizeSelect").on("change", function () {
    pageSize = parseInt($(this).val());
    currentPage = 1;
    updateTable();
  });

  // Hàm định dạng giá tiền (không cần thiết cho khách hàng, nhưng giữ lại nếu cần)
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

  // Hàm hiển thị chi tiết khách hàng
  function showCustomerDetails(customerId) {
    const selectedCustomer = customer.find((c) => c.id === customerId);
    if (selectedCustomer) {
      Swal.fire({
        title: "Thông tin khách hàng",
        html: `
            <p><strong>ID:</strong> ${selectedCustomer.id}</p>
            <p><strong>Tên:</strong> ${
              selectedCustomer.fullname || "Không có"
            }</p>
            <p><strong>Email:</strong> ${
              selectedCustomer.email || "Không có"
            }</p>
            <p><strong>Số điện thoại:</strong> ${
              selectedCustomer.phone || "Không có"
            }</p>
          `,
        icon: "info",
        confirmButtonText: "Đóng",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy khách hàng!",
      });
    }
  }

  // Hàm lấy lịch sử đơn hàng từ API
  async function fetchCustomerInvoices(customerId) {
    try {
      const response = await fetch(`${BASE_URL}/invoices/${customerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const invoices = await response.json();
      return invoices;
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đơn hàng:", error);
      return [];
    }
  }

  // Hàm hiển thị lịch sử đơn hàng
  async function showCustomerInvoices(customerId) {
    const invoices = await fetchCustomerInvoices(customerId);
    if (invoices.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Không có đơn hàng",
        text: "Khách hàng này chưa có đơn hàng nào!",
        confirmButtonText: "Đóng",
      });
      return;
    }

    // Tạo bảng hiển thị đơn hàng
    let tableHtml = `
      <div style="overflow-x: auto;">
        <table class="table table-bordered table-hover" style="width: 100%; min-width: 600px;">
          <thead class="table-light">
            <tr>
              <th>ID Đơn hàng</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Tổng tiền</th>
              <th>Phương thức thanh toán</th>
              <th>Địa chỉ</th>
              <th>Chi tiết sản phẩm</th>
            </tr>
          </thead>
          <tbody>
    `;

    invoices.forEach((invoice) => {
      const createdAt = new Date(invoice.createdAt).toDateString("vi-VN");
      //   const statusText =
      //     invoice.status === "completed"
      //       ? "Hoàn thành"
      //         ? invoice.status === "pending"
      //         : "Chờ xác nhận"
      //       : invoice.status === "intransit"
      //       ? "Đang giao"
      //       : invoice.status === "packing"
      //       ? "Đang đóng gói"
      //       : "Đã hủy";
      let statusText = "";
      if (invoice.status === "completed") {
        statusText = "Hoàn thành";
      } else if (invoice.status === "pending") {
        statusText = "Chờ xác nhận";
      } else if (invoice.status === "intransit") {
        statusText = "Đang giao";
      } else if (invoice.status === "packing") {
        statusText = "Đang đóng gói";
      } else if (invoice.status === "cancelled") {
        statusText = "Đã hủy";
      } else if (invoice.status === "returned") {
        statusText = "Trả hàng";
      } else if (invoice.status === "pendingcancel") {
        statusText = "Chờ xác nhận";
      } else {
        statusText = "Không xác định";
      }

      const paymentMethodText =
        invoice.paymentMethod === "cod" ? "COD" : "ZaloPay";

      // Tạo chi tiết sản phẩm
      let productDetails = invoice.invoiceItemDTOs
        .map(
          (item) => `
          ${item.product.name} (Kích thước: ${item.size.name}, Số lượng: ${
            item.quantity
          }, Giá: ${formatPrice(item.product.price)})
        `
        )
        .join("<br>");

      tableHtml += `
        <tr>
          <td>${invoice.id}</td>
          <td>${createdAt}</td>
          <td>${statusText}</td>
          <td>${formatPrice(invoice.total)}</td>
          <td>${paymentMethodText}</td>
          <td>${invoice.fullAddress}</td>
          <td>${productDetails}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </div>
    `;

    // Hiển thị bảng bằng SweetAlert2
    Swal.fire({
      title: "Lịch sử đơn hàng",
      html: tableHtml,
      width: "80%",
      confirmButtonText: "Đóng",
      customClass: {
        popup: "swal2-wide-popup",
      },
    });
  }

  // Hàm cập nhật bảng
  function updateTable() {
    tableBody.empty();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCustomers = customer.slice(startIndex, endIndex);

    paginatedCustomers.forEach((customer, index) => {
      try {
        const customerId = customer.id || startIndex + index + 1;
        const row = `
            <tr>
              <td class="id-column" data-bs-toggle="tooltip" data-bs-placement="top" title="${customerId}" data-id="${customerId}">${customerId}</td>
              <td>${customer.fullName}</td>
              <td>${customer.email}</td>
              <td>${customer.phone || "Hiện chưa thêm số diện thoại"}</td>
              <td>
                <a href="#" class="view-invoice-btn" style="color: blue; text-decoration: underline; font-style: italic;" data-id="${customerId}">Xem lịch sử</a>
              </td>
            </tr>
          `;
        tableBody.append(row);
      } catch (error) {
        console.error("Lỗi khi thêm khách hàng:", customer.id, error);
      }
    });

    // Thêm sự kiện cho nút View
    $(".view-customer-btn").on("click", function () {
      const customerId = $(this).data("id");
      showCustomerDetails(customerId);
    });

    // Thêm sự kiện cho liên kết "Xem lịch sử"
    $(".view-invoice-btn").on("click", function (e) {
      e.preventDefault();
      const customerId = $(this).data("id");
      showCustomerInvoices(customerId);
    });

    // Khởi tạo tooltip
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Thêm sự kiện click để copy ID
    $(".id-column")
      .off("click")
      .on("click", function () {
        const idText = $(this).data("id");
        copyToClipboard(idText, $(this));
      });

    const showingTo = Math.min(endIndex, customer.length);
    $("#pageInfo").text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        customer.length
      } khách hàng`
    );

    updatePagination();
  }

  // Hàm cập nhật phân trang
  function updatePagination() {
    const totalPages = Math.ceil(customer.length / pageSize);
    const pagination = $("#pagination");
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
        updateTable();
      }
    });
  }

  // Gọi hàm lấy dữ liệu khi trang được tải
  fetchCustomer();
});
