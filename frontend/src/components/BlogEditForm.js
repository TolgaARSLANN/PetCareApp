import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./BlogEditForm.css";

const BlogEditForm = () => {
  const { id } = useParams(); // URL'deki blog ID'sini al
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Mevcut blog verilerini getir
    const fetchBlog = async () => {
      try {
        const { data } = await API.get(`/blogs/${id}`);
        setTitle(data.title);
        setContent(data.content);
        setAuthor(data.author);
        setImage(data.image || "");
      } catch (err) {
        console.error("Error fetching blog details:", err);
        setError("Failed to fetch blog details.");
      }
    };
    fetchBlog();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedBlog = { title, content, author, image };
      await API.put(`/blogs/${id}`, updatedBlog);
      setSuccess("Blog updated successfully!");
      setError("");

      // Yönlendirme
      setTimeout(() => {
        navigate("/blogs");
      }, 2000);
    } catch (err) {
      console.error("Error updating blog:", err);
      setError("Failed to update the blog. Please try again.");
    }
  };

  return (
    <div className="blog-edit-form">
      <h2>Blog Düzenle</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Başlık:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">İçerik:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="author">Yazar:</label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Görüntü URL (opsiyonel):</label>
          <input
            type="text"
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-submit">
          Güncelle
        </button>
      </form>
    </div>
  );
};

export default BlogEditForm;
