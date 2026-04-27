import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { MockDataProvider } from "../../../context/MockDataContext";
import { DeductionProvider } from "../../../context/DeductionContext";

export function Layout() {
  return (
    <MockDataProvider>
      <DeductionProvider>
        <div className="flex h-screen w-full overflow-hidden bg-gray-100">
          {/* 좌측 사이드바 */}
          <Sidebar />

          {/* 우측 메인 콘텐츠 영역 */}
          <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="flex-1 overflow-hidden bg-gray-50">
              <Outlet />
            </div>
          </main>
        </div>
      </DeductionProvider>
    </MockDataProvider>
  );
}