import { createHashRouter } from "react-router";
import { Layout } from "./components/layout/Layout";

// 1번 ~ 39번 페이지 컴포넌트 임포트 (전체)
import PriceChangePage from "./pages/1.PriceChangePage";
import ProductStatusChangePage from "./pages/2.ProductStatusChangePage";
import OrderStandardManagePage from "./pages/3.OrderStandardManagePage";
import StationeryOrderPage from "./pages/4.StationeryOrderPage";
import AlbumOrderPage from "./pages/5.AlbumOrderPage";
import AlbumOrderConfirmPage from "./pages/6.AlbumOrderConfirmPage";
import OverseasStationeryOrderPage from "./pages/7.OverseasStationeryOrderPage";
import AlbumNewReleaseOrderPage from "./pages/8.AlbumNewReleaseOrderPage";
import StationeryNewReleaseOrderPage from "./pages/9.StationeryNewReleaseOrderPage";
import OrderRequestInquiryPage from "./pages/10.OrderRequestInquiryPage";
import BugokDeliveryOrderPage from "./pages/11.BugokDeliveryOrderPage";
import AlbumSupplierDegreePage from "./pages/12.AlbumSupplierDegreePage";
import AlbumSupplierReturnRatePage from "./pages/13.AlbumSupplierReturnRatePage";
import AlbumSupplierReturnLimitInquiryPage from "./pages/14.AlbumSupplierReturnLimitInquiryPage";
import StationeryReturnListPage from "./pages/15.StationeryReturnListPage";
import DomesticArrivalGroupClosingPage from "./pages/16.DomesticArrivalGroupClosingPage";
import DomesticArrivalDailyClosingPage from "./pages/17.DomesticArrivalDailyClosingPage";
import OverseasStationeryPurchaseConfirmPage from "./pages/18.OverseasStationeryPurchaseConfirmPage";
import ProductInfoMainPage from "./pages/19.ProductInfoMainPage";
import PromotionRegistrationPage from "./pages/20.PromotionRegistrationPage";
import PromotionSalesInquiryPage from "./pages/21.PromotionSalesInquiryPage";
import PeriodicalSalesInquiryPage from "./pages/22.PeriodicalSalesInquiryPage";
import StationerySupplierGradePage from "./pages/23.StationerySupplierGradePage";
import AltSupplierGroupManagePage from "./pages/24.AltSupplierGroupManagePage";
import SpecificPurchaseFeeRatePage from "./pages/25.SpecificPurchaseFeeRatePage";
import SpecialPromotionRegistrationPage from "./pages/26.SpecialPromotionRegistrationPage";
import StoreDisplayManagementPage from "./pages/27.StoreDisplayManagementPage";
import OfficialDocumentManagementPage from "./pages/28.OfficialDocumentManagementPage";
import InventoryInformationPage from "./pages/29.InventoryInformationPage";
import OrderHistoryPage from "./pages/30.OrderHistoryPage";
import ReturnHistoryPage from "./pages/31.ReturnHistoryPage";
import LedgerInquiryPage from "./pages/32.LedgerInquiryPage";
import LedgerDetailPage from "./pages/33.LedgerDetailPage";
import InvoiceConfirmationPage from "./pages/34.InvoiceConfirmationPage";
import OverseasStationeryArrivalPage from "./pages/35.OverseasStationeryArrivalPage";
import StationeryBookshelfInquiryPage from "./pages/36.StationeryBookshelfInquiryPage";
import ForcedStockInPage from "./pages/37.ForcedStockInPage";
import StationeryAlbumSalesInquiryPage from "./pages/38.StationeryAlbumSalesInquiryPage";
import SectionArrivalRegistrationPage from "./pages/39.SectionArrivalRegistrationPage"; // ★ 39번 임포트 추가
import DashboardPage from "./pages/DashboardPage";
import DataMigrationGamePage from "./pages/DataMigrationGamePage";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "price-change", Component: PriceChangePage },
      { path: "status-change", Component: ProductStatusChangePage },
      { path: "order-standard", Component: OrderStandardManagePage },
      { path: "stationery-order", Component: StationeryOrderPage },
      { path: "album-order", Component: AlbumOrderPage },
      { path: "album-order-confirm", Component: AlbumOrderConfirmPage },
      { path: "overseas-stationery-order", Component: OverseasStationeryOrderPage },
      { path: "album-new-release-order", Component: AlbumNewReleaseOrderPage },
      { path: "stationery-new-release-order", Component: StationeryNewReleaseOrderPage },
      { path: "order-request-inquiry", Component: OrderRequestInquiryPage },
      { path: "bugok-delivery-order", Component: BugokDeliveryOrderPage },
      { path: "album-supplier-degree", Component: AlbumSupplierDegreePage },
      { path: "album-supplier-return-rate", Component: AlbumSupplierReturnRatePage },
      { path: "album-supplier-return-limit", Component: AlbumSupplierReturnLimitInquiryPage },
      { path: "stationery-return-list", Component: StationeryReturnListPage },
      { path: "domestic-arrival-closing", Component: DomesticArrivalGroupClosingPage },
      { path: "domestic-arrival-daily-closing", Component: DomesticArrivalDailyClosingPage },
      { path: "overseas-stationery-purchase-confirm", Component: OverseasStationeryPurchaseConfirmPage },
      { path: "product-info-main", Component: ProductInfoMainPage },
      { path: "promotion-registration", Component: PromotionRegistrationPage },
      { path: "promotion-sales", Component: PromotionSalesInquiryPage },
      { path: "periodical-sales", Component: PeriodicalSalesInquiryPage },
      { path: "stationery-supplier-grade", Component: StationerySupplierGradePage },
      { path: "alt-supplier-group", Component: AltSupplierGroupManagePage },
      { path: "specific-purchase-fee-rate", Component: SpecificPurchaseFeeRatePage },
      { path: "special-promo-registration", Component: SpecialPromotionRegistrationPage },
      { path: "store-display-management", Component: StoreDisplayManagementPage },
      { path: "official-document-management", Component: OfficialDocumentManagementPage },
      { path: "inventory-information", Component: InventoryInformationPage },
      { path: "order-history", Component: OrderHistoryPage },
      { path: "return-history", Component: ReturnHistoryPage },
      { path: "ledger-inquiry", Component: LedgerInquiryPage },
      { path: "ledger-detail", Component: LedgerDetailPage },
      { path: "invoice-confirmation", Component: InvoiceConfirmationPage },
      { path: "overseas-stationery-arrival", Component: OverseasStationeryArrivalPage },
      { path: "stationery-bookshelf-inquiry", Component: StationeryBookshelfInquiryPage },
      { path: "forced-stock-in", Component: ForcedStockInPage },
      { path: "stationery-album-sales-inquiry", Component: StationeryAlbumSalesInquiryPage },
      { path: "section-arrival-registration", Component: SectionArrivalRegistrationPage }, // ★ 39번 라우트 연결
      { path: "easter-egg", Component: DataMigrationGamePage },
      { path: "*", Component: () => <div className="p-8">페이지를 찾을 수 없습니다.</div> }
    ],
  },
]);