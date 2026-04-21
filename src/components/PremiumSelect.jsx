export default function PremiumSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-300">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
      >
        {children}
      </select>
    </div>
  );
}
