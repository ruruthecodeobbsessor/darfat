"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useRef } from "react";
import { FolderOpen, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TaskUploads({ id, files, onChange, disabled }) {
  const { t: localize } = useI18n();
  const fileInput = useRef(null), folderInput = useRef(null);
  function select(event) {
    const combined = [...files, ...Array.from(event.target.files || [])];
    const unique = new Map(combined.map(file => [`${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`, file]));
    onChange([...unique.values()]);
    event.target.value = "";
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  return <div className="space-y-3 rounded-xl bg-slate-50 p-4">
    <p id={`files-label-${id}`} className="text-[13px] font-medium text-slate-700">{localize("فایل یان فۆڵدەری کارەکەت")}</p>
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" disabled={disabled} onClick={() => fileInput.current?.click()}><Paperclip aria-hidden="true" className="h-4 w-4" /> {localize(" هەڵبژاردنی فایل")}</Button>
      <Button variant="outline" disabled={disabled} onClick={() => folderInput.current?.click()}><FolderOpen aria-hidden="true" className="h-4 w-4" /> {localize(" هەڵبژاردنی فۆڵدەر")}</Button>
    </div>
    <input ref={fileInput} type="file" multiple onChange={select} disabled={disabled} className="sr-only" tabIndex={-1} aria-labelledby={`files-label-${id}`} />
    <input ref={folderInput} type="file" multiple webkitdirectory="" directory="" onChange={select} disabled={disabled} className="sr-only" tabIndex={-1} aria-labelledby={`files-label-${id}`} />
    <p className="text-xs leading-relaxed text-slate-500" dir="auto">{localize("Any relevant files, folders or ZIPs. Up to 40 work files, 6 MB each, 20 MB total. Images are resized and saved as WebP. Dependency/build folders and credential files are excluded. Unsupported formats are stored, with review limitations explained.")}</p>
    {files.length > 0 && <>
      <p role="status" className={`text-xs ${total > 20 * 1024 * 1024 || files.length > 200 ? "text-red-700" : "text-slate-600"}`} dir="auto">{localize(files.length)} {localize(" selected · ")}{localize((total / 1024 / 1024).toFixed(2))} {localize(" MB")}</p>
      <ul className="max-h-48 space-y-1 overflow-y-auto">{files.map((file, index) => <li key={`${file.webkitRelativePath || file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-white ps-3 text-xs text-slate-700 ring-1 ring-slate-200/80">
        <span className="min-w-0 break-all" dir="auto">{file.webkitRelativePath || file.name}</span>
        <Button variant="ghost" className="min-h-11 min-w-11 shrink-0 p-2" disabled={disabled} aria-label={localize("Remove {value0}", { value0: file.name })} onClick={() => onChange(files.filter((_, at) => at !== index))}><X aria-hidden="true" className="h-4 w-4" /></Button>
      </li>)}</ul>
    </>}
  </div>;
}
