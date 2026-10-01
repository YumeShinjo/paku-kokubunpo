import { useNavigationStore, type Screen } from "@/app/store/navigationStore";

/**
 * ことだまの書の中から、別の画面(見返しなど)へ行って、また、ことだまの書へ戻るときの、戻り先の画面。
 * いま開いていることだまの書の「もどる」の戻り先(backTo)を、引き継ぐ(言の葉の森から来たなら、戻っても、言の葉の森へ戻れる)。
 */
export function zukanReturnScreen(tab: string): Screen {
  const current = useNavigationStore.getState().screen;
  return current.name === "zukan" && current.backTo ? { name: "zukan", tab, backTo: current.backTo } : { name: "zukan", tab };
}
