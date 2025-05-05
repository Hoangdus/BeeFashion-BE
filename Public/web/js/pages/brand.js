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

  const tableBody = $("#brandTableBody");
  let currentPage = 1;
  let pageSize = 10;
  let brands = [];

  // Hàm lấy dữ liệu từ API
  async function fetchBrands() {
    try {
      console.log("Đang gọi API...");
      const response = await fetch(`${BASE_URL}/admin/brands`);
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      brands = await response.json();
      brands.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log("Dữ liệu nhận được:", brands);
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

  async function getBrandByID(brandId) {
    try {
      const response = await fetch(`${BASE_URL}/admin/brands/${brandId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const brand = await response.json();
      return brand;
    } catch (error) {
      console.error("Lỗi khi lấy thương hiệu:", error);
      return "Không xác định";
    }
  }

  $(document).ready(function () {
    console.log("Document ready! jQuery version:", $().jquery);
    console.log("Số nút #addBrandBtn:", $("#addBrandBtn").length);

    $(document).on("click", "#addBrandBtn", function () {
      console.log("Add button clicked!");
      $("#addBrandModal").modal("show");
    });
  });

  // Xử lý khi nhấn nút "Lưu" trong modal
  $("#saveBrandBtn").on("click", async function () {
    const brandName = $("#brandName").val().trim();

    if (!brandName) {
      alert("Vui lòng nhập tên thương hiệu!");
      return;
    }

    const brandData = {
      name: brandName,
    };

    try {
      const response = await fetch(`${BASE_URL}/admin/brands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(brandData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await createLog(null, "add", `Thêm mới thương hiệu: ${brandData.name}`);

      $("#addBrandModal").modal("hide");
      $("#addBrandForm")[0].reset();
      $("#imagePreview").empty();
      await fetchBrands();
    } catch (error) {
      console.error("Lỗi khi thêm mới:", error);
      alert("Có lỗi xảy ra khi thêm thương hiệu: " + error.message);
    }
  });

  async function showBrandDetails(brandId) {
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy sản phẩm!",
      });
      return;
    }

    const brandInfo = await getBrandByID(brandId);

    $("#viewBrandId").text(brandInfo.id || "Không có tên");
    $("#viewBrandName").text(brandInfo.name || "Không có tên");
    $("#viewStatus").text(brandInfo.deletedAt ? "Ẩn" : "Hiển thị");
    $("#viewCreatedAt").text(
      new Date(brandInfo.createdAt).toLocaleString("vi-VN") || "Không xác định"
    );

    $("#viewBrandDetailModal").modal("show");
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
    const paginatedBrands = brands.slice(startIndex, endIndex);

    paginatedBrands.forEach((brand, index) => {
      const isActive = !brand.deletedAt;
      const statusChecked = isActive ? "checked" : "";
      const brandId = brand.id || startIndex + index + 1;
      const row = `
                    <tr>
                        <td class="id-column" data-bs-toggle="tooltip" data-bs-placement="top" title="${brandId}" data-id="${brandId}">${brandId}</td>
                        <td>${brand.name || "Không có tên"}</td>
                        <td>
                          <div class="form-check form-switch">
                              <input class="form-check-input status-toggle" type="checkbox" id="switch${brandId}" ${statusChecked} data-id="${brandId}">
                              <label class="form-check-label" for="switch${brandId}"></label>
                          </div>
                        </td>
                        <td>
                          <button class="btn btn-sm btn-success me-1 view-brand-btn" title="View info" data-id="${brandId}">
                            <i class="mdi mdi-eye"></i>
                          </button>
                        </td>
                    </tr>
                `;
      tableBody.append(row);
    });

    $(document).on("click", ".view-brand-btn", function () {
      const brandId = $(this).data("id");
      showBrandDetails(brandId);
    });

    // Khởi tạo tooltip
    $('[data-bs-toggle="tooltip"]').tooltip();

    $(".id-column").off("click");

    initializeClipboard();

    // Xử lý gạt nút trạng thái
    $(".status-toggle")
      .off("change")
      .on("change", async function () {
        const brandId = $(this).data("id");
        const isChecked = $(this).is(":checked");
        const action = isChecked ? "hiện" : "ẩn";

        if (
          !(
            await Swal.fire({
              title: `Bạn có chắc muốn ${action} Brand này?`,
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
          const url = `${BASE_URL}/admin/brands/${brandId}`;
          const method = isChecked ? "PATCH" : "DELETE";
          const response = await fetch(url, { method });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          console.log(
            `Cập nhật trạng thái ${brandId} thành công: ${
              isChecked ? "hiện" : "ẩn"
            }`
          );

          const brand = brands.find((br) => br.id === brandId);
          const brandName = brand?.name || brandId;

          await createLog(
            null,
            "changeStatus",
            `Thay đổi trạng thái thương hiệu ${brandName} thành: ${action}`
          );

          await fetchBrands(); // Làm mới bảng
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          alert("Có lỗi xảy ra: " + error.message);
          $(this).prop("checked", !isChecked); // Hoàn tác nếu lỗi
        }
      });

    const showingTo = Math.min(endIndex, brands.length);
    $("#pageInfo").text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        brands.length
      } sản phẩm`
    );

    updatePagination();
  }

  // Hàm cập nhật pagination
  function updatePagination() {
    const totalPages = Math.ceil(brands.length / pageSize);
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

  fetchBrands();
});
