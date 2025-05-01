$(document).ready(function () {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );

  console.log(BASE_URL);

  const adminRoleId = "748D8888-4088-440D-BA90-AFEA1D31B3E8";
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

  // Hàm định dạng giá tiền (tham khảo từ product.js)
  function formatPrice(price) {
    if (!price) return "0 VNĐ";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ";
  }

  // Hiển thị thông tin người dùng
  const userName = user.name;
  const userEmail = user.email;
  const userPhone = user.phone;
  console.log(user);
  const userRole = user.role_id === adminRoleId ? "Admin" : "Manager";
  const currentUserId = user.id || "";

  $("#userName").text(userName);
  $("#userEmail").text(userEmail);
  $("#userPhone").text(userPhone);
  $("#userRole").text(userRole);
  $("#userRole").addClass(
    user.role_id === adminRoleId ? "text-success" : "text-danger"
  );

  const tableBody = $("#productTableBody");
  const pageSizeSelect = $("#pageSizeSelect");
  const pageInfo = $("#pageInfo");
  const pagination = $("#pagination");
  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect.val());
  let products = [];

  // Hàm lấy dữ liệu từ API
  async function fetchProducts() {
    try {
      console.log("Đang gọi API...");
      const response = await fetch(`${BASE_URL}/admin/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allProducts = await response.json();
      console.log("Danh sách sản phẩm thô:", allProducts);

      // Lấy chi tiết sản phẩm và lọc theo manager.id
      const productDetailsPromises = allProducts.map(async (product) => {
        const detail = await fetchProductDetails(product.id);
        return {
          ...product,
          detail: detail || {}, // Lưu chi tiết sản phẩm (hoặc object rỗng nếu lỗi)
        };
      });

      const productsWithDetails = (
        await Promise.all(productDetailsPromises)
      ).filter(Boolean);
      products = productsWithDetails
        .filter((product) => product.manager.id === currentUserId) // Lọc theo manager.id
        .map((product) => ({
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.detail?.price || 0,
          createdAt: product.createdAt,
          deletedAt: product.deletedAt,
          categoryId: product.categoryId, // Thêm categoryId
          manager: product.manager, // Thêm manager để hiển thị Người tạo
        }));

      console.log("Danh sách sản phẩm đã lọc:", products);
      $("#productCount").text(products.length); // Cập nhật số lượng sản phẩm

      updateTable();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      tableBody.html(
        `<tr><td colspan="7">Không thể tải dữ liệu sản phẩm: ${error.message}</td></tr>`
      );
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
      console.error(`Lỗi khi lấy chi tiết sản phẩm ${productId}:`, error);
      return null;
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

  // Hàm lấy danh sách brands từ API
  async function fetchBrands() {
    try {
      const response = await fetch(`${BASE_URL}/brands`);
      if (!response.ok) throw new Error("Không thể lấy danh sách thương hiệu");
      const brands = await response.json();
      const brandSelect = $("#brandId");
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

  // Cập nhật số lượng hiển thị khi thay đổi select
  pageSizeSelect.on("change", function () {
    pageSize = parseInt($(this).val());
    currentPage = 1;
    updateTable();
  });

  // Hàm hiển thị chi tiết sản phẩm trong modal
  async function showProductDetails(productId) {
    const product = products.find((p) => p.id === productId);
    console.log(`${product}`);
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

    paginatedProducts.forEach((product, index) => {
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
          <td>${formatPrice(product.price)}</td> <!-- Hiển thị giá -->
          <td>
            <div class="form-check form-switch">
              <input class="form-check-input status-toggle" type="checkbox" id="switch${productId}" ${statusChecked} data-id="${productId}">
              <label class="form-check-label" for="switch${productId}"></label>
            </div>
          </td>
          <td>${
            new Date(product.createdAt).toLocaleString("vi-VN") ||
            "Không xác định"
          }</td>
          <td>
            <button class="btn btn-sm btn-success me-1 view-product-btn" title="View info" data-id="${productId}">
              <i class="mdi mdi-eye"></i>
            </button>
          </td>
        </tr>
      `;
      tableBody.append(row);
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
        const idText = $(this).data("id");
        copyToClipboard(idText, $(this));
      });

    // Thêm sự kiện cho nút "Chỉnh sửa"
    $(".edit-product-btn")
      .off("click")
      .on("click", function () {
        const productId = $(this).data("id");
        window.location.href = `edit-product.html?id=${productId}`;
      });

    // Thêm sự kiện cho nút "Xóa"
    $(".delete-btn")
      .off("click")
      .on("click", async function () {
        const productId = $(this).data("id");
        const result = await Swal.fire({
          title: "Bạn có chắc muốn xóa sản phẩm này?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Xóa",
          cancelButtonText: "Hủy",
        });
        if (result.isConfirmed) {
          try {
            const response = await fetch(
              `${BASE_URL}/admin/products/${productId}`,
              { method: "DELETE" }
            );
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            Swal.fire("Đã xóa!", "Sản phẩm đã được xóa thành công.", "success");
            fetchProducts();
          } catch (error) {
            Swal.fire(
              "Lỗi!",
              "Không thể xóa sản phẩm: " + error.message,
              "error"
            );
          }
        }
      });

    // Xử lý gạt nút trạng thái
    $(".status-toggle")
      .off("change")
      .on("change", async function () {
        const productId = $(this).data("id");
        const isChecked = $(this).is(":checked");
        const action = isChecked ? "hiện" : "ẩn";
        const result = await Swal.fire({
          title: `Bạn có chắc muốn ${action} sản phẩm này?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "OK",
          cancelButtonText: "Hủy",
        });
        if (!result.isConfirmed) {
          $(this).prop("checked", !isChecked);
          return;
        }
        try {
          const method = isChecked ? "PATCH" : "DELETE";
          const response = await fetch(
            `${BASE_URL}/admin/products/${productId}`,
            { method }
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          fetchProducts();
        } catch (error) {
          Swal.fire(
            "Lỗi!",
            "Không thể cập nhật trạng thái: " + error.message,
            "error"
          );
          $(this).prop("checked", !isChecked);
        }
      });

    const showingTo = Math.min(endIndex, products.length);
    pageInfo.text(
      `Hiển thị ${startIndex + 1} đến ${showingTo} trong ${
        products.length
      } sản phẩm`
    );
    updatePagination();
  }

  // Hàm cập nhật pagination
  function updatePagination() {
    const totalPages = Math.ceil(products.length / pageSize);
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

  fetchProducts();
});
