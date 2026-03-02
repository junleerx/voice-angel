/**
 * Dialog shown when microphone permission has been denied.
 */

'use client';

interface PermissionDialogProps {
  onRetry: () => void;
}

export function PermissionDialog({ onRetry }: PermissionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 text-center">
        <div className="text-5xl mb-4">🎤</div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          마이크 접근 권한 필요
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Voice Angel은 실시간 음성 인식을 위해 마이크 접근 권한이 필요합니다.
          브라우저 주소창의 🔒 아이콘을 클릭하여 마이크 권한을 허용해주세요.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
          >
            다시 시도
          </button>
          <a
            href="https://support.google.com/chrome/answer/2693767"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            권한 설정 방법 보기 →
          </a>
        </div>
      </div>
    </div>
  );
}
