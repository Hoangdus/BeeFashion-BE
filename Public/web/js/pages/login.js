async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const rememberMe = document.getElementById("rememberMe").checked;

  try {
    const response = await fetch("/auth/login_manager", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Email hoặc mật khẩu không đúng!");
    }

    const userData = await response.json();

    // Lưu thông tin người dùng
    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }

    // Hiển thị thông báo thành công
    await Swal.fire({
      icon: "success",
      title: "Đăng nhập thành công",
      text: `Chào mừng ${userData.name}!`,
      timer: 1500,
      showConfirmButton: false,
    });

    // Chuyển hướng đến trang sản phẩm
    window.location.href = "dashboard.html";
  } catch (error) {
    // Hiển thị thông báo lỗi
    Swal.fire({
      icon: "error",
      title: "Đăng nhập thất bại",
      text: error.message,
    });
  }
}
