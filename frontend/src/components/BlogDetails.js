import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import "./BlogDetails.css";

const BlogDetails = () => {
  const { id } = useParams(); // URL'deki blog ID'sini al
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        const { data } = await API.get(`/blogs/${id}`);
        setBlog(data);
      } catch (error) {
        setError("Failed to fetch blog details. Please try again later.");
        console.error("Error fetching blog details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [id]);

  if (loading) {
    return <p className="loading-message">Loading...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!blog) {
    return <p className="no-blog-message">Blog not found.</p>;
  }

  return (
    <div className="blog-details">
      <h2 className="blog-title">{blog.title}</h2>
      <p className="blog-author">
        <strong>Yazar:</strong> {blog.author || "Unknown"}
      </p>
      <p className="blog-date">
        <strong>Tarih:</strong> {new Date(blog.date || blog.createdAt).toLocaleDateString()}
      </p>
      {blog.image && (
        <img
          src={blog.image}
          alt={blog.title}
          className="blog-image"
        />
      )}
      <div className="blog-content">
        <p>{blog.content}</p>
      </div>
    </div>
  );
};

export default BlogDetails;
