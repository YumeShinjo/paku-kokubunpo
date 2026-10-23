import { formatVersionLabel, type VersionInfo } from "@/lib/versionInfo";

/** いま動いている版(ビルドのときに vite.config.ts が埋め込んだ値) */
export const APP_VERSION_INFO: VersionInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  buildTime: __APP_BUILD_TIME__,
};

/** 設定に出す表記: 「v0.9.0(abc1234・2026-10-23 12:34)」。開発・テストでは「v0.9.0(dev)」 */
export const APP_VERSION_LABEL = formatVersionLabel(APP_VERSION_INFO);
