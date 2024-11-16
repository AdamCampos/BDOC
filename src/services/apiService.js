// src/services/apiService.js
const axios = require('axios');

async function pegaID(termo, token) {
    return axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=1&%24filter=(Name%20eq%20%27${termo}%27%20and%20Status%20eq%20%27CURRENT%27)&%24count=false&%24skip=0`, {
        headers: { 'Authorization': token }
    }).then(response => response.data.value[0])
    .catch(() => '');
}

async function pegaOBID(id, item, token) {
    return axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Objects?$filter=(OBID%20eq%20%27${id}%27)&$select=Name,OBID&$expand=SPFFileComposition_21($filter=Interfaces%20eq%20%27ISPFBusinessFile%27%20and%20SPFViewInd%20eq%20%27true%27%20or%20SPFEditInd%20eq%20%27true%27)&$top=1&$count=true`, {
        headers: { 'Authorization': token }
    }).then(response => {
        if (response.data.value.length > 0) {
            const item = response.data.value[0];
            return [item.OBID, item];
        }
        return null;
    });
}

async function pegaURI(obid, item, token) {
    return axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Files('${obid}')/Intergraph.SPF.Server.API.Model.RetrieveFileUris`, {
        headers: { 'Authorization': token }
    }).then(response => {
        if (response.data.value.length > 0) {
            return [response.data.value[0], ...item];
        }
        return item;
    });
}

async function pegaContagemSkips(token) {
    const url = projeto === '83' ?
        'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?...' :
        'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?...';
    
    return axios.get(url, {
        headers: { 'Authorization': token }
    }).then(response => {
        return Math.floor(response.data['@odata.count'] / 1000);
    });
}

module.exports = { pegaID, pegaOBID, pegaURI, pegaContagemSkips };
