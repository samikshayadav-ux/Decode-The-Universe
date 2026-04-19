import React, { useState, useEffect } from "react";

const HiddenButtonGame = ({ onComplete }) => {
  const [found, setFound] = useState(false);

  useEffect(() => {
    // Disable inspect shortcuts
    const handleKeyDown = (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U")|| (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const handleClick = () => {
    setFound(true);
    setTimeout(() => {
      onComplete(); // Move to next game
    }, 1000); // short delay so player sees success message
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#f9f9f9",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Corner text */}
      <p
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          fontSize: "14px",
          color: "#888",
        }}
      >
        This page is not blank
      </p>

      <h1
        style={{
          textAlign: "center",
          marginTop: "20%",
          fontSize: "44px",
          color: "#f9f9f9",
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
        }}
      >
        Find out the button to proceed
      </h1>

      {/* Fake hints */}
      <p
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          fontSize: "14px",
          color: "#f9f9f9",
        }}
      >
        Look at the bottom right corner
      </p>

      <p
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          fontSize: "14px",
          color: "#f9f9f9",
        }}
      >
        Haha you have been fooled
      </p>

      <p
        style={{
          position: "absolute",
          top: "10px",
          right: "50%",
          fontSize: "14px",
          color: "#f9f9f9",
        }}
      >
        Look at the bottom left corner
      </p>

      {/* Hidden button */}
      <button
        onClick={handleClick}
        style={{
          position: "absolute",
          bottom: "30%",
          right: "40%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "10px",
          width: "100px",
          height: "100px",
        }}
      >
        <span style={{ opacity: 0 }}>Click Me</span>
      </button>

      {/* Found message */}
      {found && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "20px",
            color: "green",
          }}
        >
          🎉 You found it!
        </div>
      )}
    </div>
  );
};

export default HiddenButtonGame;
