$(document).ready(function () {
  console.log("URL Search:", window.location.search);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  console.log("productId:", productId);

  if (!productId) {
    alert("Không tìm thấy ID sản phẩm!");
    window.location.href = "product.html";
    return;
  }

  $("#productIdHidden").val(productId);

  let originalProduct = null;
  let originalProductDetail = null;
  let allSizes = [];
  let currentImages = []; // Lưu danh sách ảnh hiện tại (tối đa 3)

  // Ngăn form submit
  $("#editProductForm").on("submit", function (e) {
    e.preventDefault();
  });

  async function fetchCategories() {
    try {
      const response = await fetch("http://127.0.0.1:8080/categories");
      if (!response.ok) throw new Error("Không thể lấy danh mục");
      const categories = await response.json();
      const categorySelect = $("#editCategoryId");
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

  async function fetchBrands() {
    try {
      const response = await fetch("http://127.0.0.1:8080/brands");
      if (!response.ok) throw new Error("Không thể lấy thương hiệu");
      const brands = await response.json();
      const brandSelect = $("#editBrandId");
      brandSelect.empty();
      brandSelect.append('<option value="">Chọn thương hiệu</option>');
      brands.forEach((brand) => {
        brandSelect.append(
          `<option value="${brand.id}">${brand.name}</option>`
        );
      });
    } catch (error) {
      console.error("Lỗi khi lấy thương hiệu:", error);
    }
  }

  async function fetchSizes() {
    try {
      const response = await fetch("http://127.0.0.1:8080/admin/sizes");
      if (!response.ok) throw new Error("Không thể lấy kích thước");
      allSizes = await response.json();
      return allSizes;
    } catch (error) {
      console.error("Lỗi khi lấy kích thước:", error);
      return [];
    }
  }

  async function loadProduct() {
    if (!productId) return;
    try {
      const productResponse = await fetch(
        `http://127.0.0.1:8080/admin/products`
      );
      if (!productResponse.ok)
        throw new Error(`Không thể tải danh sách sản phẩm`);
      const products = await productResponse.json();
      originalProduct = products.find((p) => p.id === productId);
      if (!originalProduct)
        throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);

      try {
        const detailResponse = await fetch(
          `http://127.0.0.1:8080/productdetails/getByProductID/${productId}`
        );
        if (detailResponse.ok) {
          originalProductDetail = await detailResponse.json();
          console.log("ProductDetail loaded:", originalProductDetail);
          currentImages = originalProductDetail.images.slice(0, 3); // Lấy tối đa 3 ảnh
        } else {
          console.warn("Không có chi tiết sản phẩm cho ID: " + productId);
          originalProductDetail = { id: null };
          currentImages = originalProduct.image ? [originalProduct.image] : [];
        }
      } catch (error) {
        console.error("Không có chi tiết sản phẩm:", error.message);
        originalProductDetail = { id: null };
        currentImages = originalProduct.image ? [originalProduct.image] : [];
      }

      $("#editProductName").val(originalProduct.name || "");
      $("#editCategoryId").val(originalProduct.categoryId || "");
      $("#editProductPrice").val(
        originalProductDetail?.price || originalProduct.price || ""
      );
      $("#editBrandId").val(originalProductDetail?.brandId || "");
      $("#editDescription").val(originalProductDetail?.description || "");

      const sizesTableBody = $("#sizesTableBody");
      sizesTableBody.empty();
      const existingSizes = originalProductDetail?.sizes || [];
      const existingQuantities = originalProductDetail?.quantities || [];

      if (existingSizes.length > 0) {
        existingSizes.forEach((size, index) => {
          const quantity = existingQuantities[index] || 0;
          sizesTableBody.append(`
            <tr data-size-id="${size.id}">
              <td>${size.name}</td>
              <td><input type="number" class="form-control quantity-input" data-size-id="${size.id}" value="${quantity}" min="0" /></td>
              <td><button class="btn btn-danger btn-sm remove-size-btn" data-size-id="${size.id}">Xóa</button></td>
            </tr>
          `);
        });
      } else {
        sizesTableBody.append(
          '<tr><td colspan="3">Chưa có kích thước</td></tr>'
        );
      }

      await fetchSizes();
      renderImageSlider();
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error.message);
      alert(`Có lỗi xảy ra: ${error.message}`);
      window.location.href = "product.html";
    }
  }

  function renderImageSlider() {
    const imageSlider = $("#imageSlider");
    imageSlider.empty();
    if (currentImages.length > 0) {
      currentImages.forEach((imgUrl, index) => {
        imageSlider.append(`
          <div class="image-slide" data-index="${index}">
            <img src="${imgUrl}" alt="Product Image" />
          </div>
        `);
      });
      imageSlider.slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        dots: true,
        infinite: true,
        autoplay: false,
      });
    } else {
      imageSlider.append("<div><p>Chưa có ảnh</p></div>");
    }
  }

  $("#addSizeBtn").on("click", function () {
    const sizesTableBody = $("#sizesTableBody");
    const addedSizeIds = sizesTableBody
      .find("tr")
      .map((_, row) => $(row).data("size-id"))
      .get();
    const availableSizes = allSizes.filter(
      (size) => !addedSizeIds.includes(size.id)
    );

    if (availableSizes.length === 0) {
      alert("Đã thêm tất cả kích thước có sẵn!");
      return;
    }

    const select = $('<select class="form-select temp-size-select"></select>');
    select.append('<option value="">Chọn kích thước</option>');
    availableSizes.forEach((size) => {
      select.append(`<option value="${size.id}">${size.name}</option>`);
    });

    const modal = $(`
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Thêm kích thước</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary add-size-confirm">Thêm</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
            </div>
          </div>
        </div>
      </div>
    `);
    modal.find(".modal-body").append(select);
    modal.modal("show");

    modal.find(".add-size-confirm").on("click", function () {
      const selectedSizeId = select.val();
      if (!selectedSizeId) {
        alert("Vui lòng chọn một kích thước!");
        return;
      }

      const selectedSize = allSizes.find((size) => size.id === selectedSizeId);
      if (sizesTableBody.find("tr td[colspan='3']").length > 0) {
        sizesTableBody.empty();
      }
      sizesTableBody.append(`
        <tr data-size-id="${selectedSize.id}">
          <td>${selectedSize.name}</td>
          <td><input type="number" class="form-control quantity-input" data-size-id="${selectedSize.id}" value="0" min="0" /></td>
          <td><button class="btn btn-danger btn-sm remove-size-btn" data-size-id="${selectedSize.id}">Xóa</button></td>
        </tr>
      `);
      modal.modal("hide");
    });
  });

  $(document).on("click", ".remove-size-btn", function () {
    const sizeId = $(this).data("size-id");
    const row = $(this).closest("tr");
    row.remove();
    const remainingRows = $("#sizesTableBody tr").length;
    if (remainingRows === 0) {
      $("#sizesTableBody").append(
        '<tr><td colspan="3">Chưa có kích thước</td></tr>'
      );
    }
  });

  $("#updateImagesBtn").on("click", function () {
    $("#editProductImages").click();
  });

  $("#editProductImages").on("change", function (e) {
    e.preventDefault();
    const files = e.target.files;
    if (files.length !== 3) {
      alert("Vui lòng chọn đúng 3 ảnh!");
      e.target.value = ""; // Xóa lựa chọn không hợp lệ
      return;
    }

    const imageSlider = $("#imageSlider");
    currentImages = []; // Xóa ảnh cũ, chuẩn bị cho 3 ảnh mới

    const readers = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      readers.push(
        new Promise((resolve) => {
          reader.onload = function (event) {
            resolve(event.target.result);
          };
          reader.readAsDataURL(file);
        })
      );
    }

    Promise.all(readers).then((imageSources) => {
      currentImages = imageSources;
      imageSlider.slick("unslick"); // Hủy slick cũ
      imageSlider.empty();
      currentImages.forEach((imgSrc, index) => {
        imageSlider.append(`
          <div class="image-slide" data-index="${index}">
            <img src="${imgSrc}" alt="Product Image" />
          </div>
        `);
      });
      imageSlider.slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        dots: true,
        infinite: true,
        autoplay: false,
      });
    });
    e.target.value = ""; // Reset input sau khi xử lý
  });

  $("#saveEditProductBtn").on("click", async function () {
    const productName = $("#editProductName").val().trim();
    const productPrice = parseInt($("#editProductPrice").val());
    const categoryId = $("#editCategoryId").val();
    const brandId = $("#editBrandId").val();
    const description = $("#editDescription").val();

    const sizeQuantities = $(".quantity-input")
      .map((_, el) => ({
        sizeId: $(el).data("size-id"),
        quantity: parseInt($(el).val()) || 0,
      }))
      .get();
    const sizes = sizeQuantities.map((sq) => sq.sizeId);
    const quantities = sizeQuantities.map((sq) => sq.quantity);

    console.log("Dữ liệu thu thập:", {
      productName,
      productPrice,
      categoryId,
      brandId,
      description,
      sizes,
      quantities,
      images: currentImages,
    });

    const hasChanges =
      (productName && productName !== originalProduct.name) ||
      (categoryId && categoryId !== originalProduct.categoryId) ||
      (!isNaN(productPrice) &&
        productPrice !==
          (originalProductDetail?.price || originalProduct.price)) ||
      (brandId && brandId !== originalProductDetail?.brandId) ||
      (description && description !== originalProductDetail?.description) ||
      JSON.stringify(sizes) !==
        JSON.stringify(originalProductDetail?.sizeIds) ||
      (quantities.length > 0 &&
        JSON.stringify(quantities) !==
          JSON.stringify(originalProductDetail?.quantities)) ||
      JSON.stringify(currentImages) !==
        JSON.stringify(
          originalProductDetail?.images ||
            (originalProduct.image ? [originalProduct.image] : [])
        );

    if (!hasChanges) {
      alert("Không có thay đổi nào để lưu!");
      return;
    }

    const productFormData = new FormData();
    if (productName && productName !== originalProduct.name) {
      productFormData.append("name", productName);
    }
    if (categoryId && categoryId !== originalProduct.categoryId) {
      productFormData.append("categoryId", categoryId);
    }

    const detailFormData = new FormData();
    if (
      !isNaN(productPrice) &&
      productPrice !== (originalProductDetail?.price || originalProduct.price)
    ) {
      detailFormData.append("price", productPrice);
    }
    if (brandId && brandId !== originalProductDetail?.brandId) {
      detailFormData.append("brandId", brandId);
    }
    if (description && description !== originalProductDetail?.description) {
      detailFormData.append("description", description);
    }
    sizes.forEach((sizeId) => {
      detailFormData.append("sizeIds[]", sizeId);
    });
    if (
      quantities.length > 0 &&
      JSON.stringify(quantities) !==
        JSON.stringify(originalProductDetail?.quantities)
    ) {
      quantities.forEach((quantity) => {
        detailFormData.append("quantities[]", quantity);
      });
    }

    // Xử lý ảnh: Gửi 3 ảnh cho ProductDetail và lấy ảnh đầu tiên cho Product
    let hasNewImages = false;
    let firstImageBlob = null; // Lưu ảnh đầu tiên để gửi cho Product
    currentImages.forEach((image, index) => {
      if (typeof image === "string" && image.startsWith("data:")) {
        const base64Data = image.split(",")[1];
        const blob = base64ToBlob(base64Data, "image/jpeg");
        detailFormData.append("images[]", blob, `image${index}.jpg`); // Gửi mảng ảnh cho ProductDetail
        if (index === 0) {
          firstImageBlob = blob; // Lưu ảnh đầu tiên
        }
        hasNewImages = true;
      }
    });

    // Nếu có ảnh mới, thêm ảnh đầu tiên vào productFormData
    if (hasNewImages && firstImageBlob) {
      productFormData.append("image", firstImageBlob, "image0.jpg"); // Gửi ảnh đầu tiên cho Product
    }

    // Nếu không có ảnh mới nhưng danh sách ảnh thay đổi, gửi danh sách URL cũ cho ProductDetail
    if (
      !hasNewImages &&
      JSON.stringify(currentImages) !==
        JSON.stringify(originalProductDetail?.images || [])
    ) {
      currentImages.forEach((image, index) => {
        if (typeof image === "string" && !image.startsWith("data:")) {
          detailFormData.append(`imageUrls[${index}]`, image); // Gửi URL cũ cho ProductDetail
        }
      });
      // Nếu danh sách ảnh thay đổi, lấy ảnh đầu tiên từ currentImages để cập nhật Product (nếu cần)
      if (
        currentImages.length > 0 &&
        currentImages[0] !== originalProduct.image
      ) {
        productFormData.append("imageUrl", currentImages[0]); // Gửi URL ảnh đầu tiên cho Product
      }
    }

    try {
      let updated = false;

      // Cập nhật Product nếu có dữ liệu
      if (productFormData.keys().next().value) {
        console.log("Gửi yêu cầu PUT tới /admin/products/", productId);
        const productResponse = await fetch(
          `http://127.0.0.1:8080/admin/products/${productId}`,
          {
            method: "PUT",
            body: productFormData,
          }
        );
        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          throw new Error(
            `Cập nhật Product thất bại: ${productResponse.status} - ${errorText}`
          );
        }
        updated = true;
      }

      // Cập nhật ProductDetail nếu có dữ liệu
      if (detailFormData.keys().next().value) {
        if (!originalProductDetail?.id) {
          console.log("Không có ProductDetail hiện tại, tạo mới...");
          detailFormData.append("productId", productId);
          const detailResponse = await fetch(
            `http://127.0.0.1:8080/admin/productdetails`,
            {
              method: "POST",
              body: detailFormData,
            }
          );
          if (!detailResponse.ok) {
            const errorText = await detailResponse.text();
            throw new Error(`Tạo ProductDetail thất bại: ${errorText}`);
          }
        } else {
          console.log(
            "Gửi yêu cầu PUT tới /admin/productdetails/",
            originalProductDetail.id
          );
          const detailResponse = await fetch(
            `http://127.0.0.1:8080/admin/productdetails/${originalProductDetail.id}`,
            {
              method: "PUT",
              body: detailFormData,
            }
          );
          if (!detailResponse.ok) {
            const errorText = await detailResponse.text();
            throw new Error(`Cập nhật ProductDetail thất bại: ${errorText}`);
          }
        }
        updated = true;
      }

      if (updated) {
        alert("Cập nhật sản phẩm thành công!");
        // window.location.href = `edit-product.html?id=${productId}`;
        window.location.href = "product.html";
      } else {
        alert("Không có thay đổi nào được gửi!");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      alert("Có lỗi xảy ra khi lưu: " + error.message);
    }
  });

  function base64ToBlob(base64, mime) {
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mime });
  }

  fetchCategories();
  fetchBrands();
  loadProduct();
});
