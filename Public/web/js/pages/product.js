$(document).ready(function () {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );

  // console.log(user);

  const managerRoleId = "9AC80862-F9B7-44FF-9DE7-4F02DF2F037A";
  let availableSizes = [];
  let isFetchingSizes = false;

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

  const tableBody = $("#productTableBody");
  let currentPage = 1;
  let pageSize = 10;
  let products = [];

  // Hàm lấy dữ liệu từ API
  async function fetchProducts() {
    try {
      console.log("Đang gọi API...");
      const response = await fetch(`${BASE_URL}/admin/products`);
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      products = await response.json();
      console.log("Dữ liệu nhận được:", products);
      updateTable();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      tableBody.html(
        '<tr><td colspan="6">Không thể tải dữ liệu sản phẩm: ' +
          error.message +
          "</td></tr>"
      );
    }
  }

  // Hàm lấy danh sách danh mục từ API
  async function fetchCategories() {
    try {
      const response = await fetch(`${BASE_URL}/categories`);
      if (!response.ok) throw new Error("Không thể lấy danh mục");
      const categories = await response.json();
      const categorySelect = $("#categoryId");
      categorySelect.empty();
      categorySelect.append('<option value="">Chọn danh mục</option>');
      categories.forEach((category) => {
        categorySelect.append(
          `<option value="${category.id}">${category.name}</option>`
        );
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
    }
  }

  // Hàm lấy danh sách brands từ API
  async function fetchBrands() {
    try {
      const response = await fetch(`${BASE_URL}/admin/brands`);
      if (!response.ok) throw new Error("Không thể lấy danh sách thương hiệu");
      const brands = await response.json();
      const brandSelect = $("#detailBrandId");
      brandSelect.empty();
      brandSelect.append('<option value="">Chọn thương hiệu</option>');
      brands.forEach((brand) => {
        brandSelect.append(
          `<option value="${brand.id}">${brand.name}</option>`
        );
      });
    } catch (error) {
      console.error("Lỗi khi lấy brands:", error);
    }
  }

  async function fetchSizes() {
    try {
      const response = await fetch(`${BASE_URL}/admin/sizes`);
      if (!response.ok) throw new Error("Không thể lấy danh sách kích thước");
      availableSizes = await response.json(); // Lưu vào availableSizes
      console.log("Sizes loaded:", availableSizes);
    } catch (error) {
      console.error("Lỗi khi lấy sizes:", error);
      availableSizes = []; // Đặt lại để tránh lỗi tiếp theo
    }
  }

  function populateSizeRow() {
    const sizeSelectOptions = availableSizes
      .map((size) => `<option value="${size.id}">${size.name}</option>`)
      .join("");
    return `
      <tr>
        <td>
          <select class="form-select size-select" required>
            <option value="">Chọn kích thước</option>
            ${sizeSelectOptions}
          </select>
        </td>
        <td>
          <input type="number" class="form-control quantity-input" min="0" required />
        </td>
        <td>
          <button type="button" class="btn btn-danger btn-sm remove-size-btn">
            <i class="mdi mdi-delete"></i>
          </button>
        </td>
      </tr>
    `;
  }

  // Hiển thị modal và lấy danh mục khi nhấn nút "Thêm mới"
  $(document).on("click", "#addProductBtn", function () {
    // console.log("Add button clicked!");
    fetchCategories(); // Lấy danh mục khi mở modal
    // fetchBrands(); // Lấy brands khi mở modal
    $("#addProductModal").modal("show");
    // console.log("Add Product Modal called!");
  });

  $("#productImage").on("change", function (e) {
    const file = e.target.files[0];
    const previewContainer = $("#imagePreview");
    previewContainer.empty();
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = $(
          `<img src="${event.target.result}" alt="Preview" style="width: 100px; height: 100px; object-fit: cover; margin: 5px;">`
        );
        previewContainer.append(img);
      };
      reader.readAsDataURL(file);
    }
  });

  $("#detailImages").on("change", function (e) {
    const files = e.target.files;
    const previewContainer = $("#detailImagePreview");
    previewContainer.empty();
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (event) {
          const img = $(
            `<img src="${event.target.result}" alt="Preview" style="width: 100px; height: 100px; object-fit: cover; margin: 5px;">`
          );
          previewContainer.append(img);
        };
        reader.readAsDataURL(file);
      });
    }
  });

  $("#addSizeBtn").on("click", function () {
    $("#sizesTableBody").append(populateSizeRow());
  });

  $(document).on("click", ".remove-size-btn", function () {
    $(this).closest("tr").remove();
  });

  // Xử lý khi nhấn nút "Lưu" trong modal
  $("#saveProductBtn").on("click", async function () {
    const productName = $("#productName").val();
    // const productPrice = parseFloat($("#productPrice").val());
    const categoryId = $("#categoryId").val();
    const productImage = $("#productImage")[0].files[0];
    // const brandId = $("#brandId").val();
    const managerId = user.id;
    // const normalizedName = "";

    if (!productName) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }
    // if (isNaN(productPrice) || productPrice < 0) {
    //   alert("Vui lòng nhập giá sản phẩm hợp lệ!");
    //   return;
    // }
    if (!managerId) {
      alert("Lỗi khi gán Id tài khoản hiện tại!");
      return;
    }
    if (!categoryId) {
      alert("Vui lòng chọn danh mục!");
      return;
    }
    if (!productImage) {
      alert("Vui lòng chọn ảnh sản phẩm!");
      return;
    }
    // if (!brandId) {
    //   alert("Vui lòng chọn thương hiệu!");
    //   return;
    // }

    const formData = new FormData();
    formData.append("name", productName);
    // formData.append("price", productPrice);
    formData.append("categoryId", categoryId);
    formData.append("image", productImage);
    formData.append("normalizedName", "");
    formData.append("managerID", managerId);

    try {
      const response = await fetch(`${BASE_URL}/admin/products`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newProduct = await response.json();
      const productId = newProduct.id;

      await Swal.fire({
        icon: "info",
        title: "Thông báo",
        text: "Vui lòng hoàn tất thông tin chi tiết sản phẩm!",
        timer: 2000,
        showConfirmButton: false,
      });

      $("#productId").val(productId);
      // $("#detailBrandId").val(brandId);
      fetchBrands();
      fetchSizes();
      $("#sizesTableBody").empty();
      // $("#sizesTableBody").append(populateSizeRow());
      if (availableSizes.length > 0) {
        $("#sizesTableBody").append(populateSizeRow());
      }
      $("#addProductDetailModal").modal("show");
      // await fetchProducts();
    } catch (error) {
      console.error("Lỗi khi thêm mới:", error);
      alert("Có lỗi xảy ra khi thêm sản phẩm: " + error.message);
    }
  });

  $("#saveProductDetailBtn").on("click", async function () {
    const productId = $("#productId").val();
    const brandId = $("#detailBrandId").val();
    const price = parseInt($("#productPrice").val());
    const description = $("#description").val().trim();
    // const color = $("#color").val().trim();
    const images = $("#detailImages")[0].files;

    // Thu thập sizeIds và quantities từ bảng
    const sizeRows = $("#sizesTableBody tr");
    const sizeIds = [];
    const quantities = [];

    sizeRows.each(function () {
      const sizeId = $(this).find(".size-select").val();
      const quantity = parseInt($(this).find(".quantity-input").val());
      if (sizeId && !isNaN(quantity) && quantity >= 0 && sizeId !== "") {
        sizeIds.push(sizeId);
        quantities.push(quantity);
      }
    });

    if (!productId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "ID sản phẩm không hợp lệ!",
      });
      return;
    }
    if (!brandId) {
      Swal.fire({
        icon: "warning",
        title: "Lỗi",
        text: "Vui lòng chọn thương hiệu!",
      });
      return;
    }
    if (isNaN(price) || price < 0) {
      Swal.fire({
        icon: "warning",
        title: "Lỗi",
        text: "Vui lòng nhập giá sản phẩm hợp lệ!",
      });
      return;
    }
    if (sizeIds.length === 0 || quantities.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Lỗi",
        text: "Vui lòng thêm ít nhất một kích thước và số lượng hợp lệ!",
      });
      return;
    }
    if (sizeIds.length !== quantities.length) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Số lượng kích thước và số lượng không khớp!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("brandId", brandId);
    formData.append("price", price);
    // formData.append("quantities", JSON.stringify(quantities));
    formData.append("description", description);
    formData.append("color", "");
    // formData.append("sizeIds", JSON.stringify(sizeIds));
    sizeIds.forEach((id, index) => {
      formData.append(`sizeIds[${index}]`, id);
    });
    quantities.forEach((qty, index) => {
      formData.append(`quantities[${index}]`, qty);
    });
    Array.from(images).forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });

    try {
      const response = await fetch(`${BASE_URL}/admin/productdetails`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.reason || "Không có chi tiết lỗi"}`;
        } catch (e) {
          // Không parse được JSON
        }
        throw new Error(errorMessage);
      }
      console.log("Thêm chi tiết sản phẩm thành công");

      // Đóng cả hai modal
      $("#addProductDetailModal").modal("hide");
      $("#addProductModal").modal("hide");
      $("#addProductForm")[0].reset();
      $("#addProductDetailForm")[0].reset();
      $("#imagePreview").empty();
      $("#detailImagePreview").empty();
      await fetchProducts();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Thêm sản phẩm và chi tiết thành công!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Lỗi khi thêm chi tiết sản phẩm:", error);
      alert("Có lỗi xảy ra khi thêm chi tiết sản phẩm: " + error.message);
    }
  });

  // Cập nhật số lượng hiển thị khi thay đổi select
  $("#pageSizeSelect").on("change", function () {
    pageSize = parseInt($(this).val());
    currentPage = 1;
    updateTable();
  });

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

  // Hàm cập nhật bảng
  function updateTable() {
    tableBody.empty();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);
    console.log(
      "Số sản phẩm trong paginatedProducts:",
      paginatedProducts.length
    );

    paginatedProducts.forEach((product, index) => {
      try {
        const isActive = !product.deletedAt;
        const statusChecked = isActive ? "checked" : "";
        const imageUrl = product.image || "https://via.placeholder.com/50";
        const productId = product.id || startIndex + index + 1;
        const row = `
              <tr>
                <td class="id-column" data-bs-toggle="tooltip" data-bs-placement="top" title="${productId}" data-id="${productId}">${productId}</td>
                <td><img src="${imageUrl}" alt="${
          product.name || "Sản phẩm"
        }" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td>${product.name || "Không có tên"}</td>
                <td>${formatPrice(product.price)}</td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input status-toggle" type="checkbox" id="switch${productId}" ${statusChecked} data-id="${productId}">
                        <label class="form-check-label" for="switch${productId}"></label>
                    </div>
                </td>
                <td>
                  <button class="btn btn-sm btn-primary me-1 edit-product-btn" title="Update" data-id="${productId}">
                    <i class="mdi mdi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-success" title="View info">
                    <i class="mdi mdi-eye"></i>
                  </button>
                </td>
              </tr>
            `;
        tableBody.append(row);
      } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", product.id, error);
      }
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

    // Thêm sự kiện cho nút "Chỉnh sửa"
    $(".edit-product-btn")
      .off("click")
      .on("click", function () {
        const productId = $(this).data("id");
        window.location.href = `edit-product.html?id=${productId}`;
      });

    // Xử lý gạt nút trạng thái
    $(".status-toggle")
      .off("change")
      .on("change", async function () {
        const productId = $(this).data("id");
        const isChecked = $(this).is(":checked");
        const action = isChecked ? "hiện" : "ẩn";

        if (
          !(
            await Swal.fire({
              title: `Bạn có chắc muốn ${action} sản phẩm này?`, // Rút gọn title
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
          const url = `${BASE_URL}/admin/products/${productId}`;
          const method = isChecked ? "PATCH" : "DELETE";
          const response = await fetch(url, { method });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          console.log(
            `Cập nhật trạng thái ${productId} thành công: ${
              isChecked ? "hiện" : "ẩn"
            }`
          );
          await fetchProducts(); // Làm mới bảng
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          alert("Có lỗi xảy ra: " + error.message);
          $(this).prop("checked", !isChecked); // Hoàn tác nếu lỗi
        }
      });

    const showingTo = Math.min(endIndex, products.length);
    $("#pageInfo").text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        products.length
      } sản phẩm`
    );

    updatePagination();
  }

  // Hàm cập nhật pagination
  function updatePagination() {
    const totalPages = Math.ceil(products.length / pageSize);
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

  fetchProducts();
});
