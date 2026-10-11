import React, { useState, useEffect } from "react";
import API from "../services/api";
import { getCurrentUserId } from "../services/auth";
import BlogForm from "./BlogForm"; // BlogForm'u ekledik
import { Link, useNavigate } from "react-router-dom";
import "./BlogList.css";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();

  // Blogları getir
  const fetchBlogs = async () => {
    try {
      const { data } = await API.get("/blogs");
      setBlogs(data);
    } catch (err) {
      setError("Yazılar yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Silme işlemi
  const handleDelete = async (id) => {
    if (!window.confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
    try {
      await API.delete(`/blogs/${id}`);
      setBlogs(blogs.filter((blog) => blog._id !== id)); // Blog listesini güncelle
    } catch (err) {
      console.error("Error deleting blog:", err);
      window.alert("Yazı silinemedi. Lütfen tekrar deneyin.");
    }
  };

  // Düzenleme işlemi
  const handleEdit = (id) => {
    navigate(`/blogs/edit/${id}`); // Edit sayfasına yönlendirme
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  if (loading) {
    return <p className="loading-message">Yükleniyor...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="blog-list">
      <h2>Blog Paylaşımlar</h2>
      {currentUserId ? (
        <BlogForm refreshBlogs={fetchBlogs} />
      ) : (
        <p className="no-blogs-message">
          Yazı paylaşmak için <Link to="/login">giriş yapın</Link>.
        </p>
      )}
      <div className="blog-content">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <div key={blog._id} className="blog-card">
              <h3>{blog.title}</h3>
              <p>{blog.content.substring(0, 100)}...</p>
              <Link to={`/blogs/${blog._id}`} className="btn btn-primary">
                Daha Fazla Oku
              </Link>
              {blog.authorId === currentUserId && (
                <>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleEdit(blog._id)}
                  >
                    Düzenle
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(blog._id)}
                  >
                    Sil
                  </button>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="no-blogs-message">Henüz yazı yok.</p>
        )}
      </div>
    </div>
  );
};

export default BlogList;
