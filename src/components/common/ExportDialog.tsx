/**
 * Modal dialog for exporting session data in various formats.
 */

'use client';

import { useState } from 'react';
import type { RecordingSession, ExportFormat } from '@/types/session';
import { exportSession, downloadBlob, generateExportFilename } from '@/lib/exportUtils';

interface ExportDialogProps {
  session: RecordingSession;
  onClose: () => void;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'txt-original', label: 'TXT (원문)', description: '영어 원문만 저장' },
  { value: 'txt-translated', label: 'TXT (번역)', description: '한국어 번역만 저장' },
  { value: 'txt-both', label: 'TXT (양쪽)', description: '원문 + 번역 모두 저장' },
  { value: 'srt', label: 'SRT 자막', description: '타임스탬프 포함 자막 파일' },
  { value: 'json', label: 'JSON', description: '전체 데이터 (개발자용)' },
];

export function ExportDialog({ session, onClose }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt-both');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = exportSession(selectedFormat, session);
      const filename = generateExportFilename(session.metadata.title, selectedFormat);
      downloadBlob(blob, filename);
      onClose();
    } catch (err) {
      console.error('[export] Failed to export session:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">내보내기</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format selection */}
        <div className="px-6 py-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            내보낼 형식을 선택하세요
          </p>
          {FORMAT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedFormat === opt.value
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="exportFormat"
                value={opt.value}
                checked={selectedFormat === opt.value}
                onChange={() => setSelectedFormat(opt.value)}
                className="mt-0.5 text-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 rounded-lg transition-colors"
          >
            {isExporting ? '내보내는 중...' : '내보내기'}
          </button>
        </div>
      </div>
    </div>
  );
}
