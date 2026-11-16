export function csvText(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const cell = (input: string | number | null | undefined) => {
    const value = String(input ?? "");
    const safe = /^[=+@\-]/.test(value.trimStart()) ? "'" + value : value;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  return "\uFEFF" + [headers, ...rows].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const url = URL.createObjectURL(new Blob([csvText(headers, rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
