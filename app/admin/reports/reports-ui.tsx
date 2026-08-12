"use client";

export function ExportButtons({ ratingsCSV, complaintsCSV }: { ratingsCSV: string; complaintsCSV: string }) {
  function download(name: string, content: string) {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => download("ratings.csv", ratingsCSV)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Export ratings CSV
      </button>
      <button
        onClick={() => download("complaints.csv", complaintsCSV)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Export complaints CSV
      </button>
    </div>
  );
}
