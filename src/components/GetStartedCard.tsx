type Props = {
  description: string;
  ctaLabel: string;
  primary?: boolean;
};

export default function GetStartedCard({ description, ctaLabel, primary }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 text-center">
      <p className="text-sm text-gray-700">{description}</p>
      <div className="flex w-full flex-col items-center gap-2">
        <button
          className={
            primary
              ? "w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              : "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          }
        >
          {ctaLabel}
        </button>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Dismiss
        </button>
      </div>
    </div>
  );
}
