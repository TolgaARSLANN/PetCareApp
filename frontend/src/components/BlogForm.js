import React, { useState } from "react";
import API from "../services/api";
import "./BlogForm.css";

const BlogForm = ({ refreshBlogs }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!title || !content || !author) {
        setError("Please fill in all required fields!");
        return;
      }

      const blogData = { title, content, author, image };
      await API.post("/blogs", blogData);

      setSuccess("Blog added successfully!");
      setTitle("");
      setContent("");
      setAuthor("");
      setImage("");
      setError("");

      if (refreshBlogs) {
        refreshBlogs(); // Blog listesi yenilenecek
      }
    } catch (err) {
      setError("Failed to add blog. Please try again.");
    }
  };

  return (
    <div className="blog-form">
      <h2>Yeni Blog Ekle</h2>
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
          Blog Ekle
        </button>
      </form>
    </div>
  );
};

export default BlogForm;
