import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import API from "../services/api";
import { useAuth } from "../context/useAuth";
import BlogForm from "./BlogForm";
import Alert from "./ui/Alert";
import { PageLoader } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";

const BlogEditForm = () => {
  useDocumentTitle("Yazıyı düzenle");
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUserId = useAuth().user?.id;

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { data } = await API.get(`/blogs/${id}`);
        setBlog(data);
      } catch (err) {
        console.error("Error fetching blog details:", err);
        setError("Yazı yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  const handleUpdate = async (values) => {
    await API.put(`/blogs/${id}`, values);
    navigate(`/blogs/${id}`);
  };

  if (loading) return <PageLoader label="Yazı yükleniyor" />;

  return (
    <div className="container container-narrow page">
      <Link to={`/blogs/${id}`} className="back-link">
        <ArrowLeft size={18} aria-hidden="true" />
        Yazıya dön
      </Link>
      <h1 className="page-title mb-4">Yazıyı düzenle</h1>
      {error || !blog ? (
        <Alert type="error">{error || "Yazı bulunamadı."}</Alert>
      ) : blog.authorId !== currentUserId ? (
        // Sunucu zaten reddeder; formu hiç göstermeyip nedenini söylemek daha açık
        <Alert type="error">Bu yazıyı yalnızca yazarı düzenleyebilir.</Alert>
      ) : (
        <div className="card form-card">
          <BlogForm
            initialValues={{ title: blog.title, content: blog.content, author: blog.author, image: blog.image || "" }}
            submitLabel="Değişiklikleri kaydet"
            onSubmit={handleUpdate}
            onCancel={() => navigate(`/blogs/${id}`)}
          />
        </div>
      )}
    </div>
  );
};

export default BlogEditForm;
