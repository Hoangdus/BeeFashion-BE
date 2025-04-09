$(document).ready(function () {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  const adminRoleId = "748D8888-4088-440D-BA90-AFEA1D31B3E8"; // ID của Admin
  const managerRoleId = "9AC80862-F9B7-44FF-9DE7-4F02DF2F037A"; // ID của Manager

  // Kiểm tra đăng nhập và quyền truy cập
  if (!user || user.role_id !== adminRoleId) {
    Swal.fire({
      icon: "warning",
      title: user ? "Không có quyền" : "Chưa đăng nhập",
      text: user
        ? "Chỉ Admin mới có thể truy cập trang này!"
        : "Vui lòng đăng nhập để tiếp tục!",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      window.location.href = user ? "account-infor.html" : "login.html";
    });
    return;
  }

  // Hiển thị thông tin tài khoản hiện tại
  $("#currentAccountName").text(user.name || "Chưa có tên");
  $("#currentAccountEmail").text(user.email || "Chưa có email");
  $("#currentAccountRole")
    .text(user.role_id === adminRoleId ? "Admin" : "Manager")
    .addClass(user.role_id === adminRoleId ? "role-admin" : "role-manager");
  $("#currentAccountPhone").text(user.phone || "Chưa có số điện thoại");

  if (user.role_id === managerRoleId) {
    $("#accountManagerTab").hide();
    $("#statsTab").hide();
  } else {
    $("#accountManagerTab").show();
  }

  const tableBody = $("#accountTableBody");
  const pageSizeSelect = $("#pageSizeSelect");
  const pageInfo = $("#pageInfo");
  const pagination = $("#pagination");
  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect.val()) || 10;
  let accounts = [];
  let roles = [];

  // Hàm lấy danh sách tài khoản từ API
  async function fetchAccounts() {
    try {
      console.log("Đang gọi API danh sách tài khoản...");
      const response = await fetch("http://127.0.0.1:8080/admin/managers");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      accounts = await response.json();
      console.log("Danh sách tài khoản:", accounts);
      updateTable();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      tableBody.html(
        `<tr><td colspan="6">Không thể tải dữ liệu tài khoản: ${error.message}</td></tr>`
      );
    }
  }

  // Hàm lấy danh sách roles từ API
  async function fetchRoles() {
    try {
      const response = await fetch("http://127.0.0.1:8080/roles"); // Adjust this endpoint
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      roles = await response.json();
      console.log("Dữ liệu roles từ API:", roles);
      populateRoleSelect();
    } catch (error) {
      console.error("Lỗi khi lấy danh sách roles:", error);
      roles = [];
      populateRoleSelect();
    }
  }

  // Hàm populate role select trong modal
  function populateRoleSelect() {
    const roleSelect = $("#role");
    roleSelect.empty();
    roleSelect.append('<option value="">Chọn vai trò</option>');

    if (!roles || roles.length === 0) {
      roleSelect.append('<option value="">Không có vai trò nào</option>');
      return;
    }

    roles.forEach((role) => {
      roleSelect.append(
        `<option value="${role.id}">${role.roleName}</option>` // Sử dụng roleName thay vì name
      );
    });
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

  // Show modal when clicking "Thêm mới" button
  $("#addAccountBtn").click(function () {
    $("#addAccountForm")[0].reset(); // Reset form
    populateRoleSelect(); // Ensure latest roles are loaded
    $("#addAccountModal").modal("show");
  });

  // Handle form submission for adding new account
  $("#saveAccountBtn").click(async function () {
    // Validate form
    if (!$("#addAccountForm")[0].checkValidity()) {
      $("#addAccountForm")[0].reportValidity();
      return;
    }

    // Get form data
    const formData = {
      name: $("#name").val(),
      email: $("#email").val(),
      phone: $("#phone").val(),
      role: $("#role").val(),
      password: $("#password").val(),
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:8080/auth/register_manager",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add authorization header if needed
            // 'Authorization': 'Bearer ' + user.token
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Email đã tồn tại");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Hide modal
      $("#addAccountModal").modal("hide");

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Tài khoản đã được tạo thành công!",
        timer: 2000,
        showConfirmButton: false,
      });

      // Refresh account table
      await fetchAccounts();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Đã xảy ra lỗi khi tạo tài khoản",
        confirmButtonText: "OK",
      });
    }
  });

  // Hàm cập nhật bảng
  function updateTable() {
    tableBody.empty();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const filteredAccounts = accounts.filter(
      (account) => account.id !== user.id
    );
    const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

    paginatedAccounts.forEach((account) => {
      const accountId = account.id || "N/A";
      const roleText = account.role_id === adminRoleId ? "Admin" : "Manager";
      const roleClass =
        account.role_id === adminRoleId ? "role-admin" : "role-manager";
      const isActive = !account.deletedAt;
      const statusChecked = isActive ? "checked" : "";

      const row = `
          <tr>
            <td class="id-column" data-bs-toggle="tooltip" data-bs-placement="top" title="${accountId}" data-id="${accountId}">${accountId}</td>
            <td>${account.name || "Chưa có tên"}</td>
            <td>${account.email || "Chưa có email"}</td>
            <td><span class="${roleClass}">${roleText}</span></td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input status-toggle" type="checkbox" id="switch${accountId}" ${statusChecked} data-id="${accountId}">
                    <label class="form-check-label" for="switch${accountId}"></label>
                </div>
            </td>
            <td>
              <button class="btn btn-sm btn-primary me-1 edit-account-btn" title="Sửa" data-id="${accountId}">
                <i class="mdi mdi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-account-btn" title="Xóa" data-id="${accountId}">
                <i class="mdi mdi-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      tableBody.append(row);
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

    // Thêm sự kiện cho nút "Chỉnh sửa"
    $(".edit-account-btn")
      .off("click")
      .on("click", function () {
        const accountId = $(this).data("id");
        window.location.href = `edit-account.html?id=${accountId}`;
      });

    // Thêm sự kiện cho nút toggle trạng thái
    $(".status-toggle")
      .off("change")
      .on("change", async function () {
        const accountId = $(this).data("id");
        const isChecked = $(this).is(":checked"); // True nếu bật, false nếu tắt
        const action = isChecked ? "hiện" : "ẩn";

        if (
          !(
            await Swal.fire({
              title: `Bạn có chắc muốn ${action} tài khoản này?`, // Rút gọn title
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "OK",
              cancelButtonText: "Hủy",
              width: "350px", // Giảm chiều rộng (mặc định ~500px)
              padding: "1em", // Giảm padding để nhỏ gọn
              buttonsStyling: true, // Giữ kiểu nút mặc định
              customClass: {
                title: "swal2-title-small", // Class tùy chỉnh cho title
                popup: "swal2-popup-small", // Class tùy chỉnh cho popup
              },
            })
          ).isConfirmed
        ) {
          return $(this).prop("checked", !isChecked);
        }

        try {
          const url = `http://127.0.0.1:8080/admin/managers/${accountId}`;
          const method = isChecked ? "PATCH" : "DELETE";
          const response = await fetch(url, { method });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          console.log(
            `Cập nhật trạng thái ${accountId} thành công: ${
              isChecked ? "hiện" : "ẩn"
            }`
          );
          await fetchAccounts(); // Làm mới bảng
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          alert("Có lỗi xảy ra: " + error.message);
          $(this).prop("checked", !isChecked); // Hoàn tác nếu lỗi
        }
      });

    const showingTo = Math.min(endIndex, filteredAccounts.length);
    pageInfo.text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        filteredAccounts.length
      } tài khoản`
    );
    updatePagination(filteredAccounts.length);
  }

  // Hàm cập nhật pagination
  function updatePagination() {
    const totalPages = Math.ceil(accounts.length / pageSize);
    pagination.empty();

    pagination.append(`
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
          <a class="page-link" href="#" aria-label="Previous">«</a>
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
          <a class="page-link" href="#" aria-label="Next">»</a>
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

  // Cập nhật số lượng hiển thị khi thay đổi select
  pageSizeSelect.on("change", function () {
    pageSize = parseInt($(this).val());
    currentPage = 1;
    updateTable();
  });

  Promise.all([fetchRoles(), fetchAccounts()]);
});
