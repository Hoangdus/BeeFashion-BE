$(document).ready(function () {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  const managerRoleId = "9AC80862-F9B7-44FF-9DE7-4F02DF2F037A";
  let availableSizes = [];

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
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  // Hàm lấy chi tiết sản phẩm từ API productdetails
  async function fetchProductDetails(productId) {
    try {
      const response = await fetch(
        `${BASE_URL}/productdetails/getByProductID/${productId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải chi tiết sản phẩm: " + error.message,
      });
      return null;
    }
  }

  // Hàm lấy tên danh mục
  async function fetchCategoryName(categoryId) {
    try {
      const response = await fetch(
        `${BASE_URL}/admin/categories/${categoryId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const category = await response.json();
      return category.name || "Không xác định";
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      return "Không xác định";
    }
  }

  // Hàm lấy tên thương hiệu
  async function fetchBrandName(brandId) {
    try {
      const response = await fetch(`${BASE_URL}/admin/brands/${brandId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const brand = await response.json();
      return brand.name || "Không xác định";
    } catch (error) {
      console.error("Lỗi khi lấy thương hiệu:", error);
      return "Không xác định";
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
    fetchCategories();
    $("#addProductModal").modal("show");
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

  // Hàm hiển thị chi tiết sản phẩm trong modal
  async function showProductDetails(productId) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy sản phẩm!",
      });
      return;
    }

    // Lấy chi tiết sản phẩm
    const details = await fetchProductDetails(productId);

    // Lấy tên danh mục
    const categoryName = await fetchCategoryName(product.categoryId);

    // Lấy tên thương hiệu (nếu có chi tiết sản phẩm)
    const brandName = details
      ? await fetchBrandName(details.brandId)
      : "Không xác định";

    // Điền thông tin vào modal
    $("#viewProductId").text(product.id);
    $("#viewProductName").text(product.name || "Không có tên");
    $("#viewCategory").text(categoryName);
    $("#viewBrand").text(brandName);
    $("#viewPrice").text(details ? formatPrice(details.price) : "Chưa có giá");
    $("#viewStatus").text(product.deletedAt ? "Ẩn" : "Hiển thị");
    $("#viewDescription").text(details?.description || "Không có mô tả");
    $("#viewManager").text(product.manager?.name || "Không xác định");
    $("#viewCreatedAt").text(
      new Date(product.createdAt).toLocaleString("vi-VN") || "Không xác định"
    );

    // Hiển thị ảnh
    const imageContainer = $("#viewProductImages");
    imageContainer.empty();

    // Ảnh chính
    if (product.image) {
      imageContainer.append(
        `<img src="${product.image}" alt="Main Image" style="width: 100px; height: 100px; object-fit: cover; margin: 5px;">`
      );
    }

    // Ảnh chi tiết
    if (details?.images && details.images.length > 0) {
      details.images.forEach((img) => {
        imageContainer.append(
          `<img src="${img}" alt="Detail Image" style="width: 100px; height: 100px; object-fit: cover; margin: 5px;">`
        );
      });
    }

    // Hiển thị kích thước và số lượng
    const sizesTable = $("#viewSizesTable");
    sizesTable.empty();
    if (details?.sizes && details.sizes.length > 0 && details.quantities) {
      details.sizes.forEach((size, index) => {
        const quantity = details.quantities[index] || 0;
        sizesTable.append(`
              <tr>
                  <td>${size.name || "Không xác định"}</td>
                  <td>${quantity}</td>
              </tr>
          `);
      });
    } else {
      sizesTable.append(`
          <tr>
              <td colspan="2">Không có thông tin kích thước</td>
          </tr>
      `);
    }

    // Hiển thị modal
    $("#viewProductDetailModal").modal("show");
  }

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
                  <button class="btn btn-sm btn-success me-1 view-product-btn" title="View info" data-id="${productId}">
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

    // Thêm sự kiện cho nút View (ngoài vòng lặp forEach)
    $(document).on("click", ".view-product-btn", function () {
      const productId = $(this).data("id");
      showProductDetails(productId);
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
              title: `Bạn có chắc muốn ${action} sản phẩm này?`,
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
          await fetchProducts();
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
