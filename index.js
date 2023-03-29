#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const inquirer = require("inquirer");
const fontSpider = require('font-spider');
inquirer.prompt([
  {
    type: "input",
    name: "fontName",
    message: "请输入根目录下的字体文件名，仅支持ttf格式，如：font.ttf > ",
    default: "font.ttf",
    validate: function (value) {
      if (/^[^\\/:*?"<>|\r\n]+\.ttf$/.test(value)) {
        return true;
      }
      return "请输入正确的字体文件名";
    }
  },
  {
    type: "input",
    name: "userCustomWords",
    message: "请输入需要自定义提取的字符 > ",
  },
  {
    type: "checkbox",
    name: "wordDict",
    message: "请选择要附加的常见字符集 > ",
    choices: [
      {
        name: "1000字",
        value: "1000",
      },
      {
        name: "3500字",
        value: "3500"
      },
      {
        name: "7000字",
        value: "7000"
      }
    ]
  },
  {
    type: "list",
    name: "isBackup",
    message: "压缩后是否保留原字体文件 > ",
    choices: [
      {
        name: "是",
        value: true,
        checked: true
      },
      {
        name: "否",
        value: false
      },
    ]
  },
]).then(answers => {
  const {fontName, userCustomWords, wordDict, isBackup} = answers;
  const dictResult = wordDict.map(k => {
    return fs.readFileSync(path.join(__dirname, 'dict/', `${k}.txt`), 'utf-8');
  }).join("")
  const htmlTemplate = `
    <!DOCTYPE html><html><body>
    <style>
    @font-face {font-family: 'pingfang';  src: url(${path.join('./', fontName)});}
    .font {font-family: pingfang;font-size: 20px;}
    </style>
    <div class="font">${userCustomWords}${dictResult}</div>
    </body></html>
    `;
  console.log("生成字符集模板中...")
  const htmlPath = path.join('./', 'index.html');
  fs.appendFile(htmlPath, htmlTemplate, err => {
    if (err) {
      console.error("生成字符集模板失败！")
    } else {
      console.log("生成字符集成功，正在打包...")
      fontSpider.spider([htmlPath], {
        silent: true,
      }).then(function (webFonts) {
        return fontSpider.compressor(webFonts, {silent: true, backup: isBackup});
      }).then(function (webFonts) {
        console.log("正在清理...")
        try {
          fs.rmSync(htmlPath)
          const resultFilePath = path.join('./', fontName)
          console.log(`打包成功！压缩后的字体路径为${resultFilePath}`)
          if (isBackup) {
            console.log(`原字体备份路径为${path.join('./', ".font-spider/", fontName)}`)
          }
        } catch (err) {
          console.error("清理失败！")
        }
      }).catch(function (errors) {
        console.error(errors);
      });
    }
  })
})
