import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Article, NotePencil, PencilSimple, Trash } from "@phosphor-icons/react";
import API from "../services/api";
import { useAuth } from "../context/useAuth";
import BlogForm from "./BlogForm";
import Alert from "./ui/Alert";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";
import { SkeletonCards } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { formatDate } from "../utils/format";

export const BlogCover = ({ src, className = "" }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`blog-cover blog-cover-placeholder ${className}`} aria-hidden="true">
        <Article size={36} weight="duotone" />
      </div>
    );
  }
  return (
    <img src={src} alt="" className={`blog-cover ${className}`} loading="lazy" onError={() => setFailed(true)} />
  );
};

const BlogList = () => {
  useDocumentTitle("Blog");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const navigate = useNavigate();
  const currentUserId = useAuth().user?.id;

  const fetchBlogs = async () => {
    setError(null);
    try {
      const { data } = await API.get("/blogs");
      setBlogs(data);
    } catch (err) {
      setError("Yazılar yüklenemedi.");
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleCreate = async (values) => {
    await API.post("/blogs", values);
    setFormOpen(false);
    setNotice("Yazınız yayınlandı.");
    await fetchBlogs();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await API.delete(`/blogs/${toDelete._id}`);
      setBlogs((current) => current.filter((blog) => blog._id !== toDelete._id));
      setNotice("Yazı silindi.");
      setToDelete(null);
    } catch (err) {
      console.error("Error deleting blog:", err);
      setDeleteError("Yazı silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Blog</h1>
          <p className="page-subtitle">Evcil dost sahiplerinden deneyimler, ipuçları ve öneriler.</p>
        </div>
        {currentUserId && !formOpen && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setNotice("");
              setFormOpen(true);
            }}
          >
            <NotePencil size={18} aria-hidden="true" />
            Yazı yaz
          </button>
        )}
      </header>

      {!currentUserId && (
        <Alert type="info" className="mb-4">
          Yazı paylaşmak için <Link to="/login">giriş yapın</Link> ya da <Link to="/register">ücretsiz üye olun</Link>.
        </Alert>
      )}

      {notice && (
        <Alert type="success" onClose={() => setNotice("")} className="mb-4">
          {notice}
        </Alert>
      )}

      {formOpen && (
        <section className="card form-card mb-6" aria-labelledby="new-post-title">
          <h2 id="new-post-title" className="card-title">
            Yeni yazı
          </h2>
          <BlogForm submitLabel="Yayınla" onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </section>
      )}

      {loading ? (
        <SkeletonCards count={3} label="Yazılar yükleniyor" />
      ) : error ? (
        <Alert type="error">
          {error}{" "}
          <button type="button" className="link-button" onClick={fetchBlogs}>
            Tekrar dene
          </button>
        </Alert>
      ) : blogs.length === 0 ? (
        <EmptyState
          icon={Article}
          title="Henüz yazı yok"
          description={currentUserId ? "İlk yazıyı siz paylaşın!" : "Giriş yaparak ilk yazıyı siz paylaşabilirsiniz."}
        />
      ) : (
        <ul className="card-grid" aria-label="Blog yazıları">
          {blogs.map((blog) => (
            <li key={blog._id} className="card blog-card">
              <BlogCover src={blog.image} />
              <div className="blog-card-body">
                <p className="blog-meta">
                  {blog.author} · <time dateTime={blog.date}>{formatDate(blog.date || blog.createdAt)}</time>
                </p>
                <h2 className="blog-card-title">
                  <Link to={`/blogs/${blog._id}`} className="stretched-link">
                    {blog.title}
                  </Link>
                </h2>
                <p className="blog-excerpt">{blog.content}</p>
                <div className="blog-card-footer">
                  <span className="read-more" aria-hidden="true">
                    Devamını oku <ArrowRight size={16} />
                  </span>
                  {blog.authorId === currentUserId && (
                    <div className="icon-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                        aria-label={`"${blog.title}" yazısını düzenle`}
                        title="Düzenle"
                      >
                        <PencilSimple size={20} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={() => {
                          setDeleteError("");
                          setToDelete(blog);
                        }}
                        aria-label={`"${blog.title}" yazısını sil`}
                        title="Sil"
                      >
                        <Trash size={20} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Yazı silinsin mi?"
        message={`"${toDelete?.title || ""}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, sil"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default BlogList;
