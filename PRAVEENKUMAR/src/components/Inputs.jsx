import React, { useContext, useState } from "react";
import Img from "../img/img.png";
import Attach from "../img/attach.png";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(UserContext);

  const validateImage = (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setErrorMessage("Invalid file type. Please upload an image (JPG, PNG, GIF).");
      return false;
    }

    if (file.size > maxSize) {
      setErrorMessage("File size exceeds 5 MB. Please upload a smaller image.");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && validateImage(file)) {
      setImg(file);
      setShowConfirmPopup(true);
    } else {
      setImg(null);
    }
  };

  const handleSend = async () => {
    setShowConfirmPopup(false);

    if (img) {
      const storageRef = ref(storage, uuid());
      const uploadTask = uploadBytesResumable(storageRef, img);

      setIsUploading(true);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload failed", error);
          setIsUploading(false);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion({
                id: uuid(),
                text,
                senderId: currentUser.uid,
                date: Timestamp.now(),
                img: downloadURL,
              }),
            });

            setIsUploading(false);
            setIsUploaded(true);

            setTimeout(() => setIsUploaded(false), 3000);
          });
        }
      );
    } else {
      await updateDoc(doc(db, "chats", data.chatId), {
        messages: arrayUnion({
          id: uuid(),
          text,
          senderId: currentUser.uid,
          date: Timestamp.now(),
        }),
      });
    }

    await updateDoc(doc(db, "userChats", currentUser.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    await updateDoc(doc(db, "userChats", data.user.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    setText("");
    setImg(null);
  };

  const handleCancelUpload = () => {
    setImg(null);
    setShowConfirmPopup(false);
  };

  return (
    <>
      <style>{`
        .upload-popup, .confirm-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(0, 0, 0, 0.8);
          padding: 20px;
          border-radius: 10px;
          color: white;
          text-align: center;
          z-index: 1000;
        }

        .popup-content {
          padding: 10px;
          font-size: 16px;
        }

        .error-message {
          color: red;
          margin: 10px 0;
        }

        .confirm-button, .cancel-button {
          padding: 10px 15px;
          margin: 5px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.2s;
        }

        .confirm-button {
          background-color: green;
          color: white;
        }

        .confirm-button:hover {
          background-color: limegreen;
        }

        .confirm-button:active {
          transform: scale(0.95);
        }

        .cancel-button {
          background-color: red;
          color: white;
        }

        .cancel-button:hover {
          background-color: darkred;
        }

        .cancel-button:active {
          transform: scale(0.95);
        }
      `}</style>

      <div className="input">
        <input
          type="text"
          placeholder="Write a message..."
          onChange={(e) => setText(e.target.value)}
          value={text}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <div className="send">
          <img src={Attach} alt="" />
          <input
            type="file"
            style={{ display: "none" }}
            id="file"
            onChange={handleImageChange}
          />
          <label htmlFor="file">
            <img
              src={Img}
              alt=""
              style={{
                opacity: isUploading ? 0.5 : 1,
                transition: "opacity 0.5s ease-in-out",
              }}
            />
          </label>
          <button onClick={handleSend} disabled={isUploading || !!errorMessage}>
            {isUploading ? "Uploading..." : "Send"}
          </button>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>

      {showConfirmPopup && (
        <div className="confirm-popup">
          <div className="popup-content">
            <p>Are you sure you want to upload this image?</p>
            <img src={URL.createObjectURL(img)} alt="Preview" style={{ maxWidth: "100%", marginBottom: "10px" }} />
            <button className="confirm-button" onClick={handleSend}>Yes, Upload</button>
            <button className="cancel-button" onClick={handleCancelUpload}>Cancel</button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="upload-popup">
          <div className="popup-content">
            <p>Uploading...</p>
          </div>
        </div>
      )}

      {isUploaded && (
        <div className="upload-popup">
          <div className="popup-content">
            <p>Image uploaded successfully!</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Input;