import React, { useState } from 'react'

interface WelcomeGuideProps {
  onComplete: () => void
}

export function WelcomeGuide({ onComplete }: WelcomeGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Yellow Claude Orchestra へようこそ！",
      description: "複数のエージェントが協力してプロジェクトを開発する AI システムです",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <p className="text-center text-gray-600">
            3つのエージェントが連携して、あなたの開発作業を効率化します
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🎬</div>
              <div className="font-medium text-sm">Producer</div>
              <div className="text-xs text-gray-500">要件聞き取り</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🎭</div>
              <div className="font-medium text-sm">Director</div>
              <div className="text-xs text-gray-500">優先度判定</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">👨‍💻</div>
              <div className="font-medium text-sm">Actor</div>
              <div className="text-xs text-gray-500">実装作業</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "プロジェクト作成",
      description: "まずは開発するプロジェクトを作成しましょう",
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">プロジェクトとは？</h4>
            <p className="text-sm text-gray-600 mb-3">
              プロジェクトは開発作業の単位です。複数のプロジェクトを並行して進行できます。
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>プロジェクト名: 「ECサイト開発」</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>リポジトリ: 「my-ecommerce-site」</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>説明: 「オンラインショップの開発」</span>
              </div>
            </div>
          </div>
          <div className="p-4 border border-warning-200 bg-warning-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-warning text-sm">ヒント</span>
            </div>
            <p className="text-sm text-warning-700">
              プロジェクトを作成すると、そのプロジェクト専用のタスク管理が始まります
            </p>
          </div>
        </div>
      )
    },
    {
      title: "タスク依頼",
      description: "エージェントにやってほしいことを依頼してみましょう",
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">タスク依頼の流れ</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <div className="font-medium text-sm">やりたいことを入力</div>
                  <div className="text-xs text-gray-500">「ユーザー認証機能を作って」</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <div className="font-medium text-sm">Producer が詳細確認</div>
                  <div className="text-xs text-gray-500">要件を詳しく聞いてくれます</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-warning text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <div className="font-medium text-sm">Director が優先度判定</div>
                  <div className="text-xs text-gray-500">タスクの重要度を決めます</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <div className="font-medium text-sm">Actor が実装開始</div>
                  <div className="text-xs text-gray-500">コードを書いてくれます</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border border-primary-200 bg-primary-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-primary text-sm">⌘+Enter</span>
            </div>
            <p className="text-sm text-primary-700">
              Cmd/Ctrl + Enter でタスクを素早く送信できます
            </p>
          </div>
        </div>
      )
    }
  ]

  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">
            {steps[currentStep].description}
          </p>
          
          {/* プログレスバー */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>ステップ {currentStep + 1} / {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {steps[currentStep].content}
        </div>

        {/* フッター */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            戻る
          </button>
          
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {isLastStep ? (
            <button
              onClick={onComplete}
              className="btn btn-primary"
            >
              始める
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="btn btn-primary"
            >
              次へ
            </button>
          )}
        </div>
      </div>
    </div>
  )
}