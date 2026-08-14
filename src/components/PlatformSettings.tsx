export default function PlatformSettings() {
  const platforms = ["Pinterest", "Instagram", "YouTube"];
  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
      <h2 className="text-lg font-semibold mb-6">Platform Configuration</h2>
      <div className="space-y-6">
        {platforms.map(platform => (
          <div key={platform} className="border-b border-neutral-100 pb-6 last:border-0 last:pb-0">
            <h3 className="font-medium text-neutral-900 mb-4">{platform} Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder={`${platform} API Key`} className="p-2 border border-neutral-300 rounded-md w-full" />
              <input type="text" placeholder={`${platform} Secret`} className="p-2 border border-neutral-300 rounded-md w-full" />
            </div>
          </div>
        ))}
        <button className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800">Save Configuration</button>
      </div>
    </div>
  );
}
