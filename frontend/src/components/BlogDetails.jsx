import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Article, ArrowLeft, PencilSimple } from "@phosphor-icons/react";
import API from "../services/api";
import { getCurrentUserId } from "../services/auth";
import { BlogCover } from "./BlogList";
import EmptyState from "./ui/EmptyState";
import { PageLoader } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { formatDate } from "../utils/format";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useDocumentTitle(blog?.title || "Blog");

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        const { data } = await API.get(`/blogs/${id}`);
        setBlog(data);
      } catch (err) {
        setError(
          err.response?.status === 404 ? "Bu yazı bulunamadı; silinmiş olabilir." : "Yazı yüklenemedi. Lütfen tekrar deneyin."
        );
        console.error("Error fetching blog details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogDetails();
  }, [id]);

  if (loading) return <PageLoader label="Yazı yükleniyor" />;

  if (error || !blog) {
    return (
      <div className="container page">
        <EmptyState
          icon={Article}
          title="Yazı açılamadı"
          description={error || "Yazı bulunamadı."}
          action={
            <Link to="/blogs" className="btn btn-primary">
              Tüm yazılara dön
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = blog.authorId && blog.authorId === getCurrentUserId();

  return (
    <article className="container container-narrow page">
      <Link to="/blogs" className="back-link">
        <ArrowLeft size={18} aria-hidden="true" />
        Tüm yazılar
      </Link>
      <header className="article-header">
        <h1 className="article-title">{blog.title}</h1>
        <div className="article-meta">
          <span>
            {blog.author || "Bilinmeyen yazar"} ·{" "}
            <time dateTime={blog.date}>{formatDate(blog.date || blog.createdAt)}</time>
          </span>
          {isOwner && (
            <Link to={`/blogs/edit/${blog._id}`} className="btn btn-secondary btn-sm">
              <PencilSimple size={16} aria-hidden="true" />
              Düzenle
            </Link>
          )}
        </div>
      </header>
      {blog.image && <BlogCover src={blog.image} className="article-cover" />}
      <div className="article-body">{blog.content}</div>
    </article>
  );
};

export default BlogDetails;
