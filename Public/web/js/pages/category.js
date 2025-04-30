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
      categories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  async function fetchCategoryById(categoryId) {
    try {
      const response = await fetch(
        `${BASE_URL}/admin/categories/${categoryId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const category = await response.json();
      return category;
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      return "Không xác định";
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
      const response = await fetch(`${BASE_URL}/admin/categories`, {
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

  // Thêm sự kiện cho nút Xem
  async function showCategoryDetails(categoryId) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy sản phẩm!",
      });
      return;
    }

    const categoryInfo = await fetchCategoryById(categoryId);
    console.log(`categoryInfo:`, categoryInfo);

    $("#viewCategoryId").text(categoryInfo.id || "Không xác định");
    $("#viewCategoryName").text(categoryInfo.name || "Không xác định");
    $("#viewCreatedAt").text(
      new Date(categoryInfo.createdAt).toLocaleString("vi-VN") ||
        "Không xác định"
    );
    $("#viewStatus").text(categoryInfo.deletedAt ? "Ẩn" : "Hiển thị");
    $("#viewCategoryDetailModal").modal("show");
  }

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
                        <button class="btn btn-sm btn-success me-1 view-category-btn" title="View info" data-id="${categoryId}">
                          <i class="mdi mdi-eye"></i>
                        </button>
                      </td>
                  </tr>
              `;
      tableBody.append(row);
    });

    // Thêm sự kiện cho nút View (ngoài vòng lặp forEach)
    $(document).on("click", ".view-category-btn", function () {
      const categoryId = $(this).data("id");
      showCategoryDetails(categoryId);
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
              title: `Bạn có chắc muốn ${action} danh mục này?`,
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
