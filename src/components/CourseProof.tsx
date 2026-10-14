import { COURSE_PROOF_TEXT } from "@/data/courseProof";

/** 講義の自作証明(「情報通信技術活用論 2026」)。ふりがなや絵文字は付けない。置き場所ごとの見た目は className で決める */
export function CourseProof({ className }: { className: string }) {
  return <p className={`course-proof ${className}`}>{COURSE_PROOF_TEXT}</p>;
}
