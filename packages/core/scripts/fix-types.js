#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const typesDir = path.join(__dirname, '../build/types')
const srcTypesDir = path.join(typesDir, 'core/src')
const targetDir = typesDir

// 如果 core/src 目录存在,将其内容移动到 build/types 根目录
if (fs.existsSync(srcTypesDir)) {
    console.log('Moving type definitions to correct location...')

    // 递归复制文件
    function copyRecursive(src, dest) {
        const entries = fs.readdirSync(src, { withFileTypes: true })

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)

            if (entry.isDirectory()) {
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true })
                }
                copyRecursive(srcPath, destPath)
            } else {
                fs.copyFileSync(srcPath, destPath)
            }
        }
    }

    copyRecursive(srcTypesDir, targetDir)

    // 删除 browser, browser-utils, core 目录
    const dirsToRemove = ['browser', 'browser-utils', 'core']
    for (const dir of dirsToRemove) {
        const dirPath = path.join(typesDir, dir)
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true })
        }
    }

    console.log('Type definitions moved successfully!')
} else {
    console.log('Type definitions are already in the correct location.')
}
