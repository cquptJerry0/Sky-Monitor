import React, { useState } from 'react'
import { type TestStep } from '../types'

interface StepFormProps {
    steps: TestStep[]
    onStepComplete: (stepId: string, result: 'success' | 'error', message?: string) => void
}

export const StepForm: React.FC<StepFormProps> = ({ steps, onStepComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [executing, setExecuting] = useState(false)

    const currentStep = steps[currentStepIndex]
    const isLastStep = currentStepIndex === steps.length - 1

    const executeStep = async () => {
        if (!currentStep || executing) return

        setExecuting(true)
        try {
            await currentStep.action()

            let isValid = true
            if (currentStep.validate) {
                isValid = await currentStep.validate()
            }

            const result = isValid ? 'success' : 'error'
            const message = isValid ? '步骤执行成功' : '验证失败'

            onStepComplete(currentStep.id, result, message)

            if (isValid && !isLastStep) {
                setTimeout(() => {
                    setCurrentStepIndex(currentStepIndex + 1)
                }, 500)
            }
        } catch (error: any) {
            onStepComplete(currentStep.id, 'error', error.message)
        } finally {
            setExecuting(false)
        }
    }

    const reset = () => {
        setCurrentStepIndex(0)
        steps.forEach(step => {
            step.completed = false
            step.result = undefined
            step.message = undefined
        })
    }

    return (
        <div className="space-y-6">
            {/* 步骤进度条 */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-semibold text-sm transition-all
                  ${
                      step.completed
                          ? step.result === 'success'
                              ? 'bg-black text-white'
                              : 'bg-gray-400 text-white'
                          : index === currentStepIndex
                            ? 'bg-white border-2 border-black text-black'
                            : 'bg-gray-200 text-gray-500'
                  }
                `}
                            >
                                {step.completed ? (step.result === 'success' ? '✓' : '✗') : index + 1}
                            </div>
                            <div className="mt-2 text-xs text-center max-w-[100px]">{step.title}</div>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`
                  flex-1 h-0.5 mx-2 transition-all
                  ${step.completed ? 'bg-black' : 'bg-gray-200'}
                `}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* 当前步骤详情 */}
            {currentStep && (
                <div className="border border-gray-300 p-6">
                    <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
                    <p className="text-gray-600 mb-4">{currentStep.description}</p>

                    {currentStep.completed && currentStep.message && (
                        <div
                            className={`
                mb-4 p-3 border-l-3
                ${currentStep.result === 'success' ? 'bg-gray-50 border-black' : 'bg-gray-100 border-gray-400'}
              `}
                        >
                            {currentStep.message}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={executeStep}
                            disabled={executing || currentStep.completed}
                            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {executing ? '执行中...' : currentStep.completed ? '已完成' : '执行步骤'}
                        </button>

                        {(isLastStep && currentStep.completed) || steps.some(s => s.result === 'error') ? (
                            <button
                                onClick={reset}
                                className="px-6 py-2 border-2 border-black text-black font-medium hover:bg-gray-50 transition-colors"
                            >
                                重新开始
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}
