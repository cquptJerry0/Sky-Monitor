/**
 * 应用入口
 *
 * 按照 Sentry 的最佳实践：
 * - 第一行导入 SDK 初始化文件
 * - 确保 SDK 在 React 渲染之前初始化
 */

// Sky Monitor SDK initialization should be imported first!
import './instrument.ts'

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
