import React from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";
import EmptyState from "./ui/EmptyState";
import useDocumentTitle from "../hooks/useDocumentTitle";

const NotFound = () => {
  useDocumentTitle("Sayfa bulunamadı");
  return (
    <div className="container page">
      <h1 className="visually-hidden">Sayfa bulunamadı</h1>
      <EmptyState
        icon={MagnifyingGlass}
        title="Aradığınız sayfa bulunamadı"
        description="Bağlantı hatalı olabilir ya da sayfa kaldırılmış olabilir."
        action={
          <Link to="/" className="btn btn-primary">
            Ana sayfaya dön
          </Link>
        }
      />
    </div>
  );
};

export default NotFound;
