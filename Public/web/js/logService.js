async function createLog(name, contentType, content) {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || sessionStorage.getItem("user")
    );

    const logData = {
      name: name || user.name || "Unknown",
      contentType: contentType, // add, changeStatus, approval, other
      content: content,
    };

    const response = await fetch(`${BASE_URL}/admin/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const createdLog = await response.json();
    console.log("Log đã được tạo:", createdLog);
    return true;
  } catch (error) {
    console.error("Lỗi khi tạo log:", error);
    return false;
  }
}

// export { createLog };
window.createLog = createLog;
