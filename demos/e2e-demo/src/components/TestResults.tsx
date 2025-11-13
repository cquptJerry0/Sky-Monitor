import React from 'react'
import { type TestResult } from '../types'

interface TestResultsProps {
    results: TestResult[]
    maxHeight?: string
}

export const TestResults: React.FC<TestResultsProps> = ({ results, maxHeight = '400px' }) => {
    return (
        <div className="border border-gray-300">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                <h3 className="font-semibold text-sm">测试结果</h3>
            </div>
            <div className="overflow-y-auto bg-white" style={{ maxHeight }}>
                {results.length === 0 ? (
                    <div className="p-4 text-gray-500 text-sm text-center">暂无测试结果</div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`
                  p-4 border-l-3 text-sm
                  ${result.type === 'success' ? 'border-black' : result.type === 'error' ? 'border-gray-400' : 'border-gray-300'}
                `}
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="font-medium">
                                        {result.type === 'success' ? '[SUCCESS]' : result.type === 'error' ? '[ERROR]' : '[INFO]'}{' '}
                                        {result.message}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">{result.timestamp}</span>
                                </div>
                                {result.details !== undefined && (
                                    <pre className="mt-2 p-2 bg-gray-50 text-xs overflow-x-auto">
                                        {typeof result.details === 'object' && result.details !== null
                                            ? JSON.stringify(result.details, null, 2)
                                            : String(result.details)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
