import React, { useState } from "react";

const UploadForm = ({ onUpload }) => {
  const [image, setImage] = useState(null);
  const [url, setUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (image) formData.append("image", image);
    if (url) formData.append("gsv_url", url);

    const response = await fetch("http://127.0.0.1:8000/detect/", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    onUpload(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter GSV URL" />
      <button type="submit">Submit</button>
    </form>
  );
};

export default UploadForm;
