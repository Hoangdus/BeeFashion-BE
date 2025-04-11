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

  const tableBody = $("#sizeTableBody");
  let currentPage = 1;
  let pageSize = 10;
  let sizes = [];

  // Hàm lấy dữ liệu từ API
  async function fetchSizes() {
    try {
      console.log("Đang gọi API...");
      const response = await fetch(`${BASE_URL}/admin/sizes`);
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      sizes = await response.json();
      console.log("Dữ liệu nhận được:", sizes);
      updateTable();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      tableBody.html(
        '<tr><td colspan="4">Không thể tải dữ liệu kích thước: ' +
          error.message +
          "</td></tr>"
      );
    }
  }

  // Hiển thị modal khi nhấn nút "Thêm mới"
  $(document).on("click", "#addSizeBtn", function () {
    console.log("Add button clicked!");
    $("#addSizeModal").modal("show");
  });

  // Xử lý khi nhấn nút "Lưu" trong modal
  $("#saveSizeBtn").on("click", async function () {
    const sizeName = $("#sizeName").val().trim();

    if (!sizeName) {
      alert("Vui lòng nhập tên kích thước!");
      return;
    }

    const sizeData = {
      name: sizeName,
    };

    try {
      const response = await fetch(`${BASE_URL}/admin/sizes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sizeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newSize = await response.json();
      console.log("Thêm mới thành công:", newSize);

      $("#addSizeModal").modal("hide");
      $("#addSizeForm")[0].reset();
      await fetchSizes();
    } catch (error) {
      console.error("Lỗi khi thêm mới:", error);
      alert("Có lỗi xảy ra khi thêm kích thước: " + error.message);
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
    const sizeId = row.find(".status-toggle").data("id");
    const sizeName = row.find("td:eq(1)").text();

    // Điền dữ liệu vào modal
    $("#editSizeId").val(sizeId);
    $("#editSizeName").val(sizeName);

    // Hiển thị modal
    $("#editSizeModal").modal("show");
  });

  // Xử lý khi nhấn nút "Lưu thay đổi" trong modal sửa
  $("#saveEditSizeBtn").on("click", async function () {
    const sizeId = $("#editSizeId").val();
    const sizeName = $("#editSizeName").val().trim();

    if (!sizeName) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng nhập tên kích thước!",
      });
      return;
    }

    const sizeData = {
      id: sizeId,
      name: sizeName,
    };

    try {
      const response = await fetch(`${BASE_URL}/admin/sizes/${sizeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sizeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedSize = await response.json();
      console.log("Cập nhật thành công:", updatedSize);

      // Đóng modal và làm mới bảng
      $("#editSizeModal").modal("hide");
      $("#editSizeForm")[0].reset();
      await fetchSizes();

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật kích thước thành công!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra khi cập nhật kích thước: " + error.message,
      });
    }
  });

  // Hàm cập nhật bảng
  function updateTable() {
    tableBody.empty();

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSizes = sizes.slice(startIndex, endIndex);

    paginatedSizes.forEach((size, index) => {
      const isActive = !size.deletedAt;
      const statusChecked = isActive ? "checked" : "";
      const sizeId = size.id || startIndex + index + 1;
      const row = `
                  <tr>
                      <td class="id-column" data-bs-toggle="tooltip" data-bs-placement="top" title="${sizeId}" data-id="${sizeId}">${sizeId}</td>
                      <td>${size.name || "Không có tên"}</td>
                      <td>
                        <div class="form-check form-switch">
                            <input class="form-check-input status-toggle" type="checkbox" id="switch${sizeId}" ${statusChecked} data-id="${sizeId}">
                            <label class="form-check-label" for="switch${sizeId}"></label>
                        </div>
                      </td>
                      <td>
                          <button class="btn btn-sm btn-primary me-1" title="Sửa">
                            <i class="mdi mdi-pencil"></i>
                          </button>
                          <button class="btn btn-sm btn-danger" title="Xóa">
                              <i class="mdi mdi-trash-can"></i>
                          </button>
                      </td>
                  </tr>
              `;
      tableBody.append(row);
    });

    $('[data-bs-toggle="tooltip"]').tooltip();

    $(".id-column")
      .off("click")
      .on("click", function () {
        const idText = $(this).data("id");
        copyToClipboard(idText, $(this));
      });

    // Xử lý gạt nút trạng thái
    $(".status-toggle")
      .off("change")
      .on("change", async function () {
        const sizeId = $(this).data("id");
        const isChecked = $(this).is(":checked");
        const action = isChecked ? "hiện" : "ẩn";

        if (
          !(
            await Swal.fire({
              title: `Bạn có chắc muốn ${action} Size này?`, // Rút gọn title
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
          const url = `${BASE_URL}/admin/sizes/${sizeId}`;
          const method = isChecked ? "PATCH" : "DELETE";
          const response = await fetch(url, { method });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          console.log(
            `Cập nhật trạng thái ${sizeId} thành công: ${
              isChecked ? "hiện" : "ẩn"
            }`
          );
          await fetchSizes(); // Làm mới bảng
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          alert("Có lỗi xảy ra: " + error.message);
          $(this).prop("checked", !isChecked); // Hoàn tác nếu lỗi
        }
      });

    const showingTo = Math.min(endIndex, sizes.length);
    $("#pageInfo").text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        sizes.length
      } kích thước`
    );

    updatePagination();
  }

  // Hàm cập nhật pagination
  function updatePagination() {
    const totalPages = Math.ceil(sizes.length / pageSize);
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

  fetchSizes();
});
