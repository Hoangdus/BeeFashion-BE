const getBaseUrl = () => {
  const port = window.location.port;

  if (port === "8080") {
    return "http://127.0.0.1:8080";
  } else if (port === "9000") {
    return "http://beefashion.duckdns.org:9000";
  } else {
    return "http://127.0.0.1:8080";
  }
};

window.BASE_URL = getBaseUrl();
