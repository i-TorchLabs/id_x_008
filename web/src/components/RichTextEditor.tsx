"use client";

/**
 * 富文本编辑器（quill 2.x）— 支持标题 / 字号 / 颜色 / 对齐 / 图片等。
 *
 * 关键设计：size / color / background / align 均注册为 inline-style attributor
 * （输出 style="font-size:18px" 等内联样式），这样编辑产物在学生端
 * dangerouslySetInnerHTML 渲染时无需依赖 quill.snow.css 即可正确呈现。
 */
import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import Quill from "quill";
import "quill/dist/quill.snow.css";

// ── 注册 inline-style attributor（替代默认 class-based） ──
// 使输出 HTML 自包含内联样式，脱离 quill CSS 也能正确渲染。
// Quill.import / register 的类型声明不完整，用 any 绕过。
/* eslint-disable @typescript-eslint/no-explicit-any */
const SizeStyle = Quill.import("attributors/style/size") as any;
SizeStyle.whitelist = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
Quill.register(SizeStyle, true);
Quill.register(Quill.import("attributors/style/color") as any, true);
Quill.register(Quill.import("attributors/style/background") as any, true);
Quill.register(Quill.import("attributors/style/align") as any, true);
/* eslint-enable @typescript-eslint/no-explicit-any */

const FONT_SIZES = [false, "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  [{ size: FONT_SIZES }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }, { align: [] }],
  ["link", "image"],
  ["clean"],
];

const IMAGE_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB

/** 自定义图片处理：文件选择 → base64 → 插入，带大小校验。 */
function imageHandler(this: { quill: Quill }) {
  const quill = this.quill;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > IMAGE_SIZE_LIMIT) {
      alert(`Image must be under ${IMAGE_SIZE_LIMIT / 1024 / 1024}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const range = quill.getSelection(true) ?? { index: quill.getLength(), length: 0 };
      quill.insertEmbed(range.index, "image", reader.result, "user");
      quill.setSelection(range.index + 1, 0);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

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
  // 记录最近一次向父级 emit 的内容，避免外部 value 回环导致光标跳转
  const lastEmitted = useRef<string>("");

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;
    const quill = new Quill(containerRef.current, {
      theme: "snow",
      placeholder: "Describe the project...",
      modules: {
        toolbar: {
          container: TOOLBAR,
          handlers: { image: imageHandler },
        },
      },
    });
    lastEmitted.current = quill.getSemanticHTML();
    quill.on("text-change", () => {
      lastEmitted.current = quill.getSemanticHTML();
      onChangeRef.current(lastEmitted.current);
    });
    quillRef.current = quill;
    // 初始化后同步一次外部 value（编辑态回填，DOMPurify 净化后再 paste）
    if (value && value !== lastEmitted.current) {
      const sanitized = DOMPurify.sanitize(value, { USE_PROFILES: { html: true } });
      quill.clipboard.dangerouslyPasteHTML(sanitized);
      lastEmitted.current = quill.getSemanticHTML();
    }
  }, []);

  // 外部 value 变化时同步编辑器；跳过自身 emit 的回环，避免光标跳转
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (value === lastEmitted.current) return;
    const sel = quill.getSelection();
    const sanitized = DOMPurify.sanitize(value || "", { USE_PROFILES: { html: true } });
    quill.clipboard.dangerouslyPasteHTML(sanitized);
    lastEmitted.current = quill.getSemanticHTML();
    if (sel) quill.setSelection(sel);
  }, [value]);

  return <div ref={containerRef} className="min-h-40 bg-white" />;
}
