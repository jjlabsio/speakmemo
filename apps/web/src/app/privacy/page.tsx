import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "개인정보처리방침 — semo",
  description: "semo 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-svh">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          개인정보처리방침
        </h1>
        <p className="mt-4 text-muted-foreground">최종 업데이트: 2025년 1월</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-base font-semibold text-foreground">
              1. 수집하는 개인정보
            </h2>
            <p className="mt-2">
              semo는 서비스 제공을 위해 이메일 주소, 음성 녹음 데이터를
              수집합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              2. 개인정보의 이용
            </h2>
            <p className="mt-2">
              수집된 정보는 음성 메모 처리 및 AI 분석 서비스 제공에만
              사용됩니다. 제3자에게 판매하거나 공유하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              3. 데이터 보관
            </h2>
            <p className="mt-2">
              음성 녹음 파일은 처리 완료 후 안전하게 저장되며, 계정 삭제 시 모든
              데이터가 영구 삭제됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. 문의</h2>
            <p className="mt-2">
              개인정보 관련 문의는{" "}
              <a
                href="mailto:privacy@speakmemo.app"
                className="text-primary underline underline-offset-4"
              >
                privacy@speakmemo.app
              </a>
              으로 연락해 주세요.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
