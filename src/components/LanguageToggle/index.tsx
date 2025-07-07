'use client';

import { useAppDispatch, useAppSelector } from '@/lib/client/store/hooks';
import { switchLanguages } from '@/lib/client/store/conversationSlice';

export function LanguageToggle() {
  const dispatch = useAppDispatch();
  const { primary, secondary } = useAppSelector(
    (state) => state.conversation.languages
  );
  const status = useAppSelector((state) => state.conversation.status);

  const handleSwitch = () => {
    dispatch(switchLanguages());
  };

  const getLanguageDisplay = (lang: 'en' | 'es') => {
    return lang === 'en' ? '🇺🇸 English' : '🇪🇸 Español';
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Doctor:</span>
        <span className="text-lg font-semibold">
          {getLanguageDisplay(primary)}
        </span>
      </div>

      <button
        onClick={handleSwitch}
        disabled={status === 'active'}
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110"
        title={status === 'active' ? 'Cannot switch during active conversation' : 'Switch languages'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Patient:</span>
        <span className="text-lg font-semibold">
          {getLanguageDisplay(secondary)}
        </span>
      </div>
    </div>
  );
}