import { sql, StandardSQL } from '@codemirror/lang-sql'
import { autocompletion, CompletionContext } from '@codemirror/autocomplete'
import { linter, Diagnostic } from '@codemirror/lint'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'

import { CLICKHOUSE_SCHEMA_FIELDS } from '@/config/clickhouse-schema'

interface SqlEditorProps {
    value: string
    onChange: (value: string) => void
    height?: string
    readOnly?: boolean
}

/**
 * SQL 编辑器组件
 * 支持语法高亮、自动补全、字段验证
 */
export function SqlEditor({ value, onChange, height = '300px', readOnly = false }: SqlEditorProps) {
    // ClickHouse 字段自动补全
    const clickhouseCompletions = useMemo(() => {
        return autocompletion({
            override: [
                (context: CompletionContext) => {
                    const word = context.matchBefore(/\w*/)
                    if (!word || (word.from === word.to && !context.explicit)) {
                        return null
                    }

                    return {
                        from: word.from,
                        options: CLICKHOUSE_SCHEMA_FIELDS.map((field: any) => ({
                            label: field.name,
                            type: 'variable',
                            detail: `${field.type} - ${field.category}`,
                            info: field.description || undefined,
                        })),
                    }
                },
            ],
        })
    }, [])

    // SQL 语法验证
    const sqlLinter = useMemo(() => {
        return linter((view): Diagnostic[] => {
            const diagnostics: Diagnostic[] = []
            const text = view.state.doc.toString()

            // 基础 SQL 关键字检查
            const hasSelect = /\bSELECT\b/i.test(text)
            const hasFrom = /\bFROM\b/i.test(text)

            if (!hasSelect) {
                diagnostics.push({
                    from: 0,
                    to: text.length,
                    severity: 'error',
                    message: 'SQL 查询必须包含 SELECT 关键字',
                })
            }

            if (!hasFrom) {
                diagnostics.push({
                    from: 0,
                    to: text.length,
                    severity: 'error',
                    message: 'SQL 查询必须包含 FROM 关键字',
                })
            }

            // 检查是否使用了 monitor_events 表
            if (hasFrom && !/\bFROM\s+monitor_events\b/i.test(text)) {
                diagnostics.push({
                    from: 0,
                    to: text.length,
                    severity: 'warning',
                    message: '建议使用 monitor_events 表',
                })
            }

            return diagnostics
        })
    }, [])

    const extensions = useMemo(() => {
        return [sql({ dialect: StandardSQL }), clickhouseCompletions, sqlLinter]
    }, [clickhouseCompletions, sqlLinter])

    return (
        <div className="border rounded-md overflow-hidden">
            <CodeMirror
                value={value}
                height={height}
                extensions={extensions}
                onChange={onChange}
                readOnly={readOnly}
                theme="light"
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    searchKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                }}
            />
        </div>
    )
}
