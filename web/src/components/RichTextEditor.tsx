"use client";

/** 富文本编辑器（quill 2.x），用于项目内容编辑。 */
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;
    const quill = new Quill(containerRef.current, {
      theme: "snow",
      modules: { toolbar: [["bold", "italic", "underline"], [{ list: "bullet" }], ["link"]] },
    });
    quill.on("text-change", () => {
      onChangeRef.current(quill.getSemanticHTML());
    });
    quillRef.current = quill;
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (quill && value !== quill.getSemanticHTML()) {
      quill.clipboard.dangerouslyPasteHTML(value || "");
    }
    // 仅在编辑目标切换时重置内容
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quillRef.current]);

  return <div ref={containerRef} className="min-h-40 bg-white" />;
}
