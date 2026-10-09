"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Globe, ImagePlus, Send, Users, X } from "lucide-react";
import { createPost } from "@/app/social/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { controlClass } from "@/components/ui/field";

const OPTIONS = [
  { value: "public", label: "هەمووان", hint: "هەموو بەکارهێنەران دەیبینن", Icon: Globe },
  { value: "followers", label: "تەنها فۆڵۆوەرەکان", hint: "تەنها ئەوانەی فۆڵۆیان کردوویت", Icon: Users },
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// `bare` drops the card frame for use inside another card.
export function PostComposer({ bare = false }) {
  const [state, action, pending] = useActionState(createPost, {});
  // A new key after each successful post clears the fields.
  return <ComposerForm key={state.key ?? 0} state={state} action={action} pending={pending} bare={bare} />;
}

function ComposerForm({ state, action, pending, bare }) {
  const [visibility, setVisibility] = useState("public");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const fileInput = useRef(null);
  const length = body.trim().length;
  const preview = useObjectUrl(image);

  function pickImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setImageError("تەنها وێنەی JPG، PNG، WEBP یان GIF.");
    if (file.size > IMAGE_MAX_BYTES) return setImageError("قەبارەی وێنە دەبێت لە ٥ مێگابایت کەمتر بێت.");
    setImageError("");
    setImage(file);
  }

  // The photo is kept in state (not the file input) so it survives React's form reset after an error.
  function submit(formData) {
    if (image) formData.set("image", image);
    return action(formData);
  }

  return (
    <form action={submit} className={bare ? undefined : "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5"}>
      <label htmlFor="post-body" className="text-[15px] font-semibold text-slate-900">
        دەستکەوتێکت هەیە؟ با هاوڕێکانت بزانن 🎉
      </label>
      <textarea
        id="post-body"
        name="body"
        rows={3}
        maxLength={1000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="بۆ نموونە: ئەمڕۆ لە هاکاسۆنی هەولێر پلەی دووەمم بەدەستهێنا..."
        className={controlClass({ className: "mt-3 resize-y py-3 leading-7" })}
      />

      {preview && (
        <div className="relative mt-3 overflow-hidden rounded-xl bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="پێشبینینی وێنەی پۆست" className="max-h-80 w-full object-contain" />
          <button
            type="button"
            onClick={() => setImage(null)}
            disabled={pending}
            className="pressable absolute end-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 focus-ring"
            aria-label="لابردنی وێنە"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(",")} onChange={pickImage} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <Button type="button" variant="ghost" className="mt-2 -ms-2" onClick={() => fileInput.current?.click()} disabled={pending}>
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
        {image ? "گۆڕینی وێنە" : "زیادکردنی وێنە"}
      </Button>
      {imageError && <p className="text-[13px] text-red-700" role="alert">{imageError}</p>}

      <fieldset className="mt-3">
        <legend className="mb-2 text-[13px] font-medium text-slate-500">کێ دەتوانێت ببینێت؟</legend>
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {OPTIONS.map(({ value, label, hint, Icon }) => (
            <label
              key={value}
              title={hint}
              className={cn(
                "pressable inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-orange-500/20",
                visibility === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={value}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                className="sr-only"
              />
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="mt-3 text-[13px] text-red-700" role="alert">{state.error}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">{length}/١٠٠٠</span>
        <Button type="submit" isLoading={pending} disabled={length === 0 && !image}>
          <Send className="h-4 w-4 rotate-180" aria-hidden="true" />
          بڵاوکردنەوە
        </Button>
      </div>
    </form>
  );
}

// A preview URL for the chosen file, released when the file changes or the form unmounts.
function useObjectUrl(file) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return url;
}
