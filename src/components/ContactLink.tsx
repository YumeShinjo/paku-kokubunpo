import { ExternalLink, Mail } from "lucide-react";

/** お問い合わせフォーム(Googleフォーム)。プライバシーポリシー第10条に書いたものと同じ */
export const CONTACT_FORM_URL = "https://forms.gle/dtyC4R6VM1JJMpEs9";

/**
 * 「お問い合わせ」のリンク。外部のブラウザ(別のタブ)で、お問い合わせフォームを開く。
 * タップできる高さは44px以上。プライバシーポリシー画面と、せってい画面に置く(ホーム画面のフッターには置かない)。
 */
export function ContactLink({ className = "" }: { className?: string }) {
  return (
    <a className={`contact-link ${className}`.trim()} href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">
      <Mail aria-hidden="true" size={18} />
      <span>お問い合わせ</span>
      <ExternalLink aria-hidden="true" size={14} className="contact-link-external" />
      <span className="visually-hidden">(新しいタブで、お問い合わせフォームを開きます)</span>
    </a>
  );
}
