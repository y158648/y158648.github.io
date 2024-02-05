const fs = require('fs');
const path = require('path');

// 定义函数用于读取并处理文件
function processFile(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file: ${filePath}`);
            console.error(err);
            return;
        }

        const fileName = path.basename(filePath, '.md') + "/";
        const newData = data.replace(new RegExp(encodeURI(fileName), 'g'), '');

        fs.writeFile(filePath, newData, 'utf8', err => {
            if (err) {
                console.error(`Error writing to file: ${filePath}`);
                console.error(err);
                return;
            }
            console.log(`Processed file: ${filePath}`);
        });
    });
}

// 定义函数用于遍历文件夹
function traverseDirectory(dirPath) {
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${dirPath}`);
            console.error(err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            fs.stat(filePath, (err, stat) => {
                if (err) {
                    console.error(`Error getting file status: ${filePath}`);
                    console.error(err);
                    return;
                }
                if (stat.isDirectory()) {
                    traverseDirectory(filePath); // 递归遍历子目录
                } else if (path.extname(filePath) === '.md') {
                    processFile(filePath); // 处理Markdown文件
                }
            });
        });
    });
}

// 执行遍历
const currentDirectory = process.cwd(); // 获取当前目录
traverseDirectory(currentDirectory);
