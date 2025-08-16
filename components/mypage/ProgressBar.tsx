'use client';

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
      <div className="bg-blue-500 h-4 transition-all duration-300" style={{ width: `${progress}%` }} />
    </div>
  );
}
