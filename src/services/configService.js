const path = require('path');

module.exports = {
  getChromePath: function() {
    return path.resolve('C:\\Users\\nvmj\\Desktop\\NodeJS\\chrome\\win64-127.0.6533.72\\chrome.exe');
  },
  getCookiesFilePath: function() {
    return path.resolve('C:\\Users\\nvmj\\AppData\\Local\\Google\\Chrome for Testing\\User Data\\Default\\Network\\cookies.json');
  },
  getProjectPath: function(project) {
    if (project === '83') {
      return 'D:\\BDOC';
    } else if (project === '82') {
      return 'D:\\BDOC 82';
    } else {
      throw new Error('Projeto desconhecido');
    }
  }
};
