function calculaToken(token) {
    const base64 = token.split('.')[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map(function (item) {
        return "%" + ("00" + item.charCodeAt(0).toString(16)).slice(-2);
      }).join("")
    );
    const { exp } = JSON.parse(jsonPayload);
    let expiraEm = ((((exp * 1000) - Date.now()) / 60000).toFixed(0));
  
    return expiraEm;
  }
  
  // Exporta a função como módulo
  module.exports = {
    calculaToken,
  };
  