'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              エラーが発生しました
            </h3>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            予期しないエラーが発生しました。もう一度お試しください。
          </p>
        </div>
        <div className="mt-6">
          <button
            onClick={reset}
            className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    </div>
  )
}