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
  } else {
    $("#accountManagerTab").show();
  }

  const tableBody = $("#categoryTableBody");
  let currentPage = 1;
  let pageSize = 10;
  let categories = [];

  // Hàm lấy dữ liệu từ API
  async function fetchCategories() {
    try {
      console.log("Đang gọi API...");
      const response = await fetch(`${BASE_URL}/admin/categories`);
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      categories = await response.json();
      console.log("Dữ liệu nhận được:", categories);
      updateTable();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      tableBody.html(
        '<tr><td colspan="6">Không thể tải dữ liệu danh mục: ' +
          error.message +
          "</td></tr>"
      );
    }
  }

  // Hiển thị modal khi nhấn nút "Thêm mới"
  $(document).on("click", "#addCategoryBtn", function () {
    console.log("Add button clicked!");
    $("#addCategoryModal").modal("show");
  });

  // Xử lý khi nhấn nút "Lưu" trong modal
  $("#saveCategoryBtn").on("click", async function () {
    const categoryName = $("#categoryName").val().trim();

    if (!categoryName) {
      alert("Vui lòng nhập tên thể loại!");
      return;
    }

    const categoryData = {
      name: categoryName,
    };

    try {
      const response = await fetch(`${BASE_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newCategory = await response.json();
      console.log("Thêm mới thành công:", newCategory);

      // Đóng modal và làm mới bảng
      $("#addCategoryModal").modal("hide");
      $("#addCategoryForm")[0].reset(); // Xóa dữ liệu trong form
      await fetchCategories(); // Làm mới danh sách categories
    } catch (error) {
      console.error("Lỗi khi thêm mới:", error);
      alert("Có lỗi xảy ra khi thêm thể loại: " + error.message);
    }
  });

  // Cập nhật số lượng hiển thị khi thay đổi select
  $("#pageSizeSelect").on("change", function () {
    pageSize = parseInt($(this).val());
    currentPage = 1;
    updateTable();
  });

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

  // Thêm sự kiện cho nút Sửa
  tableBody.on("click", ".btn-primary", function () {
    const row = $(this).closest("tr");
    const categoryId = row.find(".status-toggle").data("id");
    const categoryName = row.find("td:eq(1)").text();

    // Điền dữ liệu vào modal
    $("#editCategoryId").val(categoryId);
    $("#editCategoryName").val(categoryName);

    // Hiển thị modal
    $("#editCategoryModal").modal("show");
  });

  // Xử lý khi nhấn nút "Lưu thay đổi" trong modal sửa
  $("#saveEditCategoryBtn").on("click", async function () {
    const categoryId = $("#editCategoryId").val();
    const categoryName = $("#editCategoryName").val().trim();

    if (!categoryName) {
      alert("Vui lòng nhập tên thể loại!");
      return;
    }

    const categoryData = {
      id: categoryId,
      name: categoryName,
    };

    try {
      const response = await fetch(
        `${BASE_URL}/admin/categories/${categoryId}`,
        {
          method: "PUT", // Sử dụng PUT để cập nhật toàn bộ
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedCategory = await response.json();
      console.log("Cập nhật thành công:", updatedCategory);

      // Đóng modal và làm mới bảng
      $("#editCategoryModal").modal("hide");
      $("#editCategoryForm")[0].reset();
      await fetchCategories();

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật thể loại thành công!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra khi cập nhật thể loại: " + error.message,
      });
    }
  });

  // Hàm cập nhật bảng
  function updateTable() {
    tableBody.empty();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCategories = categories.slice(startIndex, endIndex);

    paginatedCategories.forEach((category, index) => {
      const isActive = !category.deletedAt;
      const statusChecked = isActive ? "checked" : "";
      const categoryId = category.id || startIndex + index + 1;
      const row = `
                  <tr>
                      <td class="id-column" data-bs-toggle="tooltip" data-bs-placement="top" title="${categoryId}" data-id="${categoryId}">${categoryId}</td>
                      <td>${category.name || "Không có tên"}</td>
                      <td>
                        <div class="form-check form-switch">
                          <input class="form-check-input status-toggle" type="checkbox" id="switch${categoryId}" ${statusChecked} data-id="${categoryId}">
                          <label class="form-check-label" for="switch${categoryId}"></label>
                        </div>
                      </td>
                      <td>
                          <button class="btn btn-sm btn-primary me-1" title="Update">
                            <i class="mdi mdi-pencil"></i>
                          </button>
                          <button class="btn btn-sm btn-success" title="View info">
                            <i class="mdi mdi-eye"></i>
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
        // .off() để tránh trùng lặp sự kiện
        const idText = $(this).data("id"); // Lấy ID từ data-id
        copyToClipboard(idText, $(this));
      });

    $(".status-toggle")
      .off("change")
      .on("change", async function () {
        const isChecked = $(this).is(":checked");
        const categoryId = $(this).data("id");
        const action = isChecked ? "hiện" : "ẩn";

        if (
          !(
            await Swal.fire({
              title: `Bạn có chắc muốn ${action} danh mục này?`, // Rút gọn title
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
          const url = `${BASE_URL}/admin/categories/${categoryId}`;
          const method = isChecked ? "PATCH" : "DELETE";
          const response = await fetch(url, { method });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          console.log(
            `Cập nhật trạng thái ${categoryId} thành công: ${
              isChecked ? "hiện" : "ẩn"
            }`
          );
          await fetchCategories();
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          alert("Có lỗi xảy ra: " + error.message);
          $(this).prop("checked", !isChecked); // Hoàn tác nếu lỗi
        }
      });

    const showingTo = Math.min(endIndex, categories.length);
    $("#pageInfo").text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        categories.length
      } sản phẩm`
    );

    updatePagination();
  }

  // Hàm cập nhật pagination
  function updatePagination() {
    const totalPages = Math.ceil(categories.length / pageSize);
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
              <li class="page-item ${
                currentPage === totalPages ? "disabled" : ""
              }">
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

  fetchCategories();
});
