const fs = require('fs');
const path = require('path');

// 遍历文件夹
function traverseFolder(folderPath) {
    const files = fs.readdirSync(folderPath);

    files.forEach(file => {
        const filePath = path.join(folderPath, file);

        // 判断是否为文件夹
        if (fs.statSync(filePath).isDirectory()) {
            // 递归遍历子文件夹
            traverseFolder(filePath);
        } else {
            // 处理 .md 文件
            if (path.extname(filePath) === '.md') {
                insertTextToFile(filePath, getInsertText(file));
            }
        }
    });
}

function getInsertText(filename) {
    return `---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---`
}

// 在文件开头插入文本
function insertTextToFile(filePath, textToInsert) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const modifiedContent = textToInsert + '\n' + fileContent;
        // const modifiedContent = fileContent.replace()

        fs.writeFileSync(filePath, modifiedContent);
        console.log(`Inserted text into ${filePath}`);
    } catch (error) {
        console.error(`Error inserting text into ${filePath}: ${error.message}`);
    }
}

// 指定要遍历的文件夹路径
const folderPath = './posts';

// 开始遍历文件夹
traverseFolder(folderPath);