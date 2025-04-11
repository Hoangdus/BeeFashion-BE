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
  } else {
    $("#accountManagerTab").show();
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

      // Lấy chi tiết sản phẩm và lọc theo managerId
      const productDetailsPromises = allProducts.map(async (product) => {
        const detailResponse = await fetch(
          `${BASE_URL}/productdetails/getByProductID/${product.id}`
        );
        if (!detailResponse.ok) {
          console.error(`Lỗi khi lấy chi tiết sản phẩm ${product.id}`);
          return null;
        }
        const detail = await detailResponse.json();
        return { ...product, detail };
      });

      const productsWithDetails = (
        await Promise.all(productDetailsPromises)
      ).filter(Boolean);
      products = productsWithDetails
        .filter((product) => product.detail.managerId === currentUserId)
        .map((product) => ({
          id: product.id,
          name: product.name,
          image: product.image,
          createdAt: product.createdAt,
          deletedAt: product.deletedAt,
        }));

      console.log("Danh sách sản phẩm đã lọc:", products);
      $("#productCount").text(products.length); // Cập nhật số lượng sản phẩm

      updateTable();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      tableBody.html(
        `<tr><td colspan="6">Không thể tải dữ liệu sản phẩm: ${error.message}</td></tr>`
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

  // Hiển thị modal và lấy danh mục khi nhấn nút "Thêm mới"
  $("#addProductBtn").on("click", function () {
    console.log("Add button clicked!");
    fetchCategories();
    fetchBrands();
    $("#addProductModal").modal("show");
  });

  // Preview ảnh khi chọn file
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

  // Xử lý khi nhấn nút "Lưu" trong modal
  $("#saveProductBtn").on("click", async function () {
    const productName = $("#productName").val().trim();
    const categoryId = $("#categoryId").val();
    const productImage = $("#productImage")[0].files[0];
    const brandId = $("#brandId").val();

    if (!productName) return alert("Vui lòng nhập tên sản phẩm!");
    if (!categoryId) return alert("Vui lòng chọn danh mục!");
    if (!productImage) return alert("Vui lòng chọn ảnh sản phẩm!");
    if (!brandId) return alert("Vui lòng chọn thương hiệu!");

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("categoryId", categoryId);
    formData.append("image", productImage);
    formData.append("isFavByCurrentUser", "false");

    try {
      const response = await fetch(`${BASE_URL}/admin/products`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const newProduct = await response.json();
      const productId = newProduct.id;

      const productDetailData = {
        productId: productId,
        price: 0,
        quantities: [],
        description: "",
        brandId: brandId,
        images: [],
        color: "",
        managerId: currentUserId,
      };

      const productDetailResponse = await fetch(`${BASE_URL}/productdetails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productDetailData),
      });
      if (!productDetailResponse.ok)
        throw new Error(`HTTP error! status: ${productDetailResponse.status}`);

      $("#addProductModal").modal("hide");
      $("#addProductForm")[0].reset();
      $("#imagePreview").empty();
      await fetchProducts();
    } catch (error) {
      console.error("Lỗi khi thêm mới:", error);
      alert("Có lỗi xảy ra khi thêm sản phẩm: " + error.message);
    }
  });

  // Cập nhật số lượng hiển thị khi thay đổi select
  pageSizeSelect.on("change", function () {
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
            <td>
              <div class="form-check form-switch">
                <input class="form-check-input status-toggle" type="checkbox" id="switch${productId}" ${statusChecked} data-id="${productId}">
                <label class="form-check-label" for="switch${productId}"></label>
              </div>
            </td>
            <td>${product.createdAt || "N/A"}</td>
            <td>
              <button class="btn btn-sm btn-primary me-1 edit-product-btn" title="Sửa" data-id="${productId}">
                <i class="mdi mdi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-btn" title="Xóa" data-id="${productId}">
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
