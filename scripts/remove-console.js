#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 需要清理的目录
const dirsToClean = [
    'packages/browser/src',
    'packages/browser-utils/src',
    'packages/core/src',
    'packages/react/src',
    'packages/vite-plugin/src',
    'apps/frontend/monitor/src',
    'apps/backend/monitor/src',
    'apps/backend/dsn-server/src',
]

// 排除的文件模式
const excludePatterns = [/\.test\.ts$/, /\.spec\.ts$/, /__tests__/, /node_modules/, /build/, /dist/, /coverage/]

// 需要保留的 console.log (注释或文档)
const keepPatterns = [
    /\/\/.+console\.log/, // 单行注释
    /\/\*.+console\.log.+\*\//, // 多行注释
    /\*.+console\.log/, // JSDoc 注释
]

function shouldExclude(filePath) {
    return excludePatterns.some(pattern => pattern.test(filePath))
}

function shouldKeepLine(line) {
    return keepPatterns.some(pattern => pattern.test(line))
}

function removeConsoleLogs(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const newLines = []
    let removed = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // 保留注释中的 console.log
        if (shouldKeepLine(line)) {
            newLines.push(line)
            continue
        }

        // 检测 console.log 语句
        if (/^\s*console\.log\(/.test(line)) {
            // 单行 console.log
            removed++
            continue
        } else if (/console\.log\(/.test(line) && !/\/\//.test(line.split('console.log')[0])) {
            // 行内 console.log (不在注释中)
            // 检查是否是多行调用
            let fullStatement = line
            let j = i

            // 查找完整的语句 (直到找到闭合括号)
            while (j < lines.length && !fullStatement.includes(')')) {
                j++
                if (j < lines.length) {
                    fullStatement += '\n' + lines[j]
                }
            }

            // 如果是完整的 console.log 语句,跳过所有相关行
            if (/console\.log\([^)]*\)/.test(fullStatement)) {
                removed++
                i = j // 跳过多行
                continue
            }
        }

        newLines.push(line)
    }

    if (removed > 0) {
        fs.writeFileSync(filePath, newLines.join('\n'))
        console.log(`✓ ${filePath}: 移除 ${removed} 个 console.log`)
        return removed
    }

    return 0
}

function walkDir(dir) {
    let totalRemoved = 0

    if (!fs.existsSync(dir)) {
        console.log(`⚠ 目录不存在: ${dir}`)
        return 0
    }

    const files = fs.readdirSync(dir)

    for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (shouldExclude(filePath)) {
            continue
        }

        if (stat.isDirectory()) {
            totalRemoved += walkDir(filePath)
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            totalRemoved += removeConsoleLogs(filePath)
        }
    }

    return totalRemoved
}

console.log('开始清理 console.log...\n')

let grandTotal = 0
for (const dir of dirsToClean) {
    const fullPath = path.join(process.cwd(), dir)
    console.log(`\n清理目录: ${dir}`)
    const removed = walkDir(fullPath)
    grandTotal += removed
}

console.log(`\n总计移除 ${grandTotal} 个 console.log`)
