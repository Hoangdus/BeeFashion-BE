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
      sizes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  async function fetchSizeByID(sizeId) {
    try {
      const response = await fetch(`${BASE_URL}/admin/sizes/${sizeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const size = await response.json();
      return size;
    } catch (error) {
      console.error("Lỗi khi lấy sizes:", error);
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

      await createLog(null, "add", `Thêm mới kích thước: ${newSize.name}`);

      $("#addSizeModal").modal("hide");
      $("#addSizeForm")[0].reset();
      await fetchSizes();
    } catch (error) {
      console.error("Lỗi khi thêm mới:", error);
      alert("Có lỗi xảy ra khi thêm kích thước: " + error.message);
    }
  });

  async function showSizeDetails(sizeId) {
    const size = sizes.find((size) => size.id === sizeId);
    if (!size) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy size!",
      });
      return;
    }

    const sizeInfo = await fetchSizeByID(sizeId);

    $("#viewSizeId").text(sizeInfo.id);
    $("#viewSizeName").text(sizeInfo.name);
    $("#viewCreatedAt").text(
      new Date(sizeInfo.createdAt).toLocaleString("vi-VN") || "Không xác định"
    );
    $("#viewStatus").text(sizeInfo.deletedAt ? "Ẩn" : "Hiển thị");
    $("#viewSizeDetailModal").modal("show");
  }

  // Cập nhật số lượng hiển thị khi thay đổi select
  $("#pageSizeSelect").on("change", function () {
    pageSize = parseInt($(this).val());
    currentPage = 1;
    updateTable();
  });

  // Hàm khởi tạo Clipboard.js
  function initializeClipboard() {
    new ClipboardJS(".id-column", {
      text: function (trigger) {
        const idText = $(trigger).data("id");
        if (!idText) {
          console.error("Không có ID để sao chép");
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không có ID để sao chép",
            timer: 1500,
            showConfirmButton: false,
          });
          return "";
        }
        return idText.toString(); // Đảm bảo là chuỗi
      },
    })
      .on("success", function (e) {
        // Hiển thị phản hồi "Đã sao chép!"
        const element = $(e.trigger);
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
        e.clearSelection(); // Xóa vùng chọn
      })
      .on("error", function (e) {
        console.error("Lỗi khi sao chép:", e);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể sao chép nội dung",
          timer: 1500,
          showConfirmButton: false,
        });
      });
  }

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
                        <button class="btn btn-sm btn-success me-1 view-size-btn" title="View info" data-id="${sizeId}">
                          <i class="mdi mdi-eye"></i>
                        </button>
                      </td>
                  </tr>
              `;
      tableBody.append(row);
    });

    // Thêm sự kiện cho nút View (ngoài vòng lặp forEach)
    $(document).on("click", ".view-size-btn", function () {
      const sizeId = $(this).data("id");
      showSizeDetails(sizeId);
    });

    $('[data-bs-toggle="tooltip"]').tooltip();

    $(".id-column").off("click");

    initializeClipboard();

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
              title: `Bạn có chắc muốn ${action} Size này?`,
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

          const size = sizes.find((sz) => sz.id === sizeId);
          const sizeName = size?.name || sizeId;

          await createLog(
            null,
            "changeStatus",
            `Thay đổi trạng thái size "${sizeName}" thành: ${action}`
          );
          await fetchSizes();
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          alert("Có lỗi xảy ra: " + error.message);
          $(this).prop("checked", !isChecked);
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
