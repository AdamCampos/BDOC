const { startBrowser } = require('../services/browserService');
const { getDevToolsData } = require('../services/devToolsService');
const { carregarCookies, salvarCookies } = require('../services/cookieService');
const { CHROME_PATH, COOKIES_FILE_PATH } = require('../config/constants');

async function main(args) {
    let projeto = args[0];
    console.log(`Projeto: P-${projeto}`);
    let browser;

    try {
        console.log('Iniciando navegador em modo headless...');
        browser = await startBrowser(true);
        console.log('Navegador iniciado com headless: true');

        const page = await browser.newPage();
        await carregarCookies(page, COOKIES_FILE_PATH);

        const token = await getDevToolsData(page, 'https://integra-ext.petrobras.com.br/INTEGRA/#/');

        if (token) {
            console.log('Token capturado com sucesso:', token);
        } else {
            console.log('Erro ao capturar o token. Reiniciando em modo interativo para login manual...');
            await browser.close();
            browser = await startBrowser(false);
            console.log('Navegador reiniciado em modo interativo.');

            const pageInterativo = await browser.newPage();
            await carregarCookies(pageInterativo, COOKIES_FILE_PATH);
            console.log('Aguardando 60 segundos para login manual...');
            await pageInterativo.waitForTimeout(60000);

            const tokenInterativo = await getDevToolsData(pageInterativo, 'https://integra-ext.petrobras.com.br/INTEGRA/#/');

            if (tokenInterativo) {
                console.log('Token capturado após login manual:', tokenInterativo);
            } else {
                console.error('Falha ao capturar o token após interação manual.');
            }
        }

        await salvarCookies(page, COOKIES_FILE_PATH);
    } catch (error) {
        console.error('Erro durante a execução:', error);
    } finally {
        if (browser) {
            console.log('Fechando o navegador.');
            await browser.close();
        }
    }
}

module.exports = { main };
