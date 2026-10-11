import React, { useEffect, useState } from "react";
import { Link, useRouteError } from "react-router-dom";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import EmptyState from "./ui/EmptyState";
import { PageLoader } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { isChunkLoadError, reloadPage, shouldAutoReloadFor } from "../utils/reload";

// Sayfa çizilirken beklenmeyen bir hata olursa gösterilir. Menü ve alt bilgi yerinde kalır
// (App.jsx'te ortak çerçevenin içindeki rotalara bağlıdır).
const RouteError = () => {
  const error = useRouteError();
  const chunkError = isChunkLoadError(error);
  const [reloading] = useState(() => shouldAutoReloadFor(error));
  useDocumentTitle("Bir şeyler ters gitti");

  useEffect(() => {
    if (reloading) reloadPage();
    else console.error("Unexpected error while rendering the page:", error);
  }, [reloading, error]);

  if (reloading) return <PageLoader label="Uygulamanın yeni sürümü yükleniyor" />;

  return (
    <div className="container page">
      <h1 className="visually-hidden">Bir şeyler ters gitti</h1>
      <EmptyState
        icon={WarningCircle}
        title="Bir şeyler ters gitti"
        description={
          chunkError
            ? "Uygulama güncellenmiş olabilir. Sayfayı yenileyerek yeni sürümü yükleyin."
            : "Bu sayfa beklenmedik bir hatayla karşılaştı. Sayfayı yenilemeyi deneyin; sorun sürerse biraz sonra tekrar deneyin."
        }
        action={
          <div className="empty-state-actions">
            <button type="button" className="btn btn-primary" onClick={reloadPage}>
              <ArrowClockwise size={18} aria-hidden="true" />
              Sayfayı yenile
            </button>
            <Link to="/" className="btn btn-secondary" reloadDocument>
              Ana sayfaya dön
            </Link>
          </div>
        }
      />
    </div>
  );
};

export default RouteError;
